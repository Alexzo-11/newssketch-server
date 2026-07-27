const Comment = require('../models/Comment');
const Post = require('../models/Post');
const { validationResult } = require('express-validator');

exports.getComments = async (req, res, next) => {
  const { post } = req.query;
  try {
    const query = post ? { post } : {};
    const comments = await Comment.find(query)
      .populate('author', 'name')
      .sort('-createdAt');
    res.json(comments);
  } catch (error) {
    next(error);
  }
};

exports.createComment = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { content, postId } = req.body;
  const author = req.user._id;

  try {
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    const comment = await Comment.create({ content, author, post: postId });
    const populated = await Comment.findById(comment._id).populate('author', 'name');
    res.status(201).json(populated);
  } catch (error) {
    next(error);
  }
};