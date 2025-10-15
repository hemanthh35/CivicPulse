/**
 * Create Test Users for Testing Email Notifications
 * This script creates test users with different roles
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./backend/models/user.model');

const testUsers = [
  {
    name: 'Test Citizen',
    email: 'citizen@test.com',
    password: 'password123',
    role: 'citizen',
    mobile: '+919876543210'
  },
  {
    name: 'Test Worker',
    email: 'worker@test.com',
    password: 'password123',
    role: 'worker',
    mobile: '+919876543211'
  },
  {
    name: 'Test Admin',
    email: 'admin@test.com',
    password: 'password123',
    role: 'admin',
    mobile: '+919876543212'
  },
  {
    name: 'Test Student',
    email: 'student@test.com',
    password: 'password123',
    role: 'student',
    mobile: '+919876543213',
    travelFlag: true
  }
];

async function createTestUsers() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    console.log('👥 Creating test users...\n');

    for (const userData of testUsers) {
      // Check if user already exists
      const existingUser = await User.findOne({ email: userData.email });
      
      if (existingUser) {
        console.log(`⚠️  User already exists: ${userData.email} (${userData.role})`);
      } else {
        const user = new User(userData);
        await user.save();
        console.log(`✅ Created: ${userData.email} (${userData.role})`);
      }
    }

    console.log('\n✨ Test users ready!\n');
    console.log('📧 Login Credentials:');
    console.log('='.repeat(50));
    testUsers.forEach(user => {
      console.log(`\n${user.role.toUpperCase()}:`);
      console.log(`  Email:    ${user.email}`);
      console.log(`  Password: password123`);
      console.log(`  Mobile:   ${user.mobile}`);
    });
    console.log('\n' + '='.repeat(50));
    console.log('\n💡 To test email notifications:');
    console.log('1. Login as citizen@test.com');
    console.log('2. Create a complaint');
    console.log('3. Login as worker@test.com');
    console.log('4. Mark the complaint as "resolved"');
    console.log('5. Check the email inbox!\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createTestUsers();
