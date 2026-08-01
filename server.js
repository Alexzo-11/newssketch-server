const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const path = require('path');
const mongoose = require('mongoose');
const multer = require('multer');
const fs = require('fs');
const bcrypt = require('bcryptjs');

// Load models
const Post = require('./models/Post');
const Category = require('./models/Category');
const User = require('./models/User');
const Comment = require('./models/Comment');
const Video = require('./models/Video');

dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();

// Connect to MongoDB
const connectDB = require('./config/db');
connectDB();

// ============================================
// CORS CONFIGURATION
// ============================================

const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:3000',
  'https://newssketch-client.vercel.app',
  'http://localhost:3000',
  'http://localhost:3001',
  'https://*.vercel.app',
  'https://*.onrender.com',
];

app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  let isAllowed = false;
  if (!origin) {
    isAllowed = true;
  } else {
    isAllowed = allowedOrigins.some(allowed => {
      if (!allowed) return false;
      if (allowed.includes('*')) {
        const pattern = allowed.replace('*', '.*');
        const regex = new RegExp(`^${pattern}$`);
        return regex.test(origin);
      }
      return origin === allowed || origin === allowed.replace(/\/$/, '');
    });
  }
  
  if (isAllowed && origin) {
    res.header('Access-Control-Allow-Origin', origin);
  } else if (!origin) {
    res.header('Access-Control-Allow-Origin', '*');
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cookie, X-Requested-With, Accept');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Max-Age', '86400');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});

// ============================================
// ROOT & HEALTH ROUTES
// ============================================

app.get('/', (req, res) => {
  res.json({
    message: 'News Sketch API Server',
    status: 'running',
    version: '2.0.0 - Database Mode',
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: {
        login: 'POST /api/auth/login',
        me: 'GET /api/auth/me',
        logout: 'POST /api/auth/logout',
        register: 'POST /api/auth/register'
      },
      posts: {
        list: 'GET /api/posts',
        create: 'POST /api/posts',
        getBySlug: 'GET /api/posts/:slug',
        getById: 'GET /api/posts/id/:id',
        update: 'PUT /api/posts/id/:id',
        delete: 'DELETE /api/posts/id/:id',
        related: 'GET /api/posts/related'
      },
      categories: {
        list: 'GET /api/categories',
        create: 'POST /api/categories',
        update: 'PUT /api/categories/:id',
        delete: 'DELETE /api/categories/:id',
        posts: 'GET /api/categories/:slug/posts'
      },
      comments: {
        list: 'GET /api/comments',
        create: 'POST /api/comments'
      },
      videos: {
        list: 'GET /api/videos',
        get: 'GET /api/videos/:id',
        upload: 'POST /api/videos/upload',
        youtube: 'POST /api/videos/youtube',
        delete: 'DELETE /api/videos/:id',
        featured: 'GET /api/videos/featured'
      },
      search: 'GET /api/search',
      admin: {
        stats: 'GET /api/admin/stats'
      },
      test: 'GET /api/test',
      health: 'GET /health'
    }
  });
});

app.get('/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState;
  const statusMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    mongodb: statusMap[dbStatus] || 'unknown',
    environment: process.env.NODE_ENV || 'development'
  });
});

// ============================================
// MULTER CONFIGURATION
// ============================================

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Image upload configuration
const imageStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'image-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const imageFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (JPEG, PNG, GIF, WebP)'));
  }
};

const uploadImage = multer({
  storage: imageStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: imageFilter
});

// Video upload configuration
const videoStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'video-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const videoFilter = (req, file, cb) => {
  const allowedTypes = /mp4|webm|ogg|mov|avi|mkv/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only video files are allowed (MP4, WebM, OGG, MOV, AVI, MKV)'));
  }
};

const uploadVideo = multer({
  storage: videoStorage,
  limits: { fileSize: 500 * 1024 * 1024 },
  fileFilter: videoFilter
});

