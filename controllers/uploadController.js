const cloudinary = require('../config/cloudinary');

exports.uploadImage = async (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }
  try {
    const result = await cloudinary.uploader.upload(req.file.path);
    res.json({ url: result.secure_url, publicId: result.public_id });
  } catch (error) {
    next(error);
  }
};