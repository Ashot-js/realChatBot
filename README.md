# 💬 Real-Time Chat

Full-stack real-time chat application built with React, Node.js, Socket.IO, MongoDB Atlas, and Redis Cloud.

## Features

- 🔐 **JWT Authentication** — Register / Login with secure password hashing
- 💬 **Private Chats** — One-on-one real-time messaging
- 👥 **Group Chats** — Create rooms, add participants
- 🟢 **Online Status** — Live user presence tracking via Redis
- ⌨️ **Typing Indicator** — Real-time "user is typing..."
- 📜 **Message History** — Infinite scroll with pagination
- 😊 **Emoji Picker** — Built-in emoji selector
- 📎 **File Upload** — Send images and documents (all file types)
- 🎨 **Dark Navy Theme** — Professional dark blue + white color scheme

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, TypeScript, Tailwind CSS, Vite |
| **Backend** | Node.js, Express, TypeScript |
| **Real-time** | Socket.IO (WebSocket) |
| **Database** | MongoDB Atlas (Mongoose ODM) |
| **Cache/PubSub** | Redis Cloud (ioredis) |
| **Auth** | JWT (JSON Web Tokens) |
| **File Storage** | Local disk (uploads/) |

## Project Structure

```
real-time-chat/
├── client/                  # React frontend
│   ├── src/
│   │   ├── components/      # UI components
│   │   ├── context/         # React contexts (Auth, Socket, Chat)
│   │   ├── pages/           # Login, Register
│   │   ├── services/        # API client, Socket.IO client
│   │   └── types/           # TypeScript interfaces
│   ├── index.html
│   ├── tailwind.config.js
│   └── vite.config.ts
├── server/                  # Express + Socket.IO backend
│   ├── src/
│   │   ├── middleware/      # JWT auth middleware
│   │   ├── models/          # Mongoose models (User, Message, Chat)
│   │   ├── routes/          # REST API routes
│   │   ├── socket/          # Socket.IO event handlers
│   │   └── config.ts        # MongoDB, Redis, app config
│   └── .env.example
├── DEPLOY.md                # Deployment guide + pre-push checklist
└── README.md                # This file
```

## Quick Start

### Prerequisites

- **Node.js** 18+
- **MongoDB Atlas** account (free tier)
- **Redis Cloud** account (free tier)

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd real-time-chat

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 2. Environment Variables

Copy the example env file and fill in your values:

```bash
cd server
cp .env.example .env
```

Edit `server/.env` with your actual credentials:

```env
MONGO_URI=mongodb+srv://<user>:<pass>@cluster0.xxxxx.mongodb.net/real-time-chat
REDIS_URL=redis://default:<pass>@redis-xxxxx.c000.us-east-1-mz.ec2.cloud.redislabs.com:00000
JWT_SECRET=your-random-secret-string-here
PORT=5000
CLIENT_URL=http://localhost:5173
```

### 3. Run Locally

**Terminal 1 — Server:**
```bash
cd server
npm run dev
```

**Terminal 2 — Client:**
```bash
cd client
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### 4. Test with Two Tabs

1. Open `http://localhost:5173` in two browser tabs
2. Register two different users
3. Search for the other user in the sidebar and start chatting!

## API Endpoints

### Auth
- `POST /api/auth/register` — Register new user
- `POST /api/auth/login` — Login
- `GET /api/auth/me` — Get current user

### Users
- `GET /api/users/search?q=...` — Search users
- `GET /api/users/online` — Get online users
- `GET /api/users/:id` — Get user by ID

### Chats
- `GET /api/chats` — Get all user chats
- `GET /api/chats/:id` — Get chat by ID
- `POST /api/chats/private` — Create/get private chat
- `POST /api/chats/group` — Create group chat
- `PUT /api/chats/:id/participants` — Add participant to group

### Messages
- `GET /api/messages/:chatId?page=1&limit=50` — Get message history

### Upload
- `POST /api/upload` — Upload file (multipart/form-data)

## Socket.IO Events

### Client → Server
| Event | Payload |
|---|---|
| `message:send` | `{ chatId, content, type, fileUrl?, fileName?, fileSize? }` |
| `typing:start` | `{ chatId }` |
| `typing:stop` | `{ chatId }` |
| `messages:read` | `{ chatId }` |
| `chat:join` | `chatId` |

### Server → Client
| Event | Payload |
|---|---|
| `message:new` | `Message` object |
| `typing:update` | `{ chatId, userId, isTyping }` |
| `user:online` | `{ userId }` |
| `user:offline` | `{ userId }` |
| `messages:read:ack` | `{ chatId, userId }` |
| `chat:joined` | `string[]` (chat IDs) |

## License

MIT
