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

    // Complaint goes to admin for manual assignment - NO auto-assignment
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
      assignedTo: null, // No auto-assignment - admin will assign manually
      statusHistory: [{
        status: 'pending',
        changedBy: req.user.id,
        changedAt: new Date(),
        comment: 'Complaint created - awaiting admin assignment'
      }]
    });

    await complaint.save();

    console.log(`✅ Complaint created successfully (awaiting admin assignment):`, {
      id: complaint._id,
      title: complaint.title,
      createdBy: req.user.id,
      status: complaint.status
    });

    // If user is a student with travel flag on, add to moderation queue
    try {
      if (req.user.role === 'student' && req.user.travelFlag) {
        const moderationItem = new ModerationQueue({
          reportType: 'complaint',
          reportedItemId: complaint._id,
          title: complaint.title,
          description: complaint.description,
          reason: 'other', // Use 'other' from enum - represents travel flag moderation need
          severity: 'medium',
          reportedBy: req.user.id,
          AI_flagged: false, // Later integrate with AI for auto-flagging
          status: 'pending'
        });
        await moderationItem.save();
        console.log(`✅ Moderation item created for travel-flagged complaint:`, moderationItem._id);
      }
    } catch (modError) {
      console.error('⚠️ Error creating moderation item:', modError.message);
      // Don't fail the complaint creation if moderation creation fails
    }

    res.status(201).json({
      success: true,
      complaint
    });
  } catch (error) {
    console.error('Complaint creation error:', error);
    console.error('Error stack:', error.stack);
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

// @route   GET /api/complaints/details/:id
// @desc    Get single complaint with full details (worker info, status history, comments count)
// @access  Private
router.get('/details/:id', protect, async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate('createdBy', 'name email role mobile')
      .populate('assignedTo', 'name email role mobile specializations workArea')
      .populate({
        path: 'statusHistory.changedBy',
        select: 'name role'
      });

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }

    // Check authorization - only complaint creator, assigned worker, or admin can view
    const isAuthorized = 
      complaint.createdBy._id.toString() === req.user.id ||
      (complaint.assignedTo && complaint.assignedTo._id.toString() === req.user.id) ||
      req.user.role === 'admin';

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this complaint'
      });
    }

    // Get comments count
    const Comment = require('../models/comment.model');
    const commentsCount = await Comment.countDocuments({ complaintId: req.params.id });

    res.status(200).json({
      success: true,
      complaint,
      commentsCount
    });
  } catch (error) {
    console.error('Error fetching complaint details:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server Error'
    });
  }
});

