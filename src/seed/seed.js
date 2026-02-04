import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { connectDB } from '../config/db.js';
import User from '../models/User.js';
import Note from '../models/Note.js';

dotenv.config();

const seed = async () => {
  await connectDB();

  await User.deleteMany();
  await Note.deleteMany();

  const salt = await bcrypt.genSalt(10);
  const password = await bcrypt.hash('password123', salt);

  const user = await User.create({
    name: 'Demo User',
    email: 'demo@example.com',
    password,
    role: 'admin',
  });

  const notes = [
    {
      title: 'Calculus Notes',
      description: 'Limits, derivatives, and integrals overview.',
      category: 'Mathematics',
      fileUrl: '/uploads/sample-calculus.pdf',
      uploadedBy: user._id,
    },
    {
      title: 'World History Summary',
      description: 'Key events and timelines.',
      category: 'History',
      fileUrl: '/uploads/sample-history.pdf',
      uploadedBy: user._id,
    },
  ];

  await Note.insertMany(notes);
  console.log('Seed data inserted');
  process.exit(0);
};

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
