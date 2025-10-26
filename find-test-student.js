const mongoose = require('mongoose');
const User = require('./backend/models/user.model');

async function findTestStudent() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/civicpulse', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('✅ Connected to MongoDB\n');

    // Find the test student
    const student = await User.findOne({ 
      $or: [
        { name: 'Test Student' },
        { email: 'student@test.com' }
      ]
    });
    
    if (student) {
      console.log('✅ Found Test Student!');
      console.log('  ID:', student._id);
      console.log('  Name:', student.name);
      console.log('  Email:', student.email);
      console.log('  Role:', student.role);
      console.log('  Points:', student.points);
      console.log('  Badges:', student.badges);
    } else {
      console.log('❌ Test Student not found');
    }

    // Also list all students again for comparison
    const allStudents = await User.find({ role: 'student' }).select('_id name email role');
    console.log('\n📋 All Students:');
    allStudents.forEach(s => {
      console.log(`  - ${s.name} (${s.email}): ${s._id}`);
    });

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

findTestStudent();
