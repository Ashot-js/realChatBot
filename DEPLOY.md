# Deploying RealChat

## Server — Render

Service `realChatBot` (Web Service, Free), connected to this GitHub repo:

| Setting | Value |
|---------|-------|
| Root Directory | `server` |
| Build Command | `npm install` (compiles TypeScript via `postinstall`) |
| Start Command | `npm start` (`node dist/index.js`) |
| Health Check Path | `/api/health` |

Environment variables:

| Key | Value |
|-----|-------|
| `MONGO_URI` | MongoDB Atlas connection string (Atlas → Connect → Drivers) |
| `JWT_SECRET` | long random string — the server refuses to start in production without it |
| `NODE_ENV` | `production` |
| `CLIENT_URL` | `https://realchatbot-app.web.app` (comma-separate several origins) |
| `REDIS_URL` | optional, Upstash Redis URL for the online list |

Every push to `main` redeploys. If Render can't see the repo, add it under
GitHub → Settings → Applications → Render → Repository access.

## Client — Firebase Hosting

`client/.env.production` holds `VITE_SOCKET_URL=https://realchatbot.onrender.com`.

```bash
cd client
npm install
npm run build
npx firebase deploy --only hosting
```

## After deploying

```bash
curl https://realchatbot.onrender.com/api/health   # {"status":"ok"} once MongoDB is connected
```
