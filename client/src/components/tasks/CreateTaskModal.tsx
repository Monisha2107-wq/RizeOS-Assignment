import React, { useState } from 'react';
import { X, Sparkles, UserCheck } from 'lucide-react';
import api from '../../api/axios';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateTaskModal({ isOpen, onClose, onSuccess }: CreateTaskModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    required_skills: '',
    assigned_to: ''
  });

  const [aiRecommendations, setAiRecommendations] = useState<any[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const fetchAIRecommendations = async () => {
    if (!formData.required_skills) {
      setError("Please enter required skills first to get AI recommendations.");
      return;
    }
    
    setIsAiLoading(true);
    setError('');
    
    try {
      const skillsArray = formData.required_skills.split(',').map(s => s.trim()).filter(s => s);
      const res = await api.post('/ai/smart-assign', { required_skills: skillsArray });
      setAiRecommendations(res.data.data);
    } catch (err: any) {
      setError("Failed to fetch AI recommendations.");
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const skillsArray = formData.required_skills.split(',').map(s => s.trim()).filter(s => s);
      const payload = { ...formData, required_skills: skillsArray };
      
      if (!payload.assigned_to) delete (payload as any).assigned_to;

      await api.post('/tasks', payload);
      
      setFormData({ title: '', description: '', priority: 'medium', required_skills: '', assigned_to: '' });
      setAiRecommendations([]);
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create task.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-[#1e293b] rounded-xl border border-[#334155] w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
        
        <div className="flex justify-between items-center p-6 border-b border-[#334155]">
          <h2 className="text-xl font-bold text-white flex items-center">
            Create Task
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <form id="create-task-form" onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="p-3 bg-red-500/10 border border-red-500/50 rounded text-red-400 text-sm">{error}</div>}

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Task Title *</label>
              <input type="text" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})}
                className="w-full px-3 py-2 bg-[#0f172a] border border-[#334155] rounded-lg text-white focus:border-indigo-500 outline-none" placeholder="Build Dashboard UI" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Priority</label>
                <select value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value})}
                  className="w-full px-3 py-2 bg-[#0f172a] border border-[#334155] rounded-lg text-white focus:border-indigo-500 outline-none">
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Required Skills</label>
                <input type="text" value={formData.required_skills} onChange={e => setFormData({...formData, required_skills: e.target.value})}
                  className="w-full px-3 py-2 bg-[#0f172a] border border-[#334155] rounded-lg text-white focus:border-indigo-500 outline-none" placeholder="React, Node" />
              </div>
            </div>

            <div className="pt-4 border-t border-[#334155]">
              <div className="flex justify-between items-end mb-3">
                <label className="block text-sm font-medium text-slate-300">Assign To (Employee ID)</label>
                <button type="button" onClick={fetchAIRecommendations} disabled={isAiLoading}
                  className="flex items-center text-sm px-3 py-1.5 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 rounded-md transition-colors border border-indigo-500/30">
                  <Sparkles className="w-4 h-4 mr-1.5" />
                  {isAiLoading ? 'Analyzing...' : 'Ask AI for Recommendations'}
                </button>
              </div>

              <input type="text" value={formData.assigned_to} onChange={e => setFormData({...formData, assigned_to: e.target.value})}
                className="w-full px-3 py-2 bg-[#0f172a] border border-[#334155] rounded-lg text-slate-400 focus:border-indigo-500 outline-none mb-3 font-mono text-sm" placeholder="Paste Employee UUID here or select below" />

              {aiRecommendations.length > 0 && (
                <div className="space-y-2 mt-2">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Top AI Matches</p>
                  {aiRecommendations.map((rec, idx) => (
                    <div key={idx} onClick={() => setFormData({...formData, assigned_to: rec.employee_id})}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors flex justify-between items-center
                        ${formData.assigned_to === rec.employee_id ? 'bg-indigo-600/20 border-indigo-500' : 'bg-[#0f172a] border-[#334155] hover:border-slate-500'}`}>
                      <div>
                        <div className="font-medium text-white text-sm">{rec.name} <span className="text-slate-500 font-normal">({rec.role})</span></div>
                        <div className="text-xs text-slate-400 mt-1">{rec.explanation}</div>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className={`text-sm font-bold ${rec.match_score >= 80 ? 'text-emerald-400' : 'text-amber-400'}`}>
                          {rec.match_score}% Match
                        </span>
                        {formData.assigned_to === rec.employee_id && <UserCheck className="w-4 h-4 text-indigo-400 mt-1" />}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </form>
        </div>

        <div className="p-4 border-t border-[#334155] flex justify-end space-x-3 bg-[#1e293b]">
          <button type="button" onClick={onClose} className="px-4 py-2 text-slate-300 hover:bg-[#334155] rounded-lg transition-colors">Cancel</button>
          <button type="submit" form="create-task-form" disabled={isSubmitting} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors disabled:opacity-50">
            {isSubmitting ? 'Creating...' : 'Create Task'}
          </button>
        </div>
      </div>
    </div>
  );
}