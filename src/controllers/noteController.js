import { validationResult } from 'express-validator';
import Note from '../models/Note.js';
import User from '../models/User.js';
import { uploadBufferToCloudinary, deleteFromCloudinary } from '../utils/cloudinary.js';

export const uploadNote = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400);
    return next(new Error(errors.array()[0].msg));
  }

  if (!req.file) {
    res.status(400);
    return next(new Error('File is required'));
  }

  const { title, description, category } = req.body;

  try {
    const upload = await uploadBufferToCloudinary(req.file.buffer, 'notes', req.file.originalname);

    const note = await Note.create({
      title,
      description,
      category,
      fileUrl: upload.secure_url,
      filePublicId: upload.public_id,
      uploadedBy: req.user._id,
    });

    const populated = await note.populate('uploadedBy', 'name email');
    res.status(201).json(populated);
  } catch (err) {
    next(err);
  }
};

export const getNotes = async (req, res, next) => {
  const { search, category, mine, favorites, page = 1, limit = 9, sort = 'newest' } = req.query;
  const filter = {};

  if (search) {
    filter.title = { $regex: search, $options: 'i' };
  }
  if (category) {
    filter.category = category;
  }
  if (mine === 'true') {
    if (!req.user) {
      res.status(401);
      return next(new Error('Not authorized'));
    }
    filter.uploadedBy = req.user._id;
  }
  if (favorites === 'true') {
    if (!req.user) {
      res.status(401);
      return next(new Error('Not authorized'));
    }
    filter._id = { $in: req.user.favorites || [] };
  }

  const pageNum = Number(page) || 1;
  const pageSize = Math.min(Number(limit) || 9, 50);

  try {
    const total = await Note.countDocuments(filter);

    let notes = await Note.find(filter)
      .populate('uploadedBy', 'name email role')
      .skip((pageNum - 1) * pageSize)
      .limit(pageSize)
      .lean();

    if (sort === 'likes') {
      notes = notes.sort((a, b) => (b.likes?.length || 0) - (a.likes?.length || 0));
    } else {
      notes = notes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    const categoryCounts = await Note.aggregate([
      { $match: filter },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $project: { category: '$_id', count: 1, _id: 0 } },
    ]);

    res.json({
      data: notes,
      total,
      page: pageNum,
      pages: Math.ceil(total / pageSize),
      categories: categoryCounts,
    });
  } catch (err) {
    next(err);
  }
};

export const getNoteById = async (req, res, next) => {
  try {
    const note = await Note.findById(req.params.id).populate('uploadedBy', 'name email');
    if (!note) {
      res.status(404);
      return next(new Error('Note not found'));
    }
    res.json(note);
  } catch (err) {
    next(err);
  }
};

export const deleteNote = async (req, res, next) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) {
      res.status(404);
      return next(new Error('Note not found'));
    }

    if (note.uploadedBy.toString() !== req.user._id.toString()) {
      res.status(403);
      return next(new Error('Not authorized to delete this note'));
    }

    if (note.filePublicId) {
      await deleteFromCloudinary(note.filePublicId);
    }

    await note.deleteOne();
    res.json({ message: 'Note deleted' });
  } catch (err) {
    next(err);
  }
};

export const updateNote = async (req, res, next) => {
  const { title, description, category } = req.body;
  try {
    const note = await Note.findById(req.params.id);
    if (!note) {
      res.status(404);
      return next(new Error('Note not found'));
    }

    if (note.uploadedBy.toString() !== req.user._id.toString()) {
      res.status(403);
      return next(new Error('Not authorized to edit this note'));
    }

    if (title) note.title = title;
    if (description) note.description = description;
    if (category) note.category = category;
    await note.save();

    const populated = await note.populate('uploadedBy', 'name email');
    res.json(populated);
  } catch (err) {
    next(err);
  }
};

export const likeNote = async (req, res, next) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) {
      res.status(404);
      return next(new Error('Note not found'));
    }

    const userId = req.user._id.toString();
    const liked = note.likes.map((id) => id.toString()).includes(userId);

    if (liked) {
      note.likes = note.likes.filter((id) => id.toString() !== userId);
    } else {
      note.likes.push(req.user._id);
    }

    await note.save();
    res.json({ likes: note.likes.length, liked: !liked });
  } catch (err) {
    next(err);
  }
};

export const favoriteNote = async (req, res, next) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) {
      res.status(404);
      return next(new Error('Note not found'));
    }

    const user = await User.findById(req.user._id);
    const isFav = (user.favorites || []).some((id) => id.toString() === note._id.toString());
    if (isFav) {
      user.favorites = user.favorites.filter((id) => id.toString() !== note._id.toString());
    } else {
      user.favorites.push(note._id);
    }
    await user.save();

    res.json({ favorited: !isFav, favorites: user.favorites.length });
  } catch (err) {
    next(err);
  }
};

export const commentOnNote = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400);
    return next(new Error(errors.array()[0].msg));
  }

  try {
    const note = await Note.findById(req.params.id);
    if (!note) {
      res.status(404);
      return next(new Error('Note not found'));
    }

    note.comments.push({ user: req.user._id, text: req.body.text });
    await note.save();
    const populated = await note.populate({
      path: 'comments.user',
      select: 'name email',
    });

    res.status(201).json(populated.comments);
  } catch (err) {
    next(err);
  }
};
