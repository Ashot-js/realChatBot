import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config, getRedis } from '../config';
import { Message } from '../models/Message';
import { Chat } from '../models/Chat';
import { User } from '../models/User';
import { AuthPayload } from '../middleware/auth';

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

export function setupSocket(io: Server): void {
  // ─── Auth middleware ──────────────────────────────────────
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = jwt.verify(token, config.jwtSecret) as AuthPayload;
      socket.userId = decoded.userId;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', async (socket: AuthenticatedSocket) => {
    if (!socket.userId) {
      socket.disconnect(true);
      return;
    }
    const userId: string = socket.userId;
    console.log(`[Socket] User ${userId} connected`);

    // ─── REGISTER ALL HANDLERS FIRST (before any await) ──────
    socket.on('message:send', async (data: { chatId: string; content: string; type?: string; fileUrl?: string; fileName?: string; fileSize?: number }) => {
      try {
        const { chatId, content, type, fileUrl, fileName, fileSize } = data;
        console.log('[Socket] message:send received:', { chatId, content: content.slice(0, 30), userId });
        const chat = await Chat.findOne({ _id: chatId, participants: userId });
        if (!chat) {
          console.warn('[Socket] Chat not found for', { chatId, userId });
          socket.emit('error', { message: 'Chat not found or access denied' });
          return;
        }
        const message = await Message.create({ chat: chatId, sender: userId, content, type: type || 'text', fileUrl, fileName, fileSize });
        const populated = await message.populate('sender', 'username avatar');
        chat.lastMessage = message._id;
        await chat.save();
        console.log('[Socket] Emitting message:new to room', chatId);
        io.to(chatId).emit('message:new', populated);
      } catch (err) {
        console.error('[Socket] message:send error:', err);
        socket.emit('error', { message: err instanceof Error ? err.message : 'Failed to send message' });
      }
    });

    socket.on('typing:start', (data: { chatId: string }) => {
      socket.to(data.chatId).emit('typing:update', { chatId: data.chatId, userId, isTyping: true });
    });

    socket.on('typing:stop', (data: { chatId: string }) => {
      socket.to(data.chatId).emit('typing:update', { chatId: data.chatId, userId, isTyping: false });
    });

    socket.on('messages:read', async (data: { chatId: string }) => {
      try {
        await Message.updateMany({ chat: data.chatId, sender: { $ne: userId }, readBy: { $ne: userId } }, { $addToSet: { readBy: userId } });
        socket.to(data.chatId).emit('messages:read:ack', { chatId: data.chatId, userId });
      } catch (err) {
        console.error('[Socket] messages:read error:', err);
      }
    });

    socket.on('chat:join', (chatId: string) => {
      socket.join(chatId);
    });

    socket.on('disconnect', async () => {
      console.log(`[Socket] User ${userId} disconnected`);
      clearInterval(onlineInterval);
      await User.findByIdAndUpdate(userId, { isOnline: false, lastSeen: new Date() });
      socket.broadcast.emit('user:offline', { userId });
      await getRedis()?.del(`online:${userId}`);
    });

    // ─── RUN ASYNC SETUP ────────────────────────────────────
    // ─── MARK ONLINE ────────────────────────────────────────
    await getRedis()?.set(`online:${userId}`, '1', 'EX', 300); // 5-min TTL
    await User.findByIdAndUpdate(userId, { isOnline: true, lastSeen: new Date() });
    socket.broadcast.emit('user:online', { userId });

    // Refresh TTL every 60s
    const onlineInterval = setInterval(() => {
      getRedis()?.set(`online:${userId}`, '1', 'EX', 300)?.catch((err) =>
        console.error(`[Redis] Failed to refresh online TTL for ${userId}:`, err.message)
      );
    }, 60_000);

    // ─── JOIN ALL USER CHATS ────────────────────────────────
    const chats = await Chat.find({ participants: userId });
    console.log(`[Socket] User ${userId} joining ${chats.length} chat rooms`);
    chats.forEach((chat) => {
      socket.join(chat._id.toString());
    });
    socket.emit('chat:joined', chats.map((c) => c._id.toString()));
  });
}