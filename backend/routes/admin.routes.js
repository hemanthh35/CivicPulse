const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth.middleware');
const User = require('../models/user.model');
const Complaint = require('../models/complaint.model');
const ModerationQueue = require('../models/moderation.model');

// ==========================================
// ADMIN DASHBOARD STATISTICS
// ==========================================

// @route   GET /api/admin/stats
// @desc    Get system-wide statistics for admin dashboard
// @access  Private/Admin
router.get('/stats', protect, authorize('admin'), async (req, res) => {
  try {
    // User statistics
    const totalUsers = await User.countDocuments();
    const usersByRole = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);

    // Complaint statistics
    const totalComplaints = await Complaint.countDocuments();
    const complaintsByStatus = await Complaint.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    
    const complaintsByType = await Complaint.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]);

    const complaintsByPriority = await Complaint.aggregate([
      { $group: { _id: '$priority', count: { $sum: 1 } } }
    ]);

    // Recent activity
    const recentComplaints = await Complaint.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('createdBy', 'name email role');

    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('-password');

    // Response time analysis
    const resolvedComplaints = await Complaint.find({ status: 'Resolved' });
    let avgResponseTime = 0;
    if (resolvedComplaints.length > 0) {
      const totalTime = resolvedComplaints.reduce((sum, complaint) => {
        const time = complaint.resolvedAt 
          ? (new Date(complaint.resolvedAt) - new Date(complaint.createdAt)) / (1000 * 60 * 60 * 24)
          : 0;
        return sum + time;
      }, 0);
      avgResponseTime = (totalTime / resolvedComplaints.length).toFixed(2);
    }

    res.status(200).json({
      success: true,
      stats: {
        users: {
          total: totalUsers,
          byRole: usersByRole.reduce((acc, item) => {
            acc[item._id] = item.count;
            return acc;
          }, {})
        },
        complaints: {
          total: totalComplaints,
          byStatus: complaintsByStatus.reduce((acc, item) => {
            acc[item._id] = item.count;
            return acc;
          }, {}),
          byType: complaintsByType.reduce((acc, item) => {
            acc[item._id] = item.count;
            return acc;
          }, {}),
          byPriority: complaintsByPriority.reduce((acc, item) => {
            acc[item._id] = item.count;
            return acc;
          }, {})
        },
        analytics: {
          avgResponseTime: parseFloat(avgResponseTime),
          resolutionRate: totalComplaints > 0 
            ? ((complaintsByStatus.find(s => s._id === 'Resolved')?.count || 0) / totalComplaints * 100).toFixed(2)
            : 0
        },
        recentActivity: {
          complaints: recentComplaints,
          users: recentUsers
        }
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

// ==========================================
// USER MANAGEMENT
// ==========================================

// @route   GET /api/admin/users
// @desc    Get all users with filtering and pagination
// @access  Private/Admin
router.get('/users', protect, authorize('admin'), async (req, res) => {
  try {
    const { role, search, page = 1, limit = 10 } = req.query;

    // Build query
    let query = {};
    if (role) query.role = role;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { mobile: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      users,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit))
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

// @route   GET /api/admin/users/:id
// @desc    Get single user details
// @access  Private/Admin
router.get('/users/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get user's complaints
    const complaints = await Complaint.find({ createdBy: user._id })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      user,
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

// @route   PUT /api/admin/users/:id
// @desc    Update user (role, status, etc.)
// @access  Private/Admin
router.put('/users/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const { role, name, email, mobile, location, points, badges } = req.body;

    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update fields
    if (role) user.role = role;
    if (name) user.name = name;
    if (email) user.email = email;
    if (mobile) user.mobile = mobile;
    if (location) user.location = location;
    if (points !== undefined) user.points = points;
    if (badges) user.badges = badges;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      user: await User.findById(user._id).select('-password')
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server Error'
    });
  }
});

// @route   DELETE /api/admin/users/:id
// @desc    Delete user
// @access  Private/Admin
router.delete('/users/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Don't allow deleting yourself
    if (user._id.toString() === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account'
      });
    }

    await user.deleteOne();

    // Also delete user's complaints
    await Complaint.deleteMany({ createdBy: user._id });

    res.status(200).json({
      success: true,
      message: 'User and their complaints deleted successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server Error'
    });
  }
});

