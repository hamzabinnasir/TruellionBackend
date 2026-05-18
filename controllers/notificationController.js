const Notification = require('../models/Notification');

exports.addNotification = async (req, res) => {
  try {
    const { user, action } = req.body;
    const newNotification = new Notification({ user, action });
    await newNotification.save();

    // keep only last 20
    const count = await Notification.countDocuments();
    if (count > 20) {
      const oldest = await Notification.find().sort({ timestamp: 1 }).limit(count - 20);
      const oldestIds = oldest.map(n => n._id);
      await Notification.deleteMany({ _id: { $in: oldestIds } });
    }

    res.status(201).json(newNotification);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find().sort({ timestamp: -1 }).limit(20);
    res.status(200).json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
