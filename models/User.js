const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  accountStatus: {
    type: String,
    enum: ['subscribed', 'demo'],
    default: 'subscribed',
  },
  isBanned: {
    type: Boolean,
    default: false,
  },
  startDate: {
    type: String, // ISO date string YYYY-MM-DD
    required: true,
  },
  endDate: {
    type: String, // ISO date string YYYY-MM-DD
    required: true,
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
