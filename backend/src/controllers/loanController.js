const { db } = require('../models/database');
const exchangeRateService = require('../services/exchangeRateService');
const { createNotification } = require('../services/notificationService');

const requestLoan = async (req, res) => {
  const { amount, currency, interest_rate, duration_months } = req.body;
  const userId = req.user.id;
  const groupId = req.params.groupId;
  
  try {
    // Validate inputs
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Amount must be positive' });
    }
    if (!currency || !['USD', 'LRD'].includes(currency)) {
      return res.status(400).json({ error: 'Invalid currency' });
    }
    if (!interest_rate || interest_rate <= 0) {
      return res.status(400).json({ error: 'Interest rate must be positive' });
    }
    if (!duration_months || duration_months <= 0) {
      return res.status(400).json({ error: 'Duration must be positive' });
    }
    
    // Check for existing active loan
    const activeLoan = await new Promise((resolve, reject) => {
      db.get(
        `SELECT * FROM loans 
         WHERE user_id = ? AND group_id = ? AND status IN ('approved', 'disbursed', 'active')
         LIMIT 1`,
        [userId, groupId],
        (err, loan) => {
          if (err) reject(err);
          resolve(loan);
        }
      );
    });
    
    if (activeLoan) {
      return res.status(400).json({ error: 'You already have an active loan' });
    }
    
    // Check wallet balance for savings requirement (optional 20% rule)
    const wallet = await new Promise((resolve, reject) => {
      db.get(
        'SELECT usd_balance, lrd_balance FROM wallets WHERE user_id = ? AND group_id = ?',
        [userId, groupId],
        (err, wallet) => {
          if (err) reject(err);
          resolve(wallet);
        }
      );
    });
    
    const rate = await exchangeRateService.getCurrentRate();
    const loanUsd = currency === 'USD' ? amount : amount / rate;
    const totalSavingsUsd = wallet ? (wallet.usd_balance + (wallet.lrd_balance / rate)) : 0;
    
    // Ensure loan doesn't exceed savings (80% rule - optional)
    if (loanUsd > totalSavingsUsd * 0.8 && totalSavingsUsd > 0) {
      return res.status(400).json({ 
        error: `Loan amount cannot exceed 80% of savings. Your savings: $${totalSavingsUsd.toFixed(2)} USD` 
      });
    }
    
    // Create loan request
    const loanId = await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO loans (user_id, group_id, amount, currency, interest_rate, duration_months, status, remaining_balance)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [userId, groupId, amount, currency, interest_rate, duration_months, 'requested', amount],
        function(err) {
          if (err) reject(err);
          resolve(this.lastID);
        }
      );
    });
    
    // Notify group leader
    const group = await new Promise((resolve, reject) => {
      db.get('SELECT leader_id FROM groups WHERE id = ?', [groupId], (err, group) => {
        if (err) reject(err);
        resolve(group);
      });
    });
    
    if (group && group.leader_id !== userId) {
      await createNotification(
        group.leader_id,
        'loan_request',
        'New Loan Request',
        `Member ${req.user.full_name} requested a loan of ${amount} ${currency}`,
        `/groups/${groupId}/loans/${loanId}`
      );
    }
    
    // Notify the borrower
    await createNotification(
      userId,
      'loan_request',
      'Loan Request Submitted',
      `Your loan request for ${amount} ${currency} has been submitted for approval`,
      `/loans/${loanId}`
    );
    
    res.json({
      message: 'Loan request submitted successfully',
      loanId: loanId,
      status: 'requested'
    });
  } catch (error) {
    console.error('Loan request error:', error);
    res.status(500).json({ error: error.message });
  }
};

