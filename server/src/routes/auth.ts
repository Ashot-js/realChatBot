import { Router, type Response } from 'express';
import { z } from 'zod';
import { rateLimit } from 'express-rate-limit';
import { User } from '../models/User';
import { generateToken, authMiddleware, type AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

// Slows down password guessing: 10 failed attempts per IP per 15 minutes.
const authLimiter = rateLimit({ windowMs: 15 * 60_000, limit: 10, skipSuccessfulRequests: true });

const email = z.string().trim().toLowerCase().email().max(254);

const registerSchema = z.object({
  username: z.string().trim().min(3).max(30).regex(/^[\p{L}\p{N}_.-]+$/u, 'Letters, digits, _ . - only'),
  email,
  password: z.string().min(6).max(72),
});

const loginSchema = z.object({
  email,
  password: z.string().min(1).max(72),
});

// POST /api/auth/register
router.post('/register', authLimiter, validate(registerSchema), async (req, res: Response) => {
  const { username, email, password } = req.body as z.infer<typeof registerSchema>;

  const existing = await User.exists({ $or: [{ email }, { username }] });
  if (existing) {
    res.status(409).json({ error: 'Username or email already exists' });
    return;
  }

  const user = await User.create({ username, email, password });
  res.status(201).json({ user: user.toJSON(), token: generateToken(user.id) });
});

// POST /api/auth/login
router.post('/login', authLimiter, validate(loginSchema), async (req, res: Response) => {
  const { email, password } = req.body as z.infer<typeof loginSchema>;
  const user = await User.findOne({ email });

  if (!user || !(await user.comparePassword(password))) {
    res.status(401).json({ error: 'Invalid email or password' });
    return;
  }
  res.json({ user: user.toJSON(), token: generateToken(user.id) });
});

// GET /api/auth/me
router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  const user = await User.findById(req.userId);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  res.json({ user: user.toJSON() });
});

export default router;
