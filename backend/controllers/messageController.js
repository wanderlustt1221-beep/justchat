// backend/controllers/messageController.js
import Message from '../models/Message.js';
import Chat from '../models/Chat.js';
import cloudinary from '../config/cloudinary.js';

const getMessages = async (req, res) => {
  try {
    const { chatId } = req.params;

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ success: false, message: 'Chat not found' });
    }

    const isParticipant = chat.participants.some(
      (p) => p.toString() === req.user._id.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({ success: false, message: 'Not authorized to access these messages' });
    }

    const messages = await Message.find({ chatId })
      .populate('senderId', 'name')
      .sort({ createdAt: 1 });

    res.status(200).json({ success: true, data: messages });
  } catch (error) {
    console.error('GetMessages error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const sendMessage = async (req, res) => {
  try {
    const { chatId, text, image } = req.body;

    if (!chatId) {
      return res.status(400).json({ success: false, message: 'Chat ID is required' });
    }

    if (!text && !image) {
      return res.status(400).json({ success: false, message: 'Message must contain text or image' });
    }

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ success: false, message: 'Chat not found' });
    }

    const isParticipant = chat.participants.some(
      (p) => p.toString() === req.user._id.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({ success: false, message: 'Not authorized to send messages in this chat' });
    }

    const message = await Message.create({ chatId, senderId: req.user._id, text, image });

    chat.lastMessage = message._id;
    await chat.save();

    const populatedMessage = await Message.findById(message._id).populate('senderId', 'name');

    res.status(201).json({ success: true, data: populatedMessage });
  } catch (error) {
    console.error('SendMessage error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file provided' });
    }

    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'chat-app',
      resource_type: 'auto',
    });

    res.status(200).json({
      success: true,
      data: { url: result.secure_url, publicId: result.public_id },
    });
  } catch (error) {
    console.error('UploadImage error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export { getMessages, sendMessage, uploadImage };
