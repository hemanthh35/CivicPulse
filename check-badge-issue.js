const mongoose = require('mongoose');
const User = require('./backend/models/user.model');
const Reward = require('./backend/models/reward.model');

const userId = '68f01fc8dde1766bce2dbb63';
const badgeName = 'Community Hero';

async function checkBadgeIssue() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/civicpulse', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('✅ Connected to MongoDB');

    // Check if user exists
    const user = await User.findById(userId);
    console.log('\n📋 User Details:');
    console.log('  Found:', !!user);
    if (user) {
      console.log('  ID:', user._id);
      console.log('  Name:', user.name);
      console.log('  Email:', user.email);
      console.log('  Role:', user.role);
      console.log('  Role Type:', typeof user.role);
      console.log('  Role === "student":', user.role === 'student');
      console.log('  Points:', user.points);
      console.log('  Badges:', user.badges);
    }

    // Check reward record
    const reward = await Reward.findOne({ userId });
    console.log('\n🏆 Reward Record:');
    console.log('  Found:', !!reward);
    if (reward) {
      console.log('  ID:', reward._id);
      console.log('  User ID:', reward.userId);
      console.log('  Points:', reward.points);
      console.log('  Badges:', reward.badges);
      console.log('  Badge exists:', reward.badges.includes(badgeName));
    }

    // Diagnose the issue
    console.log('\n🔍 Diagnosis:');
    if (!user) {
      console.error('❌ User not found!');
    } else if (user.role !== 'student') {
      console.error(`❌ User role is "${user.role}", not "student"`);
    } else if (reward && reward.badges.includes(badgeName)) {
      console.error(`❌ Badge "${badgeName}" already exists for this user`);
    } else {
      console.log('✅ All checks passed - badge can be added!');
    }

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkBadgeIssue();
