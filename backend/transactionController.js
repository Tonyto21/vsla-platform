const { db } = require('../models/database');
const exchangeRateService = require('../services/exchangeRateService');

const createDeposit = async (req, res) => {
  const { amount, currency, description } = req.body;
  const userId = req.user.id;
  const groupId = req.params.groupId;
  
  try {
    // Validate amount
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Amount must be positive' });
    }
    
    if (!currency || !['USD', 'LRD'].includes(currency)) {
      return res.status(400).json({ error: 'Invalid currency' });
    }
    
    // Get exchange rate
    const rate = await exchangeRateService.getCurrentRate();
    const usdEquivalent = currency === 'USD' ? amount : amount / rate;
    
    // Generate reference
    const reference = `DEP-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    
    // Begin transaction
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');
      
      // Update wallet
      const updateField = currency === 'USD' ? 'usd_balance' : 'lrd_balance';
      db.run(
        `UPDATE wallets SET ${updateField} = ${updateField} + ?,
         last_updated = CURRENT_TIMESTAMP
         WHERE user_id = ? AND group_id = ?`,
        [amount, userId, groupId],
        function(err) {
          if (err) {
            db.run('ROLLBACK');
            return res.status(400).json({ error: err.message });
          }
          
          // If wallet didn't exist, create it
          if (this.changes === 0) {
            db.run(
              'INSERT INTO wallets (user_id, group_id, usd_balance, lrd_balance) VALUES (?, ?, ?, ?)',
              [userId, groupId, currency === 'USD' ? amount : 0, currency === 'LRD' ? amount : 0],
              function(err) {
                if (err) {
                  db.run('ROLLBACK');
                  return res.status(400).json({ error: err.message });
                }
              }
            );
          }
        }
      );
      
      // Record transaction
      db.run(
        `INSERT INTO transactions (user_id, group_id, type, amount, currency, exchange_rate, usd_equivalent, description, reference)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [userId, groupId, 'deposit', amount, currency, rate, usdEquivalent, description, reference],
        function(err) {
          if (err) {
            db.run('ROLLBACK');
            return res.status(400).json({ error: err.message });
          }
          
          db.run('COMMIT');
          
          res.json({
            message: 'Deposit successful',
            transactionId: this.lastID,
            reference,
            usd_equivalent: usdEquivalent
          });
        }
      );
    });
  } catch (error) {
    console.error('Deposit error:', error);
    res.status(500).json({ error: error.message });
  }
};

const getTransactions = (req, res) => {
  const { groupId } = req.params;
  const { startDate, endDate, type, currency, limit = 50 } = req.query;
  
  let query = `
    SELECT t.*, u.full_name as user_name
    FROM transactions t
    JOIN users u ON t.user_id = u.id
    WHERE t.group_id = ?
  `;
  const params = [groupId];
  
  if (startDate) {
    query += ' AND t.created_at >= ?';
    params.push(startDate);
  }
  if (endDate) {
    query += ' AND t.created_at <= ?';
    params.push(endDate);
  }
  if (type) {
    query += ' AND t.type = ?';
    params.push(type);
  }
  if (currency) {
    query += ' AND t.currency = ?';
    params.push(currency);
  }
  
  query += ' ORDER BY t.created_at DESC LIMIT ?';
  params.push(limit);
  
  db.all(query, params, (err, transactions) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(transactions);
  });
};

const getWalletBalance = async (req, res) => {
  const { groupId } = req.params;
  const userId = req.user.id;
  
  db.get(
    'SELECT usd_balance, lrd_balance FROM wallets WHERE user_id = ? AND group_id = ?',
    [userId, groupId],
    async (err, wallet) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      if (!wallet) {
        return res.json({ usd_balance: 0, lrd_balance: 0, total_usd: 0 });
      }
      
      const rate = await exchangeRateService.getCurrentRate();
      const totalUsd = wallet.usd_balance + (wallet.lrd_balance / rate);
      
      res.json({
        ...wallet,
        total_usd: totalUsd,
        exchange_rate: rate
      });
    }
  );
};

module.exports = { createDeposit, getTransactions, getWalletBalance };