
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Users, MapPin, Calendar, ChevronRight, Globe, UserPlus } from 'lucide-react';
import { format } from 'date-fns';
import MemberManagementModal from '../components/MemberManagementModal';

const Groups = () => {
  const { user, isCBLAdmin, isGroupLeader } = useAuth();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [newGroup, setNewGroup] = useState({ name: '', location: '', meeting_day: '', county: '' });

  const counties = [
    'Bomi', 'Bong', 'Gbarpolu', 'Grand Bassa', 'Grand Cape Mount', 'Grand Gedeh', 
    'Grand Kru', 'Lofa', 'Margibi', 'Maryland', 'Montserrado', 'Nimba', 
    'Rivercess', 'River Gee', 'Sinoe'
  ];

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/groups');
      setGroups(res.data);
    } catch (err) {
      console.error('Failed to fetch groups:', err);
    } finally {
      setLoading(false);
    }
  };

  const createGroup = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/groups', newGroup);
      setShowCreateModal(false);
      setNewGroup({ name: '', location: '', meeting_day: '', county: '' });
      fetchGroups();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create group');
    }
  };

  const openMemberManagement = (group) => {
    setSelectedGroup(group);
    setShowMemberModal(true);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div></div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">{isCBLAdmin ? 'All VSLA Groups' : isGroupLeader ? 'My Group' : 'Groups'}</h1>
          <p className="text-gray-400 text-sm mt-1">{groups.length} group{groups.length !== 1 ? 's' : ''}</p>
        </div>
        {(isCBLAdmin || isGroupLeader) && (
          <button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl transition">
            <Plus size={18} /> Create Group
          </button>
        )}
      </div>

      {groups.length === 0 ? (
        <div className="text-center py-12 bg-white/5 rounded-xl border border-white/10">
          <Users className="h-12 w-12 text-gray-500 mx-auto mb-3" />
          <p className="text-gray-400">No groups yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {groups.map((group) => (
            <div key={group.id} className="bg-white/5 rounded-xl border border-white/10 p-5 hover:border-white/20 transition hover:-translate-y-1">
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-white font-semibold text-lg">{group.name}</h3>
                <div className="flex gap-1">
                  <span className="bg-indigo-500/20 text-indigo-300 text-xs px-2 py-1 rounded-full">{group.member_count || 0} members</span>
                  {isGroupLeader && group.leader_id === user?.id && (
                    <button 
                      onClick={() => openMemberManagement(group)} 
                      className="bg-green-500/20 text-green-300 text-xs px-2 py-1 rounded-full hover:bg-green-500/30 transition flex items-center gap-1" 
                      title="Manage Members"
                    >
                      <UserPlus size={10} /> Manage
                    </button>
                  )}
                </div>
              </div>
              <div className="space-y-2 text-sm">
                {group.county && <div className="flex items-center gap-2 text-gray-400"><Globe size={14} /> {group.county} County</div>}
                {group.location && <div className="flex items-center gap-2 text-gray-400"><MapPin size={14} /> {group.location}</div>}
                {group.meeting_day && <div className="flex items-center gap-2 text-gray-400"><Calendar size={14} /> Meetings: {group.meeting_day}s</div>}
                <div className="text-gray-500 text-xs">Created: {format(new Date(group.created_at), 'MMM dd, yyyy')}</div>
                <div className="text-gray-500 text-xs">Leader: {group.leader_name}</div>
              </div>
              <div className="mt-4 pt-3 border-t border-white/10 flex justify-end">
                <button onClick={() => openMemberManagement(group)} className="text-indigo-400 text-sm flex items-center gap-1 hover:gap-2 transition-all">
                  View Members <ChevronRight size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-md border border-gray-700">
            <h2 className="text-xl font-bold text-white mb-4">Create New Group</h2>
            <form onSubmit={createGroup}>
              <div className="mb-4"><label className="block text-sm text-gray-400 mb-1">Group Name *</label><input type="text" value={newGroup.name} onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })} className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white" required /></div>
              <div className="mb-4"><label className="block text-sm text-gray-400 mb-1">County *</label><select value={newGroup.county} onChange={(e) => setNewGroup({ ...newGroup, county: e.target.value })} className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white" required><option value="">Select County</option>{counties.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
              <div className="mb-4"><label className="block text-sm text-gray-400 mb-1">Location/Town</label><input type="text" value={newGroup.location} onChange={(e) => setNewGroup({ ...newGroup, location: e.target.value })} className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white" /></div>
              <div className="mb-6"><label className="block text-sm text-gray-400 mb-1">Meeting Day</label><select value={newGroup.meeting_day} onChange={(e) => setNewGroup({ ...newGroup, meeting_day: e.target.value })} className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"><option value="">Select a day</option>{['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (<option key={day} value={day.toLowerCase()}>{day}</option>))}</select></div>
              <div className="flex gap-3"><button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 py-2 rounded-lg border border-gray-600 text-gray-300">Cancel</button><button type="submit" className="flex-1 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700">Create Group</button></div>
            </form>
          </div>
        </div>
      )}

      {showMemberModal && selectedGroup && (
        <MemberManagementModal 
          isOpen={showMemberModal} 
          onClose={() => setShowMemberModal(false)} 
          group={selectedGroup} 
          onSuccess={fetchGroups} 
        />
      )}
    </div>
  );
};

export default Groups;
