// Test MongoDB Atlas Connection
require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/civicpulse';

console.log('🔄 Testing MongoDB Atlas connection...');
console.log('📍 URI:', MONGODB_URI.replace(/:[^:@]+@/, ':****@')); // Hide password

mongoose.connect(MONGODB_URI, {
  serverSelectionTimeoutMS: 15000, // 15 seconds
  socketTimeoutMS: 45000,
})
  .then(() => {
    console.log('✅ SUCCESS: Connected to MongoDB Atlas!');
    console.log('📊 Database:', mongoose.connection.name);
    console.log('🌐 Host:', mongoose.connection.host);
    console.log('✨ Your MongoDB Atlas connection is working perfectly!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ ERROR: Failed to connect to MongoDB Atlas');
    console.error('📝 Error details:', err.message);
    
    if (err.message.includes('IP')) {
      console.error('\n💡 SOLUTION:');
      console.error('   1. Go to https://cloud.mongodb.com');
      console.error('   2. Click "Network Access" in left sidebar');
      console.error('   3. Click "ADD IP ADDRESS"');
      console.error('   4. Select "ALLOW ACCESS FROM ANYWHERE"');
      console.error('   5. Click "Confirm"');
      console.error('   6. Wait 1-2 minutes and try again\n');
    }
    
    if (err.message.includes('authentication')) {
      console.error('\n💡 SOLUTION:');
      console.error('   Check your MongoDB username and password in .env file\n');
    }
    
    process.exit(1);
  });

// Handle timeout
setTimeout(() => {
  console.error('⏱️  Connection timeout after 15 seconds');
  console.error('💡 This usually means IP address is not whitelisted in MongoDB Atlas');
  process.exit(1);
}, 15000);
