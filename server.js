const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const path = require('path');
const mongoose = require('mongoose');
const multer = require('multer');
const fs = require('fs');

dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();

// ============================================
// CORS CONFIGURATION - PRODUCTION READY
// ============================================

const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:3000',
  'https://newssketch-client.vercel.app',
  'http://localhost:3000',
  'http://localhost:3001',
  'https://*.vercel.app',
  'https://*.onrender.com',
];

// Custom CORS middleware
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
// HEALTH & ROOT ROUTES
// ============================================

app.get('/', (req, res) => {
  res.json({
    message: 'News Sketch API Server',
    status: 'running',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: {
        login: 'POST /api/auth/login',
        me: 'GET /api/auth/me',
        logout: 'POST /api/auth/logout'
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
        delete: 'DELETE /api/videos/:id'
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
  let dbStatus = 'disconnected';
  if (mongoose.connection) {
    const statusMap = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };
    dbStatus = statusMap[mongoose.connection.readyState] || 'unknown';
  }
  
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    mongodb: dbStatus,
    environment: process.env.NODE_ENV || 'development'
  });
});

// ============================================
// CONNECT TO MONGODB
// ============================================

let isConnected = false;

if (process.env.MONGODB_URI) {
  mongoose.connect(process.env.MONGODB_URI)
    .then((conn) => {
      isConnected = true;
      console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
      console.log(`📦 Database: ${conn.connection.name}`);
    })
    .catch((error) => {
      console.error(`❌ MongoDB Connection Error: ${error.message}`);
      isConnected = false;
    });
} else {
  console.log('⏭️  Skipping MongoDB connection (no URI provided)');
}

// ============================================
// MULTER CONFIGURATION
// ============================================

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

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
// MOCK DATA
// ============================================

const mockPosts = [
  {
    _id: '1',
    title: 'Getting Started with News Sketch',
    slug: 'getting-started-with-news-sketch',
    excerpt: 'Learn how to build a modern news platform with Next.js and Node.js',
    content: '<p>This is a sample article to help you get started with News Sketch.</p>',
    image: { url: '/placeholder1.jpg' },
    category: { _id: '1', name: 'Technology', slug: 'technology' },
    author: { _id: '1', name: 'Admin' },
    views: 151,
    readingTime: 3,
    tags: ['nextjs', 'react', 'nodejs'],
    createdAt: new Date('2024-01-15T10:00:00Z'),
    published: true,
    featured: true,
  },
  {
    _id: '2',
    title: 'Building REST APIs with Express',
    slug: 'building-rest-apis-with-express',
    excerpt: 'A comprehensive guide to building RESTful APIs with Express.js and MongoDB',
    content: '<p>Learn how to build robust APIs for your applications.</p>',
    image: { url: '/placeholder2.jpg' },
    category: { _id: '2', name: 'Development', slug: 'development' },
    author: { _id: '1', name: 'Admin' },
    views: 89,
    readingTime: 5,
    tags: ['express', 'api', 'mongodb'],
    createdAt: new Date('2024-01-20T14:30:00Z'),
    published: true,
    featured: false,
  },
  {
    _id: '3',
    title: 'Tailwind CSS Tips and Tricks',
    slug: 'tailwind-css-tips-and-tricks',
    excerpt: 'Improve your workflow with these Tailwind CSS best practices',
    content: '<p>Discover powerful Tailwind CSS techniques for faster development.</p>',
    image: { url: '/placeholder3.jpg' },
    category: { _id: '1', name: 'Technology', slug: 'technology' },
    author: { _id: '1', name: 'Admin' },
    views: 210,
    readingTime: 4,
    tags: ['tailwindcss', 'css', 'design'],
    createdAt: new Date('2024-01-25T09:15:00Z'),
    published: true,
    featured: true,
  },
  {
    _id: '4',
    title: 'Next.js 15 Features',
    slug: 'next-js-15-features',
    excerpt: 'Explore the latest features in Next.js 15',
    content: '<p>Next.js 15 brings many exciting features.</p>',
    image: { url: '/placeholder4.jpg' },
    category: { _id: '2', name: 'Development', slug: 'development' },
    author: { _id: '1', name: 'Admin' },
    views: 75,
    readingTime: 4,
    tags: ['nextjs', 'react'],
    createdAt: new Date('2024-01-28T16:45:00Z'),
    published: true,
    featured: false,
  },
];

