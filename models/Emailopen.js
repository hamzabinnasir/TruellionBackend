const mongoose = require('mongoose');

// Each document represents a single unique email open event.
// The unique index on `token` acts as a server-side dedup guard —
// if Gmail's proxy fires the pixel multiple times, only the first
// insert succeeds. Subsequent attempts throw error code 11000
// (duplicate key), which the route handler silently ignores.

const emailOpenSchema = new mongoose.Schema({
  token:    { type: String, required: true, unique: true },   // pixelToken — one per email sent
  queueKey: { type: String, required: true, index: true },    // e.g. q_user_gmail_com
  openedAt: { type: Date,   default: Date.now }
});

module.exports = mongoose.model('EmailOpen', emailOpenSchema);