const express = require('express');
const { check } = require('express-validator');
const { register, login, logout, getMe } = require('../controllers/authController');
const auth = require('../middleware/auth');
const router = express.Router();

router.post('/register', [
  check('name', 'Name is required').notEmpty(),
  check('email', 'Valid email required').isEmail(),
  check('password', 'Password must be at least 6 characters').isLength({ min: 6 }),
], register);

router.post('/login', [
  check('email', 'Valid email required').isEmail(),
  check('password', 'Password required').notEmpty(),
], login);

router.post('/logout', logout);
router.get('/me', auth, getMe);

module.exports = router;