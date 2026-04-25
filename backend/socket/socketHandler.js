// backend/socket/socketHandler.js
import { Server } from 'socket.io';
import { verifyToken } from '../utils/jwt.js';
import User from '../models/User.js';
import Message from '../models/Message.js';
import Chat from '../models/Chat.js';

// Store active users: userId -> socketId
const activeUsers = new Map();

// Store typing status: chatId -> Set of userIds
const typingUsers = new Map();

const initializeSocket = (server) => {
  const allowedOrigins = [
    'http://localhost:3000',
    process.env.CLIENT_URL,
    process.env.CLIENT_URL_2,
  ].filter(Boolean);

  const io = new Server(server, {
    cors: {
      origin: allowedOrigins,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  // Authenticate socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      const decoded = verifyToken(token);
      if (!decoded) {
        return next(new Error('Authentication error: Invalid token'));
      }

      const user = await User.findById(decoded.userId);
      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      socket.userId = user._id.toString();
      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', async (socket) => {
    console.log(`[Socket] User connected: ${socket.userId} (socket: ${socket.id})`);

    // Handle duplicate connections — disconnect old socket
    if (activeUsers.has(socket.userId)) {
      const oldSocketId = activeUsers.get(socket.userId);
      const oldSocket = io.sockets.sockets.get(oldSocketId);
      if (oldSocket && oldSocket.id !== socket.id) {
        console.log(`[Socket] Disconnecting old socket ${oldSocketId} for user ${socket.userId}`);
        oldSocket.disconnect(true);
      }
    }

    activeUsers.set(socket.userId, socket.id);

    await User.findByIdAndUpdate(socket.userId, {
      isOnline: true,
      lastSeen: new Date(),
    });

    io.emit('user_online', { userId: socket.userId, isOnline: true });

    // Each user joins their own room so io.to(userId) works
    socket.join(socket.userId);

    // ─── Send message ────────────────────────────────────────────────────────
    socket.on('send_message', async (data) => {
      try {
        const { chatId, text, image } = data;
        console.log(`[Socket] send_message from ${socket.userId} to chatId: ${chatId}`);

        if (!chatId) {
          socket.emit('error', { message: 'chatId is required' });
          return;
        }

        if (!text && !image) {
          socket.emit('error', { message: 'Message must contain text or image' });
          return;
        }

        const chat = await Chat.findById(chatId);
        if (!chat) {
          socket.emit('error', { message: 'Chat not found' });
          return;
        }

        const isParticipant = chat.participants.some(
          (p) => p.toString() === socket.userId
        );
        if (!isParticipant) {
          socket.emit('error', { message: 'Not authorized' });
          return;
        }

        const message = await Message.create({
          chatId,
          senderId: socket.userId,
          text,
          image,
        });

        chat.lastMessage = message._id;
        await chat.save();

        // Populate senderId for the client; keep chatId in the result
        const populatedMessage = await Message.findById(message._id)
          .populate('senderId', 'name')
          .lean();

        // Ensure chatId is always a string (lean() returns ObjectId)
        populatedMessage.chatId = populatedMessage.chatId.toString();

        console.log(`[Socket] emitting receive_message ${populatedMessage._id} to chatId: ${populatedMessage.chatId}`);

        const otherParticipantId = chat.participants
          .find((p) => p.toString() !== socket.userId)
          .toString();

        io.to(socket.userId).emit('receive_message', populatedMessage);
        io.to(otherParticipantId).emit('receive_message', populatedMessage);

        // Clear typing indicator for sender
        const typingSet = typingUsers.get(chatId);
        if (typingSet) {
          typingSet.delete(socket.userId);
          if (typingSet.size === 0) typingUsers.delete(chatId);
        }
        io.to(otherParticipantId).emit('stop_typing', { chatId, userId: socket.userId });
      } catch (error) {
        console.error('[Socket] send_message error:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // ─── Typing ──────────────────────────────────────────────────────────────
    socket.on('typing', async (data) => {
      try {
        const { chatId } = data;

        const chat = await Chat.findById(chatId);
        if (!chat) return;

        const isParticipant = chat.participants.some(
          (p) => p.toString() === socket.userId
        );
        if (!isParticipant) return;

        if (!typingUsers.has(chatId)) typingUsers.set(chatId, new Set());
        typingUsers.get(chatId).add(socket.userId);

        const otherParticipantId = chat.participants
          .find((p) => p.toString() !== socket.userId)
          .toString();

        io.to(otherParticipantId).emit('typing', {
          chatId,
          userId: socket.userId,
          userName: socket.user.name,
        });
      } catch (error) {
        console.error('[Socket] typing error:', error);
      }
    });

    // ─── Stop typing ─────────────────────────────────────────────────────────
    socket.on('stop_typing', async (data) => {
      try {
        const { chatId } = data;

        const chat = await Chat.findById(chatId);
        if (!chat) return;

        const typingSet = typingUsers.get(chatId);
        if (typingSet) {
          typingSet.delete(socket.userId);
          if (typingSet.size === 0) typingUsers.delete(chatId);
        }

        const otherParticipantId = chat.participants
          .find((p) => p.toString() !== socket.userId)
          .toString();

        io.to(otherParticipantId).emit('stop_typing', { chatId, userId: socket.userId });
      } catch (error) {
        console.error('[Socket] stop_typing error:', error);
      }
    });

    // ─── Disconnect ──────────────────────────────────────────────────────────
    socket.on('disconnect', async () => {
      console.log(`[Socket] User disconnected: ${socket.userId} (socket: ${socket.id})`);

      // Only mark offline if this is still the active socket for this user
      if (activeUsers.get(socket.userId) === socket.id) {
        activeUsers.delete(socket.userId);

        await User.findByIdAndUpdate(socket.userId, {
          isOnline: false,
          lastSeen: new Date(),
        });

        io.emit('user_offline', {
          userId: socket.userId,
          isOnline: false,
          lastSeen: new Date(),
        });
      }

      // Clear all typing indicators for this socket's user
      for (const [chatId, typingSet] of typingUsers.entries()) {
        if (typingSet.has(socket.userId)) {
          typingSet.delete(socket.userId);
          if (typingSet.size === 0) typingUsers.delete(chatId);

          const chat = await Chat.findById(chatId);
          if (chat) {
            const otherParticipantId = chat.participants
              .find((p) => p.toString() !== socket.userId)
              ?.toString();

            if (otherParticipantId) {
              io.to(otherParticipantId).emit('stop_typing', {
                chatId,
                userId: socket.userId,
              });
            }
          }
        }
      }
    });
  });

  return io;
};

export default initializeSocket;