const express = require('express');
const router = express.Router();
const { authenticateToken, authorize, checkGroupAccess } = require('../middleware/auth');

// Controllers
const authController = require('../controllers/authController');
const groupController = require('../controllers/groupController');
const transactionController = require('../controllers/transactionController');
const loanController = require('../controllers/loanController');
const notificationController = require('../controllers/notificationController');
const reportController = require('../controllers/reportController');

// Auth
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.get('/auth/me', authenticateToken, authController.getCurrentUser);

// Groups
router.post('/groups', authenticateToken, authorize('group_leader', 'cbl_admin'), groupController.createGroup);
router.get('/groups', authenticateToken, groupController.getGroups);
router.get('/groups/:id', authenticateToken, groupController.getGroupById);
router.post('/groups/:groupId/members', authenticateToken, authorize('group_leader', 'cbl_admin'), groupController.addMember);

// Transactions
router.post('/groups/:groupId/deposits', authenticateToken, checkGroupAccess, transactionController.createDeposit);
router.get('/groups/:groupId/transactions', authenticateToken, checkGroupAccess, transactionController.getTransactions);
router.get('/groups/:groupId/wallet', authenticateToken, checkGroupAccess, transactionController.getWalletBalance);

// Loans
router.post('/groups/:groupId/loans', authenticateToken, checkGroupAccess, loanController.requestLoan);
router.put('/loans/:loanId/approve', authenticateToken, authorize('group_leader', 'cbl_admin'), loanController.approveLoan);
router.put('/loans/:loanId/disburse', authenticateToken, authorize('group_leader', 'cbl_admin'), loanController.disburseLoan);
router.post('/loans/:loanId/repay', authenticateToken, loanController.repayLoan);
router.get('/groups/:groupId/loans', authenticateToken, checkGroupAccess, loanController.getLoans);
router.get('/loans/:loanId', authenticateToken, loanController.getLoanById);

// Notifications
router.get('/notifications', authenticateToken, notificationController.getNotifications);
router.put('/notifications/:notificationId/read', authenticateToken, notificationController.markAsRead);
router.put('/notifications/read-all', authenticateToken, notificationController.markAllAsRead);

// Reports (CBL Dashboard)
router.get('/reports/dashboard', authenticateToken, authorize('cbl_admin'), reportController.getDashboard);

// Test & debug
router.get('/test', (req, res) => res.json({ message: 'API working' }));
router.get('/debug/routes', (req, res) => {
  const routes = [];
  router.stack.forEach(layer => {
    if (layer.route) {
      routes.push({ path: layer.route.path, methods: Object.keys(layer.route.methods) });
    }
  });
  res.json(routes);
});

module.exports = router;