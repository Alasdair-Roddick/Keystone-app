import { app, BrowserWindow } from 'electron'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { ipcMain } from 'electron'
import { randomUUID } from 'crypto'


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

type Session = {
  id: string
  type: 'local' | 'remote'
  hostId?: string
  createdAt: number
}

const sessions = new Map<string, Session>()




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

    const session: Session = {
      id: sessionId,
      type: req.type,
      hostId: req.type === 'remote' ? req.hostId : undefined,
      createdAt: Date.now(),
    }

    sessions.set(sessionId, session)

    console.log('[keystone] session created:', session)

    // Simulate async setup delay (transition screen realism)
    await new Promise((r) => setTimeout(r, 600))

    return { ok: true, sessionId }
  })

  ipcMain.on('keystone:write', (_event, { sessionId, data }) => {
    if (!sessions.has(sessionId)) return
    console.log(`[keystone] write → ${sessionId}:`, data)
  })

  ipcMain.on('keystone:resize', (_event, { sessionId, cols, rows }) => {
    if (!sessions.has(sessionId)) return
    console.log(`[keystone] resize → ${sessionId}: ${cols}x${rows}`)
  })

  ipcMain.on('keystone:closeSession', (_event, sessionId) => {
    if (!sessions.has(sessionId)) return

    console.log('[keystone] closing session:', sessionId)
    sessions.delete(sessionId)
  })
}


app.whenReady().then(() => {
  registerIPC()
  createWindow()
})

