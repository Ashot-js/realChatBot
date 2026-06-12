import express from 'express';
import http from 'http';
import cors from 'cors';
import path from 'path';
import { Server } from 'socket.io';
import { connectMongo, connectRedis, config } from './config';
import { setupSocket } from './socket';
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import chatRoutes from './routes/chats';
import messageRoutes from './routes/messages';
import uploadRoutes from './routes/upload';

async function main(): Promise<void> {
  // ─── Connect to DBs ──────────────────────────────────────
  await connectMongo();
  await connectRedis();

  // ─── Express App ─────────────────────────────────────────
  const app = express();

  app.use(
    cors({
      origin: config.clientUrl,
      credentials: true,
    })
  );
  app.use(express.json());

  // Serve uploaded files
  app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

  // ─── Routes ──────────────────────────────────────────────
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/chats', chatRoutes);
  app.use('/api/messages', messageRoutes);
  app.use('/api/upload', uploadRoutes);

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // ─── HTTP Server + Socket.IO ─────────────────────────────
  const server = http.createServer(app);
  const io = new Server(server, {
    cors: {
      origin: config.clientUrl,
      methods: ['GET', 'POST'],
    },
    pingInterval: 25000,
    pingTimeout: 20000,
  });

  setupSocket(io);

  // ─── Start ───────────────────────────────────────────────
  server.listen(config.port, () => {
    console.log(`[Server] Running on port ${config.port}`);
  });
}

main().catch(console.error);