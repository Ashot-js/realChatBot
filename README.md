# RealChat — real-time chat

Private and group chats with live delivery, typing indicator, online status, photos, files and voice messages.
Works on phones (full-screen list ↔ conversation), tablets and desktops (side by side).

**App:** https://realchatbot-app.web.app
**API:** https://realchatbot.onrender.com/api/health

## Stack (all free tiers)

| Part | Where | Tech |
|------|-------|------|
| Client (`client/`) | Firebase Hosting | React 19, TypeScript, Tailwind CSS 4, Socket.IO client, Vite |
| Server (`server/`) | Render (Free) | Node, Express 5, Socket.IO, Mongoose, Zod, JWT, helmet |
| Database | MongoDB Atlas (M0) | users, chats, messages; uploaded files in GridFS |
| Presence | Upstash Redis (optional) | "who is online" list |

The free Render instance sleeps when idle — the first request after a pause takes ~50 s.

## How it works

- **Real time:** one WebSocket (Socket.IO) per signed-in tab. The server puts each socket in the
  rooms of the user's chats; a new chat is pushed to all its members (`chat:new`) so it appears
  without a reload.
- **Privacy:** history (`GET /api/messages/:chatId`), live rooms, typing and read receipts are only
  available to chat members — checked against the database on the server, never trusted from the client.
- **Files:** uploaded to MongoDB GridFS (Render's free disk is wiped on restart). Whitelisted types,
  5 MB max, served with `nosniff` and a sandbox CSP; byte ranges for Safari audio.

## Run locally

```bash
# server
cd server
cp .env.example .env     # MONGO_URI (Atlas or local), JWT_SECRET
npm install              # also compiles TypeScript
npm run dev              # http://localhost:5000

# client (second terminal)
cd client
npm install
npm run dev              # http://localhost:5173 — /api and /socket.io are proxied to :5000
```

## Checks

```bash
cd server && API_BASE=http://localhost:5000 npm run smoke   # 34 API + Socket.IO checks
cd client && npm run lint && npm run build
```

`npm run smoke` creates throwaway `smoke-*` users — run it against a local database, or delete them after.

Deployment: see [DEPLOY.md](DEPLOY.md).
