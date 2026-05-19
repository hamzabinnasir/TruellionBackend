require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Admin = require('./models/Admin');

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, { dbName: 'TruellionDB' });
    console.log('Connected to DB TruellionDB');

    const email = 'zaavyan@example.com';
    const password = 'zaavyan1234';

    let admin = await Admin.findOne({ email });
    
    if (admin) {
      console.log('Admin already exists. Updating password...');
    } else {
      console.log('Admin not found. Creating...');
      admin = new Admin({
        firstName: 'Zaavyan',
        lastName: 'Admin',
        email: email,
        phone: '+923001234567',
        bio: 'Super Admin Account'
      });
    }

    const salt = await bcrypt.genSalt(10);
    admin.password = await bcrypt.hash(password, salt);
    
    await admin.save();
    console.log('Admin successfully saved in TruellionDB.admins collection!');
    console.log('You can now log in with email:', email, 'and password:', password);

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

seedAdmin();
