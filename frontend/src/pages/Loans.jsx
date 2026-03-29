
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';
import { Plus, CheckCircle, XCircle, Clock, Eye, RefreshCw, ArrowRight, DollarSign } from 'lucide-react';

const Loans = () => {
  const { user, isCBLAdmin, isGroupLeader, isMember } = useAuth();
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [newLoan, setNewLoan] = useState({ amount: '', currency: 'USD', interest_rate: 10, duration_months: 6 });

  useEffect(() => {
    fetchLoans();
  }, []);

  const fetchLoans = async () => {
    try {
      const groupsRes = await axios.get('http://localhost:5000/api/groups');
      if (groupsRes.data.length > 0) {
        const group = groupsRes.data[0];
        const res = await axios.get(`http://localhost:5000/api/groups/${group.id}/loans`);
        
        let filtered = res.data;
        if (isMember) {
          filtered = res.data.filter(l => l.user_id === user?.id);
        }
        
        setLoans(filtered);
      }
    } catch (err) {
      console.error('Failed to fetch loans:', err);
    } finally {
      setLoading(false);
    }
  };

  const requestLoan = async (e) => {
    e.preventDefault();
    try {
      const groupsRes = await axios.get('http://localhost:5000/api/groups');
      if (groupsRes.data.length > 0) {
        const group = groupsRes.data[0];
        await axios.post(`http://localhost:5000/api/groups/${group.id}/loans`, newLoan);
        setShowRequestForm(false);
        setNewLoan({ amount: '', currency: 'USD', interest_rate: 10, duration_months: 6 });
        fetchLoans();
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to request loan');
    }
  };

  const approveLoan = async (loanId, action) => {
    try {
      await axios.put(`http://localhost:5000/api/loans/${loanId}/approve`, { action });
      fetchLoans();
    } catch (err) {
      console.error('Failed to approve loan:', err);
    }
  };

  const disburseLoan = async (loanId) => {
    try {
      await axios.put(`http://localhost:5000/api/loans/${loanId}/disburse`);
      fetchLoans();
    } catch (err) {
      console.error('Failed to disburse loan:', err);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      requested: { color: 'bg-yellow-500/20 text-yellow-400', icon: Clock, label: 'Pending Approval' },
      approved: { color: 'bg-blue-500/20 text-blue-400', icon: Eye, label: 'Approved' },
      disbursed: { color: 'bg-purple-500/20 text-purple-400', icon: ArrowRight, label: 'Disbursed' },
      active: { color: 'bg-orange-500/20 text-orange-400', icon: Clock, label: 'Active' },
      repaid: { color: 'bg-green-500/20 text-green-400', icon: CheckCircle, label: 'Repaid' },
      defaulted: { color: 'bg-red-500/20 text-red-400', icon: XCircle, label: 'Defaulted' },
    };
    const badge = badges[status] || badges.requested;
    const Icon = badge.icon;
    return <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${badge.color}`}><Icon size={10} /> {badge.label}</span>;
  };

  const pendingLoans = loans.filter(l => l.status === 'requested');
  const activeLoans = loans.filter(l => l.status === 'active' || l.status === 'disbursed');

  if (loading) {
    return <div className="flex items-center justify-center h-96"><div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div></div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">
            {isCBLAdmin ? 'Loan Management' : isGroupLeader ? 'Loan Requests' : 'My Loans'}
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            {isCBLAdmin ? 'Oversee all loan activities nationwide' : isGroupLeader ? `Pending approvals: ${pendingLoans.length}` : `Active loans: ${activeLoans.length}`}
          </p>
        </div>
        {isMember && !activeLoans.some(l => l.status === 'active' || l.status === 'disbursed') && (
          <button onClick={() => setShowRequestForm(true)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl transition">
            <Plus size={18} /> Request Loan
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-800/50 rounded-xl p-4 text-center"><p className="text-2xl font-bold text-white">{loans.length}</p><p className="text-xs text-gray-400">Total Loans</p></div>
        <div className="bg-gray-800/50 rounded-xl p-4 text-center"><p className="text-2xl font-bold text-orange-400">{pendingLoans.length}</p><p className="text-xs text-gray-400">Pending Approval</p></div>
        <div className="bg-gray-800/50 rounded-xl p-4 text-center"><p className="text-2xl font-bold text-green-400">{activeLoans.length}</p><p className="text-xs text-gray-400">Active Loans</p></div>
      </div>

      {showRequestForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-md border border-gray-700">
            <h2 className="text-xl font-bold text-white mb-4">Request a Loan</h2>
            <form onSubmit={requestLoan}>
              <div className="mb-4"><label className="block text-sm text-gray-400 mb-1">Amount</label><input type="number" step="0.01" value={newLoan.amount} onChange={(e) => setNewLoan({...newLoan, amount: parseFloat(e.target.value)})} className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white" required /></div>
              <div className="mb-4"><label className="block text-sm text-gray-400 mb-1">Currency</label><select value={newLoan.currency} onChange={(e) => setNewLoan({...newLoan, currency: e.target.value})} className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"><option value="USD">USD</option><option value="LRD">LRD</option></select></div>
              <div className="mb-4"><label className="block text-sm text-gray-400 mb-1">Interest Rate (%)</label><input type="number" step="0.5" value={newLoan.interest_rate} onChange={(e) => setNewLoan({...newLoan, interest_rate: parseFloat(e.target.value)})} className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white" required /></div>
              <div className="mb-6"><label className="block text-sm text-gray-400 mb-1">Duration (months)</label><input type="number" value={newLoan.duration_months} onChange={(e) => setNewLoan({...newLoan, duration_months: parseInt(e.target.value)})} className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white" required /></div>
              <div className="flex gap-3"><button type="button" onClick={() => setShowRequestForm(false)} className="flex-1 py-2 rounded-lg border border-gray-600 text-gray-300">Cancel</button><button type="submit" className="flex-1 py-2 rounded-lg bg-indigo-600 text-white">Submit Request</button></div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-700/50">
              <tr><th className="px-6 py-3 text-left text-xs text-gray-400">Date</th>{(isCBLAdmin || isGroupLeader) && <th className="px-6 py-3 text-left text-xs text-gray-400">Borrower</th>}<th className="px-6 py-3 text-left text-xs text-gray-400">Amount</th><th className="px-6 py-3 text-left text-xs text-gray-400">Currency</th><th className="px-6 py-3 text-left text-xs text-gray-400">Interest</th><th className="px-6 py-3 text-left text-xs text-gray-400">Remaining</th><th className="px-6 py-3 text-left text-xs text-gray-400">Status</th>{(isGroupLeader || isCBLAdmin) && <th className="px-6 py-3 text-left text-xs text-gray-400">Actions</th>}</tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {loans.length === 0 ? (
                <tr><td colSpan={isGroupLeader ? 8 : 7} className="px-6 py-12 text-center text-gray-500">No loans found. {isMember && 'Click "Request Loan" to apply.'}</td></tr>
              ) : (
                loans.map((loan) => (
                  <tr key={loan.id} className="hover:bg-gray-700/30">
                    <td className="px-6 py-3 text-gray-300 text-sm">{format(new Date(loan.created_at), 'MMM dd, yyyy')}</td>
                    {(isCBLAdmin || isGroupLeader) && <td className="px-6 py-3 text-white text-sm">{loan.borrower_name}</td>}
                    <td className="px-6 py-3 text-white text-sm font-semibold">{loan.amount}</td>
                    <td className="px-6 py-3"><span className={`px-2 py-1 rounded-full text-xs ${loan.currency === 'USD' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-purple-500/20 text-purple-400'}`}>{loan.currency}</span></td>
                    <td className="px-6 py-3 text-gray-300 text-sm">{loan.interest_rate}%</td>
                    <td className="px-6 py-3 text-white text-sm">{loan.remaining_balance} {loan.currency}</td>
                    <td className="px-6 py-3">{getStatusBadge(loan.status)}</td>
                    {(isGroupLeader || isCBLAdmin) && (
                      <td className="px-6 py-3">
                        {loan.status === 'requested' && (
                          <div className="flex gap-2"><button onClick={() => approveLoan(loan.id, 'approve')} className="p-1 bg-green-600 rounded hover:bg-green-700"><CheckCircle size={14} className="text-white" /></button><button onClick={() => approveLoan(loan.id, 'reject')} className="p-1 bg-red-600 rounded hover:bg-red-700"><XCircle size={14} className="text-white" /></button></div>
                        )}
                        {loan.status === 'approved' && (<button onClick={() => disburseLoan(loan.id)} className="px-2 py-1 bg-blue-600 rounded text-xs text-white hover:bg-blue-700">Disburse</button>)}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Loans;
