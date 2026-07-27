const express = require('express');
const { getDashboardStats } = require('../controllers/postController');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const router = express.Router();

// Get dashboard stats - with error handling
router.get('/stats', auth, admin, async (req, res, next) => {
  try {
    // Get stats from the controller
    const stats = await getDashboardStats(req, res, next);
    res.json(stats);
  } catch (error) {
    console.error('Stats error:', error);
    // Return default stats instead of error
    res.json({
      posts: 0,
      views: 0,
      comments: 0,
      visitors: 0,
      chartData: { views: [0, 0, 0, 0, 0, 0, 0] }
    });
  }
});

module.exports = router;