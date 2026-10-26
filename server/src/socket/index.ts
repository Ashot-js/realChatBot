import type { Server, Socket } from 'socket.io';
import { z } from 'zod';
import { isValidObjectId } from 'mongoose';
import { getRedis } from '../config';
import { verifyToken } from '../middleware/auth';
import { Message } from '../models/Message';
import { Chat, type IChat } from '../models/Chat';
import { User } from '../models/User';
import { isStoredFile } from '../routes/files';

interface AuthedSocket extends Socket {
  data: { userId: string };
}

const ONLINE_TTL = 300; // seconds; refreshed every minute while connected
const userRoom = (userId: string) => `user:${userId}`;

const sendSchema = z.object({
  chatId: z.string().refine(isValidObjectId),
  content: z.string().max(4000).default(''),
  type: z.enum(['text', 'image', 'file', 'audio']).default('text'),
  fileUrl: z.string().optional(),
  fileName: z.string().max(200).optional(),
  fileSize: z.number().int().min(0).max(10_000_000).optional(),
});

/**
 * Puts every connected socket of the chat's members into its room and tells
 * them about it, so a brand-new chat shows up (and receives messages) at once.
 */
export function announceChat(io: Server, chat: IChat): void {
  const rooms = chat.participants.map((p) => userRoom(String(p._id ?? p)));
  io.in(rooms).socketsJoin(String(chat._id));
  io.to(rooms).emit('chat:new', chat);
}

export function setupSocket(io: Server): void {
  io.use((socket, next) => {
    const userId = verifyToken(socket.handshake.auth?.token);
    if (!userId) return next(new Error('Authentication required'));
    socket.data.userId = userId;
    next();
  });

  io.on('connection', async (socket: AuthedSocket) => {
    const { userId } = socket.data;

    // Rooms the socket may act in: its chats only. Membership is checked
    // against the database when joining, never trusted from the client.
    const inRoom = (chatId: unknown): chatId is string => typeof chatId === 'string' && socket.rooms.has(chatId);

    socket.on('message:send', async (raw: unknown) => {
      const parsed = sendSchema.safeParse(raw);
      if (!parsed.success) {
        socket.emit('error', { message: 'Invalid message' });
        return;
      }
      const { chatId, content, type, fileUrl, fileName, fileSize } = parsed.data;
      const text = content.trim();

      try {
        const chat = await Chat.findOne({ _id: chatId, participants: userId });
        if (!chat) {
          socket.emit('error', { message: 'Chat not found' });
          return;
        }
        // Text needs text; attachments need a file uploaded to our storage.
        if (type === 'text' ? !text : !(await isStoredFile(fileUrl))) {
          socket.emit('error', { message: 'Invalid message' });
          return;
        }

        const message = await Message.create({
          chat: chatId,
          sender: userId,
          content: text,
          type,
          ...(type !== 'text' && { fileUrl, fileName, fileSize }),
        });
        await message.populate('sender', 'username avatar');
        await chat.updateOne({ lastMessage: message._id });
        io.to(chatId).emit('message:new', message);
      } catch (err) {
        console.error('[Socket] message:send failed:', err);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    socket.on('typing:start', ({ chatId } = {}) => {
      if (inRoom(chatId)) socket.to(chatId).emit('typing:update', { chatId, userId, isTyping: true });
    });

    socket.on('typing:stop', ({ chatId } = {}) => {
      if (inRoom(chatId)) socket.to(chatId).emit('typing:update', { chatId, userId, isTyping: false });
    });

    socket.on('messages:read', async ({ chatId } = {}) => {
      if (!inRoom(chatId)) return;
      try {
        await Message.updateMany(
          { chat: chatId, sender: { $ne: userId }, readBy: { $ne: userId } },
          { $addToSet: { readBy: userId } },
        );
        socket.to(chatId).emit('messages:read:ack', { chatId, userId });
      } catch (err) {
        console.error('[Socket] messages:read failed:', err);
      }
    });

    // Re-join a chat (e.g. after reconnect); only if the user is a member.
    socket.on('chat:join', async (chatId: unknown) => {
      if (typeof chatId !== 'string' || !isValidObjectId(chatId)) return;
      if (await Chat.exists({ _id: chatId, participants: userId })) socket.join(chatId);
    });

    const refreshOnline = () => getRedis()?.set(`online:${userId}`, '1', 'EX', ONLINE_TTL).catch(() => {});
    const onlineInterval = setInterval(refreshOnline, 60_000);

    socket.on('disconnect', async () => {
      clearInterval(onlineInterval);
      // Another tab may still be open.
      if ((await io.in(userRoom(userId)).fetchSockets()).length > 0) return;
      await getRedis()?.del(`online:${userId}`).catch(() => {});
      await User.findByIdAndUpdate(userId, { isOnline: false, lastSeen: new Date() });
      socket.broadcast.emit('user:offline', { userId });
    });

    try {
      socket.join(userRoom(userId));
      const chats = await Chat.find({ participants: userId }).select('_id').lean();
      socket.join(chats.map((c) => String(c._id)));
      refreshOnline();
      await User.findByIdAndUpdate(userId, { isOnline: true, lastSeen: new Date() });
      socket.broadcast.emit('user:online', { userId });
    } catch (err) {
      console.error('[Socket] connection setup failed:', err);
    }
  });
}