// ============================================
// MIDDLEWARE
// ============================================

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan('dev'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ============================================
// AUTH ROUTES
// ============================================

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'admin',
    });
    
    res.status(201).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token: 'mock-jwt-token',
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('📡 Login attempt:', email);
    
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    
    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token: 'mock-jwt-token',
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      message: 'Server error during login',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get current user
app.get('/api/auth/me', async (req, res) => {
  try {
    let user = await User.findOne({ email: 'admin@newssketch.com' });
    if (!user) {
      user = await User.create({
        name: 'Admin',
        email: 'admin@newssketch.com',
        password: 'admin123',
        role: 'admin',
      });
    }
    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

// ============================================
// POST ROUTES
// ============================================

// GET all posts
app.get('/api/posts', async (req, res) => {
  try {
    const { page = 1, limit = 10, category, featured, sort = '-createdAt' } = req.query;
    
    const query = { published: true };
    if (category) {
      const categoryDoc = await Category.findOne({ slug: category });
      if (categoryDoc) query.category = categoryDoc._id;
    }
    if (featured === 'true') query.featured = true;
    
    let sortOption = {};
    if (sort === '-views') sortOption = { views: -1 };
    else if (sort === 'views') sortOption = { views: 1 };
    else sortOption = { createdAt: -1 };
    
    const posts = await Post.find(query)
      .populate('category', 'name slug')
      .populate('author', 'name')
      .sort(sortOption)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));
    
    const total = await Post.countDocuments(query);
    
    res.json({
      posts,
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
    });
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ message: 'Failed to fetch posts' });
  }
});

// GET related posts
app.get('/api/posts/related', async (req, res) => {
  try {
    const { category, exclude } = req.query;
    if (!category) {
      return res.status(400).json({ message: 'Category parameter is required' });
    }
    const posts = await Post.find({
      category,
      _id: { $ne: exclude },
      published: true,
    })
      .populate('category', 'name slug')
      .populate('author', 'name')
      .limit(3)
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (error) {
    console.error('Error fetching related posts:', error);
    res.status(500).json({ message: 'Failed to fetch related posts' });
  }
});

// GET single post by slug
app.get('/api/posts/:slug', async (req, res) => {
  try {
    const post = await Post.findOne({ slug: req.params.slug, published: true })
      .populate('category', 'name slug')
      .populate('author', 'name');
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    post.views += 1;
    await post.save();
    res.json(post);
  } catch (error) {
    console.error('Error fetching post:', error);
    res.status(500).json({ message: 'Failed to fetch post' });
  }
});

// GET post by ID
app.get('/api/posts/id/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('category', 'name slug')
      .populate('author', 'name');
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    res.json(post);
  } catch (error) {
    console.error('Error fetching post by ID:', error);
    res.status(500).json({ message: 'Failed to fetch post' });
  }
});

// POST create new post
app.post('/api/posts', uploadImage.single('image'), async (req, res) => {
  try {
    console.log('📡 POST /api/posts - Creating new post');
    console.log('📦 Request body:', req.body);
    
    req.setTimeout(120000);
    
    const { title, content, category, tags, metaTitle, metaDescription, slug: customSlug, featured } = req.body;
    
    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }
    if (!content) {
      return res.status(400).json({ message: 'Content is required' });
    }
    if (!category) {
      return res.status(400).json({ message: 'Category is required' });
    }
    
    let parsedTags = tags;
    if (typeof tags === 'string') {
      try {
        parsedTags = JSON.parse(tags);
      } catch {
        parsedTags = tags.split(',').map(t => t.trim()).filter(t => t);
      }
    }
    
    let slug = customSlug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    slug = slug.replace(/^-+|-+$/g, '');
    const existingPost = await Post.findOne({ slug });
    if (existingPost) {
      slug = slug + '-' + Date.now();
    }
    
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://newssketch-api.onrender.com' 
      : 'http://localhost:5000';
    
    let imageUrl = '/placeholder.svg';
    let publicId = 'placeholder';
    if (req.file) {
      imageUrl = `${baseUrl}/uploads/${req.file.filename}`;
      publicId = req.file.filename;
      console.log('📎 Image uploaded:', req.file.filename);
    }
    
    const adminUser = await User.findOne({ email: 'admin@newssketch.com' });
    if (!adminUser) {
      return res.status(400).json({ message: 'Admin user not found. Please seed the database.' });
    }
    
    const post = await Post.create({
      title,
      slug,
      content,
      excerpt: content.replace(/<[^>]*>/g, '').slice(0, 150) + '...',
      image: { url: imageUrl, publicId },
      category,
      tags: parsedTags || [],
      author: adminUser._id,
      metaTitle: metaTitle || title,
      metaDescription: metaDescription || content.replace(/<[^>]*>/g, '').slice(0, 160),
      readingTime: Math.ceil(content.replace(/<[^>]*>/g, '').split(' ').length / 200) || 2,
      published: true,
      featured: featured === 'true' || featured === true,
    });
    
    console.log('✅ Post created:', post._id);
    res.status(201).json(post);
  } catch (error) {
    console.error('❌ Error creating post:', error);
    res.status(500).json({ 
      message: 'Failed to create post',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// PUT update post
app.put('/api/posts/id/:id', uploadImage.single('image'), async (req, res) => {
  try {
    const { id } = req.params;
    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    const { title, content, category, tags, metaTitle, metaDescription, slug: customSlug, featured } = req.body;
    
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://newssketch-api.onrender.com' 
      : 'http://localhost:5000';
    
    let imageUrl = post.image?.url || '/placeholder.svg';
    let publicId = post.image?.publicId || 'placeholder';
    if (req.file) {
      imageUrl = `${baseUrl}/uploads/${req.file.filename}`;
      publicId = req.file.filename;
    }
    
    post.title = title || post.title;
    post.content = content || post.content;
    post.category = category || post.category;
    post.tags = tags ? (typeof tags === 'string' ? tags.split(',').map(t => t.trim()) : tags) : post.tags;
    post.metaTitle = metaTitle || post.metaTitle;
    post.metaDescription = metaDescription || post.metaDescription;
    if (customSlug) post.slug = customSlug;
    post.image = { url: imageUrl, publicId };
    if (featured !== undefined) post.featured = featured === 'true' || featured === true;
    
    await post.save();
    res.json(post);
  } catch (error) {
    console.error('Error updating post:', error);
    res.status(500).json({ message: 'Failed to update post' });
  }
});

// DELETE post
app.delete('/api/posts/id/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    await post.deleteOne();
    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ message: 'Failed to delete post' });
  }
});

