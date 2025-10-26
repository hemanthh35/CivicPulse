const mongoose = require('mongoose');
const Complaint = require('./backend/models/complaint.model');

async function checkResolvedComplaints() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/civicpulse', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('✅ Connected to MongoDB\n');

    // Get all complaints
    const allComplaints = await Complaint.find().select('_id title status priority createdAt resolvedAt');
    console.log(`📋 Total Complaints: ${allComplaints.length}\n`);

    // Group by status
    const byStatus = {};
    allComplaints.forEach(c => {
      if (!byStatus[c.status]) {
        byStatus[c.status] = [];
      }
      byStatus[c.status].push(c);
    });

    console.log('Complaints by Status:');
    Object.entries(byStatus).forEach(([status, complaints]) => {
      console.log(`  ${status}: ${complaints.length}`);
    });

    console.log('\n🔍 Resolved Complaints Details:');
    if (byStatus['resolved'] && byStatus['resolved'].length > 0) {
      byStatus['resolved'].forEach((c, idx) => {
        console.log(`  ${idx + 1}. ${c.title}`);
        console.log(`     ID: ${c._id}`);
        console.log(`     Status: ${c.status}`);
        console.log(`     Created: ${c.createdAt}`);
        console.log(`     Resolved At: ${c.resolvedAt}`);
        console.log('');
      });
    } else {
      console.log('  ❌ NO RESOLVED COMPLAINTS FOUND');
      console.log('  All complaints statuses:');
      allComplaints.forEach((c, idx) => {
        console.log(`     ${idx + 1}. "${c.title}" - Status: ${c.status}`);
      });
    }

    // Get stats like admin endpoint does
    const resolvedCount = await Complaint.countDocuments({ status: 'resolved' });
    const totalCount = await Complaint.countDocuments();
    const resolutionRate = totalCount > 0 ? ((resolvedCount / totalCount) * 100).toFixed(2) : 0;

    console.log('\n📊 Stats:');
    console.log(`  Total: ${totalCount}`);
    console.log(`  Resolved: ${resolvedCount}`);
    console.log(`  Resolution Rate: ${resolutionRate}%`);

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkResolvedComplaints();
