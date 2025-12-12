import { app, BrowserWindow, ipcMain } from "electron";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { randomUUID } from "crypto";
import pty from "node-pty";
import { Client } from "ssh2";
createRequire(import.meta.url);
const __dirname$1 = path.dirname(fileURLToPath(import.meta.url));
process.env.APP_ROOT = path.join(__dirname$1, "..");
const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, "public") : RENDERER_DIST;
let win;
const HOSTS = {
  "alasdair": {
    host: "192.168.1.126",
    port: 22,
    username: "alasdair"
  }
};
const sessions = /* @__PURE__ */ new Map();
const pendingPasswordPrompts = /* @__PURE__ */ new Map();
function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
    webPreferences: {
      preload: path.join(__dirname$1, "preload.mjs")
    }
  });
  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(RENDERER_DIST, "index.html"));
  }
}
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
    win = null;
  }
});
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
function registerIPC() {
  ipcMain.handle("keystone:createSession", async (_event, req) => {
    console.log("[keystone] createSession request:", req);
    const sessionId = randomUUID();
    let ptyProcess;
    let sshClient;
    let shellChannel;
    if (req.type === "local") {
      const shell = process.env.SHELL || (process.platform === "win32" ? "powershell.exe" : "bash");
      ptyProcess = pty.spawn(shell, [], {
        name: "xterm-color",
        cols: 80,
        rows: 24,
        cwd: process.env.HOME,
        env: process.env
      });
    }
    if (req.type === "remote") {
      const cfg = HOSTS[req.hostId];
      if (!cfg) {
        return { ok: false, error: "Unknown host" };
      }
      const requestId = randomUUID();
      if (win) {
        win.webContents.send("keystone:passwordPrompt", {
          requestId,
          host: cfg.host,
          username: cfg.username,
          prompt: "Password"
        });
      }
      const password = await new Promise((resolvePassword) => {
        pendingPasswordPrompts.set(requestId, resolvePassword);
      });
      if (password === null) {
        return { ok: false, error: "Authentication cancelled" };
      }
      console.log("[keystone] Connecting to SSH with:", {
        host: cfg.host,
        port: cfg.port,
        username: cfg.username,
        hasPassword: !!password,
        passwordLength: password.length
      });
      sshClient = new Client();
      await new Promise((resolve, reject) => {
        sshClient.on("ready", () => {
          console.log("[keystone] SSH connection ready");
          sshClient.shell(
            {
              term: "xterm-256color",
              cols: 80,
              rows: 24
            },
            (err, channel) => {
              if (err) return reject(err);
              shellChannel = channel;
              resolve();
            }
          );
        }).on("keyboard-interactive", (_name, _instructions, _instructionsLang, prompts, finish) => {
          console.log("[keystone] keyboard-interactive prompts:", prompts);
          const responses = prompts.map(() => password);
          finish(responses);
        }).on("error", (err) => {
          console.error("[keystone] SSH error:", err.message, err.level);
          reject(err);
        }).connect({
          ...cfg,
          password,
          tryKeyboard: true,
          debug: (msg) => console.log("[ssh2]", msg)
        });
      });
    }
    const session = {
      id: sessionId,
      type: req.type,
      hostId: req.type === "remote" ? req.hostId : void 0,
      createdAt: Date.now(),
      pty: ptyProcess,
      ssh: sshClient,
      shell: shellChannel
    };
    sessions.set(sessionId, session);
    if (ptyProcess && win) {
      ptyProcess.onData((data) => {
        win.webContents.send(
          `keystone:sessionData:${sessionId}`,
          data
        );
      });
    }
    if (shellChannel && win) {
      shellChannel.on("data", (data) => {
        win.webContents.send(
          `keystone:sessionData:${sessionId}`,
          data.toString()
        );
      });
      shellChannel.stderr.on("data", (data) => {
        win.webContents.send(
          `keystone:sessionData:${sessionId}`,
          data.toString()
        );
      });
    }
    console.log("[keystone] session created:", session);
    await new Promise((r) => setTimeout(r, 300));
    return { ok: true, sessionId };
  });
  ipcMain.on("keystone:write", (_event, { sessionId, data }) => {
    const session = sessions.get(sessionId);
    if (!session) return;
    if (session.pty) {
      session.pty.write(data);
    } else if (session.shell) {
      session.shell.write(data);
    }
  });
  ipcMain.on("keystone:resize", (_event, { sessionId, cols, rows }) => {
    const session = sessions.get(sessionId);
    if (!session) return;
    if (session.pty) {
      session.pty.resize(cols, rows);
    } else if (session.shell) {
      session.shell.setWindow(rows, cols, 0, 0);
    }
  });
  ipcMain.on("keystone:passwordResponse", (_event, { requestId, password }) => {
    const resolve = pendingPasswordPrompts.get(requestId);
    if (resolve) {
      resolve(password);
      pendingPasswordPrompts.delete(requestId);
    }
  });
  ipcMain.on("keystone:closeSession", (_event, sessionId) => {
    var _a, _b, _c;
    const session = sessions.get(sessionId);
    if (!session) return;
    console.log("[keystone] closing session:", sessionId);
    (_a = session.pty) == null ? void 0 : _a.kill();
    (_b = session.shell) == null ? void 0 : _b.close();
    (_c = session.ssh) == null ? void 0 : _c.end();
    sessions.delete(sessionId);
  });
}
app.whenReady().then(() => {
  registerIPC();
  createWindow();
});
export {
  MAIN_DIST,
  RENDERER_DIST,
  VITE_DEV_SERVER_URL
};
