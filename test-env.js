const dotenv = require('dotenv');
const path = require('path');

// Load .env file
dotenv.config({ path: path.join(__dirname, '.env') });

console.log('📋 Environment Variables Check:');
console.log('--------------------------------');
console.log('PORT:', process.env.PORT || 'Not set');
console.log('MONGODB_URI:', process.env.MONGODB_URI || 'Not set');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? '✅ Set' : '❌ Not set');
console.log('--------------------------------');

if (!process.env.MONGODB_URI) {
  console.log('❌ MONGODB_URI is missing!');
  console.log('💡 Create a .env file with:');
  console.log('   MONGODB_URI=mongodb://localhost:27017/newssketch');
}