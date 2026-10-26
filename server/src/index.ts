import express from 'express';
import http from 'node:http';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import { rateLimit } from 'express-rate-limit';
import { Server } from 'socket.io';
import { connectMongo, connectRedis, config } from './config';
import { setupSocket } from './socket';
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import chatRoutes from './routes/chats';
import messageRoutes from './routes/messages';
import fileRoutes from './routes/files';

async function main(): Promise<void> {
  await connectMongo();
  await connectRedis();

  const app = express();
  // Render terminates TLS in front of the app; trust one proxy hop so req.ip is the client.
  app.set('trust proxy', 1);

  app.use(helmet());
  app.use(cors({ origin: config.clientUrls }));
  app.use(express.json({ limit: '50kb' }));
  app.use('/api', rateLimit({ windowMs: 60_000, limit: 300 }));

  app.get('/', (_req, res) => {
    res.json({ service: 'RealChatBot API', status: 'running', health: '/api/health' });
  });

  app.get('/api/health', (_req, res) => {
    const dbUp = mongoose.connection.readyState === 1;
    res.status(dbUp ? 200 : 503).json({ status: dbUp ? 'ok' : 'db_unavailable' });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/chats', chatRoutes);
  app.use('/api/messages', messageRoutes);
  app.use('/api', fileRoutes);

  app.use((_req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  // Express 5 forwards rejected async handlers here. Details go to the log, never to the client.
  app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    if (err instanceof SyntaxError && 'body' in err) {
      res.status(400).json({ error: 'Invalid JSON' });
      return;
    }
    console.error('[Server] Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
  });

  const server = http.createServer(app);
  const io = new Server(server, {
    cors: { origin: config.clientUrls },
    maxHttpBufferSize: 64 * 1024, // socket events carry text only; files go through /api/upload
    pingInterval: 25_000,
    pingTimeout: 20_000,
  });
  app.set('io', io);
  setupSocket(io);

  server.listen(config.port, () => {
    console.log(`[Server] Running on port ${config.port}`);
  });
}

main().catch((err) => {
  console.error('[Server] Failed to start:', err);
  process.exit(1);
});