// @route   GET /api/complaints/search
// @desc    Advanced complaint search with filters
// @access  Private
router.get('/search', protect, async (req, res) => {
  try {
    const {
      keyword,
      status,
      type,
      priority,
      startDate,
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 10
    } = req.query;

    const query = {};

    // If not admin, only show user's own complaints
    if (req.user.role !== 'admin' && req.user.role !== 'worker') {
      query.createdBy = req.user.id;
    } else if (req.user.role === 'worker') {
      query.assignedTo = req.user.id;
    }

    // Keyword search (title, description, location)
    if (keyword) {
      query.$or = [
        { title: { $regex: keyword, $options: 'i' } },
        { description: { $regex: keyword, $options: 'i' } },
        { 'location.address': { $regex: keyword, $options: 'i' } },
        { 'location.city': { $regex: keyword, $options: 'i' } }
      ];
    }

    // Status filter
    if (status) {
      query.status = status;
    }

    // Type filter
    if (type) {
      query.type = type;
    }

    // Priority filter
    if (priority) {
      query.priority = priority;
    }

    // Date range filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query
    const complaints = await Complaint.find(query)
      .populate('createdBy', 'name email role')
      .populate('assignedTo', 'name email role')
      .sort(sortOptions)
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Complaint.countDocuments(query);

    res.status(200).json({
      success: true,
      complaints,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error searching complaints:', error);
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

// @route   GET /api/complaints/worker/stats
// @desc    Get worker's performance statistics
// @access  Private/Worker
router.get('/worker/stats', protect, authorize(['worker']), async (req, res) => {
  try {
    const workerId = req.user.id;
    console.log('📊 Getting stats for worker:', workerId);
    
    // Get all complaints assigned to this worker
    const totalAssigned = await Complaint.countDocuments({ assignedTo: workerId });
    const pending = await Complaint.countDocuments({ assignedTo: workerId, status: 'pending' });
    const inProgress = await Complaint.countDocuments({ assignedTo: workerId, status: 'in-progress' });
    const resolved = await Complaint.countDocuments({ assignedTo: workerId, status: 'resolved' });
    
    // Calculate completion rate
    const completionRate = totalAssigned > 0 
      ? ((resolved / totalAssigned) * 100).toFixed(1)
      : '0.0';
    
    // Get recent assignments (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentAssignments = await Complaint.countDocuments({
      assignedTo: workerId,
      createdAt: { $gte: sevenDaysAgo }
    });
    
    // Get average completion time for resolved complaints
    const resolvedComplaints = await Complaint.find({
      assignedTo: workerId,
      status: 'resolved'
    }).select('createdAt updatedAt');
    
    let avgCompletionTime = 0;
    if (resolvedComplaints.length > 0) {
      const totalTime = resolvedComplaints.reduce((sum, complaint) => {
        const diff = new Date(complaint.updatedAt) - new Date(complaint.createdAt);
        return sum + diff;
      }, 0);
      avgCompletionTime = (totalTime / resolvedComplaints.length / (1000 * 60 * 60 * 24)).toFixed(1); // Convert to days
    }
    
    // Calculate overall rating from feedback
    const ratedComplaints = await Complaint.find({
      assignedTo: workerId,
      'feedback.rating': { $exists: true, $ne: null }
    }).select('feedback.rating');
    
    let overallRating = 0;
    let ratedCount = 0;
    if (ratedComplaints.length > 0) {
      const totalRating = ratedComplaints.reduce((sum, complaint) => {
        return sum + (complaint.feedback?.rating || 0);
      }, 0);
      overallRating = (totalRating / ratedComplaints.length).toFixed(1);
      ratedCount = ratedComplaints.length;
    }
    
    console.log('⭐ Worker rating:', {
      overallRating,
      ratedCount,
      totalRatingCount: ratedComplaints.length
    });
    
    res.status(200).json({
      success: true,
      stats: {
        totalAssigned,
        pending,
        inProgress,
        resolved,
        completionRate: `${completionRate}%`,
        recentAssignments,
        avgCompletionTime: `${avgCompletionTime} days`,
        overallRating: parseFloat(overallRating),
        ratedComplaints: ratedCount
      }
    });
  } catch (error) {
    console.error('❌ Error getting worker stats:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server Error'
    });
  }
});

// @route   GET /api/complaints/worker/analytics
// @desc    Get advanced analytics for worker
// @access  Private/Worker
router.get('/worker/analytics', protect, authorize(['worker']), async (req, res) => {
  try {
    const workerId = req.user.id;
    
    // Get complaints by type
    const complaintsByType = await Complaint.aggregate([
      { $match: { assignedTo: workerId } },
      { $group: { _id: '$type', count: { $sum: 1 } } },
      { $project: { type: '$_id', count: 1, _id: 0 } }
    ]);
    
    // Get complaints by priority
    const complaintsByPriority = await Complaint.aggregate([
      { $match: { assignedTo: workerId } },
      { $group: { _id: '$priority', count: { $sum: 1 } } },
      { $project: { priority: '$_id', count: 1, _id: 0 } }
    ]);
    
    // Get daily resolution trend (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const dailyTrend = await Complaint.aggregate([
      { 
        $match: { 
          assignedTo: workerId,
          resolvedAt: { $gte: thirtyDaysAgo }
        } 
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$resolvedAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } },
      { $project: { date: '$_id', count: 1, _id: 0 } }
    ]);
    
    // Get resolution time distribution
    const resolvedComplaints = await Complaint.find({
      assignedTo: workerId,
      status: 'resolved',
      resolvedAt: { $exists: true }
    }).select('createdAt resolvedAt');
    
    const resolutionTimes = {
      '< 1 day': 0,
      '1-3 days': 0,
      '3-7 days': 0,
      '> 7 days': 0
    };
    
    resolvedComplaints.forEach(complaint => {
      const days = (new Date(complaint.resolvedAt) - new Date(complaint.createdAt)) / (1000 * 60 * 60 * 24);
      if (days < 1) resolutionTimes['< 1 day']++;
      else if (days <= 3) resolutionTimes['1-3 days']++;
      else if (days <= 7) resolutionTimes['3-7 days']++;
      else resolutionTimes['> 7 days']++;
    });
    
    // Get monthly performance (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const monthlyPerformance = await Complaint.aggregate([
      { 
        $match: { 
          assignedTo: workerId,
          createdAt: { $gte: sixMonthsAgo }
        } 
      },
      {
        $group: {
          _id: {
            month: { $month: '$createdAt' },
            year: { $year: '$createdAt' },
            status: '$status'
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);
    
    res.status(200).json({
      success: true,
      analytics: {
        byType: complaintsByType,
        byPriority: complaintsByPriority,
        dailyTrend,
        resolutionTimes,
        monthlyPerformance
      }
    });
  } catch (error) {
    console.error('Error getting worker analytics:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server Error'
    });
  }
});

