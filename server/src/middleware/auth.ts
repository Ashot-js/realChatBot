import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';

export interface AuthRequest extends Request {
  userId?: string;
}

interface TokenPayload {
  userId: string;
}

export function generateToken(userId: string): string {
  return jwt.sign({ userId } satisfies TokenPayload, config.jwtSecret, {
    algorithm: 'HS256',
    expiresIn: config.jwtExpiresIn,
  } as jwt.SignOptions);
}

/** Returns the user id from a token, or null if it is missing, forged or expired. */
export function verifyToken(token: unknown): string | null {
  if (typeof token !== 'string') return null;
  try {
    const { userId } = jwt.verify(token, config.jwtSecret, { algorithms: ['HS256'] }) as TokenPayload;
    return typeof userId === 'string' ? userId : null;
  } catch {
    return null;
  }
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  const userId = header?.startsWith('Bearer ') ? verifyToken(header.slice(7)) : null;
  if (!userId) {
    res.status(401).json({ error: 'Invalid or expired token' });
    return;
  }
  req.userId = userId;
  next();
}
