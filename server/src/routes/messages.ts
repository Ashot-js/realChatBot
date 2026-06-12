import { Router, Response } from 'express';
import { Message } from '../models/Message';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/messages/:chatId?page=1&limit=50
router.get(
  '/:chatId',
  authMiddleware,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
      const skip = (page - 1) * limit;

      const messages = await Message.find({ chat: req.params.chatId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('sender', 'username avatar')
        .lean();

      const total = await Message.countDocuments({ chat: req.params.chatId });
      const hasMore = skip + limit < total;

      // Messages are newest-first from DB; reverse for client
      res.json({
        messages: messages.reverse(),
        page,
        hasMore,
        total,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
);

export default router;