// @route   GET /api/complaints/worker
// @desc    Get complaints assigned to this worker only
// @access  Private/Worker
router.get('/worker', protect, authorize(['worker']), async (req, res) => {
  try {
    console.log('🔍 Worker complaints request from user:', req.user.id, req.user.role);
    
    // Get only complaints assigned to this specific worker
    const complaints = await Complaint.find({ assignedTo: req.user.id })
      .sort({ createdAt: -1 })
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email');
    
    console.log(`📊 Found ${complaints.length} complaints assigned to worker ${req.user.id}`);
      
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
    
    const complaint = await Complaint.findById(req.params.id)
      .populate('createdBy', 'name email');
    
    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }
    
    const oldAssignee = complaint.assignedTo;
    complaint.assignedTo = workerId;
    complaint.status = 'in-progress';
    complaint._assignedBy = req.user.id; // Track who assigned
    complaint._statusChangedBy = req.user.id; // Track who changed status
    await complaint.save();
    
    // Send notification to newly assigned worker
    try {
      const { sendWorkerAssignmentEmail } = require('../services/notification.service');
      
      const worker = await User.findById(workerId);
      if (worker && worker.email) {
        await sendWorkerAssignmentEmail(worker, complaint);
        console.log('✅ Assignment notification sent to worker:', worker.email);
      }
    } catch (notifError) {
      console.error('⚠️ Failed to send assignment notification:', notifError.message);
      // Continue even if notification fails
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

// @route   PUT /api/complaints/update/:id
// @desc    Update complaint status (any worker can update any complaint)
// @access  Private/Worker
router.put('/update/:id', protect, authorize(['worker']), upload.single('resolutionProof'), async (req, res) => {
  try {
    const { status } = req.body;
    let resolutionProof = null;
    
    // Handle file upload if present
    if (req.file) {
      resolutionProof = `/uploads/${req.file.filename}`;
    }
    
    const complaint = await Complaint.findById(req.params.id).populate('createdBy');
    
    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }
    
    // ONLY allow workers to update complaints assigned to them
    if (!complaint.assignedTo) {
      return res.status(403).json({
        success: false,
        message: 'This complaint has not been assigned yet. Please contact admin for assignment.'
      });
    }
    
    if (complaint.assignedTo.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You can only update complaints assigned to you.'
      });
    }
    
    const oldStatus = complaint.status;
    complaint.status = status;
    complaint._statusChangedBy = req.user.id; // Track who changed status
    
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
        console.log('👤 User who created complaint:', complaint.createdBy);
        console.log('📧 Sending notification for status change:', oldStatus, '->', status);
        
        // Ensure createdBy is a proper user object
        const userObj = complaint.createdBy._id ? complaint.createdBy : await User.findById(complaint.createdBy);
        
        if (userObj && userObj.email) {
          const notifications = await notifyComplaintStatusChange(
            userObj,
            complaint,
            status
          );
          console.log(`✅ Notifications sent:`, notifications);
        } else {
          console.log('⚠️ User not found or no email:', userObj);
        }
      } catch (notifyError) {
        console.error('❌ Error sending notification:', notifyError);
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

// ========== SPECIFIC ROUTES MUST COME BEFORE GENERIC /:id ROUTE ==========

// @route   POST /api/complaints/:id/feedback
// @desc    Submit feedback for a resolved complaint
// @access  Private/Citizen (complaint creator only)
router.post('/:id/feedback', protect, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    
    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }
    
    const complaint = await Complaint.findById(req.params.id);
    
    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }
    
    // Check if user is the creator of the complaint
    if (complaint.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Only the complaint creator can submit feedback'
      });
    }
    
    // Check if complaint is resolved
    if (complaint.status !== 'resolved') {
      return res.status(400).json({
        success: false,
        message: 'Can only submit feedback for resolved complaints'
      });
    }
    
    // Check if feedback already exists
    if (complaint.feedback && complaint.feedback.rating) {
      return res.status(400).json({
        success: false,
        message: 'Feedback already submitted for this complaint'
      });
    }
    
    // Add feedback
    complaint.feedback = {
      rating,
      comment: comment || '',
      submittedAt: new Date()
    };
    
    await complaint.save();
    
    console.log(`⭐ Feedback submitted for complaint ${complaint._id}: ${rating} stars`);
    
    res.status(200).json({
      success: true,
      message: 'Thank you for your feedback!',
      feedback: complaint.feedback
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server Error'
    });
  }
});

