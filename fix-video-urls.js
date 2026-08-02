const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

const Video = require('./models/Video');

const fixVideoUrls = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find all videos with file URLs
    const videos = await Video.find({ fileUrl: { $exists: true, $ne: '' } });
    console.log(`📹 Found ${videos.length} videos with file URLs`);

    let updatedCount = 0;

    for (const video of videos) {
      let fileUrl = video.fileUrl;
      let needsUpdate = false;

      // Check if URL is localhost or starts with /uploads/
      if (fileUrl && fileUrl.includes('localhost:5000')) {
        fileUrl = fileUrl.replace('http://localhost:5000', 'https://newssketch-api.onrender.com');
        needsUpdate = true;
      } else if (fileUrl && fileUrl.startsWith('/uploads/')) {
        fileUrl = `https://newssketch-api.onrender.com${fileUrl}`;
        needsUpdate = true;
      }

      if (needsUpdate) {
        video.fileUrl = fileUrl;
        await video.save();
        updatedCount++;
        console.log(`✅ Updated video: ${video.title}`);
        console.log(`   New URL: ${fileUrl}`);
      }
    }

    console.log(`\n🎉 Successfully updated ${updatedCount} videos!`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

fixVideoUrls();