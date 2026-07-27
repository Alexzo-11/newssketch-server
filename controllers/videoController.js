const Video = require('../models/Video');
const { validationResult } = require('express-validator');
const fs = require('fs');
const path = require('path');

// Get all videos
exports.getVideos = async (req, res) => {
  try {
    const { page = 1, limit = 10, type } = req.query;
    const query = {};
    
    if (type) {
      query.type = type;
    }
    
    const videos = await Video.find(query)
      .populate('uploadedBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Video.countDocuments(query);
    
    res.json({
      videos,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
    });
  } catch (error) {
    console.error('Error fetching videos:', error);
    res.status(500).json({ message: 'Failed to fetch videos' });
  }
};

// Get single video
exports.getVideo = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id).populate('uploadedBy', 'name email');
    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }
    // Increment views
    video.views += 1;
    await video.save();
    res.json(video);
  } catch (error) {
    console.error('Error fetching video:', error);
    res.status(500).json({ message: 'Failed to fetch video' });
  }
};

// Upload video
exports.uploadVideo = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a video file' });
    }

    const video = new Video({
      title,
      description: description || '',
      type: 'upload',
      fileUrl: `/uploads/${req.file.filename}`,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      uploadedBy: req.user?._id || null,
    });

    await video.save();
    res.status(201).json(video);
  } catch (error) {
    console.error('Error uploading video:', error);
    // Clean up uploaded file if error
    if (req.file) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error deleting file:', err);
      });
    }
    res.status(500).json({ message: 'Failed to upload video' });
  }
};

// Add YouTube video
exports.addYouTubeVideo = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, youtubeUrl, thumbnail } = req.body;
    
    // Extract YouTube video ID
    const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = youtubeUrl.match(youtubeRegex);
    
    if (!match) {
      return res.status(400).json({ message: 'Invalid YouTube URL' });
    }
    
    const youtubeId = match[1];
    
    const video = new Video({
      title,
      description: description || '',
      type: 'youtube',
      youtubeId,
      youtubeUrl: `https://www.youtube.com/watch?v=${youtubeId}`,
      thumbnail: thumbnail || `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`,
      uploadedBy: req.user?._id || null,
    });

    await video.save();
    res.status(201).json(video);
  } catch (error) {
    console.error('Error adding YouTube video:', error);
    res.status(500).json({ message: 'Failed to add YouTube video' });
  }
};

// Delete video
exports.deleteVideo = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }
    
    // Delete file if it's an uploaded video
    if (video.type === 'upload' && video.fileUrl) {
      const filePath = path.join(__dirname, '..', video.fileUrl);
      fs.unlink(filePath, (err) => {
        if (err) console.error('Error deleting video file:', err);
      });
    }
    
    await video.deleteOne();
    res.json({ message: 'Video deleted successfully' });
  } catch (error) {
    console.error('Error deleting video:', error);
    res.status(500).json({ message: 'Failed to delete video' });
  }
};

// Update video
exports.updateVideo = async (req, res) => {
  try {
    const { title, description, status } = req.body;
    const video = await Video.findById(req.params.id);
    
    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }
    
    video.title = title || video.title;
    video.description = description !== undefined ? description : video.description;
    video.status = status || video.status;
    video.updatedAt = Date.now();
    
    await video.save();
    res.json(video);
  } catch (error) {
    console.error('Error updating video:', error);
    res.status(500).json({ message: 'Failed to update video' });
  }
};