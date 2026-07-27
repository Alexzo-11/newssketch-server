const express = require('express');
const { check } = require('express-validator');
const { uploadVideo } = require('../middleware/upload');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const {
  getVideos,
  getVideo,
  uploadVideo: uploadVideoController,
  addYouTubeVideo,
  deleteVideo,
  updateVideo,
} = require('../controllers/videoController');

const router = express.Router();

// Public routes
router.get('/', getVideos);
router.get('/:id', getVideo);

// Admin routes
router.post('/upload', 
  auth, 
  admin, 
  uploadVideo.single('video'),
  [
    check('title', 'Title is required').notEmpty(),
  ],
  uploadVideoController
);

router.post('/youtube',
  auth,
  admin,
  [
    check('title', 'Title is required').notEmpty(),
    check('youtubeUrl', 'YouTube URL is required').isURL(),
  ],
  addYouTubeVideo
);

router.put('/:id',
  auth,
  admin,
  updateVideo
);

router.delete('/:id',
  auth,
  admin,
  deleteVideo
);

module.exports = router;