// @route   PUT /api/admin/users/:id/suspend
// @desc    Suspend a user account
// @access  Private/Admin
router.put('/users/:id/suspend', protect, authorize('admin'), async (req, res) => {
  try {
    const { reason } = req.body;
    
    if (!reason || reason.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Suspension reason is required'
      });
    }

    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Don't allow suspending yourself
    if (user._id.toString() === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot suspend your own account'
      });
    }

    // Don't allow suspending other admins
    if (user.role === 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Cannot suspend admin accounts'
      });
    }

    user.isActive = false;
    user.suspendedAt = new Date();
    user.suspensionReason = reason;
    user.suspendedBy = req.user.id;
    
    await user.save();

    res.status(200).json({
      success: true,
      message: 'User suspended successfully',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        isActive: user.isActive,
        suspendedAt: user.suspendedAt,
        suspensionReason: user.suspensionReason
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

// @route   PUT /api/admin/users/:id/activate
// @desc    Activate a suspended user account
// @access  Private/Admin
router.put('/users/:id/activate', protect, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.isActive = true;
    user.suspendedAt = null;
    user.suspensionReason = null;
    user.suspendedBy = null;
    
    await user.save();

    res.status(200).json({
      success: true,
      message: 'User activated successfully',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        isActive: user.isActive
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

// ==========================================
// COMPLAINT MANAGEMENT
// ==========================================

// @route   GET /api/admin/complaints
// @desc    Get all complaints with filtering
// @access  Private/Admin
router.get('/complaints', protect, authorize('admin'), async (req, res) => {
  try {
    const { status, type, priority, search, page = 1, limit = 10 } = req.query;

    // Build query
    let query = {};
    if (status) query.status = status;
    if (type) query.type = type;
    if (priority) query.priority = priority;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } }
      ];
    }

    const complaints = await Complaint.find(query)
      .populate('createdBy', 'name email role')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Complaint.countDocuments(query);

    res.status(200).json({
      success: true,
      complaints,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit))
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

// @route   PUT /api/admin/complaints/:id
// @desc    Update complaint (assign, change status, priority)
// @access  Private/Admin
router.put('/complaints/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const { status, priority, assignedTo } = req.body;

    const complaint = await Complaint.findById(req.params.id)
      .populate('createdBy', 'name email');
    
    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }

    const oldAssignee = complaint.assignedTo;
    
    // Update fields
    if (status) {
      complaint.status = status;
      if (status === 'Resolved') {
        complaint.resolvedAt = new Date();
      }
    }
    if (priority) complaint.priority = priority;
    if (assignedTo) complaint.assignedTo = assignedTo;

    await complaint.save();

    // Send notification if worker was newly assigned or reassigned
    if (assignedTo && assignedTo.toString() !== oldAssignee?.toString()) {
      try {
        const notificationService = require('../services/notification.service');
        const User = require('../models/user.model');
        
        const worker = await User.findById(assignedTo);
        if (worker && worker.email) {
          const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                .badge { background: #10b981; color: white; padding: 8px 16px; border-radius: 20px; display: inline-block; font-weight: bold; margin: 10px 0; }
                .details-box { background: white; padding: 20px; margin: 20px 0; border-left: 4px solid #667eea; border-radius: 4px; }
                .button { background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 20px; }
                .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>🔔 New Assignment</h1>
                  <p>You have been assigned a new complaint</p>
                </div>
                <div class="content">
                  <p>Hello ${worker.name}! 👋</p>
                  
                  <p><span class="badge">NEW ASSIGNMENT</span></p>
                  
                  <div class="details-box">
                    <h2>Complaint Details:</h2>
                    <p><strong>Title:</strong> ${complaint.title}</p>
                    <p><strong>Description:</strong> ${complaint.description}</p>
                    <p><strong>Type:</strong> ${complaint.type}</p>
                    <p><strong>Priority:</strong> ${complaint.priority.toUpperCase()}</p>
                    <p><strong>Status:</strong> ${complaint.status}</p>
                    <p><strong>Reported By:</strong> ${complaint.createdBy?.name || 'Unknown'}</p>
                    <p><strong>Location:</strong> ${complaint.location?.address || 'Not specified'}</p>
                  </div>

                  <p>Please login to your dashboard to view the full details and start working on this complaint.</p>
                  
                  <center>
                    <a href="${process.env.FRONTEND_URL || 'http://localhost:4200'}/worker/assigned-complaints" class="button">
                      View in Dashboard
                    </a>
                  </center>
                </div>
                <div class="footer">
                  <p>This is an automated notification from CivicPulse</p>
                  <p>© ${new Date().getFullYear()} CivicPulse. All rights reserved.</p>
                </div>
              </div>
            </body>
            </html>
          `;
          
          await notificationService.sendEmail(
            worker.email,
            '🔔 New Complaint Assigned to You - CivicPulse',
            htmlContent
          );
          console.log('✅ Assignment notification sent to worker:', worker.email);
        }
      } catch (notifError) {
        console.error('⚠️ Failed to send assignment notification:', notifError.message);
        // Continue even if notification fails
      }
    }

    res.status(200).json({
      success: true,
      message: 'Complaint updated successfully',
      complaint: await Complaint.findById(complaint._id)
        .populate('createdBy', 'name email role')
        .populate('assignedTo', 'name email')
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server Error'
    });
  }
});

// @route   DELETE /api/admin/complaints/:id
// @desc    Delete complaint
// @access  Private/Admin
router.delete('/complaints/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    
    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }

    await complaint.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Complaint deleted successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server Error'
    });
  }
});

// ==========================================
// ANALYTICS
// ==========================================

// @route   GET /api/admin/analytics/trends
// @desc    Get complaint trends over time
// @access  Private/Admin
router.get('/analytics/trends', protect, authorize('admin'), async (req, res) => {
  try {
    // Get data for last 7 days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);
    startDate.setHours(0, 0, 0, 0);

    // Get complaints created
    const complaintsCreated = await Complaint.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.date': 1 } }
    ]);

    // Get complaints resolved
    const complaintsResolved = await Complaint.aggregate([
      {
        $match: {
          status: 'Resolved',
          resolvedAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$resolvedAt' } }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.date': 1 } }
    ]);

    // Get new users registered
    const newUsers = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.date': 1 } }
    ]);

    // Create a map for all dates in the range
    const dateMap = {};
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      dateMap[dateStr] = {
        date: dateStr,
        created: 0,
        resolved: 0,
        newUsers: 0
      };
    }

    // Populate the map with real data
    complaintsCreated.forEach(item => {
      if (dateMap[item._id.date]) {
        dateMap[item._id.date].created = item.count;
      }
    });

    complaintsResolved.forEach(item => {
      if (dateMap[item._id.date]) {
        dateMap[item._id.date].resolved = item.count;
      }
    });

    newUsers.forEach(item => {
      if (dateMap[item._id.date]) {
        dateMap[item._id.date].newUsers = item.count;
      }
    });

    // Convert to array and sort by date
    const trends = Object.values(dateMap).sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    res.status(200).json({
      success: true,
      trends,
      summary: {
        totalCreated: trends.reduce((sum, t) => sum + t.created, 0),
        totalResolved: trends.reduce((sum, t) => sum + t.resolved, 0),
        totalNewUsers: trends.reduce((sum, t) => sum + t.newUsers, 0)
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

// ==========================================
// MODERATION MANAGEMENT
// ==========================================

// @route   GET /api/admin/moderation
// @desc    Get all moderation reports (using complaints)
// @access  Private/Admin
router.get('/moderation', protect, authorize('admin'), async (req, res) => {
  try {
    const { status, priority, type, search, page = 1, limit = 10 } = req.query;

    let query = {};
    if (status) query.status = status; // Only filter by status if provided
    if (priority) query.priority = priority;
    if (type) query.type = type;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const reports = await Complaint.find(query)
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Complaint.countDocuments(query);

    res.status(200).json({
      success: true,
      reports,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit))
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

// @route   GET /api/admin/moderation/:id
// @desc    Get single moderation report details
// @access  Private/Admin
router.get('/moderation/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const report = await ModerationQueue.findById(req.params.id)
      .populate('reportedBy', 'name email role')
      .populate('reviewedBy', 'name email')
      .populate('reportedItemId');

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Moderation report not found'
      });
    }

    res.status(200).json({
      success: true,
      report
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server Error'
    });
  }
});

// @route   PUT /api/admin/moderation/:id/approve
// @desc    Approve a moderation report
// @access  Private/Admin
router.put('/moderation/:id/approve', protect, authorize('admin'), async (req, res) => {
  try {
    const { action, moderatorNotes } = req.body;

    const report = await ModerationQueue.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Moderation report not found'
      });
    }

    report.status = 'approved';
    report.action = action || 'none';
    report.moderatorNotes = moderatorNotes;
    report.reviewedBy = req.user.id;
    report.reviewedAt = new Date();

    // If action is delete, mark complaint as resolved
    if (action === 'delete') {
      await Complaint.findByIdAndUpdate(report.reportedItemId, { status: 'Resolved' });
    }

    await report.save();

    res.status(200).json({
      success: true,
      message: 'Report approved successfully',
      report
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server Error'
    });
  }
});

// @route   PUT /api/admin/moderation/:id/reject
// @desc    Reject a moderation report
// @access  Private/Admin
router.put('/moderation/:id/reject', protect, authorize('admin'), async (req, res) => {
  try {
    const { moderatorNotes } = req.body;

    const report = await ModerationQueue.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Moderation report not found'
      });
    }

    report.status = 'rejected';
    report.moderatorNotes = moderatorNotes;
    report.reviewedBy = req.user.id;
    report.reviewedAt = new Date();

    await report.save();

    res.status(200).json({
      success: true,
      message: 'Report rejected successfully',
      report
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server Error'
    });
  }
});

// @route   GET /api/admin/moderation/stats/summary
// @desc    Get moderation statistics (using complaints)
// @access  Private/Admin
router.get('/moderation/stats/summary', protect, authorize('admin'), async (req, res) => {
  try {
    const totalReports = await Complaint.countDocuments();
    const pendingReports = await Complaint.countDocuments({ status: 'pending' });
    const inProgressReports = await Complaint.countDocuments({ status: 'in-progress' });
    const resolvedReports = await Complaint.countDocuments({ status: 'resolved' });

    const reportsByPriority = await Complaint.aggregate([
      { $group: { _id: '$priority', count: { $sum: 1 } } }
    ]);

    const reportsByType = await Complaint.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]);

    res.status(200).json({
      success: true,
      stats: {
        totalReports,
        pending: pendingReports,
        inProgress: inProgressReports,
        resolved: resolvedReports,
        byPriority: reportsByPriority.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        byType: reportsByType.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {})
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

// ==========================================
// DATABASE MANAGEMENT
// ==========================================

// @route   POST /api/admin/db/drop-all
// @desc    Drop all data from database (DANGEROUS - requires confirmation)
// @access  Private/Admin
router.post('/db/drop-all', protect, authorize('admin'), async (req, res) => {
  try {
    const { confirmation } = req.body;

    // Require explicit confirmation
    if (confirmation !== 'DROP_ALL_DATA_CONFIRMED') {
      return res.status(400).json({
        success: false,
        message: 'Confirmation token required. Pass confirmation: "DROP_ALL_DATA_CONFIRMED"'
      });
    }

    // Log the action
    console.warn(`⚠️ ADMIN ACTION: User ${req.user.id} is dropping all database collections`);

    // Delete all collections
    const deletedUsers = await User.deleteMany({});
    const deletedComplaints = await Complaint.deleteMany({});
    const deletedModeration = await ModerationQueue.deleteMany({});
    const deletedRewards = await Reward.deleteMany({});

    const summary = {
      users: deletedUsers.deletedCount,
      complaints: deletedComplaints.deletedCount,
      moderationReports: deletedModeration.deletedCount,
      rewards: deletedRewards.deletedCount,
      total: deletedUsers.deletedCount + deletedComplaints.deletedCount + deletedModeration.deletedCount + deletedRewards.deletedCount
    };

    // Log the summary
    console.warn(`⚠️ DATABASE PURGE SUMMARY: ${JSON.stringify(summary)}`);

    res.status(200).json({
      success: true,
      message: '⚠️ ALL DATABASE DATA HAS BEEN DELETED',
      warning: 'THIS ACTION CANNOT BE UNDONE',
      summary
    });
  } catch (error) {
    console.error('Error dropping all data:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server Error'
    });
  }
});

// @route   POST /api/admin/db/drop-complaints
// @desc    Drop all complaints from database
// @access  Private/Admin
router.post('/db/drop-complaints', protect, authorize('admin'), async (req, res) => {
  try {
    const { confirmation } = req.body;

    if (confirmation !== 'DROP_COMPLAINTS_CONFIRMED') {
      return res.status(400).json({
        success: false,
        message: 'Confirmation required'
      });
    }

    console.warn(`⚠️ ADMIN ACTION: User ${req.user.id} is dropping all complaints`);

    const result = await Complaint.deleteMany({});

    console.warn(`⚠️ COMPLAINTS DELETED: ${result.deletedCount}`);

    res.status(200).json({
      success: true,
      message: 'All complaints have been deleted',
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server Error'
    });
  }
});

// @route   POST /api/admin/db/drop-users
// @desc    Drop all users from database (keeps admin accounts)
// @access  Private/Admin
router.post('/db/drop-users', protect, authorize('admin'), async (req, res) => {
  try {
    const { confirmation } = req.body;

    if (confirmation !== 'DROP_USERS_CONFIRMED') {
      return res.status(400).json({
        success: false,
        message: 'Confirmation required'
      });
    }

    console.warn(`⚠️ ADMIN ACTION: User ${req.user.id} is dropping non-admin users`);

    const result = await User.deleteMany({ role: { $ne: 'admin' } });

    console.warn(`⚠️ NON-ADMIN USERS DELETED: ${result.deletedCount}`);

    res.status(200).json({
      success: true,
      message: 'All non-admin users have been deleted',
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server Error'
    });
  }
});

// @route   POST /api/admin/db/drop-moderation
// @desc    Drop all moderation reports from database
// @access  Private/Admin
router.post('/db/drop-moderation', protect, authorize('admin'), async (req, res) => {
  try {
    const { confirmation } = req.body;

    if (confirmation !== 'DROP_MODERATION_CONFIRMED') {
      return res.status(400).json({
        success: false,
        message: 'Confirmation required'
      });
    }

    console.warn(`⚠️ ADMIN ACTION: User ${req.user.id} is dropping all moderation reports`);

    const result = await ModerationQueue.deleteMany({});

    console.warn(`⚠️ MODERATION REPORTS DELETED: ${result.deletedCount}`);

    res.status(200).json({
      success: true,
      message: 'All moderation reports have been deleted',
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server Error'
    });
  }
});

// @route   GET /api/admin/db/stats
// @desc    Get database statistics
// @access  Private/Admin
router.get('/db/stats', protect, authorize('admin'), async (req, res) => {
  try {
    const userCount = await User.countDocuments();
    const complaintCount = await Complaint.countDocuments();
    const moderationCount = await ModerationQueue.countDocuments();
    const rewardCount = await Reward.countDocuments();

    res.status(200).json({
      success: true,
      stats: {
        users: userCount,
        complaints: complaintCount,
        moderationReports: moderationCount,
        rewards: rewardCount,
        total: userCount + complaintCount + moderationCount + rewardCount,
        collections: [
          { name: 'Users', count: userCount },
          { name: 'Complaints', count: complaintCount },
          { name: 'Moderation Reports', count: moderationCount },
          { name: 'Rewards', count: rewardCount }
        ]
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

// @route   GET /api/admin/workers/performance
// @desc    Get worker performance analytics
// @access  Private/Admin
router.get('/workers/performance', protect, authorize('admin'), async (req, res) => {
  try {
    // Get all workers
    const workers = await User.find({ role: 'worker' }).select('name email _id');

    const performanceData = await Promise.all(workers.map(async (worker) => {
      // Get all complaints assigned to this worker
      const totalAssigned = await Complaint.countDocuments({ assignedTo: worker._id });
      const pending = await Complaint.countDocuments({ assignedTo: worker._id, status: 'pending' });
      const inProgress = await Complaint.countDocuments({ assignedTo: worker._id, status: 'in-progress' });
      const resolved = await Complaint.countDocuments({ assignedTo: worker._id, status: 'resolved' });

      // Calculate completion rate
      const completionRate = totalAssigned > 0 ? Math.round((resolved / totalAssigned) * 100) : 0;

      // Calculate average completion time (in days)
      const resolvedComplaints = await Complaint.find({
        assignedTo: worker._id,
        status: 'resolved',
        resolvedAt: { $exists: true }
      }).select('createdAt resolvedAt');

      let avgCompletionTime = 0;
      if (resolvedComplaints.length > 0) {
        const totalTime = resolvedComplaints.reduce((sum, complaint) => {
          const created = new Date(complaint.createdAt);
          const resolved = new Date(complaint.resolvedAt);
          return sum + (resolved - created);
        }, 0);
        avgCompletionTime = Math.round((totalTime / resolvedComplaints.length) / (1000 * 60 * 60 * 24)); // Convert to days
      }

      // Get recent activity (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recentResolved = await Complaint.countDocuments({
        assignedTo: worker._id,
        status: 'resolved',
        resolvedAt: { $gte: thirtyDaysAgo }
      });

      // Calculate workload status
      let workloadStatus = 'light';
      if (pending + inProgress > 5) workloadStatus = 'heavy';
      else if (pending + inProgress > 2) workloadStatus = 'moderate';

      return {
        worker: {
          _id: worker._id,
          name: worker.name,
          email: worker.email
        },
        stats: {
          totalAssigned,
          pending,
          inProgress,
          resolved,
          completionRate,
          avgCompletionTime,
          recentResolved,
          workloadStatus,
          activeTasks: pending + inProgress
        }
      };
    }));

    // Calculate overall statistics
    const totalWorkers = performanceData.length;
    const totalComplaints = performanceData.reduce((sum, worker) => sum + worker.stats.totalAssigned, 0);
    const totalResolved = performanceData.reduce((sum, worker) => sum + worker.stats.resolved, 0);
    const avgCompletionRate = totalWorkers > 0 ? Math.round(performanceData.reduce((sum, worker) => sum + worker.stats.completionRate, 0) / totalWorkers) : 0;

    // Get workload distribution
    const workloadDistribution = {
      light: performanceData.filter(w => w.stats.workloadStatus === 'light').length,
      moderate: performanceData.filter(w => w.stats.workloadStatus === 'moderate').length,
      heavy: performanceData.filter(w => w.stats.workloadStatus === 'heavy').length
    };

    res.status(200).json({
      success: true,
      data: {
        workers: performanceData,
        summary: {
          totalWorkers,
          totalComplaints,
          totalResolved,
          avgCompletionRate,
          workloadDistribution
        }
      }
    });
  } catch (error) {
    console.error('Worker performance error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server Error'
    });
  }
});

// @route   GET /api/admin/analytics/detailed
// @desc    Get detailed analytics and trends
// @access  Private/Admin
router.get('/analytics/detailed', protect, authorize('admin'), async (req, res) => {
  try {
    // Get date ranges for trends
    const now = new Date();
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Complaints trends
    const complaintsTrend = await Complaint.aggregate([
      {
        $match: {
          createdAt: { $gte: last30Days }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
          count: { $sum: 1 },
          resolved: {
            $sum: { $cond: [{ $eq: ["$status", "resolved"] }, 1, 0] }
          }
        }
      },
      { $sort: { "_id": 1 } }
    ]);

    // Resolution time analysis
    const resolutionTimes = await Complaint.aggregate([
      {
        $match: {
          status: "resolved",
          resolvedAt: { $exists: true },
          createdAt: { $gte: last30Days }
        }
      },
      {
        $project: {
          resolutionTime: {
            $divide: [
              { $subtract: ["$resolvedAt", "$createdAt"] },
              1000 * 60 * 60 * 24 // Convert to days
            ]
          },
          priority: 1,
          type: 1
        }
      }
    ]);

    // Calculate average resolution times by priority
    const avgResolutionByPriority = await Complaint.aggregate([
      {
        $match: {
          status: "resolved",
          resolvedAt: { $exists: true }
        }
      },
      {
        $group: {
          _id: "$priority",
          avgTime: {
            $avg: {
              $divide: [
                { $subtract: ["$resolvedAt", "$createdAt"] },
                1000 * 60 * 60 * 24
              ]
            }
          },
          count: { $sum: 1 }
        }
      }
    ]);

    // Worker performance over time
    const workerPerformance = await Complaint.aggregate([
      {
        $match: {
          assignedTo: { $exists: true },
          createdAt: { $gte: last30Days }
        }
      },
      {
        $group: {
          _id: {
            worker: "$assignedTo",
            week: { $week: "$createdAt" }
          },
          assigned: { $sum: 1 },
          resolved: {
            $sum: { $cond: [{ $eq: ["$status", "resolved"] }, 1, 0] }
          }
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "_id.worker",
          foreignField: "_id",
          as: "workerInfo"
        }
      },
      {
        $unwind: "$workerInfo"
      },
      {
        $project: {
          workerName: "$workerInfo.name",
          week: "$_id.week",
          assigned: 1,
          resolved: 1,
          efficiency: {
            $cond: {
              if: { $gt: ["$assigned", 0] },
              then: { $multiply: [{ $divide: ["$resolved", "$assigned"] }, 100] },
              else: 0
            }
          }
        }
      },
      { $sort: { week: -1, efficiency: -1 } }
    ]);

    // Peak hours analysis
    const peakHours = await Complaint.aggregate([
      {
        $match: {
          createdAt: { $gte: last7Days }
        }
      },
      {
        $group: {
          _id: { $hour: "$createdAt" },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id": 1 } }
    ]);

    // Geographic distribution
    const locationStats = await Complaint.aggregate([
      {
        $match: {
          "location.city": { $exists: true }
        }
      },
      {
        $group: {
          _id: "$location.city",
          count: { $sum: 1 },
          resolved: {
            $sum: { $cond: [{ $eq: ["$status", "resolved"] }, 1, 0] }
          }
        }
      },
      {
        $project: {
          city: "$_id",
          total: "$count",
          resolved: 1,
          resolutionRate: {
            $multiply: [
              { $divide: ["$resolved", "$count"] },
              100
            ]
          }
        }
      },
      { $sort: { total: -1 } },
      { $limit: 10 }
    ]);

    // Calculate summary statistics
    const totalResolutionTime = resolutionTimes.reduce((sum, item) => sum + item.resolutionTime, 0);
    const avgResolutionTime = resolutionTimes.length > 0 ? (totalResolutionTime / resolutionTimes.length).toFixed(2) : 0;

    const fastResolutions = resolutionTimes.filter(r => r.resolutionTime <= 1).length;
    const slowResolutions = resolutionTimes.filter(r => r.resolutionTime > 7).length;

    res.status(200).json({
      success: true,
      analytics: {
        trends: {
          complaints: complaintsTrend,
          period: "last 30 days"
        },
        performance: {
          avgResolutionTime: parseFloat(avgResolutionTime),
          fastResolutions: fastResolutions,
          slowResolutions: slowResolutions,
          byPriority: avgResolutionByPriority
        },
        workers: workerPerformance,
        peakHours: peakHours,
        locations: locationStats,
        summary: {
          totalComplaintsAnalyzed: complaintsTrend.reduce((sum, day) => sum + day.count, 0),
          totalResolutionsAnalyzed: resolutionTimes.length,
          avgDailyComplaints: (complaintsTrend.reduce((sum, day) => sum + day.count, 0) / 30).toFixed(1),
          efficiencyRate: resolutionTimes.length > 0 ? 
            ((fastResolutions / resolutionTimes.length) * 100).toFixed(1) : 0
        }
      }
    });
  } catch (error) {
    console.error('Detailed analytics error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server Error'
    });
  }
});

// @route   GET /api/admin/complaints/:id/recommendations
// @desc    Get smart assignment recommendations for a complaint
// @access  Private/Admin
router.get('/complaints/:id/recommendations', protect, authorize('admin'), async (req, res) => {
  try {
    const { getAssignmentRecommendations } = require('../services/assignment.service');
    
    const recommendations = await getAssignmentRecommendations(req.params.id, 5);
    
    res.status(200).json({
      success: true,
      recommendations
    });
  } catch (error) {
    console.error('Get recommendations error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server Error'
    });
  }
});

// @route   POST /api/admin/complaints/bulk-assign
// @desc    Bulk assign complaints to workers
// @access  Private/Admin
router.post('/complaints/bulk-assign', protect, authorize('admin'), async (req, res) => {
  try {
    const { complaintIds, workerId, distributionMethod } = req.body;
    
    if (!complaintIds || !Array.isArray(complaintIds) || complaintIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of complaint IDs'
      });
    }

    let results = [];
    
    if (distributionMethod === 'even' && !workerId) {
      // Distribute evenly among all workers
      const workers = await User.find({ role: 'worker' });
      
      if (workers.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No workers available for assignment'
        });
      }
      
      // Get current workload for each worker
      const workloads = await Promise.all(workers.map(async (worker) => {
        const count = await Complaint.countDocuments({
          assignedTo: worker._id,
          status: { $in: ['pending', 'in-progress'] }
        });
        return { workerId: worker._id, count };
      }));
      
      // Sort workers by current workload (ascending)
      workloads.sort((a, b) => a.count - b.count);
      
      // Assign complaints to workers in round-robin fashion, starting with least loaded
      for (let i = 0; i < complaintIds.length; i++) {
        const workerIndex = i % workers.length;
        const selectedWorker = workloads[workerIndex].workerId;
        
        try {
          const complaint = await Complaint.findById(complaintIds[i]);
          if (complaint) {
            complaint.assignedTo = selectedWorker;
            complaint._assignedBy = req.user.id;
            if (complaint.status === 'pending') {
              complaint.status = 'in-progress';
              complaint._statusChangedBy = req.user.id;
            }
            await complaint.save();
            
            results.push({
              complaintId: complaintIds[i],
              success: true,
              assignedTo: selectedWorker
            });
          }
        } catch (err) {
          results.push({
            complaintId: complaintIds[i],
            success: false,
            error: err.message
          });
        }
      }
    } else if (workerId) {
      // Assign all to specific worker
      const worker = await User.findById(workerId);
      
      if (!worker || worker.role !== 'worker') {
        return res.status(400).json({
          success: false,
          message: 'Invalid worker ID'
        });
      }
      
      for (const complaintId of complaintIds) {
        try {
          const complaint = await Complaint.findById(complaintId);
          if (complaint) {
            complaint.assignedTo = workerId;
            complaint._assignedBy = req.user.id;
            if (complaint.status === 'pending') {
              complaint.status = 'in-progress';
              complaint._statusChangedBy = req.user.id;
            }
            await complaint.save();
            
            results.push({
              complaintId,
              success: true,
              assignedTo: workerId
            });
          }
        } catch (err) {
          results.push({
            complaintId,
            success: false,
            error: err.message
          });
        }
      }
    } else {
      return res.status(400).json({
        success: false,
        message: 'Please specify either a workerId or use distributionMethod="even"'
      });
    }
    
    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;
    
    res.status(200).json({
      success: true,
      message: `Bulk assignment completed: ${successCount} successful, ${failCount} failed`,
      results,
      summary: {
        total: complaintIds.length,
        successful: successCount,
        failed: failCount
      }
    });
  } catch (error) {
    console.error('Bulk assignment error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server Error'
    });
  }
});

module.exports = router;
