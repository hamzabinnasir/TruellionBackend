const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const protect = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// Seed initial admin if none exists
router.post('/seed', async (req, res) => {
  try {
    const adminExists = await Admin.findOne({ email: 'admin@truellion.com' });
    if (adminExists) return res.status(400).json({ message: 'Admin already seeded' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);

    const admin = await Admin.create({
      firstName: 'admin',
      lastName: 'admin',
      email: 'admin@truellion.com',
      password: hashedPassword,
      phone: '+1 234 567 8900',
      bio: 'System Administrator'
    });

    res.status(201).json({ message: 'Admin seeded successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const admin = await Admin.findOne({ email });
    if (admin) {
      let isMatch = false;

      // Check if password is plain text (bcrypt hashes typically start with $2)
      if (!admin.password.startsWith('$2')) {
        // Plain text comparison
        if (password === admin.password) {
          isMatch = true;
          // Automatically hash and save the plain text password
          const salt = await bcrypt.genSalt(10);
          admin.password = await bcrypt.hash(password, salt);
          await admin.save();
        }
      } else {
        isMatch = await bcrypt.compare(password, admin.password);
      }

      if (isMatch) {
        res.json({
          _id: admin.id,
          firstName: admin.firstName,
          lastName: admin.lastName,
          email: admin.email,
          avatarUrl: admin.avatarUrl,
          coverUrl: admin.coverUrl,
          token: generateToken(admin._id),
        });
      } else {
        res.status(401).json({ message: 'Invalid credentials' });
      }
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get Profile
router.get('/profile', protect, async (req, res) => {
  try {
    const admin = await Admin.findById(req.adminId).select('-password');
    if (admin) {
      res.json(admin);
    } else {
      res.status(404).json({ message: 'Admin not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update Profile
router.put('/profile', protect, upload.fields([{ name: 'avatar', maxCount: 1 }, { name: 'cover', maxCount: 1 }]), async (req, res) => {
  try {
    const admin = await Admin.findById(req.adminId);
    if (!admin) return res.status(404).json({ message: 'Admin not found' });

    admin.firstName = req.body.firstName || admin.firstName;
    admin.lastName = req.body.lastName || admin.lastName;
    admin.email = req.body.email || admin.email;
    admin.phone = req.body.phone || admin.phone;
    admin.bio = req.body.bio || admin.bio;

    if (req.files) {
      if (req.files.avatar && req.files.avatar[0]) {
        admin.avatarUrl = req.files.avatar[0].path;
      }
      if (req.files.cover && req.files.cover[0]) {
        admin.coverUrl = req.files.cover[0].path;
      }
    }

    const updatedAdmin = await admin.save();
    res.json({
      _id: updatedAdmin.id,
      firstName: updatedAdmin.firstName,
      lastName: updatedAdmin.lastName,
      email: updatedAdmin.email,
      phone: updatedAdmin.phone,
      bio: updatedAdmin.bio,
      avatarUrl: updatedAdmin.avatarUrl,
      coverUrl: updatedAdmin.coverUrl,
      token: generateToken(updatedAdmin._id),
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Change Password
router.put('/change-password', protect, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  try {
    const admin = await Admin.findById(req.adminId);
    if (!admin) return res.status(404).json({ message: 'Admin not found' });

    const isMatch = await bcrypt.compare(currentPassword, admin.password);
    if (!isMatch) return res.status(400).json({ message: 'Incorrect current password' });

    const salt = await bcrypt.genSalt(10);
    admin.password = await bcrypt.hash(newPassword, salt);
    await admin.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

const crypto = require('crypto');
const sendEmail = require('../utils/emailUtils');

// Forgot Password
router.post('/forgot-password', async (req, res) => {
  try {
    const admin = await Admin.findOne({ email: req.body.email });
    if (!admin) {
      return res.status(404).json({ message: 'There is no user with that email' });
    }

    const resetToken = crypto.randomBytes(20).toString('hex');

    admin.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    admin.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
    await admin.save();

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/?resetToken=${resetToken}`;

    const message = `You are receiving this email because you (or someone else) requested a password reset. \n\nPlease click on the following link, or paste it into your browser to complete the process:\n\n${resetUrl}\n\nIf you did not request this, please ignore this email.`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
        <h2 style="color: #f97316; text-align: center;">Password Reset Request</h2>
        <p>Hello,</p>
        <p>You are receiving this email because a password reset request was submitted for your account.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #f97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Reset Password</a>
        </div>
        <p>Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #3b82f6;"><a href="${resetUrl}">${resetUrl}</a></p>
        <p style="color: #6b7280; font-size: 0.9em; margin-top: 30px;">If you did not request this, please safely ignore this email. Your password will remain unchanged.</p>
      </div>
    `;

    try {
      const previewUrl = await sendEmail({
        email: admin.email,
        subject: 'Password Reset Request',
        message,
        html
      });
      res.json({ message: 'Email sent', previewUrl });
    } catch (err) {
      admin.resetPasswordToken = undefined;
      admin.resetPasswordExpire = undefined;
      await admin.save();
      res.status(500).json({ message: 'Email could not be sent' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Reset Password
router.put('/reset-password/:token', async (req, res) => {
  try {
    const resetPasswordToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const admin = await Admin.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!admin) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    const salt = await bcrypt.genSalt(10);
    admin.password = await bcrypt.hash(req.body.password, salt);

    admin.resetPasswordToken = undefined;
    admin.resetPasswordExpire = undefined;
    await admin.save();

    res.json({ message: 'Password reset successful' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
