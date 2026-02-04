import express from 'express';
import {
  getPersonalDocs,
  getPersonalDoc,
  uploadPersonalDoc,
  updatePersonalDoc,
  deletePersonalDoc,
} from '../controllers/personalDocController.js';
import { protect } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.use(protect); // All routes require authentication

router.route('/')
  .get(getPersonalDocs)
  .post(upload.single('file'), uploadPersonalDoc);

router.route('/:id')
  .get(getPersonalDoc)
  .put(updatePersonalDoc)
  .delete(deletePersonalDoc);

export default router;
