const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  complaintId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Complaint',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  text: {
    type: String,
    required: true,
    trim: true
  },
  userRole: {
    type: String,
    enum: ['citizen', 'student', 'worker', 'admin'],
    required: true
  },
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for faster queries
commentSchema.index({ complaintId: 1, createdAt: -1 });

module.exports = mongoose.model('Comment', commentSchema);