const mockComments = [
  {
    _id: '1',
    content: 'Great article! Very informative.',
    author: { _id: '2', name: 'John Doe' },
    post: '1',
    createdAt: new Date().toISOString(),
  },
  {
    _id: '2',
    content: 'Thanks for sharing this! Looking forward to more content.',
    author: { _id: '3', name: 'Jane Smith' },
    post: '1',
    createdAt: new Date().toISOString(),
  },
];

const mockCategories = [
  { _id: '1', name: 'Technology', slug: 'technology', description: 'Latest tech news' },
  { _id: '2', name: 'Development', slug: 'development', description: 'Software development' },
  { _id: '3', name: 'Design', slug: 'design', description: 'UI/UX design' },
  { _id: '4', name: 'Business', slug: 'business', description: 'Business and finance' },
];

const mockVideos = [
  {
    _id: '1',
    title: 'Introduction to News Sketch',
    description: 'Learn how to build a modern news platform with Next.js and Node.js',
    type: 'youtube',
    youtubeId: 'dQw4w9WgXcQ',
    youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
    views: 150,
    uploadedBy: { _id: '1', name: 'Admin' },
    createdAt: new Date().toISOString(),
    status: 'active',
  },
  {
    _id: '2',
    title: 'Building REST APIs with Express',
    description: 'A comprehensive guide to building RESTful APIs',
    type: 'youtube',
    youtubeId: '9zUHg7xjIqQ',
    youtubeUrl: 'https://www.youtube.com/watch?v=9zUHg7xjIqQ',
    thumbnail: 'https://img.youtube.com/vi/9zUHg7xjIqQ/maxresdefault.jpg',
    views: 89,
    uploadedBy: { _id: '1', name: 'Admin' },
    createdAt: new Date().toISOString(),
    status: 'active',
  },
];

// ============================================
// AUTH ROUTES
// ============================================

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  console.log('📡 Login attempt:', email);
  
  if (email === 'admin@newssketch.com' && password === 'admin123') {
    res.json({
      user: { 
        id: '1', 
        name: 'Admin', 
        email: 'admin@newssketch.com', 
        role: 'admin' 
      },
      token: 'mock-jwt-token',
    });
  } else {
    res.status(401).json({ message: 'Invalid credentials' });
  }
});

app.get('/api/auth/me', (req, res) => {
  res.json({
    id: '1',
    name: 'Admin',
    email: 'admin@newssketch.com',
    role: 'admin',
  });
});

