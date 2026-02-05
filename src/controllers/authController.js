import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { validationResult } from 'express-validator';
import User from '../models/User.js';
import { generateToken } from '../utils/generateToken.js';

export const register = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400);
    return next(new Error(errors.array()[0].msg));
  }

  const { name, email, password } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400);
      return next(new Error('Email already registered'));
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({ name, email, password: hashedPassword });

    res.status(201).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        favorites: user.favorites,
        hasDocsPassword: !!user.docsPassword,
      },
      token: generateToken(user._id),
    });
  } catch (err) {
    next(err);
  }
};

export const login = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400);
    return next(new Error(errors.array()[0].msg));
  }

  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      res.status(401);
      return next(new Error('Invalid credentials'));
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(401);
      return next(new Error('Invalid credentials'));
    }

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        favorites: user.favorites,
        hasDocsPassword: !!user.docsPassword,
      },
      token: generateToken(user._id),
    });
  } catch (err) {
    next(err);
  }
};

export const getProfile = async (req, res, next) => {
  try {
    const user = req.user;
    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        favorites: user.favorites,
        hasDocsPassword: !!user.docsPassword,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const verifyDocsPassword = async (req, res, next) => {
  try {
    const { password } = req.body;
    const user = await User.findById(req.user._id);

    if (!user.docsPassword) {
      res.status(400);
      return next(new Error('Docs password not set'));
    }

    const isMatch = await bcrypt.compare(password, user.docsPassword);
    if (!isMatch) {
      res.status(401);
      return next(new Error('Invalid docs password'));
    }

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

export const setDocsPassword = async (req, res, next) => {
  try {
    const { password } = req.body;
    if (!password || password.length < 4) {
      res.status(400);
      return next(new Error('Password must be at least 4 characters'));
    }

    const user = await User.findById(req.user._id);
    const salt = await bcrypt.genSalt(10);
    user.docsPassword = await bcrypt.hash(password, salt);
    await user.save();

    res.json({ message: 'Docs password set successfully', hasDocsPassword: true });
  } catch (err) {
    next(err);
  }
};

export const resetDocsPassword = async (req, res, next) => {
  try {
    const { accountPassword, newDocsPassword } = req.body;
    
    const user = await User.findById(req.user._id);
    
    // Verify account password first
    const isMatch = await bcrypt.compare(accountPassword, user.password);
    if (!isMatch) {
      res.status(401);
      return next(new Error('Invalid account password'));
    }

    if (!newDocsPassword || newDocsPassword.length < 4) {
      res.status(400);
      return next(new Error('New password must be at least 4 characters'));
    }

    const salt = await bcrypt.genSalt(10);
    user.docsPassword = await bcrypt.hash(newDocsPassword, salt);
    await user.save();

    res.json({ message: 'Docs password reset successfully', hasDocsPassword: true });
  } catch (err) {
    next(err);
  }
};

export const forgotPassword = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400);
    return next(new Error(errors.array()[0].msg));
  }

  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.json({ message: 'If that email exists, a reset link was sent.' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    user.resetToken = token;
    user.resetExpires = Date.now() + 1000 * 60 * 30; // 30 minutes
    await user.save();

    // In production, send email. For now, return token for development.
    res.json({ message: 'Reset token created', token });
  } catch (err) {
    next(err);
  }
};

export const resetPassword = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400);
    return next(new Error(errors.array()[0].msg));
  }

  try {
    const { token } = req.params;
    const { password } = req.body;
    const user = await User.findOne({ resetToken: token, resetExpires: { $gt: Date.now() } });
    if (!user) {
      res.status(400);
      return next(new Error('Invalid or expired token'));
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    user.resetToken = undefined;
    user.resetExpires = undefined;
    await user.save();

    res.json({ message: 'Password reset successful' });
  } catch (err) {
    next(err);
  }
};
