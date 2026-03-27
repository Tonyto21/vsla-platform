const { db } = require('../models/database');

const createNotification = (userId, type, title, message, link) => {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO notifications (user_id, type, title, message, link, is_read)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, type, title, message, link, 0],
      function(err) {
        if (err) {
          console.error('Error creating notification:', err);
          reject(err);
        } else {
          resolve(this.lastID);
        }
      }
    );
  });
};

const getNotifications = (userId, unreadOnly = false) => {
  return new Promise((resolve, reject) => {
    let query = 'SELECT * FROM notifications WHERE user_id = ?';
    const params = [userId];
    
    if (unreadOnly) {
      query += ' AND is_read = 0';
    }
    
    query += ' ORDER BY created_at DESC';
    
    db.all(query, params, (err, notifications) => {
      if (err) reject(err);
      else resolve(notifications);
    });
  });
};

const markAsRead = (notificationId, userId) => {
  return new Promise((resolve, reject) => {
    db.run(
      'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?',
      [notificationId, userId],
      function(err) {
        if (err) reject(err);
        else resolve(this.changes);
      }
    );
  });
};

module.exports = { createNotification, getNotifications, markAsRead };