app.post('/api/auth/logout', (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

// ============================================
// POST ROUTES
// ============================================

app.get('/api/posts', (req, res) => {
  const { page = 1, limit = 10, category, featured, sort = '-createdAt' } = req.query;
  let posts = [...mockPosts];
  
  if (category) {
    posts = posts.filter(p => p.category._id === category || p.category.slug === category);
  }
  
  if (featured === 'true') {
    posts = posts.filter(p => p.featured === true);
  }
  
  if (sort === '-views') {
    posts.sort((a, b) => b.views - a.views);
  } else if (sort === '-createdAt') {
    posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }
  
  const start = (parseInt(page) - 1) * parseInt(limit);
  const end = start + parseInt(limit);
  const paginatedPosts = posts.slice(start, end);
  
  res.json({
    posts: paginatedPosts,
    total: posts.length,
    totalPages: Math.ceil(posts.length / parseInt(limit)),
    currentPage: parseInt(page),
  });
});

app.get('/api/posts/related', (req, res) => {
  const { category, exclude } = req.query;
  
  if (!category) {
    return res.status(400).json({ message: 'Category parameter is required' });
  }
  
  let posts = mockPosts.filter(p => 
    p._id !== exclude && 
    (p.category._id === category || p.category.slug === category)
  );
  
  res.json(posts.slice(0, 3));
});

app.get('/api/posts/:slug', (req, res) => {
  const slug = req.params.slug;
  const post = mockPosts.find(p => p.slug === slug);
  if (!post) {
    return res.status(404).json({ message: 'Post not found' });
  }
  post.views += 1;
  res.json(post);
});

app.get('/api/posts/id/:id', (req, res) => {
  const post = mockPosts.find(p => p._id === req.params.id);
  if (!post) {
    return res.status(404).json({ message: 'Post not found' });
  }
  res.json(post);
});

app.post('/api/posts', uploadImage.single('image'), (req, res) => {
  console.log('📡 POST /api/posts - Creating new post');
  console.log('📦 Request body:', req.body);
  console.log('📎 Uploaded file:', req.file);
  
  try {
    const { title, content, category, tags, metaTitle, metaDescription, slug: customSlug } = req.body;
    
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
    
    const categoryObj = mockCategories.find(c => c._id === category);
    
    let imageUrl = '/placeholder.svg';
    let publicId = 'placeholder';
    if (req.file) {
      imageUrl = `/uploads/${req.file.filename}`;
      publicId = req.file.filename;
    }
    
    const newPost = {
      _id: String(mockPosts.length + 1),
      title: title,
      slug: customSlug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      excerpt: content.replace(/<[^>]*>/g, '').slice(0, 150) + '...',
      content: content,
      category: categoryObj || { _id: category, name: 'Category', slug: 'category' },
      author: { _id: '1', name: 'Admin' },
      views: 0,
      readingTime: Math.ceil(content.replace(/<[^>]*>/g, '').split(' ').length / 200) || 2,
      tags: parsedTags || [],
      metaTitle: metaTitle || title,
      metaDescription: metaDescription || content.replace(/<[^>]*>/g, '').slice(0, 160),
      image: { 
        url: imageUrl,
        publicId: publicId
      },
      createdAt: new Date().toISOString(),
      published: true,
      featured: false,
    };
    
    mockPosts.unshift(newPost);
    
    console.log('✅ Post created:', newPost._id);
    res.status(201).json(newPost);
  } catch (error) {
    console.error('❌ Error creating post:', error);
    res.status(500).json({ 
      message: 'Failed to create post',
      error: error.message 
    });
  }
});

app.put('/api/posts/id/:id', uploadImage.single('image'), (req, res) => {
  const { id } = req.params;
  console.log('📡 PUT /api/posts/id/:id:', id);
  
  const index = mockPosts.findIndex(p => p._id === id);
  if (index === -1) {
    return res.status(404).json({ message: 'Post not found' });
  }
  
  const { title, content, category, tags, metaTitle, metaDescription, slug: customSlug } = req.body;
  
  let imageUrl = mockPosts[index].image?.url || '/placeholder.svg';
  let publicId = mockPosts[index].image?.publicId || 'placeholder';
  if (req.file) {
    imageUrl = `/uploads/${req.file.filename}`;
    publicId = req.file.filename;
  }
  
  mockPosts[index] = {
    ...mockPosts[index],
    title: title || mockPosts[index].title,
    content: content || mockPosts[index].content,
    category: category ? mockCategories.find(c => c._id === category) || mockPosts[index].category : mockPosts[index].category,
    tags: tags ? (typeof tags === 'string' ? tags.split(',').map(t => t.trim()) : tags) : mockPosts[index].tags,
    metaTitle: metaTitle || mockPosts[index].metaTitle,
    metaDescription: metaDescription || mockPosts[index].metaDescription,
    slug: customSlug || mockPosts[index].slug,
    image: { 
      url: imageUrl,
      publicId: publicId
    },
  };
  
  console.log('✅ Post updated:', id);
  res.json(mockPosts[index]);
});

app.delete('/api/posts/id/:id', (req, res) => {
  const { id } = req.params;
  console.log('📡 DELETE /api/posts/id/:id:', id);
  
  const index = mockPosts.findIndex(p => p._id === id);
  if (index === -1) {
    return res.status(404).json({ message: 'Post not found' });
  }
  
  mockPosts.splice(index, 1);
  console.log('✅ Post deleted:', id);
  res.json({ message: 'Post deleted successfully' });
});

// ============================================
// CATEGORY ROUTES
// ============================================

app.get('/api/categories', (req, res) => {
  res.json(mockCategories);
});

app.get('/api/categories/:slug/posts', (req, res) => {
  const category = mockCategories.find(c => c.slug === req.params.slug);
  if (!category) {
    return res.status(404).json({ message: 'Category not found' });
  }
  const posts = mockPosts.filter(p => p.category._id === category._id);
  res.json({ category, posts });
});

app.post('/api/categories', (req, res) => {
  const { name, description } = req.body;
  const newCategory = {
    _id: String(mockCategories.length + 1),
    name,
    slug: name.toLowerCase().replace(/\s+/g, '-'),
    description: description || '',
  };
  mockCategories.push(newCategory);
  res.status(201).json(newCategory);
});

app.put('/api/categories/:id', (req, res) => {
  const { id } = req.params;
  const index = mockCategories.findIndex(c => c._id === id);
  if (index === -1) {
    return res.status(404).json({ message: 'Category not found' });
  }
  mockCategories[index] = { ...mockCategories[index], ...req.body };
  res.json(mockCategories[index]);
});

app.delete('/api/categories/:id', (req, res) => {
  const { id } = req.params;
  const index = mockCategories.findIndex(c => c._id === id);
  if (index === -1) {
    return res.status(404).json({ message: 'Category not found' });
  }
  mockCategories.splice(index, 1);
  res.json({ message: 'Category deleted successfully' });
});

// ============================================
// COMMENT ROUTES
// ============================================

app.get('/api/comments', (req, res) => {
  const { post } = req.query;
  let comments = [...mockComments];
  if (post) {
    comments = comments.filter(c => c.post === post);
  }
  res.json(comments);
});

app.post('/api/comments', (req, res) => {
  const { content, postId } = req.body;
  if (!content || !postId) {
    return res.status(400).json({ message: 'Content and postId are required' });
  }
  const newComment = {
    _id: String(mockComments.length + 1),
    content,
    author: { _id: '1', name: 'Current User' },
    post: postId,
    createdAt: new Date().toISOString(),
  };
  mockComments.push(newComment);
  res.status(201).json(newComment);
});

// ============================================
// VIDEO ROUTES
// ============================================

app.get('/api/videos', (req, res) => {
  const { page = 1, limit = 10, type } = req.query;
  let videos = [...mockVideos];
  
  if (type) {
    videos = videos.filter(v => v.type === type);
  }
  
  const start = (parseInt(page) - 1) * parseInt(limit);
  const end = start + parseInt(limit);
  const paginatedVideos = videos.slice(start, end);
  
  res.json({
    videos: paginatedVideos,
    total: videos.length,
    totalPages: Math.ceil(videos.length / parseInt(limit)),
    currentPage: parseInt(page),
  });
});

app.get('/api/videos/:id', (req, res) => {
  const video = mockVideos.find(v => v._id === req.params.id);
  if (!video) {
    return res.status(404).json({ message: 'Video not found' });
  }
  video.views += 1;
  res.json(video);
});

app.post('/api/videos/upload', uploadVideo.single('video'), (req, res) => {
  console.log('📡 POST /api/videos/upload');
  console.log('📦 Request body:', req.body);
  
  if (req.file) {
    console.log('📎 File uploaded:', req.file.filename, req.file.size, 'bytes');
  } else {
    console.log('⚠️ No file uploaded');
  }
  
  const { title, description } = req.body;
  
  if (!title) {
    if (req.file) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error deleting file:', err);
      });
    }
    return res.status(400).json({ message: 'Title is required' });
  }
  
  const newVideo = {
    _id: String(mockVideos.length + 1),
    title,
    description: description || '',
    type: 'upload',
    fileUrl: req.file ? `/uploads/${req.file.filename}` : null,
    fileSize: req.file ? req.file.size : 0,
    mimeType: req.file ? req.file.mimetype : null,
    views: 0,
    uploadedBy: { _id: '1', name: 'Admin' },
    createdAt: new Date().toISOString(),
    status: 'active',
  };
  
  mockVideos.unshift(newVideo);
  console.log('✅ Video created:', newVideo._id);
  res.status(201).json(newVideo);
});

