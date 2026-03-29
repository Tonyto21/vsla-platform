const { db } = require('../models/database');
const exchangeRateService = require('../services/exchangeRateService');

const getKPIDashboard = async (req, res) => {
  try {
    const rate = await exchangeRateService.getCurrentRate();

    const totalGroups = await new Promise((resolve) => {
      db.get('SELECT COUNT(*) as count FROM groups WHERE is_active = 1', (err, row) => resolve(row?.count || 0));
    });

    const totalUsers = await new Promise((resolve) => {
      db.get('SELECT COUNT(*) as count FROM users WHERE is_active = 1', (err, row) => resolve(row?.count || 0));
    });

    const savings = await new Promise((resolve) => {
      db.get(`SELECT SUM(usd_balance) as total_usd, SUM(lrd_balance) as total_lrd FROM wallets`, (err, row) => {
        resolve({
          usd: row?.total_usd || 0,
          lrd: row?.total_lrd || 0,
          total_usd: (row?.total_usd || 0) + ((row?.total_lrd || 0) / rate)
        });
      });
    });

    const loans = await new Promise((resolve) => {
      db.get(`SELECT COUNT(*) as total_loans,
              SUM(CASE WHEN status IN ('disbursed','active') THEN 1 ELSE 0 END) as active_loans,
              SUM(CASE WHEN status = 'defaulted' THEN 1 ELSE 0 END) as defaulted_loans,
              SUM(CASE WHEN status = 'repaid' THEN 1 ELSE 0 END) as repaid_loans,
              SUM(remaining_balance) as outstanding_balance
              FROM loans`, (err, row) => resolve(row || {}));
    });

    const recentTransactions = await new Promise((resolve) => {
      db.all(`SELECT t.*, u.full_name as user_name, g.name as group_name
              FROM transactions t
              JOIN users u ON t.user_id = u.id
              JOIN groups g ON t.group_id = g.id
              ORDER BY t.created_at DESC LIMIT 20`, (err, rows) => resolve(rows || []));
    });

    const demographics = await new Promise((resolve) => {
      db.all(`SELECT gender, COUNT(*) as count FROM users WHERE gender IS NOT NULL GROUP BY gender`, (err, rows) => resolve(rows || []));
    });

    res.json({
      total_groups: totalGroups,
      total_users: totalUsers,
      total_savings: savings,
      total_loans: loans.total_loans || 0,
      active_loans: loans.active_loans || 0,
      defaulted_loans: loans.defaulted_loans || 0,
      repaid_loans: loans.repaid_loans || 0,
      outstanding_balance: loans.outstanding_balance || 0,
      repayment_rate: loans.total_loans ? (loans.repaid_loans / loans.total_loans) * 100 : 0,
      recent_transactions: recentTransactions,
      demographics,
      exchange_rate: rate
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: error.message });
  }
};

const getGroupReport = (req, res) => {
  const { groupId } = req.params;

  db.get(`SELECT g.*, COUNT(DISTINCT u.id) as member_count
          FROM groups g
          LEFT JOIN users u ON u.group_id = g.id
          WHERE g.id = ?`, [groupId], (err, report) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(report);
  });
};

const exportTransactions = (req, res) => {
  const { groupId } = req.params;
  const { format = 'json' } = req.query;

  db.all(`SELECT t.*, u.full_name as user_name, g.name as group_name
          FROM transactions t
          JOIN users u ON t.user_id = u.id
          JOIN groups g ON t.group_id = g.id
          WHERE ? = 'all' OR t.group_id = ?
          ORDER BY t.created_at DESC`, [groupId, groupId], (err, transactions) => {
    if (err) return res.status(500).json({ error: err.message });

    if (format === 'csv') {
      const headers = ['ID', 'Date', 'User', 'Group', 'Type', 'Amount', 'Currency', 'USD Equivalent', 'Description'];
      const csvRows = [headers];
      transactions.forEach(t => {
        csvRows.push([t.id, t.created_at, t.user_name, t.group_name, t.type, t.amount, t.currency, t.usd_equivalent, t.description || '']);
      });
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=transactions.csv');
      res.send(csvRows.map(row => row.join(',')).join('\n'));
    } else {
      res.json(transactions);
    }
  });
};

module.exports = { getKPIDashboard, getGroupReport, exportTransactions };