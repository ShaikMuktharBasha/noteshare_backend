import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/authRoutes.js';
import noteRoutes from './routes/noteRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import personalDocRoutes from './routes/personalDocRoutes.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 30 });
const writeLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 60 });

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/notes', writeLimiter, noteRoutes);
app.use('/api/admin', writeLimiter, adminRoutes);
app.use('/api/personal-docs', writeLimiter, personalDocRoutes);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.get('/', (req, res) => {
  res.send('API is running...');
});

app.use(notFound);
app.use(errorHandler);

export default app;
