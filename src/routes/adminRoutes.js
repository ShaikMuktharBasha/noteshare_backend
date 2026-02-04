import express from 'express';
import { protect, requireAdmin } from '../middleware/authMiddleware.js';
import { getStats, listNotes, removeNote } from '../controllers/adminController.js';

const router = express.Router();

router.use(protect, requireAdmin);

router.get('/stats', getStats);
router.get('/notes', listNotes);
router.delete('/notes/:id', removeNote);

export default router;
