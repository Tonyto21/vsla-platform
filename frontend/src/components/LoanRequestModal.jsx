
import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { X, DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';

const LoanRequestModal = ({ isOpen, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [interestRate, setInterestRate] = useState(10);
  const [duration, setDuration] = useState(6);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      const groupsRes = await axios.get('http://localhost:5000/api/groups');
      if (!groupsRes.data || groupsRes.data.length === 0) {
        toast.error('You are not assigned to any group.');
        setLoading(false);
        return;
      }
      
      const group = groupsRes.data[0];
      await axios.post(`http://localhost:5000/api/groups/${group.id}/loans`, {
        amount: parseFloat(amount),
        currency: currency,
        interest_rate: parseFloat(interestRate),
        duration_months: parseInt(duration)
      });
      
      toast.success(`Loan request of ${amount} ${currency} submitted!`);
      if (onSuccess) onSuccess();
      onClose();
      setAmount('');
      setCurrency('USD');
      setInterestRate(10);
      setDuration(6);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit loan request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-md border border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">Request a Loan</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="mb-4"><label className="block text-sm text-gray-400 mb-1">Amount *</label><input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white" placeholder="Enter amount" required /></div>
          <div className="mb-4"><label className="block text-sm text-gray-400 mb-1">Currency *</label><select value={currency} onChange={(e) => setCurrency(e.target.value)} className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"><option value="USD">USD - US Dollar</option><option value="LRD">LRD - Liberian Dollar</option></select></div>
          <div className="mb-4"><label className="block text-sm text-gray-400 mb-1">Interest Rate (%) *</label><input type="number" step="0.5" value={interestRate} onChange={(e) => setInterestRate(parseFloat(e.target.value))} className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white" required /></div>
          <div className="mb-6"><label className="block text-sm text-gray-400 mb-1">Duration (months) *</label><input type="number" value={duration} onChange={(e) => setDuration(parseInt(e.target.value))} className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white" required /></div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-2 rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-700 transition">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition flex items-center justify-center gap-2">
              <DollarSign size={16} /> {loading ? 'Submitting...' : 'Submit Loan Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoanRequestModal;
