import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import {
  Users, Wallet, TrendingUp, ArrowUpRight, Plus, Eye,
  Download, RefreshCw, CheckCircle, Activity, PieChart as PieIcon,
  Globe, DollarSign
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
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

// Register ChartJS components
ChartJS.register(
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
);

const Dashboard = () => {
  const { user, isCBLAdmin } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('week');

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (isCBLAdmin) {
          const res = await axios.get('http://localhost:5000/api/reports/dashboard');
          setDashboardData(res.data);
        } else {
          const groupsRes = await axios.get('http://localhost:5000/api/groups');
          if (groupsRes.data.length > 0) {
            const group = groupsRes.data[0];
            const [walletRes, txRes] = await Promise.all([
              axios.get(`http://localhost:5000/api/groups/${group.id}/wallet`),
              axios.get(`http://localhost:5000/api/groups/${group.id}/transactions?limit=10`)
            ]);
            setDashboardData({
              wallet: walletRes.data,
              transactions: txRes.data,
              group: group,
              total_groups: groupsRes.data.length,
              total_users: group.member_count || 0,
              total_savings: { total_usd: walletRes.data?.total_usd || 0 },
              repayment_rate: 94,
              recent_transactions: txRes.data || [],
            });
          }
        }
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [isCBLAdmin]);

  // Sample chart data
  const weeklyData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Deposits ($)',
        data: [2450, 3800, 5200, 4100, 6800, 2900, 1800],
        backgroundColor: 'rgba(99, 102, 241, 0.8)',
        borderRadius: 8,
      },
      {
        label: 'Loans ($)',
        data: [1200, 2100, 1800, 2900, 4200, 1500, 800],
        backgroundColor: 'rgba(16, 185, 129, 0.8)',
        borderRadius: 8,
      },
    ],
  };

  const monthlyData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Deposits ($)',
        data: [18500, 22400, 26800, 31200, 29800, 34500],
        backgroundColor: 'rgba(99, 102, 241, 0.8)',
        borderRadius: 8,
      },
      {
        label: 'Loans ($)',
        data: [9200, 11800, 14500, 17800, 16200, 19800],
        backgroundColor: 'rgba(16, 185, 129, 0.8)',
        borderRadius: 8,
      },
    ],
  };

  const trendData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
    datasets: [
      {
        label: 'Total Savings',
        data: [32000, 38000, 41000, 45000, 43000, 49000, 54000],
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        tension: 0.4,
        fill: true,
        pointBackgroundColor: '#6366f1',
        pointRadius: 4,
      },
    ],
  };

  const doughnutData = {
    labels: ['Active Loans', 'Repaid', 'Defaulted'],
    datasets: [{
      data: [
        dashboardData?.active_loans || 24,
        dashboardData?.repaid_loans || 156,
        dashboardData?.defaulted_loans || 8,
      ],
      backgroundColor: ['#f59e0b', '#10b981', '#ef4444'],
      borderWidth: 0,
    }],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: '#9ca3af', font: { size: 12 } }
      },
      tooltip: {
        backgroundColor: '#1f2937',
        titleColor: '#fff',
        bodyColor: '#9ca3af',
        borderColor: '#374151',
        borderWidth: 1,
      }
    },
    scales: {
      y: {
        grid: { color: '#374151' },
        ticks: { color: '#9ca3af' }
      },
      x: {
        grid: { display: false },
        ticks: { color: '#9ca3af' }
      }
    }
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: '#9ca3af' } },
      tooltip: {
        backgroundColor: '#1f2937',
        titleColor: '#fff',
        bodyColor: '#9ca3af',
      }
    },
    scales: {
      y: {
        grid: { color: '#374151' },
        ticks: { color: '#9ca3af', callback: (v) => `$${(v/1000).toFixed(0)}k` }
      },
      x: {
        grid: { display: false },
        ticks: { color: '#9ca3af' }
      }
    }
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { color: '#9ca3af', font: { size: 12 } }
      },
      tooltip: {
        backgroundColor: '#1f2937',
        titleColor: '#fff',
        bodyColor: '#9ca3af',
      }
    },
    cutout: '70%',
  };

  const savings = dashboardData?.total_savings?.total_usd || 45230;
  const stats = [
    { title: 'Total Groups', value: String(dashboardData?.total_groups || 12), change: '+2', icon: Globe, color: '#6366f1' },
    { title: 'Active Members', value: String(dashboardData?.total_users || 156), change: '+8', icon: Users, color: '#10b981' },
    { title: 'Total Savings', value: `$${savings.toLocaleString()}`, change: '+12.5%', icon: DollarSign, color: '#8b5cf6' },
    { title: 'Repayment Rate', value: `${dashboardData?.repayment_rate?.toFixed(0) || 94}%`, change: '+5%', icon: TrendingUp, color: '#f59e0b' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400 mt-1">{format(new Date(), 'EEEE, MMMM do, yyyy')}</p>
        </div>
        <div className="flex gap-2 bg-white/5 rounded-xl p-1">
          {['week', 'month'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                timeRange === range ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              {range.charAt(0).toUpperCase() + range.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Hero Section */}
      <div className="rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-8">
        <h2 className="text-2xl font-bold text-white mb-2">
          Welcome back, {user?.full_name?.split(' ')[0] || 'User'}! 👋
        </h2>
        <p className="text-indigo-100 mb-6">
          Your VSLA community is thriving. Track savings, manage loans, and empower your members.
        </p>
        <div className="flex gap-4">
          <button className="bg-white text-indigo-700 px-5 py-2 rounded-xl font-semibold flex items-center gap-2">
            <Plus size={18} /> Make a deposit
          </button>
          <button className="border border-white/30 text-white px-5 py-2 rounded-xl font-semibold flex items-center gap-2">
            <Eye size={18} /> View reports
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat, i) => (
          <div key={i} className="bg-gradient-to-br from-indigo-500/20 to-purple-600/20 rounded-xl p-5 border border-white/10 hover:border-white/20 transition">
            <div className="flex justify-between">
              <div>
                <p className="text-gray-400 text-sm">{stat.title}</p>
                <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
                <div className="flex items-center gap-1 mt-2 text-green-400 text-xs">
                  <ArrowUpRight size={12} />
                  <span>{stat.change} from last month</span>
                </div>
              </div>
              <div className="p-3 rounded-xl" style={{ background: `${stat.color}20` }}>
                <stat.icon size={22} color={stat.color} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <div className="bg-white/5 rounded-xl p-5 border border-white/10">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-white font-semibold">Financial Activity</h3>
              <p className="text-gray-500 text-sm">Deposits vs Loans ({timeRange === 'week' ? 'Weekly' : 'Monthly'})</p>
            </div>
            <Activity size={18} className="text-gray-500" />
          </div>
          <div className="h-80">
            <Bar data={timeRange === 'week' ? weeklyData : monthlyData} options={chartOptions} />
          </div>
        </div>

        {/* Doughnut Chart */}
        <div className="bg-white/5 rounded-xl p-5 border border-white/10">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-white font-semibold">Loan Portfolio</h3>
              <p className="text-gray-500 text-sm">Distribution by status</p>
            </div>
            <PieIcon size={18} className="text-gray-500" />
          </div>
          <div className="h-80">
            <Doughnut data={doughnutData} options={doughnutOptions} />
          </div>
          <div className="grid grid-cols-3 gap-3 mt-4">
            <div className="text-center">
              <div className="text-xl font-bold text-white">{doughnutData.datasets[0].data[0]}</div>
              <div className="text-xs text-gray-500">Active</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-white">{doughnutData.datasets[0].data[1]}</div>
              <div className="text-xs text-gray-500">Repaid</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-white">{doughnutData.datasets[0].data[2]}</div>
              <div className="text-xs text-gray-500">Defaulted</div>
            </div>
          </div>
        </div>
      </div>

      {/* Savings Trend */}
      <div className="bg-white/5 rounded-xl p-5 border border-white/10">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-white font-semibold">Savings Growth Trend</h3>
            <p className="text-gray-500 text-sm">Total savings over time</p>
          </div>
          <div className="flex items-center gap-1 text-emerald-400 text-xs">
            <ArrowUpRight size={12} /> +18.4%
          </div>
        </div>
        <div className="h-64">
          <Line data={trendData} options={lineOptions} />
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
        <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center">
          <div>
            <h3 className="text-white font-semibold">Recent Transactions</h3>
            <p className="text-gray-500 text-sm">Latest financial activities</p>
          </div>
          <div className="flex gap-2">
            <button className="p-2 hover:bg-white/10 rounded-lg"><Download size={18} className="text-gray-400" /></button>
            <button className="p-2 hover:bg-white/10 rounded-lg"><RefreshCw size={18} className="text-gray-400" /></button>
          </div>
        </div>
        
        {dashboardData?.recent_transactions?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {dashboardData.recent_transactions.slice(0, 5).map((tx) => (
                  <tr key={tx.id} className="hover:bg-white/5 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center">
                          <span className="text-white text-sm">{tx.user_name?.charAt(0)}</span>
                        </div>
                        <span className="text-white text-sm">{tx.user_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        tx.type === 'deposit' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'
                      }`}>
                        {tx.type === 'deposit' ? 'Deposit' : 'Loan Repayment'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`font-semibold ${tx.type === 'deposit' ? 'text-green-400' : 'text-blue-400'}`}>
                        {tx.type === 'deposit' ? '+' : '-'}{tx.amount} {tx.currency}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-400 text-sm">
                      {format(new Date(tx.created_at), 'MMM dd, h:mm a')}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/20 text-green-400 text-xs">
                        <CheckCircle size={12} /> Completed
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-gray-500">No transactions yet. Make your first deposit!</div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-xl p-5 border border-white/10">
          <h4 className="text-white font-semibold">Quick Deposit</h4>
          <p className="text-gray-400 text-sm mt-1">Add funds to your savings</p>
          <button className="mt-4 text-indigo-400 text-sm hover:text-indigo-300 transition">Make a deposit →</button>
        </div>
        <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-xl p-5 border border-white/10">
          <h4 className="text-white font-semibold">Request Loan</h4>
          <p className="text-gray-400 text-sm mt-1">Get access to funds</p>
          <button className="mt-4 text-green-400 text-sm hover:text-green-300 transition">Apply now →</button>
        </div>
        <div className="bg-gradient-to-r from-orange-500/10 to-amber-500/10 rounded-xl p-5 border border-white/10">
          <h4 className="text-white font-semibold">Generate Report</h4>
          <p className="text-gray-400 text-sm mt-1">Download analytics</p>
          <button className="mt-4 text-orange-400 text-sm hover:text-orange-300 transition">Export CSV →</button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;