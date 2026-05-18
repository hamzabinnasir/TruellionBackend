const User = require('../models/User');
const sendEmail = require('../utils/emailUtils');

exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().sort({ _id: -1 });
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createUser = async (req, res) => {
  try {
    const { name, email, accountStatus, startDate, endDate } = req.body;
    
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(400).json({ message: "Email exists" });

    const newUser = new User({ name, email, accountStatus, startDate, endDate });
    await newUser.save();
    
    // Send invitation email
    const addonLink = process.env.ADDON_INSTALL_LINK || 'https://workspace.google.com/marketplace/app/autosend/DEPLOYMENT_ID';
    
    const message = `Hello ${name},\n\nYou have been invited to use the AutoSend Gmail Tool.\n\nPlease install the add-on using this link: ${addonLink}\n\nMake sure to log in with your authorized email: ${email}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
        <h2 style="color: #3b82f6; text-align: center;">Welcome to AutoSend Gmail Tool</h2>
        <p>Hello <strong>${name}</strong>,</p>
        <p>You have been successfully added to the whitelist for the AutoSend Gmail Tool.</p>
        <p>This tool allows you to send automated batch emails directly from your Gmail compose window with configurable anti-spam delays.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${addonLink}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Install Gmail Add-on</a>
        </div>
        <h3>Installation Instructions:</h3>
        <ol>
          <li>Click the install button above.</li>
          <li>Click <strong>Install</strong> on the Google Workspace Marketplace page.</li>
          <li>Select your authorized email account: <strong>${email}</strong>.</li>
          <li>Grant the necessary permissions when prompted.</li>
          <li>Open your Gmail and look for the AutoSend icon in the right sidebar or next to your Compose button!</li>
        </ol>
        <p style="color: #6b7280; font-size: 0.9em; margin-top: 30px;">If you have any issues, please contact your administrator.</p>
      </div>
    `;

    try {
      await sendEmail({
        email: newUser.email,
        subject: 'Invitation: Install AutoSend Gmail Add-on',
        message,
        html
      });
    } catch (emailError) {
      console.error('Failed to send invitation email:', emailError);
    }

    res.status(201).json(newUser);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, accountStatus, startDate, endDate } = req.body;

    const existing = await User.findOne({ email: email.toLowerCase(), _id: { $ne: id } });
    if (existing) return res.status(400).json({ message: "Email duplicate" });

    const updated = await User.findByIdAndUpdate(id, { name, email, accountStatus, startDate, endDate }, { new: true });
    if (!updated) return res.status(404).json({ message: "User not found" });

    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await User.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: "User not found" });
    
    res.status(200).json({ message: "User deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.toggleBan = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.isBanned = !user.isBanned;
    await user.save();

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.togglePlan = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.isBanned) return res.status(400).json({ message: "Cannot change plan for banned user" });

    const newStatus = user.accountStatus === "subscribed" ? "demo" : "subscribed";
    user.accountStatus = newStatus;
    
    const today = new Date().toISOString().split('T')[0];
    user.startDate = today;
    if (newStatus === "demo") {
      let d = new Date(); d.setDate(d.getDate() + 7);
      user.endDate = d.toISOString().split('T')[0];
    } else {
      let ny = new Date(); ny.setFullYear(ny.getFullYear() + 1);
      user.endDate = ny.toISOString().split('T')[0];
    }

    await user.save();

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.verifyWhitelist = async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      return res.status(404).json({ whitelisted: false, message: "User not found" });
    }

    if (user.isBanned) {
      return res.status(403).json({ whitelisted: false, message: "User is banned" });
    }

    // Check if end date has passed
    const today = new Date().toISOString().split('T')[0];
    if (user.endDate < today) {
      return res.status(403).json({ whitelisted: false, message: "Subscription expired" });
    }

    res.status(200).json({ whitelisted: true, user: { name: user.name, email: user.email, status: user.accountStatus } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
