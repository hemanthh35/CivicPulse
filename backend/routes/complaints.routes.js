const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Complaint = require('../models/complaint.model');
const ModerationQueue = require('../models/moderation.model');
const User = require('../models/user.model');
const { protect, authorize } = require('../middlewares/auth.middleware');
const { notifyComplaintStatusChange } = require('../services/notification.service');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads/'));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// @route   POST /api/complaints/create
// @desc    Create a new complaint/issue
// @access  Private
router.post('/create', protect, upload.array('images', 5), async (req, res) => {
  try {
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ success: false, message: 'Missing request body' });
    }

    let { title, description, category, location, priority } = req.body;
    
    // Parse location if it's a JSON string
    if (typeof location === 'string') {
      try {
        location = JSON.parse(location);
      } catch (e) {
        return res.status(400).json({ success: false, message: 'Invalid location format' });
      }
    }

    if (!title || !description || !category || !location) {
      return res.status(400).json({ success: false, message: 'Missing required fields: title, description, category, location' });
    }

    // Handle uploaded files
    let mediaURLs = [];
    if (req.files && req.files.length > 0) {
      mediaURLs = req.files.map(file => `/uploads/${file.filename}`);
    }

    // Find a worker before creating the complaint
    let assignedTo = null;
    try {
      const workers = await User.find({ role: 'worker' });
      if (workers.length > 0) {
        assignedTo = workers[Math.floor(Math.random() * workers.length)]._id;
      }
    } catch (err) {
      console.error('Error finding workers:', err);
    }

    const complaint = new Complaint({
      type: category, // Map category to type for backend consistency
      title: title,
      description,
      mediaURL: mediaURLs.length > 0 ? mediaURLs[0] : null, // Store first image URL
      mediaURLs: mediaURLs, // Store all image URLs
      location,
      priority: priority || 'medium',
      createdBy: req.user.id,
      rewardEligible: req.user.role === 'student' && req.user.travelFlag,
      assignedTo: assignedTo // Ensure assignment
    });

    await complaint.save();

    console.log(`✅ Complaint created successfully:`, {
      id: complaint._id,
      title: complaint.title,
      createdBy: req.user.id,
      assignedTo: assignedTo,
      status: complaint.status
    });

    // If user is a student with travel flag on, add to moderation queue
    if (req.user.role === 'student' && req.user.travelFlag) {
      const moderationItem = new ModerationQueue({
        complaintId: complaint._id,
        AI_flagged: false, // Later integrate with AI for auto-flagging
      });
      await moderationItem.save();
    }

    res.status(201).json({
      success: true,
      complaint
    });
  } catch (error) {
    console.error('Complaint creation error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server Error'
    });
  }
});

// @route   GET /api/complaints/user/:id
// @desc    Get complaints by user ID
// @access  Private
router.get('/user/:id', protect, async (req, res) => {
  try {
    // Check if the user is trying to access their own complaints or admin accessing anyone's
    if (req.user.id !== req.params.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view these complaints'
      });
    }

    const complaints = await Complaint.find({ createdBy: req.params.id })
      .sort({ createdAt: -1 })
      .populate('assignedTo', 'name email');

    res.status(200).json({
      success: true,
      count: complaints.length,
      complaints
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server Error'
    });
  }
});

// @route   GET /api/complaints/all
// @desc    Get all complaints with filters (admin only)
// @access  Private/Admin
router.get('/all', protect, authorize(['admin']), async (req, res) => {
  try {
    const { status, type, startDate, endDate } = req.query;
    
    // Build query
    const query = {};
    
    if (status) query.status = status;
    if (type) query.type = type;
    
    // Date range filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    
    const complaints = await Complaint.find(query)
      .sort({ createdAt: -1 })
      .populate('createdBy', 'name email role')
      .populate('assignedTo', 'name email role');
      
    res.status(200).json({
      success: true,
      count: complaints.length,
      complaints
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server Error'
    });
  }
});

// @route   GET /api/complaints/worker
// @desc    Get all complaints for worker (can view and work on all)
// @access  Private/Worker
router.get('/worker', protect, authorize(['worker']), async (req, res) => {
  try {
    console.log('🔍 Worker complaints request from user:', req.user.id, req.user.role);
    
    // Get all complaints, not just assigned ones - workers can see and work on all complaints
    const complaints = await Complaint.find({})
      .sort({ createdAt: -1 })
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email');
    
    console.log(`📊 Found ${complaints.length} total complaints for worker`);
      
    res.status(200).json({
      success: true,
      count: complaints.length,
      complaints
    });
  } catch (error) {
    console.error('❌ Error in worker complaints route:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server Error'
    });
  }
});

// @route   PUT /api/complaints/assign/:id
// @desc    Assign complaint to worker
// @access  Private/Admin
router.put('/assign/:id', protect, authorize(['admin']), async (req, res) => {
  try {
    const { workerId } = req.body;
    
    const complaint = await Complaint.findById(req.params.id);
    
    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }
    
    complaint.assignedTo = workerId;
    complaint.status = 'in-progress';
    await complaint.save();
    
    res.status(200).json({
      success: true,
      complaint
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server Error'
    });
  }
});

// @route   PUT /api/complaints/update/:id
// @desc    Update complaint status (any worker can update any complaint)
// @access  Private/Worker
router.put('/update/:id', protect, authorize(['worker']), async (req, res) => {
  try {
    const { status, resolutionProof } = req.body;
    
    const complaint = await Complaint.findById(req.params.id).populate('createdBy');
    
    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }
    
    // Allow any worker to update any complaint (removed assignment check)
    // Auto-assign to this worker if not already assigned
    if (!complaint.assignedTo) {
      complaint.assignedTo = req.user.id;
    }
    
    const oldStatus = complaint.status;
    complaint.status = status;
    
    // Add resolution proof if provided and status is 'resolved'
    if (status === 'resolved' && resolutionProof) {
      complaint.resolutionProof = {
        mediaURL: resolutionProof,
        timestamp: Date.now()
      };
    }
    
    await complaint.save();
    
    // Send automatic notification to the user who created the complaint
    if (oldStatus !== status && complaint.createdBy) {
      try {
        const notifications = await notifyComplaintStatusChange(
          complaint.createdBy,
          complaint,
          status
        );
        console.log(`📧 Notifications sent:`, notifications);
      } catch (notifyError) {
        console.error('Error sending notification:', notifyError);
        // Don't fail the request if notification fails
      }
    }
    
    res.status(200).json({
      success: true,
      complaint,
      message: status === 'resolved' 
        ? 'Complaint marked as resolved and user has been notified!' 
        : 'Complaint status updated successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server Error'
    });
  }
});

// @route   GET /api/complaints/:id
// @desc    Get complaint by ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate('createdBy', 'name email role')
      .populate('assignedTo', 'name email role');
      
    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }
    
    // Check if user is allowed to view this complaint
    if (
      req.user.role !== 'admin' && 
      complaint.createdBy._id.toString() !== req.user.id &&
      (complaint.assignedTo && complaint.assignedTo._id.toString() !== req.user.id)
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this complaint'
      });
    }
    
    res.status(200).json({
      success: true,
      complaint
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
