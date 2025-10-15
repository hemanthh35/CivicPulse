require('dotenv').config();
const mongoose = require('mongoose');
const Complaint = require('./backend/models/complaint.model');
const User = require('./backend/models/user.model');

async function assignExistingComplaints() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/civicpulse');
    console.log('Connected to MongoDB');

    // Find all workers
    const workers = await User.find({ role: 'worker' });
    console.log(`Found ${workers.length} workers`);

    if (workers.length === 0) {
      console.log('No workers found!');
      return;
    }

    // Find all complaints without assignedTo
    const unassignedComplaints = await Complaint.find({ 
      $or: [
        { assignedTo: null },
        { assignedTo: { $exists: false } }
      ]
    });

    console.log(`Found ${unassignedComplaints.length} unassigned complaints`);

    // Assign each complaint to a random worker
    for (let complaint of unassignedComplaints) {
      const randomWorker = workers[Math.floor(Math.random() * workers.length)];
      complaint.assignedTo = randomWorker._id;
      await complaint.save();
      console.log(`Assigned complaint ${complaint._id} to worker ${randomWorker.name}`);
    }

    console.log('All complaints have been assigned!');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

assignExistingComplaints();
