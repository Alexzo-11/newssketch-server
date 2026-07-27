const mongoose = require('mongoose');

const VideoSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  type: {
    type: String,
    enum: ['upload', 'youtube'],
    required: true,
  },
  // For uploaded videos
  fileUrl: {
    type: String,
  },
  fileSize: {
    type: Number,
  },
  mimeType: {
    type: String,
  },
  // For YouTube videos
  youtubeId: {
    type: String,
  },
  youtubeUrl: {
    type: String,
  },
  thumbnail: {
    type: String,
  },
  duration: {
    type: String,
  },
  views: {
    type: Number,
    default: 0,
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Video', VideoSchema);