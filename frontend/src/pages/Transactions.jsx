
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';
import { Download, RefreshCw, Filter, ArrowUpDown, DollarSign, TrendingUp } from 'lucide-react';

const Transactions = () => {
  const { user, isCBLAdmin, isGroupLeader, isMember } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ type: '', currency: '', startDate: '', endDate: '' });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      if (isCBLAdmin) {
        const res = await axios.get('http://localhost:5000/api/reports/dashboard');
        setTransactions(res.data.recent_transactions || []);
      } else {
        const groupsRes = await axios.get('http://localhost:5000/api/groups');
        if (groupsRes.data.length > 0) {
          const group = groupsRes.data[0];
          const res = await axios.get(`http://localhost:5000/api/groups/${group.id}/transactions?limit=50`);
          let filtered = res.data;
          if (isMember) {
            filtered = res.data.filter(tx => tx.user_id === user?.id);
          }
          setTransactions(filtered);
        }
      }
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    const headers = ['Date', 'User', 'Group', 'Type', 'Amount', 'Currency', 'USD Equivalent', 'Description'];
    const csvRows = [headers];
    transactions.forEach(tx => {
      csvRows.push([
        format(new Date(tx.created_at), 'yyyy-MM-dd HH:mm'),
        tx.user_name || user?.full_name,
        tx.group_name || 'N/A',
        tx.type,
        tx.amount,
        tx.currency,
        tx.usd_equivalent || (tx.currency === 'USD' ? tx.amount : (tx.amount / 185).toFixed(2)),
        tx.description || ''
      ]);
    });
    const csvContent = csvRows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredTransactions = transactions.filter(tx => {
    if (filter.type && tx.type !== filter.type) return false;
    if (filter.currency && tx.currency !== filter.currency) return false;
    if (filter.startDate && new Date(tx.created_at) < new Date(filter.startDate)) return false;
    if (filter.endDate && new Date(tx.created_at) > new Date(filter.endDate)) return false;
    return true;
  });

  // Calculate multi-currency totals
  const totalUSD = filteredTransactions.reduce((sum, tx) => sum + (tx.usd_equivalent || (tx.currency === 'USD' ? tx.amount : tx.amount / 185)), 0);
  const totalLRD = filteredTransactions.filter(tx => tx.currency === 'LRD').reduce((sum, tx) => sum + tx.amount, 0);
  const depositsUSD = filteredTransactions.filter(t => t.type === 'deposit' && t.currency === 'USD').reduce((s, t) => s + t.amount, 0);
  const depositsLRD = filteredTransactions.filter(t => t.type === 'deposit' && t.currency === 'LRD').reduce((s, t) => s + t.amount, 0);

  if (loading) {
    return <div className="flex items-center justify-center h-96"><div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div></div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">
            {isCBLAdmin ? 'All Transactions' : isGroupLeader ? 'Group Transactions' : 'My Transactions'}
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            {isCBLAdmin ? 'Monitor all financial activities across the nation' : isGroupLeader ? 'Track all transactions within your group' : 'View your personal transaction history'}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-2 px-4 py-2 bg-gray-800 rounded-lg text-gray-300 hover:bg-gray-700 transition">
            <Filter size={16} /> Filters
          </button>
          <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 rounded-lg text-white hover:bg-indigo-700 transition">
            <Download size={16} /> Export CSV
          </button>
          <button onClick={fetchTransactions} className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white transition">
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div><label className="block text-xs text-gray-400 mb-1">Type</label><select value={filter.type} onChange={(e) => setFilter({...filter, type: e.target.value})} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"><option value="">All</option><option value="deposit">Deposit</option><option value="loan_repayment">Loan Repayment</option></select></div>
          <div><label className="block text-xs text-gray-400 mb-1">Currency</label><select value={filter.currency} onChange={(e) => setFilter({...filter, currency: e.target.value})} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"><option value="">All</option><option value="USD">USD</option><option value="LRD">LRD</option></select></div>
          <div><label className="block text-xs text-gray-400 mb-1">From Date</label><input type="date" value={filter.startDate} onChange={(e) => setFilter({...filter, startDate: e.target.value})} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white" /></div>
          <div><label className="block text-xs text-gray-400 mb-1">To Date</label><input type="date" value={filter.endDate} onChange={(e) => setFilter({...filter, endDate: e.target.value})} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white" /></div>
        </div>
      )}

      {/* Multi-Currency Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-800/50 rounded-xl p-4 text-center"><p className="text-2xl font-bold text-white">${totalUSD.toFixed(2)}</p><p className="text-xs text-gray-400">Total (USD)</p></div>
        <div className="bg-gray-800/50 rounded-xl p-4 text-center"><p className="text-2xl font-bold text-white">L${totalLRD.toFixed(2)}</p><p className="text-xs text-gray-400">Total (LRD)</p></div>
        <div className="bg-gray-800/50 rounded-xl p-4 text-center"><p className="text-2xl font-bold text-green-400">${depositsUSD.toFixed(2)}</p><p className="text-xs text-gray-400">USD Deposits</p></div>
        <div className="bg-gray-800/50 rounded-xl p-4 text-center"><p className="text-2xl font-bold text-green-400">L${depositsLRD.toFixed(2)}</p><p className="text-xs text-gray-400">LRD Deposits</p></div>
      </div>

      <div className="bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-700/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs text-gray-400">Date</th>
                {(isCBLAdmin || isGroupLeader) && <th className="px-6 py-3 text-left text-xs text-gray-400">User</th>}
                {isCBLAdmin && <th className="px-6 py-3 text-left text-xs text-gray-400">Group</th>}
                <th className="px-6 py-3 text-left text-xs text-gray-400">Type</th>
                <th className="px-6 py-3 text-left text-xs text-gray-400">Amount</th>
                <th className="px-6 py-3 text-left text-xs text-gray-400">Currency</th>
                <th className="px-6 py-3 text-left text-xs text-gray-400">USD Value</th>
                <th className="px-6 py-3 text-left text-xs text-gray-400">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filteredTransactions.length === 0 ? (
                <tr><td colSpan={isCBLAdmin ? 8 : (isGroupLeader ? 7 : 6)} className="px-6 py-12 text-center text-gray-500">No transactions found</td></tr>
              ) : (
                filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-700/30">
                    <td className="px-6 py-3 text-gray-300 text-sm">{format(new Date(tx.created_at), 'MMM dd, yyyy')}</td>
                    {(isCBLAdmin || isGroupLeader) && <td className="px-6 py-3 text-white text-sm">{tx.user_name}</td>}
                    {isCBLAdmin && <td className="px-6 py-3 text-gray-300 text-sm">{tx.group_name}</td>}
                    <td className="px-6 py-3"><span className={`px-2 py-1 rounded-full text-xs ${tx.type === 'deposit' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'}`}>{tx.type.replace('_', ' ')}</span></td>
                    <td className="px-6 py-3 text-white text-sm font-semibold">{tx.amount}</td>
                    <td className="px-6 py-3"><span className={`px-2 py-1 rounded-full text-xs ${tx.currency === 'USD' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-purple-500/20 text-purple-400'}`}>{tx.currency}</span></td>
                    <td className="px-6 py-3 text-gray-300 text-sm">${(tx.usd_equivalent || (tx.currency === 'USD' ? tx.amount : (tx.amount / 185))).toFixed(2)}</td>
                    <td className="px-6 py-3"><span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/20 text-green-400 text-xs"><span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>Completed</span></td>
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

export default Transactions;
