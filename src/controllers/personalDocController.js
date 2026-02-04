import PersonalDoc from '../models/PersonalDoc.js';
import { uploadBufferToCloudinary, deleteFromCloudinary } from '../utils/cloudinary.js';

// @desc    Get all personal docs for logged-in user
// @route   GET /api/personal-docs
// @access  Private
export const getPersonalDocs = async (req, res, next) => {
  try {
    const docs = await PersonalDoc.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(docs);
  } catch (err) {
    next(err);
  }
};

// @desc    Get single personal doc
// @route   GET /api/personal-docs/:id
// @access  Private
export const getPersonalDoc = async (req, res, next) => {
  try {
    const doc = await PersonalDoc.findOne({ _id: req.params.id, user: req.user._id });
    if (!doc) {
      return res.status(404).json({ message: 'Document not found' });
    }
    res.json(doc);
  } catch (err) {
    next(err);
  }
};

// @desc    Upload personal doc
// @route   POST /api/personal-docs
// @access  Private
export const uploadPersonalDoc = async (req, res, next) => {
  try {
    const { title, description, category } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a file' });
    }

    const upload = await uploadBufferToCloudinary(req.file.buffer, 'personal-docs', req.file.originalname);

    const doc = await PersonalDoc.create({
      title,
      description,
      category: category || 'Other',
      file: upload.secure_url,
      filePublicId: upload.public_id,
      user: req.user._id,
    });

    res.status(201).json(doc);
  } catch (err) {
    next(err);
  }
};

// @desc    Update personal doc
// @route   PUT /api/personal-docs/:id
// @access  Private
export const updatePersonalDoc = async (req, res, next) => {
  try {
    const { title, description, category } = req.body;

    const doc = await PersonalDoc.findOne({ _id: req.params.id, user: req.user._id });
    if (!doc) {
      return res.status(404).json({ message: 'Document not found' });
    }

    doc.title = title || doc.title;
    doc.description = description !== undefined ? description : doc.description;
    doc.category = category || doc.category;

    const updated = await doc.save();
    res.json(updated);
  } catch (err) {
    next(err);
  }
};

// @desc    Delete personal doc
// @route   DELETE /api/personal-docs/:id
// @access  Private
export const deletePersonalDoc = async (req, res, next) => {
  try {
    const doc = await PersonalDoc.findOne({ _id: req.params.id, user: req.user._id });
    if (!doc) {
      return res.status(404).json({ message: 'Document not found' });
    }

    await deleteFromCloudinary(doc.filePublicId);

    await doc.deleteOne();
    res.json({ message: 'Document deleted' });
  } catch (err) {
    next(err);
  }
};
