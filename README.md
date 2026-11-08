# BLACKSITE — browser-first private multiplayer FPS

BLACKSITE is an original browser-playable FPS prototype with a retro military-shooter feel. Open the website in a modern desktop browser; no game download is required to play.

## Play locally
Requires Node.js 20+:
```bash
npm install
npm start
```
Open http://localhost:3000.

## Publish as a website
See [WEBSITE-DEPLOY.md](WEBSITE-DEPLOY.md). The included `render.yaml` can deploy the website and WebSocket multiplayer server together using Render and GitHub.

## Desktop packaging (optional)
The Electron wrapper is optional. The website is the primary way to play:
```bash
npm run desktop
```
To build desktop installers on their respective operating systems:
```bash
npm run dist:win
npm run dist:mac
```

## Included
- Browser-playable raycast FPS
- Private rooms (up to 8 connected players)
- Movement, mouse look, firing, health, respawn, and scoreboard
- Same-origin WebSocket multiplayer

## Prototype limitations
- Compact raycast arena, not a full 3D production map.
- Prototype-grade networking; no authoritative movement simulation or cheat resistance.
- No accounts, matchmaking, voice chat, parties, anti-cheat, persistence, bots, controller support, or production-ready moderation.
- For reliable internet play, deploy to a persistent Node host that supports WebSockets. Free hosting may sleep when idle.

## Controls
WASD move · Mouse aim · Left click fire · Shift sprint · R reload · Tab scoreboard · Esc releases mouse.

## License
You may use and modify this original prototype. Third-party dependencies retain their own licenses.
