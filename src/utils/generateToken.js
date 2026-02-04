import jwt from 'jsonwebtoken';

export const generateToken = (userId) => {
  const secret = process.env.JWT_SECRET || 'changeme';
  return jwt.sign({ id: userId }, secret, { expiresIn: '7d' });
};
