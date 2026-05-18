const mongoose = require('mongoose');
const User = require('./models/User');
const Notification = require('./models/Notification');
require('dotenv').config();

const users = [
  { name: "Aarav Sharma", email: "aarav@example.com", accountStatus: "subscribed", isBanned: false, startDate: "2026-01-01", endDate: "2027-01-01" },
  { name: "Zara Khan", email: "zara@example.com", accountStatus: "demo", isBanned: false, startDate: new Date().toISOString().split('T')[0], endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] },
  { name: "Rohan Mehta", email: "rohan@example.com", accountStatus: "subscribed", isBanned: false, startDate: "2025-12-01", endDate: "2026-06-01" },
  { name: "Ishita Verma", email: "ishita@example.com", accountStatus: "demo", isBanned: false, startDate: new Date().toISOString().split('T')[0], endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] },
  { name: "Dev Patel", email: "dev@example.com", accountStatus: "subscribed", isBanned: false, startDate: "2026-02-10", endDate: "2027-02-10" },
  { name: "Neha Singh", email: "neha@example.com", accountStatus: "demo", isBanned: false, startDate: new Date().toISOString().split('T')[0], endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] },
  { name: "Arjun Reddy", email: "arjun@example.com", accountStatus: "subscribed", isBanned: true, startDate: "2026-03-01", endDate: "2027-03-01" },
  { name: "Priya Kapoor", email: "priya@example.com", accountStatus: "demo", isBanned: false, startDate: new Date().toISOString().split('T')[0], endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] },
];

const notifications = [
  { user: "System", action: "Truellion ready - Banned users tracked", timestamp: Date.now() }
];

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/truellion')
.then(async () => {
  console.log('Connected to MongoDB');
  await User.deleteMany();
  await Notification.deleteMany();
  await User.insertMany(users);
  await Notification.insertMany(notifications);
  console.log('Database seeded!');
  mongoose.connection.close();
})
.catch(err => {
  console.error(err);
  mongoose.connection.close();
});
