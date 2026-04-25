// backend/routes/userRoutes.js
import { Router } from 'express';
import { getUsers, getUserById } from '../controllers/userController.js';
import { protect } from '../middleware/auth.js';

const router = Router();

router.use(protect);

router.get('/', getUsers);
router.get('/:id', getUserById);

export default router;
