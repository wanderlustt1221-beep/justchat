// backend/controllers/chatController.js
import Chat from '../models/Chat.js';

const createOrGetChat = async (req, res) => {
  try {
    const { participantId } = req.body;

    if (!participantId) {
      return res.status(400).json({ success: false, message: 'Participant ID is required' });
    }

    if (participantId === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot create chat with yourself' });
    }

    let chat = await Chat.findOne({
      participants: { $all: [req.user._id, participantId] },
    }).populate('participants', '-password');

    if (chat) {
      return res.status(200).json({ success: true, data: chat });
    }

    chat = await Chat.create({ participants: [req.user._id, participantId] });
    chat = await Chat.findById(chat._id).populate('participants', '-password');

    res.status(201).json({ success: true, data: chat });
  } catch (error) {
    console.error('CreateOrGetChat error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getChats = async (req, res) => {
  try {
    const chats = await Chat.find({ participants: req.user._id })
      .populate('participants', '-password')
      .populate({ path: 'lastMessage', populate: { path: 'senderId', select: 'name' } })
      .sort({ updatedAt: -1 });

    res.status(200).json({ success: true, data: chats });
  } catch (error) {
    console.error('GetChats error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getChatById = async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.id).populate('participants', '-password');

    if (!chat) {
      return res.status(404).json({ success: false, message: 'Chat not found' });
    }

    const isParticipant = chat.participants.some(
      (p) => p._id.toString() === req.user._id.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({ success: false, message: 'Not authorized to access this chat' });
    }

    res.status(200).json({ success: true, data: chat });
  } catch (error) {
    console.error('GetChatById error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export { createOrGetChat, getChats, getChatById };
