
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { X, UserPlus, Trash2, Users } from 'lucide-react';
import toast from 'react-hot-toast';

const MemberManagementModal = ({ isOpen, onClose, group, onSuccess }) => {
  const { user, isCBLAdmin } = useAuth();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addingMember, setAddingMember] = useState(false);
  const [newMember, setNewMember] = useState({ 
    username: '', 
    email: '', 
    full_name: '', 
    gender: '',
    password: 'password123'
  });

  useEffect(() => {
    if (isOpen && group) {
      fetchMembers();
    }
  }, [isOpen, group]);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`http://localhost:5000/api/groups/${group.id}`);
      setMembers(res.data.members || []);
    } catch (err) {
      console.error('Failed to fetch members:', err);
      toast.error('Failed to load members');
    } finally {
      setLoading(false);
    }
  };

  const addMember = async (e) => {
    e.preventDefault();
    
    if (!newMember.full_name || !newMember.username || !newMember.email) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    setAddingMember(true);
    try {
      const userData = {
        username: newMember.username,
        email: newMember.email,
        password: newMember.password,
        full_name: newMember.full_name,
        role: 'member',
        gender: newMember.gender || 'other'
      };
      
      const userRes = await axios.post('http://localhost:5000/api/auth/register', userData);
      
      if (userRes.data.userId) {
        await axios.post(`http://localhost:5000/api/groups/${group.id}/members`, {
          user_id: userRes.data.userId
        });
        
        toast.success(`${newMember.full_name} added to group successfully!`);
        setShowAddForm(false);
        setNewMember({ username: '', email: '', full_name: '', gender: '', password: 'password123' });
        fetchMembers();
        if (onSuccess) onSuccess();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add member. Username or email may already exist.');
    } finally {
      setAddingMember(false);
    }
  };

  const removeMember = async (memberId, memberName) => {
    if (!confirm(`Remove ${memberName} from the group?`)) return;
    try {
      await axios.put(`http://localhost:5000/api/users/${memberId}/remove-group`);
      toast.success(`${memberName} removed from group`);
      fetchMembers();
      if (onSuccess) onSuccess();
    } catch (err) {
      toast.error('Failed to remove member');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-2xl border border-gray-700 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">
            <Users className="inline mr-2" size={20} />
            {group?.name} - Members
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="mb-4 flex justify-between items-center">
          <p className="text-gray-400 text-sm">{members.length} members in this group</p>
          {!isCBLAdmin && (
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded-lg text-sm flex items-center gap-1 transition"
            >
              <UserPlus size={14} /> Add Member
            </button>
          )}
        </div>

        {showAddForm && !isCBLAdmin && (
          <form onSubmit={addMember} className="mb-6 p-4 bg-gray-700/50 rounded-lg">
            <h3 className="text-white font-semibold mb-3">Add New Member</h3>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <input 
                type="text" 
                placeholder="Full Name *" 
                value={newMember.full_name} 
                onChange={(e) => setNewMember({...newMember, full_name: e.target.value})} 
                className="px-3 py-2 bg-gray-600 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-indigo-500" 
                required 
              />
              <input 
                type="text" 
                placeholder="Username *" 
                value={newMember.username} 
                onChange={(e) => setNewMember({...newMember, username: e.target.value})} 
                className="px-3 py-2 bg-gray-600 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-indigo-500" 
                required 
              />
              <input 
                type="email" 
                placeholder="Email *" 
                value={newMember.email} 
                onChange={(e) => setNewMember({...newMember, email: e.target.value})} 
                className="px-3 py-2 bg-gray-600 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-indigo-500" 
                required 
              />
              <select 
                value={newMember.gender} 
                onChange={(e) => setNewMember({...newMember, gender: e.target.value})} 
                className="px-3 py-2 bg-gray-600 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="text-xs text-gray-400 mb-3">
              Default password: <span className="font-mono text-green-400">password123</span>
            </div>
            <div className="flex gap-2">
              <button 
                type="submit" 
                disabled={addingMember}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition flex items-center gap-2"
              >
                <UserPlus size={16} /> {addingMember ? 'Adding...' : 'Add Member'}
              </button>
              <button 
                type="button" 
                onClick={() => setShowAddForm(false)} 
                className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded-lg transition"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <div className="text-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-500 mx-auto"></div></div>
        ) : members.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No members yet. {!isCBLAdmin && 'Add your first member!'}</div>
        ) : (
          <div className="space-y-2">
            {members.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg hover:bg-gray-700/50 transition">
                <div>
                  <p className="text-white font-medium">{member.full_name}</p>
                  <p className="text-gray-400 text-sm">@{member.username} • {member.role === 'group_leader' ? 'Group Leader' : 'Member'}</p>
                  {member.email && <p className="text-gray-500 text-xs">{member.email}</p>}
                </div>
                {!isCBLAdmin && member.role !== 'group_leader' && (
                  <button 
                    onClick={() => removeMember(member.id, member.full_name)} 
                    className="text-red-400 hover:text-red-300 p-1 transition" 
                    title="Remove from group"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MemberManagementModal;
