const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

// Image upload to Cloudinary
const imageStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'news-sketch/images',
    upload_preset: 'news_sketch_uploads', // Add this line
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    transformation: [{ width: 1200, height: 800, crop: 'limit' }],
  },
});

// Video upload to Cloudinary
const videoStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'news-sketch/videos',
    upload_preset: 'news_sketch_uploads', // Add this line
    resource_type: 'video',
    allowed_formats: ['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv'],
  },
});

const uploadImage = multer({ storage: imageStorage });
const uploadVideo = multer({ storage: videoStorage });

module.exports = { uploadImage, uploadVideo };