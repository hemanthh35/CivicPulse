const express = require('express');
const router = express.Router();
const multer = require('multer');
const geminiService = require('../services/gemini.service');
const { protect } = require('../middlewares/auth.middleware');

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'), false);
    }
    cb(null, true);
  }
});

// @route   POST /api/gemini/analyze-image
// @desc    Analyze image with Gemini AI to generate complaint details
// @access  Private
router.post('/analyze-image', protect, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    if (!geminiService.isAvailable()) {
      return res.status(503).json({
        success: false,
        message: 'Gemini AI service is not configured. Please set GEMINI_API_KEY.'
      });
    }

    console.log(`📸 Analyzing image: ${req.file.originalname} (${req.file.size} bytes)`);

    const result = await geminiService.analyzeImage(req.file.buffer, req.file.mimetype);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: result.error || 'Failed to analyze image'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Image analyzed successfully',
      data: result.data
    });

  } catch (error) {
    console.error('Error in image analysis route:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error while analyzing image'
    });
  }
});

module.exports = router;
