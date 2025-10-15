const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['Roads & Infrastructure', 'Water & Sanitation', 'Electricity', 'Public Safety', 'Garbage & Waste', 'Parks & Environment', 'Noise & Disturbance', 'Public Transport', 'Other', 'garbage', 'road', 'water', 'lights', 'other']
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  mediaURL: {
    type: String
  },
  mediaURLs: [{
    type: String
  }],
  location: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'resolved'],
    default: 'pending'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  rewardEligible: {
    type: Boolean,
    default: false
  },
  resolutionProof: {
    mediaURL: { type: String },
    timestamp: { type: Date }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt timestamp before saving
complaintSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Complaint', complaintSchema);
