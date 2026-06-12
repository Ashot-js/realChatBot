import { Router, Request, Response } from 'express';
import { User } from '../models/User';
import { generateToken, authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      res.status(400).json({ error: 'username, email, and password are required' });
      return;
    }

    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) {
      res.status(409).json({ error: 'Username or email already exists' });
      return;
    }

    const user = await User.create({ username, email, password });
    const token = generateToken(user._id.toString());

    res.status(201).json({ user: user.toJSON(), token });
  } catch (err) {
    console.error('[Auth] Register error:', err);
    const message = err instanceof Error ? err.message : 'Registration failed';
    res.status(500).json({ error: message });
  }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'email and password are required' });
      return;
    }

    const user = await User.findOne({ email });
    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const token = generateToken(user._id.toString());
    res.json({ user: user.toJSON(), token });
  } catch (err) {
    console.error('[Auth] Login error:', err);
    const message = err instanceof Error ? err.message : 'Login failed';
    res.status(500).json({ error: message });
  }
});

// GET /api/auth/me
router.get('/me', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json({ user: user.toJSON() });
  } catch (err) {
    console.error('[Auth] Me error:', err);
    const message = err instanceof Error ? err.message : 'Server error';
    res.status(500).json({ error: message });
  }
});

export default router;
