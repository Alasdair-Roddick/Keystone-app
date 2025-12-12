import { app, BrowserWindow, ipcMain } from "electron";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { randomUUID } from "crypto";
import pty from "node-pty";
import { Client } from "ssh2";
import Database from "better-sqlite3";
let db = null;
function getDb() {
  if (db) return db;
  const dbPath = path.join(app.getPath("userData"), "keystone.db");
  console.log("[db] Opening database at:", dbPath);
  db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.exec(`
    CREATE TABLE IF NOT EXISTS hosts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      host TEXT NOT NULL,
      port INTEGER NOT NULL DEFAULT 22,
      username TEXT NOT NULL,
      password TEXT,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL
    )
  `);
  console.log("[db] Database initialized");
  return db;
}
function getAllHosts() {
  const db2 = getDb();
  const stmt = db2.prepare("SELECT * FROM hosts ORDER BY name ASC");
  return stmt.all();
}
function getHostById(id) {
  const db2 = getDb();
  const stmt = db2.prepare("SELECT * FROM hosts WHERE id = ?");
  return stmt.get(id) || null;
}
function createHost(input) {
  const db2 = getDb();
  const now = Date.now();
  const stmt = db2.prepare(`
    INSERT INTO hosts (id, name, host, port, username, password, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    input.id,
    input.name,
    input.host,
    input.port,
    input.username,
    input.password || null,
    now,
    now
  );
  return getHostById(input.id);
}
function updateHost(id, input) {
  const db2 = getDb();
  const existing = getHostById(id);
  if (!existing) return null;
  const updates = [];
  const values = [];
  if (input.name !== void 0) {
    updates.push("name = ?");
    values.push(input.name);
  }
  if (input.host !== void 0) {
    updates.push("host = ?");
    values.push(input.host);
  }
  if (input.port !== void 0) {
    updates.push("port = ?");
    values.push(input.port);
  }
  if (input.username !== void 0) {
    updates.push("username = ?");
    values.push(input.username);
  }
  if (input.password !== void 0) {
    updates.push("password = ?");
    values.push(input.password);
  }
  if (updates.length === 0) return existing;
  updates.push("updatedAt = ?");
  values.push(Date.now());
  values.push(id);
  const stmt = db2.prepare(`
    UPDATE hosts SET ${updates.join(", ")} WHERE id = ?
  `);
  stmt.run(...values);
  return getHostById(id);
}
function deleteHost(id) {
  const db2 = getDb();
  const stmt = db2.prepare("DELETE FROM hosts WHERE id = ?");
  const result = stmt.run(id);
  return result.changes > 0;
}
function closeDb() {
  if (db) {
    db.close();
    db = null;
    console.log("[db] Database closed");
  }
}
createRequire(import.meta.url);
const __dirname$1 = path.dirname(fileURLToPath(import.meta.url));
process.env.APP_ROOT = path.join(__dirname$1, "..");
const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, "public") : RENDERER_DIST;
let win;
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
      const hostConfig = getHostById(req.hostId);
      if (!hostConfig) {
        return { ok: false, error: "Unknown host" };
      }
      let password = hostConfig.password;
      if (!password) {
        const requestId = randomUUID();
        if (win) {
          win.webContents.send("keystone:passwordPrompt", {
            requestId,
            host: hostConfig.host,
            username: hostConfig.username,
            prompt: "Password"
          });
        }
        password = await new Promise((resolvePassword) => {
          pendingPasswordPrompts.set(requestId, resolvePassword);
        });
        if (password === null) {
          return { ok: false, error: "Authentication cancelled" };
        }
      }
      console.log("[keystone] Connecting to SSH with:", {
        host: hostConfig.host,
        port: hostConfig.port,
        username: hostConfig.username,
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
          host: hostConfig.host,
          port: hostConfig.port,
          username: hostConfig.username,
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
  ipcMain.handle("keystone:getHosts", () => {
    return getAllHosts();
  });
  ipcMain.handle("keystone:getHost", (_event, id) => {
    return getHostById(id);
  });
  ipcMain.handle("keystone:createHost", (_event, input) => {
    const id = randomUUID();
    return createHost({ ...input, id });
  });
  ipcMain.handle("keystone:updateHost", (_event, { id, ...input }) => {
    return updateHost(id, input);
  });
  ipcMain.handle("keystone:deleteHost", (_event, id) => {
    return deleteHost(id);
  });
}
app.whenReady().then(() => {
  getDb();
  registerIPC();
  createWindow();
});
app.on("will-quit", () => {
  closeDb();
});
export {
  MAIN_DIST,
  RENDERER_DIST,
  VITE_DEV_SERVER_URL
};
