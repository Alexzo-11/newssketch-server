const express = require('express');
const { check } = require('express-validator');
const { getPosts, getPostBySlug, createPost, updatePost, deletePost, getDashboardStats } = require('../controllers/postController');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const upload = require('../middleware/upload');
const router = express.Router();

router.get('/', getPosts);
router.get('/:slug', getPostBySlug);

// Admin routes
router.post('/', auth, admin, upload.single('image'), [
  check('title', 'Title is required').notEmpty(),
  check('content', 'Content is required').notEmpty(),
  check('category', 'Category is required').notEmpty(),
], createPost);

router.put('/:id', auth, admin, upload.single('image'), updatePost);
router.delete('/:id', auth, admin, deletePost);

module.exports = router;