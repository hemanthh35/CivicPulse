const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['citizen', 'student', 'worker', 'admin'],
    default: 'citizen'
  },
  mobile: {
    type: String,
    trim: true
  },
  location: {
    lat: { type: Number },
    lng: { type: Number }
  },
  travelFlag: {
    type: Boolean,
    default: false
  },
  points: {
    type: Number,
    default: 0
  },
  badges: [String],
  // Worker specialization
  specializations: [{
    type: String,
    enum: [
      'Roads & Infrastructure', 'Water & Sanitation', 'Electricity', 'Public Safety',
      'Garbage & Waste', 'Parks & Environment', 'Noise & Disturbance', 'Public Transport', 'Other',
      'garbage', 'road', 'water', 'lights', 'other', 'electricity', 'safety', 'parks', 'noise', 'transport'
    ]
  }],
  workArea: {
    lat: { type: Number },
    lng: { type: Number },
    radius: { type: Number, default: 10 } // in kilometers
  },
  // 2FA OTP fields
  otp: {
    type: String
  },
  otpExpiry: {
    type: Date
  },
  otpVerified: {
    type: Boolean,
    default: false
  },
  // 2FA preference (user can enable/disable)
  twoFactorEnabled: {
    type: Boolean,
    default: false  // Optional by default
  },
  // User suspension/activation
  isActive: {
    type: Boolean,
    default: true
  },
  suspendedAt: {
    type: Date
  },
  suspensionReason: {
    type: String
  },
  suspendedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  lastLogin: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate OTP
userSchema.methods.generateOTP = function () {
  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  this.otp = otp;
  // OTP expires in 10 minutes
  this.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
  this.otpVerified = false;
  return otp;
};

// Verify OTP
userSchema.methods.verifyOTP = function (enteredOTP) {
  if (!this.otp || !this.otpExpiry) {
    return false;
  }

  // Check if OTP expired
  if (new Date() > this.otpExpiry) {
    return false;
  }

  // Check if OTP matches
  return this.otp === enteredOTP;
};

module.exports = mongoose.model('User', userSchema);