const approveLoan = (req, res) => {
  const { loanId } = req.params;
  const { action } = req.body;
  const approverId = req.user.id;
  
  if (!action || !['approve', 'reject'].includes(action)) {
    return res.status(400).json({ error: 'Action must be approve or reject' });
  }
  
  db.get('SELECT * FROM loans WHERE id = ?', [loanId], async (err, loan) => {
    if (err || !loan) {
      return res.status(404).json({ error: 'Loan not found' });
    }
    
    if (loan.status !== 'requested') {
      return res.status(400).json({ error: `Loan cannot be processed in current status: ${loan.status}` });
    }
    
    const newStatus = action === 'approve' ? 'approved' : 'rejected';
    const message = action === 'approve' 
      ? 'Your loan has been approved and is ready for disbursement'
      : 'Your loan request has been rejected';
    
    db.run(
      `UPDATE loans 
       SET status = ?, approved_by = ?, approved_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [newStatus, approverId, loanId],
      async function(err) {
        if (err) {
          return res.status(400).json({ error: err.message });
        }
        
        // Notify borrower
        await createNotification(
          loan.user_id,
          'loan_status',
          `Loan ${action === 'approve' ? 'Approved' : 'Rejected'}`,
          message,
          `/loans/${loanId}`
        );
        
        res.json({ 
          message: `Loan ${action}d successfully`,
          loanId: loanId,
          status: newStatus
        });
      }
    );
  });
};

const disburseLoan = async (req, res) => {
  const { loanId } = req.params;
  
  db.get('SELECT * FROM loans WHERE id = ?', [loanId], async (err, loan) => {
    if (err || !loan) {
      return res.status(404).json({ error: 'Loan not found' });
    }
    
    if (loan.status !== 'approved') {
      return res.status(400).json({ error: `Loan must be approved before disbursement. Current status: ${loan.status}` });
    }
    
    const rate = await exchangeRateService.getCurrentRate();
    const usdEquivalent = loan.currency === 'USD' ? loan.amount : loan.amount / rate;
    
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');
      
      db.run(
        `UPDATE loans 
         SET status = 'disbursed', disbursed_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [loanId],
        function(err) {
          if (err) {
            db.run('ROLLBACK');
            return res.status(400).json({ error: err.message });
          }
        }
      );
      
      db.run(
        `INSERT INTO transactions (user_id, group_id, type, amount, currency, exchange_rate, usd_equivalent, description, reference)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [loan.user_id, loan.group_id, 'loan_disbursement', loan.amount, loan.currency, rate, usdEquivalent, 'Loan disbursement', `LOAN-${loanId}-DISB`],
        function(err) {
          if (err) {
            db.run('ROLLBACK');
            return res.status(400).json({ error: err.message });
          }
        }
      );
      
      db.run('COMMIT');
      
      createNotification(
        loan.user_id,
        'loan_disbursement',
        'Loan Disbursed',
        `Your loan of ${loan.amount} ${loan.currency} has been disbursed`,
        `/loans/${loanId}`
      );
      
      res.json({ 
        message: 'Loan disbursed successfully',
        loanId: loanId,
        status: 'disbursed'
      });
    });
  });
};

const repayLoan = async (req, res) => {
  const { loanId } = req.params;
  const { amount, currency } = req.body;
  const userId = req.user.id;
  
  if (!amount || amount <= 0) {
    return res.status(400).json({ error: 'Amount must be positive' });
  }
  
  db.get('SELECT * FROM loans WHERE id = ?', [loanId], async (err, loan) => {
    if (err || !loan) {
      return res.status(404).json({ error: 'Loan not found' });
    }
    
    if (loan.user_id !== userId && req.user.role !== 'group_leader' && req.user.role !== 'cbl_admin') {
      return res.status(403).json({ error: 'Not authorized to repay this loan' });
    }
    
    if (loan.status !== 'disbursed' && loan.status !== 'active') {
      return res.status(400).json({ error: `Loan not in repayable state. Current status: ${loan.status}` });
    }
    
    const rate = await exchangeRateService.getCurrentRate();
    let repaymentAmount = amount;
    if (currency !== loan.currency) {
      repaymentAmount = currency === 'USD' ? amount * rate : amount / rate;
    }
    
    if (repaymentAmount > loan.remaining_balance) {
      return res.status(400).json({ 
        error: `Repayment amount exceeds remaining balance. Remaining: ${loan.remaining_balance} ${loan.currency}` 
      });
    }
    
    const newBalance = loan.remaining_balance - repaymentAmount;
    const newStatus = newBalance <= 0 ? 'repaid' : 'active';
    
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');
      
      db.run(
        `UPDATE loans 
         SET remaining_balance = ?, status = ?
         WHERE id = ?`,
        [newBalance, newStatus, loanId]
      );
      
      db.run(
        `INSERT INTO loan_repayments (loan_id, amount, currency, exchange_rate)
         VALUES (?, ?, ?, ?)`,
        [loanId, amount, currency, rate]
      );
      
      const repaymentUsd = currency === 'USD' ? amount : amount / rate;
      db.run(
        `INSERT INTO transactions (user_id, group_id, type, amount, currency, exchange_rate, usd_equivalent, description, reference)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [userId, loan.group_id, 'loan_repayment', amount, currency, rate, repaymentUsd, `Loan repayment for loan #${loanId}`, `REPAY-${loanId}-${Date.now()}`]
      );
      
      db.run('COMMIT');
      
      if (userId !== loan.user_id) {
        createNotification(
          loan.user_id,
          'loan_repayment',
          newStatus === 'repaid' ? 'Loan Fully Repaid' : 'Loan Repayment Received',
          `Repayment of ${amount} ${currency} received. Remaining: ${newBalance.toFixed(2)} ${loan.currency}`,
          `/loans/${loanId}`
        );
      }
      
      res.json({ 
        message: 'Repayment recorded successfully',
        remaining_balance: newBalance,
        status: newStatus
      });
    });
  });
};

const getLoans = (req, res) => {
  const { groupId } = req.params;
  const { status } = req.query;
  
  let query = `
    SELECT l.*, u.full_name as borrower_name
    FROM loans l
    JOIN users u ON l.user_id = u.id
    WHERE l.group_id = ?
  `;
  const params = [groupId];
  
  if (status) {
    query += ' AND l.status = ?';
    params.push(status);
  }
  
  query += ' ORDER BY l.created_at DESC';
  
  db.all(query, params, (err, loans) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(loans);
  });
};

const getLoanById = (req, res) => {
  const { loanId } = req.params;
  
  db.get(
    `SELECT l.*, u.full_name as borrower_name, u.username as borrower_username
     FROM loans l
     JOIN users u ON l.user_id = u.id
     WHERE l.id = ?`,
    [loanId],
    (err, loan) => {
      if (err || !loan) {
        return res.status(404).json({ error: 'Loan not found' });
      }
      
      db.all(
        `SELECT * FROM loan_repayments WHERE loan_id = ? ORDER BY payment_date DESC`,
        [loanId],
        (err, repayments) => {
          loan.repayments = repayments || [];
          res.json(loan);
        }
      );
    }
  );
};

module.exports = { requestLoan, approveLoan, disburseLoan, repayLoan, getLoans, getLoanById };