// @route   GET /api/complaints/:id/history
// @desc    Get complaint status and assignment history
// @access  Private
router.get('/:id/history', protect, async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate('statusHistory.changedBy', 'name email role')
      .populate('assignmentHistory.assignedTo', 'name email')
      .populate('assignmentHistory.assignedBy', 'name email role')
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email');
    
    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }
    
    res.status(200).json({
      success: true,
      history: {
        statusHistory: complaint.statusHistory || [],
        assignmentHistory: complaint.assignmentHistory || [],
        createdAt: complaint.createdAt,
        resolvedAt: complaint.resolvedAt,
        currentStatus: complaint.status,
        currentAssignee: complaint.assignedTo
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

// @route   GET /api/complaints/:id/details
// @desc    Get full complaint details with worker info
// @access  Private
router.get('/:id/details', protect, async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate('createdBy', 'name email role mobile')
      .populate('assignedTo', 'name email mobile specializations')
      .populate('statusHistory.changedBy', 'name role')
      .populate('assignmentHistory.assignedTo', 'name')
      .populate('assignmentHistory.assignedBy', 'name');
    
    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }
    
    // Get worker stats if assigned
    let workerStats = null;
    if (complaint.assignedTo) {
      const resolvedCount = await Complaint.countDocuments({
        assignedTo: complaint.assignedTo._id,
        status: 'resolved'
      });
      
      const totalAssigned = await Complaint.countDocuments({
        assignedTo: complaint.assignedTo._id
      });
      
      workerStats = {
        resolvedCount,
        totalAssigned,
        completionRate: totalAssigned > 0 ? ((resolvedCount / totalAssigned) * 100).toFixed(1) : '0'
      };
    }
    
    res.status(200).json({
      success: true,
      complaint,
      workerStats
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server Error'
    });
  }
});

