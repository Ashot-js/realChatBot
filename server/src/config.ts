import mongoose from 'mongoose';
import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';

// A missing secret in production would let anyone forge tokens with the dev default.
if (isProduction && !process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET must be set in production');
}

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/real-time-chat',
  redisUrl: process.env.REDIS_URL || '',
  jwtSecret: process.env.JWT_SECRET || 'local-dev-secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  // Comma-separated list of allowed frontend origins.
  clientUrls: (process.env.CLIENT_URL || 'http://localhost:5173').split(',').map((u) => u.trim()),
  isProduction,
};

export async function connectMongo(): Promise<void> {
  await mongoose.connect(config.mongoUri);
  console.log('[MongoDB] Connected');
}

// ─── Redis: optional, only used for the "who is online" list ────────
let redisClient: Redis | null = null;

export function getRedis(): Redis | null {
  return redisClient;
}

export async function connectRedis(): Promise<void> {
  if (!config.redisUrl) {
    console.warn('[Redis] REDIS_URL not set — online list disabled');
    return;
  }

  const client = new Redis(config.redisUrl, {
    lazyConnect: true,
    maxRetriesPerRequest: 3,
    retryStrategy: (times) => (times > 5 ? null : Math.min(times * 1000, 5000)),
  });
  client.on('error', (err) => console.warn('[Redis]', err.message));

  try {
    await client.connect();
    redisClient = client;
    console.log('[Redis] Connected');
  } catch {
    console.warn('[Redis] Connection failed — running without Redis');
  }
}
