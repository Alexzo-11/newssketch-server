const express = require('express');
const { check } = require('express-validator');
const { getComments, createComment } = require('../controllers/commentController');
const auth = require('../middleware/auth');
const router = express.Router();

router.get('/', getComments);
router.post('/', auth, [
  check('content', 'Content is required').notEmpty(),
  check('postId', 'Post ID is required').notEmpty(),
], createComment);

module.exports = router;