// @route   POST /api/complaints/:id/comments
// @desc    Add comment to complaint
// @access  Private
router.post('/:id/comments', protect, async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text || text.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Comment text is required'
      });
    }
    
    const complaint = await Complaint.findById(req.params.id);
    
    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }
    
    // Initialize comments array if it doesn't exist
    if (!complaint.comments) {
      complaint.comments = [];
    }
    
    const comment = {
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      text: text.trim(),
      createdAt: new Date()
    };
    
    complaint.comments.push(comment);
    await complaint.save();
    
    // Populate the complaint to get full details
    await complaint.populate('createdBy assignedTo', 'name email');
    
    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      comment,
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

// @route   GET /api/complaints/:id/comments
// @desc    Get all comments for a complaint
// @access  Private
router.get('/:id/comments', protect, async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .select('comments')
      .lean();
    
    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }
    
    res.status(200).json({
      success: true,
      comments: complaint.comments || []
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server Error'
    });
  }
});

// @route   POST /api/complaints/:id/media
// @desc    Add additional media to complaint
// @access  Private
router.post('/:id/media', protect, upload.array('images', 3), async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    
    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }
    
    // Check if user is creator
    if (complaint.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to add media'
      });
    }
    
    // Handle uploaded files
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }
    
    const newMediaURLs = req.files.map(file => `/uploads/${file.filename}`);
    
    // Initialize mediaURLs array if it doesn't exist
    if (!complaint.mediaURLs) {
      complaint.mediaURLs = [];
    }
    
    complaint.mediaURLs.push(...newMediaURLs);
    await complaint.save();
    
    res.status(200).json({
      success: true,
      message: 'Media added successfully',
      mediaURLs: newMediaURLs,
      allMedia: complaint.mediaURLs
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server Error'
    });
  }
});

// @route   GET /api/complaints/search
// @desc    Advanced search for complaints
// @access  Private
router.get('/search/advanced', protect, async (req, res) => {
  try {
    const { 
      q,           // search query
      status,
      type,
      priority,
      startDate,
      endDate,
      myComplaints,
      page = 1,
      limit = 10
    } = req.query;
    
    let query = {};
    
    // If myComplaints is true, filter by current user
    if (myComplaints === 'true') {
      query.createdBy = req.user.id;
    }
    
    // Text search
    if (q) {
      query.$or = [
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { 'location.address': { $regex: q, $options: 'i' } }
      ];
    }
    
    // Filters
    if (status) query.status = status;
    if (type) query.type = type;
    if (priority) query.priority = priority;
    
    // Date range
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const complaints = await Complaint.find(query)
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Complaint.countDocuments(query);
    
    res.status(200).json({
      success: true,
      complaints,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        limit: parseInt(limit)
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

// @route   GET /api/complaints/nearby
// @desc    Get complaints near a location
// @access  Public
router.get('/nearby/:lat/:lng', async (req, res) => {
  try {
    const { lat, lng } = req.params;
    const radius = req.query.radius || 5; // Default 5km
    
    // Convert radius to radians (radius in km / Earth's radius in km)
    const radiusInRadians = radius / 6371;
    
    const complaints = await Complaint.find({
      'location.lat': {
        $gte: parseFloat(lat) - radiusInRadians * (180 / Math.PI),
        $lte: parseFloat(lat) + radiusInRadians * (180 / Math.PI)
      },
      'location.lng': {
        $gte: parseFloat(lng) - radiusInRadians * (180 / Math.PI),
        $lte: parseFloat(lng) + radiusInRadians * (180 / Math.PI)
      }
    })
      .select('title type priority status location createdAt')
      .limit(50);
    
    res.status(200).json({
      success: true,
      count: complaints.length,
      complaints,
      radius: `${radius}km`
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server Error'
    });
  }
});

// ========== GENERIC ROUTE MUST BE LAST ==========

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
