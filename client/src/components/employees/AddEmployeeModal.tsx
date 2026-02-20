import React, { useState } from 'react';
import { X } from 'lucide-react';
import api from '../../api/axios';

interface AddEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddEmployeeModal({ isOpen, onClose, onSuccess }: AddEmployeeModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: '',
    department: '',
    skills: '',
    wallet_address: ''
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const skillsArray = formData.skills
        .split(',')
        .map(skill => skill.trim())
        .filter(skill => skill.length > 0);

      const payload = {
        ...formData,
        skills: skillsArray
      };

      await api.post('/employees', payload);
      
      setFormData({ name: '', email: '', role: '', department: '', skills: '', wallet_address: '' });
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data?.errors?.[0]?.message || 'Failed to add employee.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-[#1e293b] rounded-xl border border-[#334155] w-full max-w-lg shadow-2xl overflow-hidden">
        
        <div className="flex justify-between items-center p-6 border-b border-[#334155]">
          <h2 className="text-xl font-bold text-white">Add New Employee</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="p-3 bg-red-500/10 border border-red-500/50 rounded text-red-400 text-sm">{error}</div>}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Full Name *</label>
              <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                className="w-full px-3 py-2 bg-[#0f172a] border border-[#334155] rounded-lg text-white focus:outline-none focus:border-indigo-500" placeholder="Jane Doe" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Email *</label>
              <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                className="w-full px-3 py-2 bg-[#0f172a] border border-[#334155] rounded-lg text-white focus:outline-none focus:border-indigo-500" placeholder="jane@company.com" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Role *</label>
              <input type="text" required value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}
                className="w-full px-3 py-2 bg-[#0f172a] border border-[#334155] rounded-lg text-white focus:outline-none focus:border-indigo-500" placeholder="Frontend Dev" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Department</label>
              <input type="text" value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})}
                className="w-full px-3 py-2 bg-[#0f172a] border border-[#334155] rounded-lg text-white focus:outline-none focus:border-indigo-500" placeholder="Engineering" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Skills (comma separated)</label>
            <input type="text" value={formData.skills} onChange={e => setFormData({...formData, skills: e.target.value})}
              className="w-full px-3 py-2 bg-[#0f172a] border border-[#334155] rounded-lg text-white focus:outline-none focus:border-indigo-500" placeholder="React, TypeScript, Node" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Wallet Address (Optional)</label>
            <input type="text" value={formData.wallet_address} onChange={e => setFormData({...formData, wallet_address: e.target.value})}
              className="w-full px-3 py-2 bg-[#0f172a] border border-[#334155] rounded-lg text-white focus:outline-none focus:border-indigo-500" placeholder="0x..." />
          </div>

          <div className="pt-4 flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-slate-300 hover:bg-[#334155] transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={isLoading} className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-colors disabled:opacity-50">
              {isLoading ? 'Saving...' : 'Add Employee'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}