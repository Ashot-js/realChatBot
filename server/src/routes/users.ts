import { Router, type Response } from 'express';
import { z } from 'zod';
import { User, PUBLIC_USER_FIELDS } from '../models/User';
import { authMiddleware, type AuthRequest } from '../middleware/auth';
import { validate, idParam } from '../middleware/validate';
import { FILE_URL_PATTERN } from './files';
import { getRedis } from '../config';

const router = Router();
router.use(authMiddleware);

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// GET /api/users/search?q=...
router.get('/search', async (req: AuthRequest, res: Response) => {
  const q = String(req.query.q ?? '').trim().slice(0, 30);
  if (!q) {
    res.json({ users: [] });
    return;
  }
  const users = await User.find({
    _id: { $ne: req.userId },
    username: { $regex: escapeRegex(q), $options: 'i' },
  })
    .select(PUBLIC_USER_FIELDS)
    .limit(20);
  res.json({ users });
});

// GET /api/users/online
router.get('/online', async (_req, res: Response) => {
  const redis = getRedis();
  if (!redis) {
    res.json({ users: [] });
    return;
  }
  const keys = await redis.keys('online:*');
  const users = await User.find({ _id: { $in: keys.map((k) => k.slice('online:'.length)) } }).select(PUBLIC_USER_FIELDS);
  res.json({ users });
});

// PATCH /api/users/avatar: the avatar must be a file uploaded to this server
const avatarSchema = z.object({ avatar: z.string().regex(FILE_URL_PATTERN, 'Upload the image first') });

router.patch('/avatar', validate(avatarSchema), async (req: AuthRequest, res: Response) => {
  const user = await User.findByIdAndUpdate(req.userId, { avatar: req.body.avatar }, { new: true }).select(PUBLIC_USER_FIELDS);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  res.json({ user });
});

// GET /api/users/:id
router.get('/:id', idParam('id'), async (req, res: Response) => {
  const user = await User.findById(req.params.id).select(PUBLIC_USER_FIELDS);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  res.json({ user });
});

export default router;
