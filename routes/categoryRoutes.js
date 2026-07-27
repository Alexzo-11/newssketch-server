const express = require('express');
const { check } = require('express-validator');
const { getCategories, createCategory, updateCategory, deleteCategory, getPostsByCategory } = require('../controllers/categoryController');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const router = express.Router();

router.get('/', getCategories);
router.get('/:slug/posts', getPostsByCategory);

router.post('/', auth, admin, [
  check('name', 'Name is required').notEmpty(),
], createCategory);

router.put('/:id', auth, admin, updateCategory);
router.delete('/:id', auth, admin, deleteCategory);

module.exports = router;