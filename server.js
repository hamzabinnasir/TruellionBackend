require('dotenv').config();

const express  = require('express');
const mongoose = require('mongoose');
const cors     = require('cors');

const userRoutes         = require('./routes/userRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const authRoutes         = require('./routes/authRoutes');
const EmailOpen          = require('./models/EmailOpen');   // ← new

const app  = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── Routes ────────────────────────────────────────────────────
app.use('/api/auth',          authRoutes);
app.use('/api/users',         userRoutes);
app.use('/api/notifications', notificationRoutes);

app.get('/', (req, res) => {
  res.json({ success: true, message: 'Server running successfully' });
});


// ═══════════════════════════════════════════════════════════════
// EMAIL OPEN TRACKING
// ═══════════════════════════════════════════════════════════════

// 1×1 transparent GIF — defined once, reused on every request.
const TRANSPARENT_GIF = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64'
);

/**
 * GET /api/track/open
 *
 * Called when a recipient opens an email (Gmail's image proxy fires the pixel).
 *
 * Key decisions:
 *  1. Respond with the GIF immediately — before any async DB work.
 *     Email clients have short image-load timeouts; a slow DB call
 *     could cause the pixel to be marked as broken on first load.
 *  2. Write to MongoDB after the response is sent. The unique index
 *     on `token` prevents double-counting if the proxy re-fires.
 *  3. ngrok-skip-browser-warning is sent as a query param from the
 *     pixel URL itself, so no custom header handling is needed here.
 */
app.get('/api/track/open', (req, res) => {
  // ── Always serve the pixel first ─────────────────────────
  res.writeHead(200, {
    'Content-Type':   'image/gif',
    'Content-Length': TRANSPARENT_GIF.length,
    'Cache-Control':  'no-store, no-cache, must-revalidate, private',
    'Pragma':         'no-cache',
    'Expires':        '0'
  });
  res.end(TRANSPARENT_GIF);

  // ── Record the open asynchronously after responding ───────
  const { token, queueKey } = req.query;
  if (!token || !queueKey) return;

  EmailOpen.create({ token, queueKey })
    .then(async () => {
      const total = await EmailOpen.countDocuments({ queueKey });
      console.log(`👁️  Open recorded | token: ${token} | queue: ${queueKey} | total opens: ${total}`);
    })
    .catch(err => {
      if (err.code === 11000) {
        // Duplicate key — this token was already counted (proxy re-fired or
        // user opened again). Silently ignore; this is expected behaviour.
        return;
      }
      console.error('Track open DB error:', err.message);
    });
});


/**
 * GET /api/track/stats?queueKey=q_user_email&ngrok-skip-browser-warning=true
 *
 * Poll this from the Composer or any dashboard to see live open counts.
 * The ngrok bypass param is ignored by Express but keeps the URL working
 * when accessed directly through an ngrok tunnel.
 */
app.get('/api/track/stats', async (req, res) => {
  const { queueKey } = req.query;
  if (!queueKey) {
    return res.status(400).json({ error: 'queueKey query parameter is required' });
  }

  try {
    const opens = await EmailOpen.find({ queueKey })
      .select('openedAt -_id')
      .sort({ openedAt: 1 });

    res.json({
      queueKey,
      openCount: opens.length,
      opens
    });
  } catch (err) {
    console.error('Track stats error:', err.message);
    res.status(500).json({ error: err.message });
  }
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

const connectDB = async () => {
  try {
    mongoose.connection.on('connected', () => console.log('DB Connected'));
    await mongoose.connect('mongodb://localhost:27017/sampleDB');
    console.log('MongoDB Connected Successfully');
  } catch (error) {
    console.log('MongoDB Connection Error:', error.message);
    process.exit(1);
  }
};

connectDB();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});