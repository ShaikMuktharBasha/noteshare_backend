import express from 'express';
import { body } from 'express-validator';
import {
  uploadNote,
  getNotes,
  getNoteById,
  deleteNote,
  likeNote,
  commentOnNote,
  updateNote,
  favoriteNote,
} from '../controllers/noteController.js';
import { protect, optionalAuth } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.post(
  '/upload',
  protect,
  upload.single('file'),
  [
    body('title').notEmpty().withMessage('Title is required'),
    body('description').notEmpty().withMessage('Description is required'),
    body('category').notEmpty().withMessage('Category is required'),
  ],
  uploadNote
);

router.get('/', optionalAuth, getNotes);
router.get('/:id', getNoteById);
router.put('/:id', protect, updateNote);
router.delete('/:id', protect, deleteNote);
router.post('/like/:id', protect, likeNote);
router.post('/comment/:id', protect, [body('text').notEmpty().withMessage('Comment text is required')], commentOnNote);
router.post('/favorite/:id', protect, favoriteNote);

export default router;
