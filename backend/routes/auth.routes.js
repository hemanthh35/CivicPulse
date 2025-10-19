const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth.middleware');
const { sendWelcomeEmail, send2FAEmail } = require('../services/notification.service');

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, mobile, location } = req.body;

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ 
        success: false, 
        message: 'User already exists' 
      });
    }

    // Create new user
    user = new User({
      name,
      email,
      password,
      role: role || 'citizen',
      mobile,
      location
    });

    await user.save();

    // Send welcome email (don't wait for it, send async)
    sendWelcomeEmail(user).catch(err => 
      console.log('Failed to send welcome email:', err.message)
    );

    // Generate JWT
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || 'civicpulsesecret',
      { expiresIn: '30d' }
    );

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        mobile: user.mobile,
        location: user.location,
        points: user.points,
        badges: user.badges,
        twoFactorEnabled: user.twoFactorEnabled || false
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server Error'
    });
  }
});

// @route   POST /api/auth/login
// @desc    Login user & get token (with 2FA for workers)
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if user account is active
    if (user.isActive === false) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been suspended. Please contact support.',
        suspended: true,
        suspensionReason: user.suspensionReason
      });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // ✨ Check if user has 2FA enabled (optional feature)
    if (user.twoFactorEnabled) {
      // Generate OTP
      const otp = user.generateOTP();
      await user.save();
      
      // Send OTP via email
      const emailResult = await send2FAEmail(user, otp);
      
      if (!emailResult.success) {
        return res.status(500).json({
          success: false,
          message: 'Failed to send OTP. Please try again.'
        });
      }

      console.log(`🔐 2FA OTP sent to ${user.role}: ${user.email}`);
      
      return res.status(200).json({
        success: true,
        require2FA: true,
        message: 'OTP sent to your email. Please verify to continue.',
        userId: user._id
      });
    }

    // For users without 2FA enabled, proceed with normal login
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || 'civicpulsesecret',
      { expiresIn: '30d' }
    );

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        mobile: user.mobile,
        location: user.location,
        travelFlag: user.travelFlag,
        points: user.points,
        badges: user.badges,
        twoFactorEnabled: user.twoFactorEnabled
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server Error'
    });
  }
});

// @route   POST /api/auth/verify-otp
// @desc    Verify OTP for 2FA (workers only)
// @access  Public
router.post('/verify-otp', async (req, res) => {
  try {
    const { userId, otp } = req.body;

    if (!userId || !otp) {
      return res.status(400).json({
        success: false,
        message: 'User ID and OTP are required'
      });
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify OTP (2FA now required for all roles)
    const isValidOTP = user.verifyOTP(otp);
    if (!isValidOTP) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired OTP. Please try again.'
      });
    }

    // Mark OTP as verified and clear it
    user.otpVerified = true;
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    console.log(`✅ 2FA verified for ${user.role}: ${user.email}`);

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || 'civicpulsesecret',
      { expiresIn: '30d' }
    );

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        mobile: user.mobile,
        location: user.location,
        travelFlag: user.travelFlag,
        points: user.points,
        badges: user.badges,
        twoFactorEnabled: user.twoFactorEnabled
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server Error'
    });
  }
});

// @route   POST /api/auth/resend-otp
// @desc    Resend OTP for 2FA
// @access  Public
router.post('/resend-otp', async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Generate new OTP (2FA now for all roles)
    const otp = user.generateOTP();
    await user.save();

    // Send OTP via email
    const emailResult = await send2FAEmail(user, otp);
    
    if (!emailResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send OTP. Please try again.'
      });
    }

    console.log(`🔁 2FA OTP resent to ${user.role}: ${user.email}`);

    res.status(200).json({
      success: true,
      message: 'OTP resent successfully to your email'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server Error'
    });
  }
});

// @route   GET /api/auth/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');

    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server Error'
    });
  }
});

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', protect, async (req, res) => {
  try {
    const { name, mobile, location, travelFlag } = req.body;

    // Find user by ID
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update fields
    if (name) user.name = name;
    if (mobile) user.mobile = mobile;
    if (location) user.location = location;
    if (req.user.role === 'student' && travelFlag !== undefined) {
      user.travelFlag = travelFlag;
    }

    await user.save();

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        mobile: user.mobile,
        location: user.location,
        travelFlag: user.travelFlag,
        points: user.points,
        badges: user.badges,
        twoFactorEnabled: user.twoFactorEnabled
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server Error'
    });
  }
});

// @route   PUT /api/auth/toggle-2fa
// @desc    Enable or disable 2FA for user
// @access  Private
router.put('/toggle-2fa', protect, async (req, res) => {
  try {
    const { enabled } = req.body;

    // Find user by ID
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update 2FA setting
    user.twoFactorEnabled = enabled === true;
    await user.save();

    console.log(`🔐 2FA ${enabled ? 'enabled' : 'disabled'} for user: ${user.email}`);

    res.status(200).json({
      success: true,
      message: `Two-Factor Authentication ${enabled ? 'enabled' : 'disabled'} successfully`,
      twoFactorEnabled: user.twoFactorEnabled
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server Error'
    });
  }
});

// @route   PUT /api/auth/worker/settings
// @desc    Update worker specializations and work area
// @access  Private (Workers only)
router.put('/worker/settings', protect, authorize('worker'), async (req, res) => {
  try {
    const { specializations, workArea } = req.body;

    // Find worker by ID
    const worker = await User.findById(req.user.id);
    if (!worker) {
      return res.status(404).json({
        success: false,
        message: 'Worker not found'
      });
    }

    // Update specializations if provided
    if (specializations !== undefined) {
      if (!Array.isArray(specializations)) {
        return res.status(400).json({
          success: false,
          message: 'Specializations must be an array'
        });
      }
      worker.specializations = specializations;
    }

    // Update work area if provided
    if (workArea) {
      if (!workArea.lat || !workArea.lng || !workArea.radius) {
        return res.status(400).json({
          success: false,
          message: 'Work area must include lat, lng, and radius'
        });
      }

      worker.workArea = {
        lat: parseFloat(workArea.lat),
        lng: parseFloat(workArea.lng),
        radius: parseFloat(workArea.radius)
      };
    }

    await worker.save();

    console.log(`⚙️ Worker settings updated for: ${worker.email}`);
    console.log(`   Specializations: ${worker.specializations.join(', ')}`);
    console.log(`   Work Area: ${worker.workArea.lat}, ${worker.workArea.lng} (${worker.workArea.radius}km)`);

    res.status(200).json({
      success: true,
      message: 'Worker settings updated successfully',
      user: {
        id: worker._id,
        name: worker.name,
        email: worker.email,
        role: worker.role,
        specializations: worker.specializations,
        workArea: worker.workArea,
        mobile: worker.mobile,
        location: worker.location,
        points: worker.points,
        badges: worker.badges,
        twoFactorEnabled: worker.twoFactorEnabled
      }
    });
  } catch (error) {
    console.error('Error updating worker settings:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server Error'
    });
  }
});

module.exports = router;
