const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

const Post = require('./models/Post');

const fixImageUrls = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find all posts with image URLs
    const posts = await Post.find({ 'image.url': { $exists: true, $ne: '' } });
    console.log(`📸 Found ${posts.length} posts with images`);

    let updatedCount = 0;

    for (const post of posts) {
      let imageUrl = post.image.url;
      let needsUpdate = false;

      // Check if URL is localhost or starts with /uploads/
      if (imageUrl.includes('localhost:5000')) {
        // Replace localhost with Render URL
        imageUrl = imageUrl.replace('http://localhost:5000', 'https://newssketch-api.onrender.com');
        needsUpdate = true;
      } else if (imageUrl.startsWith('/uploads/')) {
        // Prepend Render URL
        imageUrl = `https://newssketch-api.onrender.com${imageUrl}`;
        needsUpdate = true;
      }

      if (needsUpdate) {
        post.image.url = imageUrl;
        await post.save();
        updatedCount++;
        console.log(`✅ Updated: ${post.title}`);
        console.log(`   New URL: ${imageUrl}`);
      }
    }

    console.log(`\n🎉 Successfully updated ${updatedCount} posts!`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

fixImageUrls();