app.post('/api/videos/youtube', (req, res) => {
  console.log('📡 POST /api/videos/youtube');
  console.log('📦 Request body:', req.body);
  
  const { title, description, youtubeUrl } = req.body;
  
  if (!title) {
    return res.status(400).json({ message: 'Title is required' });
  }
  if (!youtubeUrl) {
    return res.status(400).json({ message: 'YouTube URL is required' });
  }
  
  const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = youtubeUrl.match(youtubeRegex);
  
  if (!match) {
    return res.status(400).json({ message: 'Invalid YouTube URL. Please use format: https://www.youtube.com/watch?v=VIDEO_ID' });
  }
  
  const youtubeId = match[1];
  
  const newVideo = {
    _id: String(mockVideos.length + 1),
    title,
    description: description || '',
    type: 'youtube',
    youtubeId,
    youtubeUrl: `https://www.youtube.com/watch?v=${youtubeId}`,
    thumbnail: `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`,
    views: 0,
    uploadedBy: { _id: '1', name: 'Admin' },
    createdAt: new Date().toISOString(),
    status: 'active',
  };
  
  mockVideos.unshift(newVideo);
  console.log('✅ YouTube video added:', newVideo._id);
  res.status(201).json(newVideo);
});

app.delete('/api/videos/:id', (req, res) => {
  console.log('📡 DELETE /api/videos/:id:', req.params.id);
  
  const index = mockVideos.findIndex(v => v._id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ message: 'Video not found' });
  }
  
  mockVideos.splice(index, 1);
  console.log('✅ Video deleted:', req.params.id);
  res.json({ message: 'Video deleted successfully' });
});

