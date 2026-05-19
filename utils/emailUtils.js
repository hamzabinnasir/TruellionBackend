const nodemailer = require('nodemailer');
require('dotenv').config();

const sendEmail = async (options) => {
  let transporter;

  // Use Ethereal test account if credentials are placeholders or missing
  if (!process.env.SMTP_USER || process.env.SMTP_USER === 'your_smtp_user') {
    console.log('Generating Ethereal Test Account...');
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  } else {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  const message = {
    from: `${process.env.FROM_NAME || 'Truellion Technologies'} <${process.env.FROM_EMAIL || 'noreply@truellion.com'}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html,
  };

  const info = await transporter.sendMail(message);
  console.log('Message sent: %s', info.messageId);

  const previewUrl = nodemailer.getTestMessageUrl(info);
  if (previewUrl) {
    console.log('Preview URL: %s', previewUrl);
  }

  return previewUrl;
};

module.exports = sendEmail;
