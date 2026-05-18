const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: {
    type: String,
    required: true,
  },
  action: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Number,
    default: () => Date.now(),
  }
});

module.exports = mongoose.model('Notification', notificationSchema);
