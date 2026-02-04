import mongoose from 'mongoose';

const personalDocSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    category: {
      type: String,
      enum: ['Resume', 'ID Proof', 'Certificate', 'Financial', 'Medical', 'Other'],
      default: 'Other',
    },
    file: { type: String, required: true }, // will store Cloudinary secure_url
    filePublicId: { type: String },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

// Ensure users can only access their own documents
personalDocSchema.index({ user: 1 });

const PersonalDoc = mongoose.model('PersonalDoc', personalDocSchema);
export default PersonalDoc;
