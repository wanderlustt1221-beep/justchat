// backend/routes/messageRoutes.js
import { Router } from 'express';
import multer from 'multer';
import { getMessages, sendMessage, uploadImage } from '../controllers/messageController.js';
import { protect } from '../middleware/auth.js';

const router = Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // ✅ local folder
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  },
});

router.use(protect);

// IMPORTANT: /upload must come BEFORE /:chatId
router.post('/upload', upload.single('image'), uploadImage);
router.get('/:chatId', getMessages);
router.post('/', sendMessage);

export default router;
