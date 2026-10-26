import { Router, type Response } from 'express';
import { Message } from '../models/Message';
import { Chat } from '../models/Chat';
import { authMiddleware, type AuthRequest } from '../middleware/auth';
import { idParam } from '../middleware/validate';

const router = Router();

// GET /api/messages/:chatId?page=1&limit=50: only for members of the chat
router.get('/:chatId', authMiddleware, idParam('chatId'), async (req: AuthRequest, res: Response) => {
  const chatId = req.params.chatId as string;
  if (!(await Chat.exists({ _id: chatId, participants: req.userId }))) {
    res.status(404).json({ error: 'Chat not found' });
    return;
  }

  const page = Math.max(1, Math.min(parseInt(String(req.query.page)) || 1, 1000));
  const limit = Math.max(1, Math.min(parseInt(String(req.query.limit)) || 50, 100));
  const skip = (page - 1) * limit;

  const [messages, total] = await Promise.all([
    Message.find({ chat: chatId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('sender', 'username avatar')
      .lean(),
    Message.countDocuments({ chat: chatId }),
  ]);

  // Newest-first from the database; the client wants oldest-first.
  res.json({ messages: messages.reverse(), page, hasMore: skip + limit < total, total });
});

export default router;
