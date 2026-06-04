const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  otp: {
    type: String,
    required: true,
  },
  // Pending registration data (stored until OTP verified)
  pendingData: {
    username: String,
    passwordHash: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 600, // TTL: 10 minutes
  },
});

module.exports = mongoose.model('OTP', otpSchema);
