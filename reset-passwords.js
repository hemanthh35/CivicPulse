const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./backend/models/user.model');

const resetAllPasswords = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const newPassword = '111111';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    const result = await User.updateMany(
      {},
      { $set: { password: hashedPassword } }
    );

    console.log(`✅ Updated ${result.modifiedCount} users`);
    console.log(`🔑 All passwords reset to: ${newPassword}`);

    const users = await User.find().select('name email role');
    console.log('\n📋 Users in database:');
    users.forEach(user => {
      console.log(`   - ${user.name} (${user.email}) - Role: ${user.role}`);
    });

    await mongoose.connection.close();
    console.log('\n✅ Done! All passwords are now: 111111');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

resetAllPasswords();
