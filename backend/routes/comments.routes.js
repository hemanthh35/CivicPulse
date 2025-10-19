const express = require('express');
const router = express.Router();
const Comment = require('../models/comment.model');
const Complaint = require('../models/complaint.model');
const Notification = require('../models/notification.model');
const { protect } = require('../middlewares/auth.middleware');

// @route   POST /api/comments/:complaintId
// @desc    Add comment to a complaint
// @access  Private
router.post('/:complaintId', protect, async (req, res) => {
  try {
    const { text } = req.body;
    const { complaintId } = req.params;

    if (!text || text.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Comment text is required'
      });
    }

    // Verify complaint exists
    const complaint = await Complaint.findById(complaintId).populate('createdBy assignedTo');
    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }

    // Create comment
    const comment = new Comment({
      complaintId,
      userId: req.user.id,
      text: text.trim(),
      userRole: req.user.role
    });

    await comment.save();

    // Populate user info
    await comment.populate('userId', 'name email role');

    // Create notifications for relevant parties
    const notificationPromises = [];
    
    // Notify complaint creator if commenter is not the creator
    if (complaint.createdBy && complaint.createdBy._id.toString() !== req.user.id) {
      notificationPromises.push(
        Notification.create({
          recipientId: complaint.createdBy._id,
          type: 'comment_added',
          title: 'New Comment on Your Complaint',
          message: `${req.user.name} commented: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`,
          relatedComplaintId: complaintId
        })
      );
    }

    // Notify assigned worker if exists and commenter is not the worker
    if (complaint.assignedTo && complaint.assignedTo._id.toString() !== req.user.id) {
      notificationPromises.push(
        Notification.create({
          recipientId: complaint.assignedTo._id,
          type: 'comment_added',
          title: 'New Comment on Assigned Complaint',
          message: `${req.user.name} commented: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`,
          relatedComplaintId: complaintId
        })
      );
    }

    await Promise.all(notificationPromises);

    res.status(201).json({
      success: true,
      comment
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server Error'
    });
  }
});

// @route   GET /api/comments/:complaintId
// @desc    Get all comments for a complaint
// @access  Private
router.get('/:complaintId', protect, async (req, res) => {
  try {
    const { complaintId } = req.params;

    // Verify complaint exists
    const complaint = await Complaint.findById(complaintId);
    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }

    const comments = await Comment.find({ complaintId })
      .populate('userId', 'name email role')
      .sort({ createdAt: 1 }); // Oldest first

    res.status(200).json({
      success: true,
      count: comments.length,
      comments
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server Error'
    });
  }
});

// @route   PUT /api/comments/:commentId
// @desc    Edit a comment
// @access  Private (own comments only)
router.put('/:commentId', protect, async (req, res) => {
  try {
    const { text } = req.body;
    const { commentId } = req.params;

    if (!text || text.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Comment text is required'
      });
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    // Check if user owns the comment
    if (comment.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to edit this comment'
      });
    }

    comment.text = text.trim();
    comment.isEdited = true;
    comment.editedAt = new Date();
    await comment.save();

    await comment.populate('userId', 'name email role');

    res.status(200).json({
      success: true,
      comment
    });
  } catch (error) {
    console.error('Error editing comment:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server Error'
    });
  }
});

// @route   DELETE /api/comments/:commentId
// @desc    Delete a comment
// @access  Private (own comments only or admin)
router.delete('/:commentId', protect, async (req, res) => {
  try {
    const { commentId } = req.params;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    // Check if user owns the comment or is admin
    if (comment.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this comment'
      });
    }

    await comment.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server Error'
    });
  }
});

module.exports = router;
