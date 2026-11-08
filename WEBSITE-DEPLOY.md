# Publish BLACKSITE as a website

The game already runs in a browser. This deployment setup serves the game page and its multiplayer WebSocket server from one web service.

## Fastest route: Render + GitHub

1. Create a GitHub account if you do not already have one.
2. Create a new repository named `blacksite-private-fps`.
3. Upload the contents of this project ZIP to the repository (the files inside the folder, not the ZIP itself).
4. In Render, choose **New → Blueprint** and connect that GitHub repository.
5. Render reads `render.yaml` and creates the web service.
6. When deployment finishes, open the `onrender.com` URL Render provides.
7. Share that website URL and your private room code with friends.

The service uses the same HTTPS website origin for WebSocket multiplayer (`wss://`), so no separate client URL setting is needed.

## Important hosting notes

- Render's free web services may sleep when idle and can take time to wake up.
- A sleeping or restarted free service disconnects active matches.
- For reliable always-on sessions, use a paid persistent web service.
- The current prototype is suitable for private testing, not a public competitive launch. It has no accounts, anti-cheat, rate limiting, or production-grade server-side movement validation.
- Private room codes are invitations, not password-grade security. Do not use sensitive codes.

## Run locally first

Install Node.js 20+, then:
```bash
npm install
npm start
```
Open `http://localhost:3000`.

## Browser controls

WASD move · Mouse aim · Left click fire · Shift sprint · R reload · Tab scoreboard · Esc releases mouse.
