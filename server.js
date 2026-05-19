require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const userRoutes = require('./routes/userRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const authRoutes = require('./routes/authRoutes');


const app = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── Routes ────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);

app.get('/', (req, res) => {
  res.json({ success: true, message: 'Server running successfully' });
});





// ═══════════════════════════════════════════════════════════════
// GLOBAL ERROR HANDLER
// ═══════════════════════════════════════════════════════════════

app.use((err, req, res, next) => {
  console.error('Global Error:', err);
  const message = err.message
    || (err.error && err.error.message)
    || 'An unexpected error occurred.';
  res.status(500).json({ message, error: err });
});


// ═══════════════════════════════════════════════════════════════
// DATABASE + SERVER START
// ═══════════════════════════════════════════════════════════════

let isConnected;

const connectDB = async () => {
  if (isConnected) return;
  mongoose.connection.on('connected', () => console.log('✅ DB Connected'));
  const db = await mongoose.connect(process.env.MONGO_URI, { dbName: 'truellion' });
  isConnected = db.connections[0].readyState;
  console.log('✅ MongoDB Connected Successfully');
};

connectDB();

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;