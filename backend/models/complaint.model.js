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
  statusHistory: [{
    status: {
      type: String,
      enum: ['pending', 'in-progress', 'resolved'],
      required: true
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    changedAt: {
      type: Date,
      default: Date.now
    },
    comment: {
      type: String
    }
  }],
  assignmentHistory: [{
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    assignedAt: {
      type: Date,
      default: Date.now
    },
    comment: {
      type: String
    }
  }],
  feedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: {
      type: String,
      maxlength: 500
    },
    submittedAt: {
      type: Date
    }
  },
  resolvedAt: {
    type: Date
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

// Middleware to track status changes
complaintSchema.pre('save', function(next) {
  if (this.isModified('status') && !this.isNew) {
    // Track status change in history
    const statusEntry = {
      status: this.status,
      changedBy: this._statusChangedBy || this.assignedTo || this.createdBy,
      changedAt: new Date()
    };
    
    if (!this.statusHistory) {
      this.statusHistory = [];
    }
    this.statusHistory.push(statusEntry);
    
    // Set resolvedAt timestamp when status becomes resolved
    if (this.status === 'resolved' && !this.resolvedAt) {
      this.resolvedAt = new Date();
    }
  }
  next();
});

// Middleware to track assignment changes
complaintSchema.pre('save', function(next) {
  if (this.isModified('assignedTo') && !this.isNew) {
    const assignmentEntry = {
      assignedTo: this.assignedTo,
      assignedBy: this._assignedBy || this.createdBy,
      assignedAt: new Date()
    };
    
    if (!this.assignmentHistory) {
      this.assignmentHistory = [];
    }
    this.assignmentHistory.push(assignmentEntry);
  }
  next();
});

module.exports = mongoose.model('Complaint', complaintSchema);
