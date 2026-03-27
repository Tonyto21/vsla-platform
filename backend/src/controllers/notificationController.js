const { getNotifications, markAsRead } = require('../services/notificationService');

const getNotificationsController = async (req, res) => {
  try {
    const userId = req.user.id;
    const { unread_only } = req.query;
    
    const notifications = await getNotifications(userId, unread_only === 'true');
    const unreadCount = (await getNotifications(userId, true)).length;
    
    res.json({
      notifications,
      unread_count: unreadCount
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: error.message });
  }
};

const markAsReadController = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.id;
    
    const changes = await markAsRead(notificationId, userId);
    
    if (changes === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    
    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: error.message });
  }
};

const markAllAsReadController = async (req, res) => {
  try {
    const userId = req.user.id;
    
    await new Promise((resolve, reject) => {
      const db = require('../models/database').db;
      db.run(
        'UPDATE notifications SET is_read = 1 WHERE user_id = ?',
        [userId],
        function(err) {
          if (err) reject(err);
          else resolve();
        }
      );
    });
    
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getNotifications: getNotificationsController,
  markAsRead: markAsReadController,
  markAllAsRead: markAllAsReadController
};