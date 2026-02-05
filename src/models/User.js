import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    docsPassword: { type: String },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Note' }],
    resetToken: { type: String },
    resetExpires: { type: Date },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const User = mongoose.model('User', userSchema);
export default User;
