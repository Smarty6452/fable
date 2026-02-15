import mongoose from 'mongoose';

const SessionSchema = new mongoose.Schema({
  kidName: { type: String, default: 'Little Explorer' },
  sound: String,
  word: String,
  attempts: Number,
  success: Boolean,
  transcript: String,
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Session || mongoose.model('Session', SessionSchema);
