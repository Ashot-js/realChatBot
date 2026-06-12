import { Router, Response } from 'express';
import { Chat } from '../models/Chat';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import mongoose from 'mongoose';

const router = Router();

// GET /api/chats — list user's chats
router.get('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const chats = await Chat.find({ participants: req.userId })
      .populate('participants', 'username avatar isOnline lastSeen')
      .populate('lastMessage')
      .populate('admins', 'username avatar')
      .sort({ updatedAt: -1 });

    res.json({ chats });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/chats/private — create or get private chat
router.post('/private', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.body;

    if (!userId) {
      res.status(400).json({ error: 'userId is required' });
      return;
    }

    // Check if chat already exists
    const existing = await Chat.findOne({
      isGroup: false,
      participants: { $all: [req.userId, userId], $size: 2 },
    })
      .populate('participants', 'username avatar isOnline lastSeen')
      .populate('lastMessage');

    if (existing) {
      res.json({ chat: existing });
      return;
    }

    const chat = await Chat.create({
      isGroup: false,
      participants: [req.userId, userId],
      createdBy: req.userId,
    });

    const populated = await chat.populate('participants', 'username avatar isOnline lastSeen');
    res.status(201).json({ chat: populated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/chats/group — create group chat
router.post('/group', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, participants } = req.body;

    if (!name || !participants || !Array.isArray(participants) || participants.length < 2) {
      res.status(400).json({ error: 'name and participants (min 2) are required' });
      return;
    }

    const allParticipants = [...new Set([req.userId, ...participants])];

    const chat = await Chat.create({
      name,
      isGroup: true,
      participants: allParticipants,
      admins: [req.userId],
      createdBy: req.userId,
    });

    const populated = await chat.populate([
      { path: 'participants', select: 'username avatar isOnline lastSeen' },
      { path: 'admins', select: 'username avatar' },
    ]);

    res.status(201).json({ chat: populated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/chats/:id/participants — add user to group
router.put(
  '/:id/participants',
  authMiddleware,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { userId } = req.body;
      const chat = await Chat.findById(req.params.id);

      if (!chat) {
        res.status(404).json({ error: 'Chat not found' });
        return;
      }

      if (!chat.isGroup) {
        res.status(400).json({ error: 'Cannot add participants to a private chat' });
        return;
      }

      if (!chat.participants.map(String).includes(req.userId as string)) {
        res.status(403).json({ error: 'Not a participant' });
        return;
      }

      const objectId = new mongoose.Types.ObjectId(userId) as mongoose.Types.ObjectId;
      if (!chat.participants.some((p) => p.equals(objectId))) {
        chat.participants.push(objectId);
        await chat.save();
      }

      const populated = await chat.populate([
        { path: 'participants', select: 'username avatar isOnline lastSeen' },
        { path: 'admins', select: 'username avatar' },
      ]);

      res.json({ chat: populated });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
);

// GET /api/chats/:id
router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const chat = await Chat.findOne({
      _id: req.params.id,
      participants: req.userId,
    })
      .populate('participants', 'username avatar isOnline lastSeen')
      .populate('lastMessage')
      .populate('admins', 'username avatar');

    if (!chat) {
      res.status(404).json({ error: 'Chat not found' });
      return;
    }

    res.json({ chat });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
