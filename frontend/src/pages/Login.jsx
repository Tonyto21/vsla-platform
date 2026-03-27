import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff, ArrowRight, Shield, Zap } from 'lucide-react';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const success = await login(username, password);
    setLoading(false);
    if (success) navigate('/dashboard');
  };

  const quickFill = (user) => {
    setUsername(user);
    setPassword('password123');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="max-w-6xl w-full grid lg:grid-cols-2 gap-12 items-center">
        {/* Left Side - Hero */}
        <div>
          <div className="mb-8">
            <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center mb-6">
              <span className="text-white text-xl font-bold">V</span>
            </div>
            <h1 className="text-5xl font-bold text-white mb-4">
              Village banking{' '}
              <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                reimagined.
              </span>
            </h1>
            <p className="text-gray-400 text-lg">
              The complete platform for Village Savings & Loan Associations.
              Manage groups, track savings, and disburse loans with ease.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-500/20 rounded-lg"><Shield className="h-5 w-5 text-indigo-400" /></div>
              <div><p className="text-white font-semibold">Bank-grade</p><p className="text-gray-500 text-sm">Security</p></div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/20 rounded-lg"><Zap className="h-5 w-5 text-purple-400" /></div>
              <div><p className="text-white font-semibold">Real-time</p><p className="text-gray-500 text-sm">Analytics</p></div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-6 border-t border-white/10">
            <div><div className="text-2xl font-bold text-white">35K+</div><div className="text-xs text-gray-500">Active Users</div></div>
            <div><div className="text-2xl font-bold text-white">$2.5M</div><div className="text-xs text-gray-500">Total Savings</div></div>
            <div><div className="text-2xl font-bold text-white">98%</div><div className="text-xs text-gray-500">Repayment Rate</div></div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white">Welcome back</h2>
            <p className="text-gray-400 mt-2">Sign in to your dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-all"
                placeholder="Enter your username"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-all pr-12"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-gray-400">
                <input type="checkbox" className="accent-indigo-500" /> Remember me
              </label>
              <a href="#" className="text-sm text-indigo-400 hover:text-indigo-300">Forgot password?</a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg hover:scale-[1.02] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? 'Signing in...' : <>Sign In <ArrowRight size={18} /></>}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/10">
            <p className="text-center text-xs text-gray-500 mb-3">Demo Credentials</p>
            <div className="grid grid-cols-3 gap-2">
              <button onClick={() => quickFill('cbl_admin')} className="py-2 bg-white/5 rounded-lg text-xs text-gray-300 hover:bg-white/10 transition">Admin</button>
              <button onClick={() => quickFill('testleader')} className="py-2 bg-white/5 rounded-lg text-xs text-gray-300 hover:bg-white/10 transition">Leader</button>
              <button onClick={() => quickFill('testmember')} className="py-2 bg-white/5 rounded-lg text-xs text-gray-300 hover:bg-white/10 transition">Member</button>
            </div>
            <p className="text-center text-xs text-gray-600 mt-3">Password: password123</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;