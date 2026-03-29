import React, { useState } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Home, Users, Wallet, Landmark, FileText, Bell, LogOut, Menu, X, UserCircle, Shield } from 'lucide-react';

const Layout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Different menus based on role
  const menus = {
    cbl_admin: [
      { name: 'Dashboard', href: '/dashboard', icon: Home },
      { name: 'Groups', href: '/groups', icon: Users },
      { name: 'Transactions', href: '/transactions', icon: Wallet },
      { name: 'Loans', href: '/loans', icon: Landmark },
      { name: 'Reports', href: '/reports', icon: FileText },
    ],
    group_leader: [
      { name: 'Dashboard', href: '/dashboard', icon: Home },
      { name: 'My Group', href: '/groups', icon: Users },
      { name: 'Transactions', href: '/transactions', icon: Wallet },
      { name: 'Loan Requests', href: '/loans', icon: Landmark },
    ],
    member: [
      { name: 'Dashboard', href: '/dashboard', icon: Home },
      { name: 'My Savings', href: '/transactions', icon: Wallet },
      { name: 'My Loans', href: '/loans', icon: Landmark },
    ],
  };

  const navigation = menus[user?.role] || menus.member;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Get role badge color
  const getRoleBadge = () => {
    switch(user?.role) {
      case 'cbl_admin': return 'text-purple-300 bg-purple-500/20 border-purple-500/30';
      case 'group_leader': return 'text-blue-300 bg-blue-500/20 border-blue-500/30';
      default: return 'text-emerald-300 bg-emerald-500/20 border-emerald-500/30';
    }
  };

  const getRoleName = () => {
    switch(user?.role) {
      case 'cbl_admin': return 'Central Bank Admin';
      case 'group_leader': return 'Group Leader';
      default: return 'Member';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-20 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-30 w-64 bg-black/50 backdrop-blur-xl border-r border-white/10 transform transition-transform duration-300 lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        
        <div className="flex items-center justify-between h-16 px-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">V</span>
            </div>
            <span className="text-white font-bold text-xl">VSLA</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-400">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* User info in sidebar */}
        <div className="px-4 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center">
              <span className="text-white font-bold">{user?.full_name?.charAt(0) || 'U'}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{user?.full_name}</p>
              <p className="text-gray-400 text-xs truncate">{user?.username}</p>
            </div>
          </div>
          <div className="mt-2">
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getRoleBadge()}`}>
              <Shield size={10} className="mr-1" />
              {getRoleName()}
            </span>
          </div>
        </div>

        <nav className="mt-4 px-4">
          {navigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition mb-1 ${
                location.pathname === item.href
                  ? 'bg-white/10 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span className="font-medium">{item.name}</span>
            </Link>
          ))}
        </nav>

        {/* Logout button */}
        <div className="absolute bottom-0 w-full p-4 border-t border-white/10">
          <button onClick={handleLogout} className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition">
            <LogOut className="h-5 w-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        
        {/* Top bar */}
        <div className="sticky top-0 z-10 bg-black/30 backdrop-blur-xl border-b border-white/10">
          <div className="flex items-center justify-between h-16 px-6">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-gray-400">
              <Menu className="h-6 w-6" />
            </button>

            <div className="flex items-center gap-4">
              <Link to="/notifications" className="text-gray-400 hover:text-white relative">
                <Bell className="h-5 w-5" />
              </Link>
              <Link to="/profile" className="flex items-center gap-2 text-gray-300 hover:text-white">
                <UserCircle className="h-5 w-5" />
                <span className="hidden md:inline text-sm">Profile</span>
              </Link>
            </div>
          </div>
        </div>

        <main className="p-6">
          <Outlet />
        </main>

      </div>
    </div>
  );
};

export default Layout;