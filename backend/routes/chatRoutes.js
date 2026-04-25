// backend/routes/chatRoutes.js
import { Router } from 'express';
import { createOrGetChat, getChats, getChatById } from '../controllers/chatController.js';
import { protect } from '../middleware/auth.js';

const router = Router();

router.use(protect);

router.post('/', createOrGetChat);
router.get('/', getChats);
router.get('/:id', getChatById);

export default router;
