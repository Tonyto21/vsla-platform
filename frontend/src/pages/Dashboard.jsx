
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import {
  Users, Wallet, TrendingUp, ArrowUpRight, Download, 
  RefreshCw, CheckCircle, Activity, PieChart as PieIcon,
  Globe, DollarSign, MapPin, Calendar, FileText,
  Clock, Landmark, Plus, Eye
} from 'lucide-react';
import { format } from 'date-fns';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import LiberiaMap from '../components/LiberiaMap';
import DepositModal from '../components/DepositModal';
import LoanRequestModal from '../components/LoanRequestModal';

ChartJS.register(
  CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend,
  ArcElement, PointElement, LineElement, Filler
);

const Dashboard = () => {
  const { user, isCBLAdmin, isGroupLeader, isMember } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('week');
  const [reportPeriod, setReportPeriod] = useState('monthly');
  const [selectedCounty, setSelectedCounty] = useState(null);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showLoanModal, setShowLoanModal] = useState(false);

  const fetchDashboardData = async () => {
    try {
      if (isCBLAdmin) {
        const res = await axios.get('http://localhost:5000/api/reports/dashboard');
        setDashboardData(res.data);
      } else if (isGroupLeader) {
        const groupsRes = await axios.get('http://localhost:5000/api/groups');
        if (groupsRes.data.length > 0) {
          const group = groupsRes.data[0];
          const [walletRes, txRes, loansRes] = await Promise.all([
            axios.get(`http://localhost:5000/api/groups/${group.id}/wallet`),
            axios.get(`http://localhost:5000/api/groups/${group.id}/transactions?limit=10`),
            axios.get(`http://localhost:5000/api/groups/${group.id}/loans`)
          ]);
          setDashboardData({
            wallet: walletRes.data,
            transactions: txRes.data,
            loans: loansRes.data,
            group: group,
            pending_loans: loansRes.data.filter(l => l.status === 'requested').length,
          });
        }
      } else if (isMember) {
        const groupsRes = await axios.get('http://localhost:5000/api/groups');
        if (groupsRes.data.length > 0) {
          const group = groupsRes.data[0];
          const [walletRes, txRes, loansRes] = await Promise.all([
            axios.get(`http://localhost:5000/api/groups/${group.id}/wallet`),
            axios.get(`http://localhost:5000/api/groups/${group.id}/transactions?limit=10`),
            axios.get(`http://localhost:5000/api/groups/${group.id}/loans`)
          ]);
          const userLoans = loansRes.data.filter(l => l.user_id === user?.id);
          setDashboardData({
            wallet: walletRes.data,
            transactions: txRes.data.filter(t => t.user_id === user?.id),
            loans: userLoans,
            active_loan: userLoans.find(l => l.status === 'active' || l.status === 'disbursed'),
            group: group
          });
        }
      }
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [isCBLAdmin, isGroupLeader, isMember]);

  const weeklyData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [{
      label: 'Transactions (USD)',
      data: [2450, 3800, 5200, 4100, 6800, 2900, 1800],
      backgroundColor: 'rgba(99, 102, 241, 0.8)',
      borderRadius: 8,
    }],
  };

  const trendData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
    datasets: [{
      label: 'Total Savings (USD)',
      data: [32000, 38000, 41000, 45000, 43000, 49000, 54000],
      borderColor: '#6366f1',
      backgroundColor: 'rgba(99, 102, 241, 0.1)',
      tension: 0.4,
      fill: true,
    }],
  };

  const doughnutData = {
    labels: ['Active Loans', 'Repaid', 'Defaulted'],
    datasets: [{
      data: [dashboardData?.active_loans || 24, dashboardData?.repaid_loans || 156, dashboardData?.defaulted_loans || 8],
      backgroundColor: ['#f59e0b', '#10b981', '#ef4444'],
      borderWidth: 0,
    }],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { labels: { color: '#9ca3af' } }, tooltip: { backgroundColor: '#1f2937' } },
    scales: { y: { grid: { color: '#374151' }, ticks: { color: '#9ca3af' } }, x: { grid: { display: false }, ticks: { color: '#9ca3af' } } }
  };

  const doughnutOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: '#9ca3af' } } }, cutout: '70%' };

  if (loading) {
    return <div className="flex items-center justify-center h-96"><div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div></div>;
  }

  // ========== CBL ADMIN DASHBOARD ==========
  if (isCBLAdmin) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center"><div><h1 className="text-3xl font-bold text-white">Central Bank Dashboard</h1><p className="text-gray-400 mt-1">{format(new Date(), 'EEEE, MMMM do, yyyy')}</p></div><div className="flex gap-2"><select className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"><option>National Overview</option><option>By County</option></select><button className="bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg text-white text-sm flex items-center gap-2"><Download size={16} /> Export Report</button></div></div>
        <div className="rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-8"><h2 className="text-2xl font-bold text-white mb-2">Welcome, Central Bank Admin 👑</h2><p className="text-indigo-100 mb-4">National VSLA Oversight & Financial Inclusion Dashboard</p><div className="flex gap-4"><button className="bg-white/20 backdrop-blur text-white px-5 py-2 rounded-xl font-semibold flex items-center gap-2"><FileText size={18} /> Generate National Report</button><button className="border border-white/30 text-white px-5 py-2 rounded-xl font-semibold flex items-center gap-2"><Calendar size={18} /> Schedule Report</button></div></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-gradient-to-br from-indigo-500/20 to-purple-600/20 rounded-xl p-5 border border-white/10"><div className="flex justify-between"><div><p className="text-gray-400 text-sm">Total Groups</p><p className="text-2xl font-bold text-white">{dashboardData?.total_groups || 4}</p><div className="flex items-center gap-1 mt-2 text-green-400 text-xs"><ArrowUpRight size={12} />+2 this quarter</div></div><div className="p-3 rounded-xl bg-indigo-500/20"><Globe size={22} color="#6366f1" /></div></div></div>
          <div className="bg-gradient-to-br from-emerald-500/20 to-green-600/20 rounded-xl p-5 border border-white/10"><div className="flex justify-between"><div><p className="text-gray-400 text-sm">Total Members</p><p className="text-2xl font-bold text-white">{dashboardData?.total_users || 9}</p><div className="flex items-center gap-1 mt-2 text-green-400 text-xs"><ArrowUpRight size={12} />+12% YoY</div></div><div className="p-3 rounded-xl bg-emerald-500/20"><Users size={22} color="#10b981" /></div></div></div>
          <div className="bg-gradient-to-br from-purple-500/20 to-pink-600/20 rounded-xl p-5 border border-white/10"><div className="flex justify-between"><div><p className="text-gray-400 text-sm">Total Savings</p><p className="text-2xl font-bold text-white">${(dashboardData?.total_savings?.total_usd || 1134).toLocaleString()}</p><div className="flex items-center gap-1 mt-1 text-green-400 text-xs"><ArrowUpRight size={12} />+18.4%</div></div><div className="p-3 rounded-xl bg-purple-500/20"><Wallet size={22} color="#8b5cf6" /></div></div></div>
          <div className="bg-gradient-to-br from-amber-500/20 to-orange-600/20 rounded-xl p-5 border border-white/10"><div className="flex justify-between"><div><p className="text-gray-400 text-sm">Repayment Rate</p><p className="text-2xl font-bold text-white">{dashboardData?.repayment_rate?.toFixed(0) || 33}%</p><div className="flex items-center gap-1 mt-2 text-green-400 text-xs"><ArrowUpRight size={12} />+5%</div></div><div className="p-3 rounded-xl bg-amber-500/20"><TrendingUp size={22} color="#f59e0b" /></div></div></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6"><LiberiaMap onCountySelect={setSelectedCounty} selectedCounty={selectedCounty} /><div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700"><h3 className="text-white font-semibold mb-4 flex items-center gap-2"><MapPin size={18} /> {selectedCounty ? `${selectedCounty} County Report` : 'County Selection'}</h3>{selectedCounty ? (<div className="space-y-4"><div className="grid grid-cols-2 gap-4"><div className="bg-gray-700/50 rounded-lg p-3 text-center"><p className="text-2xl font-bold text-white">5</p><p className="text-xs text-gray-400">VSLA Groups</p></div><div className="bg-gray-700/50 rounded-lg p-3 text-center"><p className="text-2xl font-bold text-white">124</p><p className="text-xs text-gray-400">Active Members</p></div><div className="bg-gray-700/50 rounded-lg p-3 text-center"><p className="text-2xl font-bold text-white">$125K</p><p className="text-xs text-gray-400">USD Savings</p></div></div><button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg text-sm transition">Download County Report →</button></div>) : <p className="text-gray-400 text-center py-8">Click on any county to view detailed VSLA statistics</p>}</div></div>
        <div className="flex gap-2 bg-gray-800/50 rounded-xl p-1 w-fit">{['daily', 'weekly', 'monthly', 'quarterly', 'yearly'].map((period) => (<button key={period} onClick={() => setReportPeriod(period)} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${reportPeriod === period ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'}`}>{period.charAt(0).toUpperCase() + period.slice(1)}</button>))}</div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6"><div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700"><h3 className="text-white font-semibold mb-4">Financial Activity (USD)</h3><div className="h-80"><Bar data={weeklyData} options={chartOptions} /></div></div><div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700"><h3 className="text-white font-semibold mb-4">Loan Portfolio</h3><div className="h-80"><Doughnut data={doughnutData} options={doughnutOptions} /></div></div></div>
        <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700"><h3 className="text-white font-semibold mb-4">Savings Growth Trend (USD)</h3><div className="h-64"><Line data={trendData} options={chartOptions} /></div></div>
        <div className="bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden"><div className="px-6 py-4 border-b border-gray-700 flex justify-between"><h3 className="text-white font-semibold">Recent National Transactions</h3><button className="text-indigo-400 text-sm">View All →</button></div><div className="overflow-x-auto"><table className="w-full"><thead className="bg-gray-700/50"><tr><th className="px-6 py-3 text-left text-xs text-gray-400">User</th><th className="px-6 py-3 text-left text-xs text-gray-400">Group</th><th className="px-6 py-3 text-left text-xs text-gray-400">Type</th><th className="px-6 py-3 text-left text-xs text-gray-400">Amount</th><th className="px-6 py-3 text-left text-xs text-gray-400">Currency</th><th className="px-6 py-3 text-left text-xs text-gray-400">Date</th> </tr></thead><tbody className="divide-y divide-gray-700">{dashboardData?.recent_transactions?.slice(0, 5).map(tx => (<tr key={tx.id} className="hover:bg-gray-700/30"><td className="px-6 py-3 text-white text-sm">{tx.user_name}</td><td className="px-6 py-3 text-gray-300 text-sm">{tx.group_name}</td><td className="px-6 py-3"><span className={`px-2 py-1 rounded-full text-xs ${tx.type === 'deposit' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'}`}>{tx.type}</span></td><td className="px-6 py-3 text-white text-sm font-semibold">{tx.amount}</td><td className="px-6 py-3 text-white text-sm">{tx.currency}</td><td className="px-6 py-3 text-gray-400 text-sm">{format(new Date(tx.created_at), 'MMM dd')}</td></tr>))}</tbody></table></div></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5"><div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-xl p-5 border border-white/10"><h4 className="text-white font-semibold">CSV Export</h4><p className="text-gray-400 text-sm">Download raw transaction data</p><button className="mt-3 text-indigo-400 text-sm">Export CSV →</button></div><div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-xl p-5 border border-white/10"><h4 className="text-white font-semibold">JSON Report</h4><p className="text-gray-400 text-sm">API-ready data format</p><button className="mt-3 text-green-400 text-sm">Download JSON →</button></div><div className="bg-gradient-to-r from-orange-500/10 to-amber-500/10 rounded-xl p-5 border border-white/10"><h4 className="text-white font-semibold">PDF Summary</h4><p className="text-gray-400 text-sm">Printable executive summary</p><button className="mt-3 text-orange-400 text-sm">Generate PDF →</button></div></div>
      </div>
    );
  }

  // ========== GROUP LEADER DASHBOARD ==========
  if (isGroupLeader) {
    const usdBalance = dashboardData?.wallet?.usd_balance || 0;
    const lrdBalance = dashboardData?.wallet?.lrd_balance || 0;
    const totalUSD = (usdBalance + (lrdBalance / (dashboardData?.wallet?.exchange_rate || 185))).toFixed(2);

    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center"><div><h1 className="text-2xl font-bold text-white">Group Dashboard</h1><p className="text-gray-400 text-sm">{dashboardData?.group?.name} • {format(new Date(), 'EEEE, MMMM do')}</p></div></div>
        <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 p-6"><h2 className="text-xl font-bold text-white">Welcome, {user?.full_name} 👋</h2><p className="text-blue-100">Manage your group, approve loans, and track member savings.</p></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gray-800/50 rounded-xl p-4"><p className="text-gray-400 text-sm">Members</p><p className="text-2xl font-bold text-white">{dashboardData?.group?.member_count || 0}</p></div>
          <div className="bg-gray-800/50 rounded-xl p-4"><p className="text-gray-400 text-sm">USD Savings</p><p className="text-2xl font-bold text-white">${usdBalance.toLocaleString()}</p></div>
          <div className="bg-gray-800/50 rounded-xl p-4"><p className="text-gray-400 text-sm">LRD Savings</p><p className="text-2xl font-bold text-white">L${lrdBalance.toLocaleString()}</p></div>
          <div className="bg-gray-800/50 rounded-xl p-4"><p className="text-gray-400 text-sm">Total (USD)</p><p className="text-2xl font-bold text-green-400">${totalUSD}</p></div>
        </div>
        {dashboardData?.pending_loans > 0 && (<div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4"><h3 className="text-white font-semibold">Pending Loan Approvals</h3><p className="text-gray-400 text-sm">You have {dashboardData.pending_loans} loan request{dashboardData.pending_loans !== 1 ? 's' : ''} awaiting your review</p><button className="mt-2 text-orange-400 text-sm">Review Requests →</button></div>)}
        <div className="grid grid-cols-2 gap-4">
          <button onClick={() => setShowDepositModal(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2"><Plus size={18} /> Make a Deposit</button>
          <button onClick={() => setShowLoanModal(true)} className="bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2">Request Loan</button>
        </div>
        {showDepositModal && <DepositModal isOpen={showDepositModal} onClose={() => setShowDepositModal(false)} onSuccess={fetchDashboardData} />}
        {showLoanModal && <LoanRequestModal isOpen={showLoanModal} onClose={() => setShowLoanModal(false)} onSuccess={fetchDashboardData} />}
      </div>
    );
  }

  // ========== MEMBER DASHBOARD ==========
  const usdBalance = dashboardData?.wallet?.usd_balance || 0;
  const lrdBalance = dashboardData?.wallet?.lrd_balance || 0;
  const totalUSD = (usdBalance + (lrdBalance / (dashboardData?.wallet?.exchange_rate || 185))).toFixed(2);

  return (
    <div className="p-6 space-y-6">
      <div><h1 className="text-2xl font-bold text-white">My Dashboard</h1><p className="text-gray-400 text-sm">{format(new Date(), 'EEEE, MMMM do, yyyy')}</p></div>
      <div className="rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 p-6"><h2 className="text-xl font-bold text-white">Welcome, {user?.full_name} 👋</h2><p className="text-emerald-100">You are a member of: <span className="font-semibold">{dashboardData?.group?.name || 'No group assigned'}</span></p></div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-800/50 rounded-xl p-6"><h3 className="text-white font-semibold mb-3">My Balance</h3><div className="space-y-2"><div className="flex justify-between"><span className="text-gray-400">USD Balance:</span><span className="text-white font-bold">${usdBalance.toLocaleString()}</span></div><div className="flex justify-between"><span className="text-gray-400">LRD Balance:</span><span className="text-white font-bold">L${lrdBalance.toLocaleString()}</span></div><div className="flex justify-between pt-2 border-t border-gray-700"><span className="text-gray-400">Total (USD):</span><span className="text-green-400 font-bold">${totalUSD}</span></div></div><div className="flex gap-4 mt-4"><button onClick={() => setShowDepositModal(true)} className="flex-1 bg-indigo-600 py-2 rounded-lg text-white">Deposit</button><button onClick={() => setShowLoanModal(true)} className="flex-1 bg-green-600 py-2 rounded-lg text-white">Request Loan</button></div></div>
        <div className="bg-gray-800/50 rounded-xl p-6"><h3 className="text-white font-semibold mb-3">Active Loan</h3>{dashboardData?.active_loan ? (<><p className="text-2xl font-bold text-white">{dashboardData.active_loan.remaining_balance} {dashboardData.active_loan.currency}</p><p className="text-gray-400 text-sm">Remaining balance</p><button className="mt-3 text-green-400 text-sm">Make Repayment →</button></>) : (<p className="text-gray-400">No active loans. Click "Request Loan" to apply.</p>)}</div>
      </div>
      <div className="bg-gray-800/50 rounded-xl p-5"><h3 className="text-white font-semibold mb-4">Recent Activity</h3>{dashboardData?.transactions?.length > 0 ? dashboardData.transactions.slice(0, 5).map(tx => (<div key={tx.id} className="flex justify-between py-2 border-b border-gray-700"><span>{tx.type}</span><span className={tx.type === 'deposit' ? 'text-green-400' : 'text-blue-400'}>{tx.amount} {tx.currency}</span></div>)) : <p className="text-gray-400">No transactions yet</p>}</div>
      {showDepositModal && <DepositModal isOpen={showDepositModal} onClose={() => setShowDepositModal(false)} onSuccess={fetchDashboardData} />}
      {showLoanModal && <LoanRequestModal isOpen={showLoanModal} onClose={() => setShowLoanModal(false)} onSuccess={fetchDashboardData} />}
    </div>
  );
};

export default Dashboard;
