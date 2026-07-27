const Category = require('../models/Category');
const slugify = require('slugify');
const { validationResult } = require('express-validator');

exports.getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find().sort('name');
    res.json(categories);
  } catch (error) {
    next(error);
  }
};

exports.createCategory = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { name, description } = req.body;
  const slug = slugify(name, { lower: true, strict: true });
  try {
    const existing = await Category.findOne({ slug });
    if (existing) return res.status(400).json({ message: 'Category already exists' });
    const category = await Category.create({ name, slug, description });
    res.status(201).json(category);
  } catch (error) {
    next(error);
  }
};

exports.updateCategory = async (req, res, next) => {
  const { id } = req.params;
  const { name, description } = req.body;
  try {
    const category = await Category.findById(id);
    if (!category) return res.status(404).json({ message: 'Category not found' });
    category.name = name || category.name;
    category.description = description !== undefined ? description : category.description;
    if (name && name !== category.name) {
      category.slug = slugify(name, { lower: true, strict: true });
    }
    await category.save();
    res.json(category);
  } catch (error) {
    next(error);
  }
};

exports.deleteCategory = async (req, res, next) => {
  const { id } = req.params;
  try {
    const category = await Category.findById(id);
    if (!category) return res.status(404).json({ message: 'Category not found' });
    await category.remove();
    res.json({ message: 'Category removed' });
  } catch (error) {
    next(error);
  }
};

exports.getPostsByCategory = async (req, res, next) => {
  const { slug } = req.params;
  try {
    const category = await Category.findOne({ slug });
    if (!category) return res.status(404).json({ message: 'Category not found' });
    const posts = await Post.find({ category: category._id, published: true })
      .populate('author', 'name')
      .sort('-createdAt');
    res.json({ category, posts });
  } catch (error) {
    next(error);
  }
};