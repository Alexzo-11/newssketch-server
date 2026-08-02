// Add YouTube video - with better error handling
app.post('/api/videos/youtube', async (req, res) => {
  try {
    console.log('📡 POST /api/videos/youtube');
    console.log('📦 Request body:', req.body);
    
    const { title, description, youtubeUrl } = req.body;
    
    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }
    if (!youtubeUrl) {
      return res.status(400).json({ message: 'YouTube URL is required' });
    }
    
    // Extract YouTube video ID - improved regex
    const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = youtubeUrl.match(youtubeRegex);
    
    if (!match) {
      return res.status(400).json({ 
        message: 'Invalid YouTube URL. Please use format: https://www.youtube.com/watch?v=VIDEO_ID' 
      });
    }
    
    const youtubeId = match[1];
    
    // Get admin user
    const adminUser = await User.findOne({ email: 'admin@newssketch.com' });
    if (!adminUser) {
      return res.status(400).json({ message: 'Admin user not found' });
    }
    
    // Check if video already exists
    const existingVideo = await Video.findOne({ youtubeId });
    if (existingVideo) {
      return res.status(400).json({ message: 'This YouTube video has already been added' });
    }
    
    const video = await Video.create({
      title: title.trim(),
      description: description ? description.trim() : '',
      type: 'youtube',
      youtubeId,
      youtubeUrl: `https://www.youtube.com/watch?v=${youtubeId}`,
      thumbnail: `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`,
      uploadedBy: adminUser._id,
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