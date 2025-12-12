import { app, BrowserWindow, ipcMain } from "electron";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { randomUUID } from "crypto";
createRequire(import.meta.url);
const __dirname$1 = path.dirname(fileURLToPath(import.meta.url));
process.env.APP_ROOT = path.join(__dirname$1, "..");
const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, "public") : RENDERER_DIST;
let win;
const sessions = /* @__PURE__ */ new Map();
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
    const session = {
      id: sessionId,
      type: req.type,
      hostId: req.type === "remote" ? req.hostId : void 0,
      createdAt: Date.now()
    };
    sessions.set(sessionId, session);
    console.log("[keystone] session created:", session);
    await new Promise((r) => setTimeout(r, 600));
    return { ok: true, sessionId };
  });
  ipcMain.on("keystone:write", (_event, { sessionId, data }) => {
    if (!sessions.has(sessionId)) return;
    console.log(`[keystone] write → ${sessionId}:`, data);
  });
  ipcMain.on("keystone:resize", (_event, { sessionId, cols, rows }) => {
    if (!sessions.has(sessionId)) return;
    console.log(`[keystone] resize → ${sessionId}: ${cols}x${rows}`);
  });
  ipcMain.on("keystone:closeSession", (_event, sessionId) => {
    if (!sessions.has(sessionId)) return;
    console.log("[keystone] closing session:", sessionId);
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
