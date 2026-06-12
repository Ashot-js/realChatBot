import mongoose from 'mongoose';
import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/real-time-chat';
const REDIS_URL = process.env.REDIS_URL || '';

// ─── MongoDB ────────────────────────────────────────────────
export async function connectMongo(): Promise<void> {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('[MongoDB] Connected to Atlas');
  } catch (err) {
    console.error('[MongoDB] Connection failed:', err);
    process.exit(1);
  }
}

// ─── Redis (optional for local dev) ─────────────────────────
let redisClient: Redis | null = null;

export function getRedis(): Redis | null {
  return redisClient;
}

export async function connectRedis(): Promise<Redis | null> {
  if (!REDIS_URL) {
    console.warn('[Redis] REDIS_URL not set — skipping (online status unavailable)');
    return null;
  }

  redisClient = new Redis(REDIS_URL, {
    lazyConnect: true,
    maxRetriesPerRequest: 3,
    retryStrategy(times: number): number | void {
      if (times > 5) {
        console.error('[Redis] Giving up after 5 retries — running without Redis');
        return; // stop retrying
      }
      return Math.min(times * 1000, 5000);
    },
  });

  redisClient.on('error', (err) => {
    const code = (err as NodeJS.ErrnoException).code;
    if (code === 'ECONNREFUSED' || code === 'ENOTFOUND') {
      console.warn(`[Redis] Unavailable: ${err.message}`);
    } else {
      console.error('[Redis] Error:', err.message);
    }
  });

  try {
    await redisClient.connect();
    console.log('[Redis] Connected to Redis Cloud');
    return redisClient;
  } catch (err) {
    console.warn('[Redis] Connection failed — running without Redis');
    redisClient = null;
    return null;
  }
}

// ─── App Config ─────────────────────────────────────────────
export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  jwtSecret: process.env.JWT_SECRET || 'fallback-dev-secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  nodeEnv: process.env.NODE_ENV || 'development',
};
