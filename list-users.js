const mongoose = require('mongoose');
const User = require('./backend/models/user.model');

mongoose.connect('mongodb://localhost:27017/civicpulse')
  .then(async () => {
    console.log('Connected to MongoDB\n');
    
    const users = await User.find({}).select('name email role phone');
    
    console.log('📋 All Users in Database:');
    console.log('=' .repeat(80));
    
    users.forEach((user, index) => {
      console.log(`\n${index + 1}. ${user.name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Phone: ${user.phone || 'N/A'}`);
    });
    
    console.log('\n' + '='.repeat(80));
    console.log(`\nTotal Users: ${users.length}`);
    console.log('\n⚠️  All passwords have been reset to: 111111\n');
    
    mongoose.connection.close();
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
