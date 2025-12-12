import { app, BrowserWindow } from 'electron'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { ipcMain } from 'electron'
import { randomUUID } from 'crypto'
import type { IPty } from 'node-pty'
import pty from 'node-pty'
import os from 'os'
import { Client } from 'ssh2'
import type { ClientChannel } from 'ssh2'




const require = createRequire(import.meta.url)
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.mjs
// │
process.env.APP_ROOT = path.join(__dirname, '..')

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

let win: BrowserWindow | null


const HOSTS: Record<string, {
  host: string
  port: number
  username: string
  password?: string
}> = {
  'alasdair': {
    host: '192.168.1.126',
    port: 22,
    username: 'alasdair',
  },
}


type Session = {
  id: string
  type: 'local' | 'remote'
  hostId?: string
  createdAt: number




  pty?: IPty


  ssh?: Client
  shell?: ClientChannel
}

const sessions = new Map<string, Session>()

// Pending password prompts waiting for user response
const pendingPasswordPrompts = new Map<string, (password: string | null) => void>()




function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, 'electron-vite.svg'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
    },
  })


  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

function registerIPC() {
  ipcMain.handle('keystone:createSession', async (_event, req) => {
  console.log('[keystone] createSession request:', req)

  const sessionId = randomUUID()

  let ptyProcess: pty.IPty | undefined
  let sshClient: Client | undefined
  let shellChannel: ClientChannel | undefined

  // ---------- LOCAL SESSION ----------
  if (req.type === 'local') {
    const shell =
      process.env.SHELL ||
      (process.platform === 'win32' ? 'powershell.exe' : 'bash')

    ptyProcess = pty.spawn(shell, [], {
      name: 'xterm-color',
      cols: 80,
      rows: 24,
      cwd: process.env.HOME,
      env: process.env,
    })
  }

  // ---------- REMOTE (SSH) SESSION ----------
  if (req.type === 'remote') {
    const cfg = HOSTS[req.hostId]
    if (!cfg) {
      return { ok: false, error: 'Unknown host' }
    }

    // Prompt for password before connecting
    const requestId = randomUUID()

    if (win) {
      win.webContents.send('keystone:passwordPrompt', {
        requestId,
        host: cfg.host,
        username: cfg.username,
        prompt: 'Password',
      })
    }

    const password = await new Promise<string | null>((resolvePassword) => {
      pendingPasswordPrompts.set(requestId, resolvePassword)
    })

    if (password === null) {
      return { ok: false, error: 'Authentication cancelled' }
    }

    console.log('[keystone] Connecting to SSH with:', {
      host: cfg.host,
      port: cfg.port,
      username: cfg.username,
      hasPassword: !!password,
      passwordLength: password.length,
    })

    sshClient = new Client()

    await new Promise<void>((resolve, reject) => {
      sshClient!
        .on('ready', () => {
          console.log('[keystone] SSH connection ready')
          sshClient!.shell(
            {
              term: 'xterm-256color',
              cols: 80,
              rows: 24,
            },
            (err, channel) => {
              if (err) return reject(err)
              shellChannel = channel
              resolve()
            }
          )
        })
        .on('keyboard-interactive', (_name, _instructions, _instructionsLang, prompts, finish) => {
          console.log('[keystone] keyboard-interactive prompts:', prompts)
          // Use the already-provided password for keyboard-interactive
          const responses = prompts.map(() => password)
          finish(responses)
        })
        .on('error', (err) => {
          console.error('[keystone] SSH error:', err.message, err.level)
          reject(err)
        })
        .connect({
          ...cfg,
          password,
          tryKeyboard: true,
          debug: (msg) => console.log('[ssh2]', msg),
        })
    })
  }

  // ---------- SESSION OBJECT ----------
  const session: Session = {
    id: sessionId,
    type: req.type,
    hostId: req.type === 'remote' ? req.hostId : undefined,
    createdAt: Date.now(),
    pty: ptyProcess,
    ssh: sshClient,
    shell: shellChannel,
  }

  sessions.set(sessionId, session)

  // ---------- STREAM OUTPUT ----------
  if (ptyProcess && win) {
    ptyProcess.onData((data) => {
      win!.webContents.send(
        `keystone:sessionData:${sessionId}`,
        data
      )
    })
  }

  if (shellChannel && win) {
    shellChannel.on('data', (data: Buffer) => {
      win!.webContents.send(
        `keystone:sessionData:${sessionId}`,
        data.toString()
      )
    })

    shellChannel.stderr.on('data', (data: Buffer) => {
      win!.webContents.send(
        `keystone:sessionData:${sessionId}`,
        data.toString()
      )
    })
  }

  console.log('[keystone] session created:', session)

  // Optional delay for loading screen polish
  await new Promise((r) => setTimeout(r, 300))

  return { ok: true, sessionId }
})


ipcMain.on('keystone:write', (_event, { sessionId, data }) => {
  const session = sessions.get(sessionId)
  if (!session) return

  if (session.pty) {
    session.pty.write(data)
  } else if (session.shell) {
    session.shell.write(data)
  }
})


ipcMain.on('keystone:resize', (_event, { sessionId, cols, rows }) => {
  const session = sessions.get(sessionId)
  if (!session) return

  if (session.pty) {
    session.pty.resize(cols, rows)
  } else if (session.shell) {
    session.shell.setWindow(rows, cols, 0, 0)
  }
})

ipcMain.on('keystone:passwordResponse', (_event, { requestId, password }) => {
  const resolve = pendingPasswordPrompts.get(requestId)
  if (resolve) {
    resolve(password)
    pendingPasswordPrompts.delete(requestId)
  }
})

ipcMain.on('keystone:closeSession', (_event, sessionId) => {
  const session = sessions.get(sessionId)
  if (!session) return

  console.log('[keystone] closing session:', sessionId)

  session.pty?.kill()
  session.shell?.close()
  session.ssh?.end()

  sessions.delete(sessionId)
})


}


app.whenReady().then(() => {
  registerIPC()
  createWindow()
})

