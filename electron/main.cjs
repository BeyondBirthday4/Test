const { app, BrowserWindow } = require("electron");
const { spawn } = require("child_process");
const path = require("path");
let server;
let mainWindow;

function startServer() {
  const serverPath = path.join(__dirname, "..", "server.js");
  server = spawn(process.execPath, [serverPath], {
    cwd: path.join(__dirname, ".."),
    env: { ...process.env, ELECTRON_RUN_AS_NODE: "1", PORT: "3000" },
    stdio: "inherit"
  });
  server.on("error", err => console.error("Could not start local game server:", err));
}
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440, height: 900, minWidth: 960, minHeight: 620,
    backgroundColor: "#090d0c",
    autoHideMenuBar: true,
    webPreferences: { contextIsolation: true, nodeIntegration: false }
  });
  mainWindow.loadURL("http://127.0.0.1:3000");
}
app.whenReady().then(() => {
  startServer();
  const waitForServer = () => {
    const http = require("http");
    const req = http.get("http://127.0.0.1:3000", () => createWindow());
    req.on("error", () => setTimeout(waitForServer, 250));
  };
  waitForServer();
});
app.on("window-all-closed", () => {
  if (server) server.kill();
  if (process.platform !== "darwin") app.quit();
});
app.on("before-quit", () => { if (server) server.kill(); });
