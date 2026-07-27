const Post = require('../models/Post');

exports.searchPosts = async (req, res, next) => {
  const { q } = req.query;
  if (!q) {
    return res.status(400).json({ message: 'Query parameter q is required' });
  }
  try {
    const posts = await Post.find({
      $text: { $search: q },
      published: true,
    })
      .populate('category', 'name slug')
      .populate('author', 'name')
      .sort({ score: { $meta: 'textScore' } })
      .limit(20);
    res.json(posts);
  } catch (error) {
    next(error);
  }
};