// ============================================
// CATEGORY ROUTES
// ============================================

app.get('/api/categories', async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ message: 'Failed to fetch categories' });
  }
});

app.get('/api/categories/:slug/posts', async (req, res) => {
  try {
    const category = await Category.findOne({ slug: req.params.slug });
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    const posts = await Post.find({ category: category._id, published: true })
      .populate('author', 'name')
      .sort({ createdAt: -1 });
    res.json({ category, posts });
  } catch (error) {
    console.error('Error fetching category posts:', error);
    res.status(500).json({ message: 'Failed to fetch category posts' });
  }
});

app.post('/api/categories', async (req, res) => {
  try {
    const { name, description } = req.body;
    
    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }
    
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    const existingCategory = await Category.findOne({ 
      $or: [{ name: name.trim() }, { slug }] 
    });
    if (existingCategory) {
      return res.status(400).json({ message: 'Category already exists' });
    }
    
    const category = new Category({
      name: name.trim(),
      slug: slug,
      description: description ? description.trim() : '',
    });
    
    await category.save();
    res.status(201).json(category);
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ 
      message: 'Failed to create category',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

app.put('/api/categories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    category.name = name || category.name;
    category.description = description !== undefined ? description : category.description;
    await category.save();
    res.json(category);
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ message: 'Failed to update category' });
  }
});

app.delete('/api/categories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    await category.deleteOne();
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ message: 'Failed to delete category' });
  }
});

// ============================================
// COMMENT ROUTES
// ============================================

app.get('/api/comments', async (req, res) => {
  try {
    const { post } = req.query;
    const query = post ? { post } : {};
    const comments = await Comment.find(query)
      .populate('author', 'name')
      .sort({ createdAt: -1 });
    res.json(comments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ message: 'Failed to fetch comments' });
  }
});

app.post('/api/comments', async (req, res) => {
  try {
    const { content, postId } = req.body;
    if (!content || !postId) {
      return res.status(400).json({ message: 'Content and postId are required' });
    }
    let author = await User.findOne({ email: 'admin@newssketch.com' });
    if (!author) {
      author = await User.create({
        name: 'Admin',
        email: 'admin@newssketch.com',
        password: 'admin123',
        role: 'admin',
      });
    }
    const comment = await Comment.create({
      content,
      author: author._id,
      post: postId,
    });
    const populatedComment = await Comment.findById(comment._id)
      .populate('author', 'name');
    res.status(201).json(populatedComment);
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({ message: 'Failed to create comment' });
  }
});

// ============================================
// VIDEO ROUTES
// ============================================

// GET all videos
app.get('/api/videos', async (req, res) => {
  try {
    const { page = 1, limit = 10, type } = req.query;
    const query = { status: 'active' };
    if (type) query.type = type;
    
    const videos = await Video.find(query)
      .populate('uploadedBy', 'name')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));
    
    const total = await Video.countDocuments(query);
    
    res.json({
      videos,
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
    });
  } catch (error) {
    console.error('Error fetching videos:', error);
    res.status(500).json({ message: 'Failed to fetch videos' });
  }
});

