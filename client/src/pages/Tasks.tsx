import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import CreateTaskModal from '../components/tasks/CreateTaskModal';
import { Plus, Clock, CheckCircle2, ArrowRight } from 'lucide-react';

export default function Tasks() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchTasks = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/tasks');
      setTasks(res.data.data);
    } catch (err) {
      console.error("Failed to fetch tasks", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const updateStatus = async (taskId: string, newStatus: string) => {
    try {
      setTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
      
      await api.patch(`/tasks/${taskId}/status`, { status: newStatus });
    } catch (err) {
      console.error("Failed to update status", err);
      fetchTasks();
    }
  };

  const getPriorityColor = (priority: string) => {
    switch(priority) {
      case 'high': return 'text-red-400 bg-red-400/10 border-red-400/20';
      case 'medium': return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
      case 'low': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
      default: return 'text-slate-400 bg-slate-400/10 border-slate-400/20';
    }
  };

  const columns = [
    { id: 'assigned', title: 'Assigned', color: 'border-blue-500' },
    { id: 'in_progress', title: 'In Progress', color: 'border-amber-500' },
    { id: 'completed', title: 'Completed', color: 'border-emerald-500' }
  ];

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Task Board</h1>
          <p className="text-slate-400 text-sm mt-1">Manage and track workforce assignments.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors">
          <Plus className="w-5 h-5 mr-1" /> Create Task
        </button>
      </div>

      {isLoading ? (
        <div className="text-slate-400">Loading tasks...</div>
      ) : (
        <div className="flex-1 flex gap-6 overflow-x-auto pb-4">
          {columns.map(col => (
            <div key={col.id} className="flex-1 min-w-[320px] bg-[#1e293b]/50 rounded-xl border border-[#334155] flex flex-col">
              
              <div className={`p-4 border-b border-[#334155] border-t-2 ${col.color} rounded-t-xl bg-[#1e293b]`}>
                <h3 className="font-semibold text-white capitalize">{col.title}</h3>
                <span className="text-xs text-slate-400">{tasks.filter(t => t.status === col.id).length} Tasks</span>
              </div>

              <div className="p-4 flex-1 space-y-4 overflow-y-auto">
                {tasks.filter(t => t.status === col.id).map(task => (
                  <div key={task.id} className="bg-[#0f172a] p-4 rounded-lg border border-[#334155] shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                    </div>
                    
                    <h4 className="text-white font-medium mb-1">{task.title}</h4>
                    
                    <div className="flex flex-wrap gap-1 mb-4 mt-2">
                      {task.required_skills && safelyParseJSON(task.required_skills).map((skill: string, idx: number) => (
                        <span key={idx} className="text-[10px] text-slate-400 bg-[#1e293b] px-1.5 py-0.5 rounded">{skill}</span>
                      ))}
                    </div>

                    <div className="flex justify-between items-center pt-3 border-t border-[#334155]">
                      <span className="text-xs text-slate-500 font-mono truncate w-24" title={task.assigned_to}>
                        {task.assigned_to ? 'Assigned' : 'Unassigned'}
                      </span>
                      
                      <div className="flex space-x-2">
                        {task.status === 'assigned' && (
                          <button onClick={() => updateStatus(task.id, 'in_progress')} className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-amber-400/10 rounded transition-colors" title="Start Task">
                            <Clock className="w-4 h-4" />
                          </button>
                        )}
                        {task.status === 'in_progress' && (
                          <button onClick={() => updateStatus(task.id, 'completed')} className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-emerald-400/10 rounded transition-colors" title="Complete Task">
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        )}
                        {task.status === 'completed' && (
                          <button onClick={() => updateStatus(task.id, 'assigned')} className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-blue-400/10 rounded transition-colors" title="Reopen Task">
                            <ArrowRight className="w-4 h-4 transform rotate-180" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <CreateTaskModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={() => { setIsModalOpen(false); fetchTasks(); }} />
    </div>
  );
}

const safelyParseJSON = (data: any) => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  try { return JSON.parse(data); } catch { return []; }
};