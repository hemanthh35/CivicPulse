const mongoose = require('mongoose');
const Reward = require('./backend/models/reward.model');
const User = require('./backend/models/user.model');
require('dotenv').config();

const addTestPoints = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/civicpulse');
    console.log('✅ Connected to MongoDB');

    // Find the student user
    const student = await User.findOne({ role: 'student' });
    
    if (!student) {
      console.log('❌ No student user found!');
      process.exit(1);
    }

    console.log(`\n📋 Found student: ${student.name} (${student.email})`);

    // Find or create reward record
    let reward = await Reward.findOne({ userId: student._id });
    
    if (!reward) {
      reward = new Reward({
        userId: student._id,
        points: 0,
        badges: [],
        certificates: [],
        coupons: []
      });
      console.log('   Creating new reward record...');
    }

    // Add 1000 test points
    reward.points += 1000;
    
    // Add some badges
    const badges = ['First Report', 'Quick Reporter', 'Community Hero'];
    badges.forEach(badge => {
      if (!reward.badges.includes(badge)) {
        reward.badges.push(badge);
      }
    });

    await reward.save();

    console.log('\n✅ Rewards updated successfully!');
    console.log(`   Total Points: ${reward.points}`);
    console.log(`   Badges: ${reward.badges.join(', ')}`);
    console.log('\n🎉 You can now redeem rewards in the UI!');

    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

addTestPoints();
