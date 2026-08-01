const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Post = require('./models/Post');

dotenv.config();

const updateImageUrls = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const posts = await Post.find({ 'image.url': { $regex: '^/uploads/' } });
    console.log(`Found ${posts.length} posts with local image URLs`);
    
    for (const post of posts) {
      const newUrl = post.image.url.replace('/uploads/', 'https://newssketch-api.onrender.com/uploads/');
      post.image.url = newUrl;
      await post.save();
      console.log(`Updated post: ${post.title}`);
    }
    
    console.log('✅ All posts updated!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

updateImageUrls();