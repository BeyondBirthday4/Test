const http = require("http");
const fs = require("fs");
const path = require("path");
const WebSocket = require("ws");

const PORT = Number(process.env.PORT || 3000);
const ROOT = path.join(__dirname, "public");
const rooms = new Map();
const clients = new Map();

const server = http.createServer((req, res) => {
  let pathname = decodeURIComponent((req.url || "/").split("?")[0]);
  if (pathname === "/") pathname = "/index.html";
  const file = path.join(ROOT, pathname);
  if (!file.startsWith(ROOT)) { res.writeHead(403); return res.end("Forbidden"); }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); return res.end("Not found"); }
    const ext = path.extname(file);
    const type = ext === ".js" ? "text/javascript" : ext === ".css" ? "text/css" : "text/html";
    res.writeHead(200, { "Content-Type": type, "Cache-Control": "no-store" });
    res.end(data);
  });
});

const wss = new WebSocket.Server({ server });
const send = (ws, obj) => { if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(obj)); };
const roomPlayers = room => [...(rooms.get(room)?.values() || [])];

function broadcast(room, obj, except) {
  for (const p of roomPlayers(room)) if (p.ws !== except) send(p.ws, obj);
}
function cleanName(s) { return String(s || "PLAYER").replace(/[^a-zA-Z0-9 _-]/g, "").trim().slice(0, 14) || "PLAYER"; }
function cleanRoom(s) { return String(s || "LOBBY").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8) || "LOBBY"; }

wss.on("connection", ws => {
  const id = Math.random().toString(36).slice(2, 10);
  let player = null;
  send(ws, { type: "welcome", id });

  ws.on("message", raw => {
    let msg;
    try { msg = JSON.parse(raw.toString()); } catch { return; }

    if (msg.type === "join") {
      if (player) return;
      const room = cleanRoom(msg.room);
      if (!rooms.has(room)) rooms.set(room, new Map());
      const members = rooms.get(room);
      if (members.size >= 8) return send(ws, { type: "error", message: "That private room is full (8 players max)." });
      player = { id, ws, name: cleanName(msg.name), x: 2.5, y: 2.5, angle: 0, hp: 100, score: 0, room };
      members.set(id, player);
      send(ws, { type: "joined", id, room, players: roomPlayers(room).filter(p => p.id !== id).map(publicPlayer) });
      broadcast(room, { type: "player_joined", player: publicPlayer(player) }, ws);
      return;
    }

    if (!player) return;
    if (msg.type === "state") {
      // Keep movement inside the small arena; the client handles wall collision.
      const x = Number(msg.x), y = Number(msg.y), angle = Number(msg.angle);
      if (Number.isFinite(x) && Number.isFinite(y) && Number.isFinite(angle) &&
          x > 0.2 && x < 14.8 && y > 0.2 && y < 14.8) {
        player.x = x; player.y = y; player.angle = angle;
        broadcast(player.room, { type: "player_state", player: publicPlayer(player) }, ws);
      }
    }
    if (msg.type === "shot") {
      const target = rooms.get(player.room)?.get(String(msg.target));
      if (!target || target.id === player.id || target.hp <= 0) return;
      const dx = target.x - player.x, dy = target.y - player.y;
      const dist = Math.hypot(dx, dy);
      const aim = Math.atan2(dy, dx);
      let delta = Math.atan2(Math.sin(aim - player.angle), Math.cos(aim - player.angle));
      if (dist < 11 && Math.abs(delta) < 0.16) {
        target.hp = Math.max(0, target.hp - 34);
        if (target.hp === 0) {
          player.score += 1;
          setTimeout(() => {
            if (rooms.get(player.room)?.has(target.id)) {
              target.hp = 100; target.x = 2 + Math.random() * 10; target.y = 2 + Math.random() * 10;
              send(target.ws, { type: "respawn", x: target.x, y: target.y, hp: 100 });
              broadcast(player.room, { type: "player_state", player: publicPlayer(target) });
            }
          }, 2500);
        }
        broadcast(player.room, { type: "hit", shooter: player.id, target: target.id, hp: target.hp, score: player.score });
      }
    }
  });

  ws.on("close", () => {
    if (!player) return;
    const members = rooms.get(player.room);
    if (members) {
      members.delete(id);
      broadcast(player.room, { type: "player_left", id });
      if (!members.size) rooms.delete(player.room);
    }
  });
});

function publicPlayer(p) {
  return { id: p.id, name: p.name, x: p.x, y: p.y, angle: p.angle, hp: p.hp, score: p.score };
}

server.listen(PORT, "0.0.0.0", () => console.log(`Private FPS server running at http://localhost:${PORT}`));
