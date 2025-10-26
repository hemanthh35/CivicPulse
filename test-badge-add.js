const mongoose = require('mongoose');
const User = require('./backend/models/user.model');
const Reward = require('./backend/models/reward.model');

async function testBadgeAddition() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/civicpulse', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('✅ Connected to MongoDB\n');

    // Get the actual student from database
    const student = await User.findOne({ role: 'student' });
    
    if (!student) {
      console.error('❌ No students found in database');
      await mongoose.disconnect();
      process.exit(1);
    }

    console.log('📝 Found Student:');
    console.log('  ID:', student._id.toString());
    console.log('  Name:', student.name);
    console.log('  Email:', student.email);
    console.log('  Role:', student.role);
    console.log('');

    // Try to add a badge
    const badgeName = 'Community Hero';
    
    // Get or create reward
    let reward = await Reward.findOne({ userId: student._id });
    if (!reward) {
      reward = new Reward({ userId: student._id, points: 0, badges: [] });
      console.log('✨ Created new Reward record');
    } else {
      console.log('🎯 Found existing Reward record');
    }

    // Check if badge already exists
    if (reward.badges.includes(badgeName)) {
      console.log(`⚠️  Badge "${badgeName}" already exists`);
    } else {
      // Add badge
      reward.badges.push(badgeName);
      await reward.save();
      console.log(`✅ Badge "${badgeName}" added successfully!`);
    }

    console.log('\n📊 Final Reward State:');
    console.log('  Points:', reward.points);
    console.log('  Badges:', reward.badges);

    // Show correct user ID for frontend
    console.log('\n🎯 Use this ID in the frontend:');
    console.log('   ', student._id.toString());

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

testBadgeAddition();
