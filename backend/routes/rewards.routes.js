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
    const { limit = 50 } = req.query;
    
    const users = await User.find({ role: 'student' })
      .sort({ points: -1 })
      .limit(parseInt(limit))
      .select('name email points badges');
      
    res.status(200).json({
      success: true,
      leaderboard: users
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server Error'
    });
  }
});

// @route   GET /api/rewards/available
// @desc    Get available rewards that can be redeemed
// @access  Private
router.get('/available', protect, async (req, res) => {
  try {
    // Mock rewards data - you can create a Rewards collection later
    const availableRewards = [
      {
        _id: '1',
        name: 'Amazon Gift Card ₹500',
        description: 'Redeem your points for an Amazon gift card worth ₹500',
        pointsRequired: 500,
        category: 'gift-card',
        available: true
      },
      {
        _id: '2',
        name: 'Coffee Voucher',
        description: 'Free coffee at any CCD outlet',
        pointsRequired: 100,
        category: 'voucher',
        available: true
      },
      {
        _id: '3',
        name: 'Movie Tickets (2)',
        description: 'Get 2 movie tickets at any PVR cinema',
        pointsRequired: 300,
        category: 'entertainment',
        available: true
      },
      {
        _id: '4',
        name: 'Swiggy Voucher ₹200',
        description: 'Order your favorite food with Swiggy',
        pointsRequired: 200,
        category: 'food',
        available: true
      },
      {
        _id: '5',
        name: 'Certificate of Recognition',
        description: 'Official certificate for being a top contributor',
        pointsRequired: 1000,
        category: 'certificate',
        available: true
      }
    ];
    
    res.status(200).json({
      success: true,
      rewards: availableRewards
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server Error'
    });
  }
});

// @route   GET /api/rewards/redeem-history
// @desc    Get user's reward redemption history
// @access  Private
router.get('/redeem-history', protect, async (req, res) => {
  try {
    // Mock history data - you can create a RedeemHistory collection later
    const history = [
      // For now, return empty array
      // Later, you can query from database
    ];
    
    res.status(200).json({
      success: true,
      history: history
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server Error'
    });
  }
});

// @route   POST /api/rewards/redeem/:id
// @desc    Redeem a reward
// @access  Private
router.post('/redeem/:id', protect, async (req, res) => {
  try {
    const rewardId = req.params.id;
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Mock reward check
    const rewards = {
      '1': { name: 'Amazon Gift Card ₹500', points: 500 },
      '2': { name: 'Coffee Voucher', points: 100 },
      '3': { name: 'Movie Tickets (2)', points: 300 },
      '4': { name: 'Swiggy Voucher ₹200', points: 200 },
      '5': { name: 'Certificate of Recognition', points: 1000 }
    };
    
    const reward = rewards[rewardId];
    
    if (!reward) {
      return res.status(404).json({
        success: false,
        message: 'Reward not found'
      });
    }
    
    // Check if user has enough points
    if (user.points < reward.points) {
      return res.status(400).json({
        success: false,
        message: `Insufficient points. You need ${reward.points} points but have ${user.points} points.`
      });
    }
    
    // Deduct points
    user.points -= reward.points;
    await user.save();
    
    // In a real system, you would:
    // 1. Create a redemption record in database
    // 2. Send email with reward details/code
    // 3. Generate unique voucher codes
    
    res.status(200).json({
      success: true,
      message: `Successfully redeemed ${reward.name}! Check your email for details.`,
      remainingPoints: user.points
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
