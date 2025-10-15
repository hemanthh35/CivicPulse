const express = require('express');
const router = express.Router();
const User = require('../models/user.model');
const Reward = require('../models/reward.model');
const { protect, authorize } = require('../middlewares/auth.middleware');

// @route   GET /api/rewards/user/:id
// @desc    Get rewards for a specific user
// @access  Private
router.get('/user/:id', protect, async (req, res) => {
  try {
    // Check if the user is trying to access their own rewards or admin accessing anyone's
    if (req.user.id !== req.params.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view these rewards'
      });
    }

    let reward = await Reward.findOne({ userId: req.params.id });
    
    if (!reward) {
      // If no reward record exists, return empty reward data
      return res.status(200).json({
        success: true,
        reward: {
          userId: req.params.id,
          points: 0,
          badges: [],
          certificates: [],
          coupons: []
        }
      });
    }

    res.status(200).json({
      success: true,
      reward
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server Error'
    });
  }
});

// @route   PUT /api/rewards/add-points/:id
// @desc    Add points to a user (admin only)
// @access  Private/Admin
router.put('/add-points/:id', protect, authorize(['admin']), async (req, res) => {
  try {
    const { points } = req.body;
    
    if (!points || points <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid points value is required'
      });
    }

    // Find or create reward record
    let reward = await Reward.findOne({ userId: req.params.id });
    
    if (!reward) {
      reward = new Reward({
        userId: req.params.id,
        points: points
      });
    } else {
      reward.points += points;
    }
    
    await reward.save();
    
    // Update user points as well
    const user = await User.findById(req.params.id);
    if (user) {
      user.points += points;
      await user.save();
    }

    res.status(200).json({
      success: true,
      reward
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server Error'
    });
  }
});

// @route   PUT /api/rewards/add-badge/:id
// @desc    Add badge to a user (admin only)
// @access  Private/Admin
router.put('/add-badge/:id', protect, authorize(['admin']), async (req, res) => {
  try {
    const { badge } = req.body;
    
    if (!badge) {
      return res.status(400).json({
        success: false,
        message: 'Badge name is required'
      });
    }

    // Find or create reward record
    let reward = await Reward.findOne({ userId: req.params.id });
    
    if (!reward) {
      reward = new Reward({
        userId: req.params.id,
        badges: [badge]
      });
    } else if (!reward.badges.includes(badge)) {
      reward.badges.push(badge);
    }
    
    await reward.save();
    
    // Update user badges as well
    const user = await User.findById(req.params.id);
    if (user && !user.badges.includes(badge)) {
      user.badges.push(badge);
      await user.save();
    }

    res.status(200).json({
      success: true,
      reward
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server Error'
    });
  }
});

// @route   PUT /api/rewards/add-certificate/:id
// @desc    Add certificate to a user (admin only)
// @access  Private/Admin
router.put('/add-certificate/:id', protect, authorize(['admin']), async (req, res) => {
  try {
    const { certificate } = req.body;
    
    if (!certificate) {
      return res.status(400).json({
        success: false,
        message: 'Certificate is required'
      });
    }

    // Find or create reward record
    let reward = await Reward.findOne({ userId: req.params.id });
    
    if (!reward) {
      reward = new Reward({
        userId: req.params.id,
        certificates: [certificate]
      });
    } else if (!reward.certificates.includes(certificate)) {
      reward.certificates.push(certificate);
    }
    
    await reward.save();

    res.status(200).json({
      success: true,
      reward
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server Error'
    });
  }
});

// @route   PUT /api/rewards/add-coupon/:id
// @desc    Add coupon to a user (admin only)
// @access  Private/Admin
router.put('/add-coupon/:id', protect, authorize(['admin']), async (req, res) => {
  try {
    const { code, value, expiresAt } = req.body;
    
    if (!code || !value) {
      return res.status(400).json({
        success: false,
        message: 'Coupon code and value are required'
      });
    }

    const coupon = {
      code,
      value,
      expiresAt: expiresAt || null,
      redeemed: false
    };

    // Find or create reward record
    let reward = await Reward.findOne({ userId: req.params.id });
    
    if (!reward) {
      reward = new Reward({
        userId: req.params.id,
        coupons: [coupon]
      });
    } else {
      reward.coupons.push(coupon);
    }
    
    await reward.save();

    res.status(200).json({
      success: true,
      reward
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server Error'
    });
  }
});

// @route   GET /api/rewards/leaderboard
// @desc    Get leaderboard of users by points
// @access  Public
router.get('/leaderboard', async (req, res) => {
  try {
    const users = await User.find({ role: 'student' })
      .sort({ points: -1 })
      .limit(10)
      .select('name points badges');
      
    res.status(200).json({
      success: true,
      users
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
