const mongoose = require('mongoose');
const User = require('./backend/models/user.model');

async function listStudents() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/civicpulse', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('✅ Connected to MongoDB\n');

    // Find all students
    const students = await User.find({ role: 'student' }).select('_id name email role');
    
    console.log(`📋 Total Students: ${students.length}\n`);
    
    if (students.length === 0) {
      console.log('❌ No students found in the database!');
      console.log('   You need to create at least one student user to test badge assignment.');
    } else {
      console.log('Available Students:');
      students.forEach((student, index) => {
        console.log(`  ${index + 1}. ${student.name}`);
        console.log(`     ID: ${student._id}`);
        console.log(`     Email: ${student.email}`);
        console.log('');
      });
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

listStudents();
