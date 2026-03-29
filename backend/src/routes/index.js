
const express = require('express');
const router = express.Router();
const { authenticateToken, authorize, checkGroupAccess } = require('../middleware/auth');

// Auth routes
const authController = require('../controllers/authController');
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.get('/auth/me', authenticateToken, authController.getCurrentUser);

// Group routes
const groupController = require('../controllers/groupController');
router.post('/groups', authenticateToken, authorize('group_leader', 'cbl_admin'), groupController.createGroup);
router.get('/groups', authenticateToken, groupController.getGroups);
router.get('/groups/:id', authenticateToken, groupController.getGroupById);
router.post('/groups/:groupId/members', authenticateToken, authorize('group_leader', 'cbl_admin'), groupController.addMember);

// Remove user from group
router.put('/users/:userId/remove-group', authenticateToken, authorize('group_leader', 'cbl_admin'), (req, res) => {
  const db = require('../models/database').db;
  db.run('UPDATE users SET group_id = NULL WHERE id = ?', [req.params.userId], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'User removed from group' });
  });
});

// Transaction routes
const transactionController = require('../controllers/transactionController');
router.post('/groups/:groupId/deposits', authenticateToken, checkGroupAccess, transactionController.createDeposit);
router.get('/groups/:groupId/transactions', authenticateToken, checkGroupAccess, transactionController.getTransactions);
router.get('/groups/:groupId/wallet', authenticateToken, checkGroupAccess, transactionController.getWalletBalance);

// Loan routes
const loanController = require('../controllers/loanController');
router.post('/groups/:groupId/loans', authenticateToken, checkGroupAccess, loanController.requestLoan);
router.put('/loans/:loanId/approve', authenticateToken, authorize('group_leader', 'cbl_admin'), loanController.approveLoan);
router.put('/loans/:loanId/disburse', authenticateToken, authorize('group_leader', 'cbl_admin'), loanController.disburseLoan);
router.post('/loans/:loanId/repay', authenticateToken, loanController.repayLoan);
router.get('/groups/:groupId/loans', authenticateToken, checkGroupAccess, loanController.getLoans);
router.get('/loans/:loanId', authenticateToken, loanController.getLoanById);

// Report routes
const reportController = require('../controllers/reportController');
router.get('/reports/dashboard', authenticateToken, authorize('cbl_admin'), reportController.getKPIDashboard);
router.get('/reports/groups/:groupId', authenticateToken, reportController.getGroupReport);
router.get('/reports/groups/:groupId/export', authenticateToken, reportController.exportTransactions);

// Notification routes
const notificationController = require('../controllers/notificationController');
router.get('/notifications', authenticateToken, notificationController.getNotifications);
router.put('/notifications/:notificationId/read', authenticateToken, notificationController.markAsRead);
router.put('/notifications/read-all', authenticateToken, notificationController.markAllAsRead);

// Simulated mobile money
router.post('/simulate/deposit', authenticateToken, (req, res) => {
  res.json({ message: 'Mobile money deposit simulated', reference: `MM-${Date.now()}` });
});
router.post('/simulate/withdraw', authenticateToken, (req, res) => {
  res.json({ message: 'Mobile money withdrawal simulated', reference: `MM-${Date.now()}` });
});

router.get('/test', (req, res) => {
  res.json({ message: 'API is working!' });
});

module.exports = router;