// GET featured videos
app.get('/api/videos/featured', async (req, res) => {
  try {
    const video = await Video.findOne({ 
      featured: true,
      status: 'active'
    })
      .populate('uploadedBy', 'name')
      .sort({ createdAt: -1 });
    
    if (!video) {
      return res.status(404).json({ message: 'No featured video found' });
    }
    
    res.json(video);
  } catch (error) {
    console.error('Error fetching featured video:', error);
    res.status(500).json({ message: 'Failed to fetch featured video' });
  }
});

// GET single video
app.get('/api/videos/:id', async (req, res) => {
  try {
    const video = await Video.findById(req.params.id)
      .populate('uploadedBy', 'name');
    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }
    video.views += 1;
    await video.save();
    res.json(video);
  } catch (error) {
    console.error('Error fetching video:', error);
    res.status(500).json({ message: 'Failed to fetch video' });
  }
});

// Upload video
app.post('/api/videos/upload', uploadVideo.single('video'), async (req, res) => {
  try {
    console.log('📡 POST /api/videos/upload');
    console.log('📦 Request body:', req.body);
    
    const { title, description, featured } = req.body;
    
    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }
    
    const adminUser = await User.findOne({ email: 'admin@newssketch.com' });
    if (!adminUser) {
      return res.status(400).json({ message: 'Admin user not found' });
    }
    
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://newssketch-api.onrender.com' 
      : 'http://localhost:5000';
    
    let fileUrl = null;
    let fileSize = 0;
    let mimeType = null;
    if (req.file) {
      fileUrl = `${baseUrl}/uploads/${req.file.filename}`;
      fileSize = req.file.size;
      mimeType = req.file.mimetype;
    }
    
    const video = await Video.create({
      title,
      description: description || '',
      type: 'upload',
      fileUrl,
      fileSize,
      mimeType,
      featured: featured === 'true' || featured === true,
      uploadedBy: adminUser._id,
      status: 'active',
    });
    
    console.log('✅ Video created:', video._id);
    res.status(201).json(video);
  } catch (error) {
    console.error('Error uploading video:', error);
    res.status(500).json({ 
      message: 'Failed to upload video',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Add YouTube video
app.post('/api/videos/youtube', async (req, res) => {
  try {
    console.log('📡 POST /api/videos/youtube');
    console.log('📦 Request body:', req.body);
    
    const { title, description, youtubeUrl, featured } = req.body;
    
    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }
    if (!youtubeUrl) {
      return res.status(400).json({ message: 'YouTube URL is required' });
    }
    
    // Extract YouTube video ID
    const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = youtubeUrl.match(youtubeRegex);
    
    if (!match) {
      return res.status(400).json({ 
        message: 'Invalid YouTube URL. Please use format: https://www.youtube.com/watch?v=VIDEO_ID' 
      });
    }
    
    const youtubeId = match[1];
    
    // Check if video already exists
    const existingVideo = await Video.findOne({ youtubeId });
    if (existingVideo) {
      return res.status(400).json({ message: 'This YouTube video has already been added' });
    }
    
    const adminUser = await User.findOne({ email: 'admin@newssketch.com' });
    if (!adminUser) {
      return res.status(400).json({ message: 'Admin user not found' });
    }
    
    const video = await Video.create({
      title: title.trim(),
      description: description ? description.trim() : '',
      type: 'youtube',
      youtubeId,
      youtubeUrl: `https://www.youtube.com/watch?v=${youtubeId}`,
      thumbnail: `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`,
      featured: featured === 'true' || featured === true,
      uploadedBy: adminUser._id,
      status: 'active',
    });
    
    console.log('✅ YouTube video added:', video._id);
    res.status(201).json(video);
  } catch (error) {
    console.error('Error adding YouTube video:', error);
    res.status(500).json({ 
      message: 'Failed to add YouTube video',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// DELETE video
app.delete('/api/videos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const video = await Video.findById(id);
    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }
    await video.deleteOne();
    res.json({ message: 'Video deleted successfully' });
  } catch (error) {
    console.error('Error deleting video:', error);
    res.status(500).json({ message: 'Failed to delete video' });
  }
});

// ============================================
// SEARCH ROUTE
// ============================================

app.get('/api/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ message: 'Query parameter q is required' });
    }
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
    console.error('Error searching:', error);
    res.status(500).json({ message: 'Failed to search' });
  }
});

// ============================================
// ADMIN STATS
// ============================================

app.get('/api/admin/stats', async (req, res) => {
  try {
    const totalPosts = await Post.countDocuments();
    const totalComments = await Comment.countDocuments();
    const totalCategories = await Category.countDocuments();
    const totalVideos = await Video.countDocuments();
    const totalViews = await Post.aggregate([
      { $group: { _id: null, total: { $sum: '$views' } } }
    ]);
    const mostRead = await Post.find({ published: true })
      .sort({ views: -1 })
      .limit(5)
      .select('title slug views');
    const categoryCounts = await Post.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'category' } },
      { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
      { $project: { name: '$category.name', count: 1 } }
    ]);
    res.json({
      posts: totalPosts,
      views: totalViews[0]?.total || 0,
      comments: totalComments,
      videos: totalVideos,
      visitors: 1234,
      mostRead,
      categories: categoryCounts,
      chartData: {
        views: [120, 150, 180, 220, 190, 240, 210],
      },
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ message: 'Failed to fetch stats' });
  }
});

