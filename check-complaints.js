/**
 * Check Complaints in Database
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Complaint = require('./backend/models/complaint.model');
const User = require('./backend/models/user.model');

async function checkComplaints() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Check total complaints
    const totalComplaints = await Complaint.countDocuments();
    console.log(`📊 Total Complaints: ${totalComplaints}\n`);

    if (totalComplaints > 0) {
      console.log('📋 All Complaints:');
      console.log('='.repeat(80));
      
      const complaints = await Complaint.find({})
        .populate('createdBy', 'name email role')
        .populate('assignedTo', 'name email role')
        .sort({ createdAt: -1 });
      
      complaints.forEach((c, index) => {
        console.log(`\n${index + 1}. ${c.title}`);
        console.log(`   Status: ${c.status}`);
        console.log(`   Created by: ${c.createdBy?.name} (${c.createdBy?.email}) - ${c.createdBy?.role}`);
        console.log(`   Assigned to: ${c.assignedTo ? `${c.assignedTo.name} (${c.assignedTo.email})` : 'Not assigned'}`);
        console.log(`   Created: ${c.createdAt.toLocaleString()}`);
        console.log(`   ID: ${c._id}`);
      });
      console.log('\n' + '='.repeat(80));
    }

    // Check users
    console.log('\n👥 Users in Database:');
    console.log('='.repeat(80));
    
    const users = await User.find({}).select('name email role');
    users.forEach((u, index) => {
      console.log(`${index + 1}. ${u.name} - ${u.email} (${u.role})`);
    });
    console.log('='.repeat(80));
    
    const workerCount = await User.countDocuments({ role: 'worker' });
    console.log(`\n🔧 Total Workers: ${workerCount}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkComplaints();
