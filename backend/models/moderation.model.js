const mongoose = require('mongoose');

const ModerationSchema = new mongoose.Schema(
  {
    // Report information
    reportType: {
      type: String,
      enum: ['complaint', 'user', 'comment', 'other'],
      default: 'complaint',
      index: true
    },

    // Reference to the complaint/item being reported
    reportedItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Complaint',
      required: true
    },

    // Report details
    title: {
      type: String,
      required: true,
      trim: true
    },

    description: {
      type: String,
      required: true
    },

    reason: {
      type: String,
      enum: ['inappropriate', 'spam', 'offensive', 'harassment', 'misinformation', 'other'],
      required: true,
      index: true
    },

    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
      index: true
    },

    // User who reported
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    // AI flagged
    AI_flagged: {
      type: Boolean,
      default: false
    },

    // Status of the report
    status: {
      type: String,
      enum: ['pending', 'under_review', 'approved', 'rejected', 'resolved'],
      default: 'pending',
      index: true
    },

    // Moderation action
    action: {
      type: String,
      enum: ['none', 'warning', 'suspend', 'delete', 'archive'],
      default: 'none'
    },

    // Admin notes
    moderatorNotes: {
      type: String,
      trim: true
    },

    // Admin who handled the report
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },

    // When it was reviewed
    reviewedAt: Date,

    // Related moderations (if this resolves multiple reports)
    relatedReports: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ModerationQueue'
      }
    ],

    // Appeal information
    appeal: {
      status: {
        type: String,
        enum: ['none', 'pending', 'approved', 'rejected']
      },
      reason: String,
      submittedAt: Date,
      reviewedAt: Date,
      reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    },

    // Timestamps
    createdAt: {
      type: Date,
      default: Date.now,
      index: true
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

// Index for efficient querying
ModerationSchema.index({ status: 1, createdAt: -1 });
ModerationSchema.index({ severity: 1, status: 1 });
ModerationSchema.index({ reportedBy: 1 });
ModerationSchema.index({ reviewedBy: 1 });

// Pre-save middleware to update updatedAt
ModerationSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('ModerationQueue', ModerationSchema);