const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a category name'],
    unique: true,
    trim: true,
    maxlength: [50, 'Category name cannot be more than 50 characters'],
  },
  slug: {
    type: String,
    unique: true,
    trim: true,
  },
  description: {
    type: String,
    maxlength: [200, 'Description cannot be more than 200 characters'],
  },
}, {
  timestamps: true,
});

// NO pre-save hook here - slug is generated in the route

module.exports = mongoose.model('Category', CategorySchema);