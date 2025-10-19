const express = require('express');
const router = express.Router();
const User = require('../models/user.model');
const Complaint = require('../models/complaint.model');

// @route   GET /api/leaderboard
// @desc    Get top citizens and workers
// @access  Public
router.get('/', async (req, res) => {
  try {
    console.log('📊 Fetching leaderboard data...');

    // Get top citizens (by number of complaints reported)
    const topCitizens = await Complaint.aggregate([
      {
        $match: { 
          createdBy: { $exists: true, $ne: null }
        }
      },
      {
        $group: {
          _id: '$createdBy',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 10
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userInfo'
        }
      },
      {
        $unwind: {
          path: '$userInfo',
          preserveNullAndEmptyArrays: false
        }
      },
      {
        $project: {
          _id: '$userInfo._id',
          name: '$userInfo.name',
          email: '$userInfo.email',
          role: '$userInfo.role',
          count: 1
        }
      }
    ]);

    console.log(`👥 Found ${topCitizens.length} top citizens`);

    // Get top workers (by number of resolved complaints)
    const topWorkers = await Complaint.aggregate([
      {
        $match: { 
          assignedTo: { $exists: true, $ne: null },
          status: 'resolved'
        }
      },
      {
        $group: {
          _id: '$assignedTo',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 10
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userInfo'
        }
      },
      {
        $unwind: {
          path: '$userInfo',
          preserveNullAndEmptyArrays: false
        }
      },
      {
        $project: {
          _id: '$userInfo._id',
          name: '$userInfo.name',
          email: '$userInfo.email',
          role: '$userInfo.role',
          count: 1
        }
      }
    ]);

    console.log(`⚒️ Found ${topWorkers.length} top workers`);

    res.json({
      success: true,
      topCitizens: topCitizens || [],
      topWorkers: topWorkers || []
    });

  } catch (error) {
    console.error('❌ Leaderboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch leaderboard data',
      error: error.message
    });
  }
});

module.exports = router;