// ============================================
// TEST ROUTE
// ============================================

app.get('/api/test', async (req, res) => {
  const dbStatus = mongoose.connection.readyState;
  const statusMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  const postCount = await Post.countDocuments();
  const categoryCount = await Category.countDocuments();
  const userCount = await User.countDocuments();
  const videoCount = await Video.countDocuments();
  
  res.json({
    message: 'News Sketch API Server',
    status: 'running',
    timestamp: new Date().toISOString(),
    mongodb: statusMap[dbStatus] || 'unknown',
    database: {
      posts: postCount,
      categories: categoryCount,
      users: userCount,
      videos: videoCount,
    },
    cors: {
      origins: allowedOrigins.filter(Boolean),
      credentials: true,
    },
    routes: {
      posts: '/api/posts',
      postBySlug: '/api/posts/:slug',
      postById: '/api/posts/id/:id',
      related: '/api/posts/related?category=:id&exclude=:id',
      categories: '/api/categories',
      comments: '/api/comments',
      videos: '/api/videos',
      search: '/api/search',
      adminStats: '/api/admin/stats',
      auth: '/api/auth/login',
      test: '/api/test',
      health: '/health'
    }
  });
});

// ============================================
// 404 HANDLER
// ============================================

app.use((req, res) => {
  console.log(`❌ 404: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    message: 'Route not found',
    path: req.originalUrl,
  });
});

// ============================================
// ERROR HANDLER
// ============================================

app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);
  console.error('Stack:', err.stack);
  
  if (err instanceof multer.MulterError) {
    if (err.code === 'FILE_TOO_LARGE') {
      return res.status(400).json({ 
        message: err.fieldname === 'video' 
          ? 'Video file too large. Max size is 500MB.' 
          : 'Image file too large. Max size is 10MB.' 
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ 
        message: `Unexpected field: ${err.field}. Please use the correct field name.` 
      });
    }
    return res.status(400).json({ message: err.message });
  }
  
  if (err.message && err.message.includes('Only')) {
    return res.status(400).json({ message: err.message });
  }
  
  res.status(500).json({
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// ============================================
// START SERVER
// ============================================

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 Test API: http://localhost:${PORT}/api/test`);
  console.log(`💚 Health Check: http://localhost:${PORT}/health`);
  console.log(`📊 Admin Stats: http://localhost:${PORT}/api/admin/stats`);
  console.log(`\n📋 Available endpoints:`);
  console.log(`   GET  /`);
  console.log(`   GET  /health`);
  console.log(`   GET  /api/test`);
  console.log(`   POST /api/auth/register`);
  console.log(`   POST /api/auth/login`);
  console.log(`   GET  /api/auth/me`);
  console.log(`   GET  /api/posts`);
  console.log(`   GET  /api/posts/:slug`);
  console.log(`   GET  /api/posts/id/:id`);
  console.log(`   GET  /api/posts/related`);
  console.log(`   POST /api/posts`);
  console.log(`   PUT  /api/posts/id/:id`);
  console.log(`   DELETE /api/posts/id/:id`);
  console.log(`   GET  /api/categories`);
  console.log(`   GET  /api/categories/:slug/posts`);
  console.log(`   GET  /api/comments`);
  console.log(`   POST /api/comments`);
  console.log(`   GET  /api/videos`);
  console.log(`   GET  /api/videos/featured`);
  console.log(`   GET  /api/videos/:id`);
  console.log(`   POST /api/videos/upload`);
  console.log(`   POST /api/videos/youtube`);
  console.log(`   DELETE /api/videos/:id`);
  console.log(`   GET  /api/search`);
  console.log(`   GET  /api/admin/stats`);
  console.log(`\n✅ CORS configured for:`, allowedOrigins.filter(Boolean));
  console.log(`\n💡 Try: http://localhost:${PORT}/api/test\n`);
});