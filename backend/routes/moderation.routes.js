const express = require('express');
const router = express.Router();
const ModerationQueue = require('../models/moderation.model');
const Complaint = require('../models/complaint.model');
const User = require('../models/user.model');
const Reward = require('../models/reward.model');
const { protect, authorize } = require('../middlewares/auth.middleware');

// @route   GET /api/moderation/pending
// @desc    Get all pending moderation items
// @access  Private/Admin
router.get('/pending', protect, authorize(['admin']), async (req, res) => {
  try {
    const moderationItems = await ModerationQueue.find({ status: 'pending' })
      .populate({
        path: 'complaintId',
        populate: {
          path: 'createdBy',
          select: 'name email role'
        }
      })
      .sort({ createdAt: -1 });
      
    res.status(200).json({
      success: true,
      count: moderationItems.length,
      moderationItems
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server Error'
    });
  }
});

// @route   PUT /api/moderation/approve/:id
// @desc    Approve a moderation item and grant rewards
// @access  Private/Admin
router.put('/approve/:id', protect, authorize(['admin']), async (req, res) => {
  try {
    const { pointsToAward } = req.body;
    
    const moderationItem = await ModerationQueue.findById(req.params.id);
    
    if (!moderationItem) {
      return res.status(404).json({
        success: false,
        message: 'Moderation item not found'
      });
    }
    
    if (moderationItem.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Moderation item already ${moderationItem.status}`
      });
    }
    
    // Update moderation status
    moderationItem.status = 'approved';
    moderationItem.reviewedBy = req.user.id;
    await moderationItem.save();
    
    // Update complaint reward eligibility
    const complaint = await Complaint.findById(moderationItem.complaintId);
    if (complaint) {
      complaint.rewardEligible = true;
      await complaint.save();
      
      // Award points to the user who created the complaint
      if (pointsToAward && pointsToAward > 0) {
        // Find or create reward record
        let reward = await Reward.findOne({ userId: complaint.createdBy });
        
        if (!reward) {
          reward = new Reward({
            userId: complaint.createdBy,
            points: pointsToAward
          });
        } else {
          reward.points += pointsToAward;
        }
        
        await reward.save();
        
        // Update user points as well
        const user = await User.findById(complaint.createdBy);
        if (user) {
          user.points += pointsToAward;
          await user.save();
        }
      }
    }
    
    res.status(200).json({
      success: true,
      moderationItem
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server Error'
    });
  }
});

// @route   PUT /api/moderation/reject/:id
// @desc    Reject a moderation item
// @access  Private/Admin
router.put('/reject/:id', protect, authorize(['admin']), async (req, res) => {
  try {
    const { reason } = req.body;
    
    const moderationItem = await ModerationQueue.findById(req.params.id);
    
    if (!moderationItem) {
      return res.status(404).json({
        success: false,
        message: 'Moderation item not found'
      });
    }
    
    if (moderationItem.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Moderation item already ${moderationItem.status}`
      });
    }
    
    // Update moderation status
    moderationItem.status = 'rejected';
    moderationItem.reviewedBy = req.user.id;
    moderationItem.reason = reason;
    await moderationItem.save();
    
    // Update complaint reward eligibility
    const complaint = await Complaint.findById(moderationItem.complaintId);
    if (complaint) {
      complaint.rewardEligible = false;
      await complaint.save();
    }
    
    res.status(200).json({
      success: true,
      moderationItem
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server Error'
    });
  }
});

module.exports = router;
