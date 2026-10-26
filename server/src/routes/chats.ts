import { Router, type Response } from 'express';
import type { Server } from 'socket.io';
import { z } from 'zod';
import { Chat } from '../models/Chat';
import { User, PUBLIC_USER_FIELDS } from '../models/User';
import { authMiddleware, type AuthRequest } from '../middleware/auth';
import { validate, idParam, objectId } from '../middleware/validate';
import { announceChat } from '../socket';

const router = Router();
router.use(authMiddleware);

const POPULATE = [
  { path: 'participants', select: PUBLIC_USER_FIELDS },
  { path: 'admins', select: 'username avatar' },
  { path: 'lastMessage', populate: { path: 'sender', select: 'username avatar' } },
];

const io = (req: AuthRequest) => req.app.get('io') as Server;

/** True if every id belongs to an existing user. */
async function usersExist(ids: string[]): Promise<boolean> {
  return (await User.countDocuments({ _id: { $in: ids } })) === ids.length;
}

// GET /api/chats: the user's chats, most recently active first
router.get('/', async (req: AuthRequest, res: Response) => {
  const chats = await Chat.find({ participants: req.userId }).populate(POPULATE).sort({ updatedAt: -1 });
  res.json({ chats });
});

// POST /api/chats/private: opens the existing one-to-one chat or creates it
router.post('/private', validate(z.object({ userId: objectId })), async (req: AuthRequest, res: Response) => {
  const other: string = req.body.userId;
  if (other === req.userId || !(await usersExist([other]))) {
    res.status(400).json({ error: 'User not found' });
    return;
  }

  const existing = await Chat.findOne({
    isGroup: false,
    participants: { $all: [req.userId, other], $size: 2 },
  }).populate(POPULATE);
  if (existing) {
    res.json({ chat: existing });
    return;
  }

  const chat = await Chat.create({ isGroup: false, participants: [req.userId, other], createdBy: req.userId });
  await chat.populate(POPULATE);
  announceChat(io(req), chat);
  res.status(201).json({ chat });
});

// POST /api/chats/group
const groupSchema = z.object({
  name: z.string().trim().min(1).max(60),
  participants: z.array(objectId).min(2).max(50),
});

router.post('/group', validate(groupSchema), async (req: AuthRequest, res: Response) => {
  const { name, participants } = req.body as z.infer<typeof groupSchema>;
  const members = [...new Set([req.userId!, ...participants])];
  if (!(await usersExist(members))) {
    res.status(400).json({ error: 'Some users were not found' });
    return;
  }

  const chat = await Chat.create({ name, isGroup: true, participants: members, admins: [req.userId], createdBy: req.userId });
  await chat.populate(POPULATE);
  announceChat(io(req), chat);
  res.status(201).json({ chat });
});

// PUT /api/chats/:id/participants: a member adds someone to a group
router.put('/:id/participants', idParam('id'), validate(z.object({ userId: objectId })), async (req: AuthRequest, res: Response) => {
  const { userId } = req.body as { userId: string };
  const chat = await Chat.findOne({ _id: req.params.id, participants: req.userId });
  if (!chat) {
    res.status(404).json({ error: 'Chat not found' });
    return;
  }
  if (!chat.isGroup) {
    res.status(400).json({ error: 'Cannot add participants to a private chat' });
    return;
  }
  if (!(await usersExist([userId]))) {
    res.status(400).json({ error: 'User not found' });
    return;
  }

  await chat.updateOne({ $addToSet: { participants: userId } });
  const updated = (await Chat.findById(chat._id).populate(POPULATE))!;
  announceChat(io(req), updated);
  res.json({ chat: updated });
});

// GET /api/chats/:id
router.get('/:id', idParam('id'), async (req: AuthRequest, res: Response) => {
  const chat = await Chat.findOne({ _id: req.params.id, participants: req.userId }).populate(POPULATE);
  if (!chat) {
    res.status(404).json({ error: 'Chat not found' });
    return;
  }
  res.json({ chat });
});

export default router;