// ============================================
// SEARCH ROUTE
// ============================================

app.get('/api/search', (req, res) => {
  const { q } = req.query;
  if (!q) {
    return res.status(400).json({ message: 'Query parameter q is required' });
  }
  const results = mockPosts.filter(p => 
    p.title.toLowerCase().includes(q.toLowerCase()) ||
    p.content.toLowerCase().includes(q.toLowerCase()) ||
    p.excerpt?.toLowerCase().includes(q.toLowerCase())
  );
  res.json(results);
});

// ============================================
// ADMIN STATS
// ============================================

app.get('/api/admin/stats', (req, res) => {
  const totalPosts = mockPosts.length;
  const totalViews = mockPosts.reduce((sum, post) => sum + (post.views || 0), 0);
  const totalComments = mockComments.length;
  const totalVisitors = 1234;
  
  const mostRead = [...mockPosts]
    .sort((a, b) => (b.views || 0) - (a.views || 0))
    .slice(0, 5)
    .map(post => ({
      title: post.title,
      slug: post.slug,
      views: post.views || 0,
    }));
  
  const categoryCounts = {};
  mockPosts.forEach(post => {
    const catName = post.category?.name || 'Uncategorized';
    categoryCounts[catName] = (categoryCounts[catName] || 0) + 1;
  });
  
  res.json({
    posts: totalPosts,
    views: totalViews,
    comments: totalComments,
    visitors: totalVisitors,
    mostRead,
    categories: Object.keys(categoryCounts).map(name => ({
      name,
      count: categoryCounts[name],
    })),
    chartData: {
      views: [120, 150, 180, 220, 190, 240, 210],
    },
  });
});

// ============================================
// TEST ROUTE
// ============================================

app.get('/api/test', (req, res) => {
  res.json({
    message: 'News Sketch API Server',
    status: 'running',
    timestamp: new Date().toISOString(),
    mongodb: isConnected ? 'connected' : 'disconnected',
    postsCount: mockPosts.length,
    videosCount: mockVideos.length,
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
  console.log(`   GET  /api/videos/:id`);
  console.log(`   POST /api/videos/upload`);
  console.log(`   POST /api/videos/youtube`);
  console.log(`   DELETE /api/videos/:id`);
  console.log(`   GET  /api/search`);
  console.log(`   GET  /api/admin/stats`);
  console.log(`\n✅ CORS configured for:`, allowedOrigins.filter(Boolean));
  console.log(`\n💡 Try: http://localhost:${PORT}/api/test\n`);
});