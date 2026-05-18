require('dotenv').config({ path: './.env' });
const sendEmail = require('./utils/emailUtils');

(async () => {
  try {
    console.log("Testing email with user:", process.env.SMTP_USER);
    await sendEmail({
      email: process.env.SMTP_USER, // sending to yourself
      subject: 'Test Email from Dashboard',
      message: 'This is a test to verify your Gmail SMTP configuration.',
      html: '<h1>Success!</h1><p>Your Gmail configuration is working perfectly.</p>'
    });
    console.log("Email test successful.");
  } catch (err) {
    console.error("Email test failed:", err);
  }
})();
