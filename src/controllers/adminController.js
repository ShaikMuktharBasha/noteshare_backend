import Note from '../models/Note.js';
import User from '../models/User.js';

export const getStats = async (_req, res, next) => {
  try {
    const [notes, users] = await Promise.all([Note.countDocuments(), User.countDocuments()]);
    const totalLikes = await Note.aggregate([{ $group: { _id: null, likes: { $sum: { $size: '$likes' } } } }]);
    res.json({
      notes,
      users,
      likes: totalLikes[0]?.likes || 0,
    });
  } catch (err) {
    next(err);
  }
};

export const listNotes = async (_req, res, next) => {
  try {
    const notes = await Note.find({}).populate('uploadedBy', 'name email role').sort({ createdAt: -1 });
    res.json(notes);
  } catch (err) {
    next(err);
  }
};

export const removeNote = async (req, res, next) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) {
      res.status(404);
      return next(new Error('Note not found'));
    }
    await note.deleteOne();
    res.json({ message: 'Note removed' });
  } catch (err) {
    next(err);
  }
};
