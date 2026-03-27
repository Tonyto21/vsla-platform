const { User, Transaction, Loan } = require('../models');

exports.getDashboard = async (req, res) => {
  try {
    // Total users
    const total_users = await User.count();

    // Recent transactions (limit 10)
    const recent_transactions = await Transaction.findAll({
      order: [['createdAt', 'DESC']],
      limit: 10,
      include: [{ model: User, attributes: ['full_name'] }]
    });

    // Loans summary
    const active_loans = await Loan.count({ where: { status: 'active' } });
    const repaid_loans = await Loan.count({ where: { status: 'repaid' } });
    const defaulted_loans = await Loan.count({ where: { status: 'defaulted' } });

    // Total savings (sum deposits)
    const total_savings = await Transaction.sum('amount', { where: { type: 'deposit' } });

    res.json({
      total_users,
      total_groups: 5, // placeholder if you don't have a group table yet
      total_savings: { total_usd: total_savings || 0 },
      repayment_rate: 94, // placeholder
      recent_transactions: recent_transactions.map(tx => ({
        id: tx.id,
        type: tx.type,
        amount: tx.amount,
        currency: tx.currency,
        created_at: tx.createdAt,
        user_name: tx.User?.full_name || 'Unknown'
      })),
      active_loans,
      repaid_loans,
      defaulted_loans,
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
};