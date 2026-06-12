import { Router, Response } from 'express';
import { User } from '../models/User';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { getRedis } from '../config';

const router = Router();

// GET /api/users/search?q=...
router.get('/search', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const q = (req.query.q as string) || '';
    const users = await User.find({
      _id: { $ne: req.userId },
      username: { $regex: q, $options: 'i' },
    })
      .select('username avatar isOnline lastSeen')
      .limit(20);

    res.json({ users });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/users/online
router.get('/online', authMiddleware, async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Get online user IDs from Redis
    const r = getRedis();
    if (!r) {
      res.json({ users: [] });
      return;
    }
    const keys = await r.keys('online:*');
    const onlineIds = keys.map((k) => k.replace('online:', ''));

    const users = await User.find({ _id: { $in: onlineIds } }).select(
      'username avatar isOnline lastSeen'
    );

    res.json({ users });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/users/:id
router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.params.id).select('username avatar isOnline lastSeen');
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json({ user });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/users/avatar — update user avatar
router.patch('/avatar', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { avatar } = req.body;
    if (!avatar) {
      res.status(400).json({ error: 'avatar URL is required' });
      return;
    }
    const user = await User.findByIdAndUpdate(
      req.userId,
      { avatar },
      { new: true }
    ).select('username avatar isOnline lastSeen');
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json({ user });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;