import React, { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../store/authStore';
import api from '../api/axios';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Users, CheckSquare, Activity, Sparkles } from 'lucide-react';

export default function Dashboard() {
  const { token, organization } = useAuthStore();
  
  const [stats, setStats] = useState({
    totalEmployees: 0,
    activeTasks: 0,
    completedTasks: 0,
  });
  
  const [chartData, setChartData] = useState<any[]>([]);
  const [liveEvent, setLiveEvent] = useState<string | null>(null);
  
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [empRes, taskRes] = await Promise.all([
          api.get('/employees'),
          api.get('/tasks')
        ]);

        const employees = empRes.data.data;
        const tasks = taskRes.data.data;

        setStats({
          totalEmployees: employees.length,
          activeTasks: tasks.filter((t: any) => t.status === 'in_progress' || t.status === 'assigned').length,
          completedTasks: tasks.filter((t: any) => t.status === 'completed').length,
        });

        setChartData([
          { name: 'Mon', tasks: Math.floor(Math.random() * 5) + 1 },
          { name: 'Tue', tasks: Math.floor(Math.random() * 8) + 2 },
          { name: 'Wed', tasks: Math.floor(Math.random() * 10) + 3 },
          { name: 'Thu', tasks: tasks.filter((t: any) => t.status === 'completed').length }, 
          { name: 'Fri', tasks: 0 },
        ]);

      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
      }
    };

    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (!token) return;

    const ws = new WebSocket(`ws://localhost:5000?token=${token}`);
    wsRef.current = ws;

    ws.onopen = () => console.log('Dashboard connected to live feed');

    ws.onmessage = (event) => {
      const parsed = JSON.parse(event.data);
      
      if (parsed.event === 'dashboard.task_completed') {
        
        setLiveEvent(`Task completed by Employee ID: ${parsed.data.employeeId.substring(0,8)}...`);
        setTimeout(() => setLiveEvent(null), 4000);

        setStats(prev => ({
          ...prev,
          activeTasks: Math.max(0, prev.activeTasks - 1),
          completedTasks: prev.completedTasks + 1
        }));
      }
    };

    ws.onclose = () => console.log('Dashboard disconnected from live feed');

    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, [token]);

  return (
    <div className="space-y-6">
      
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Overview</h1>
          <p className="text-slate-400 text-sm mt-1">Welcome back to {organization?.name || 'your workspace'}.</p>
        </div>
        
        {liveEvent && (
          <div className="flex items-center px-4 py-2 bg-emerald-500/10 border border-emerald-500/50 text-emerald-400 rounded-full animate-pulse text-sm">
            <Activity className="w-4 h-4 mr-2" />
            Live: {liveEvent}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#1e293b] p-6 rounded-xl border border-[#334155] relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10"><Users className="w-16 h-16 text-indigo-500" /></div>
          <h3 className="text-slate-400 text-sm font-medium">Total Employees</h3>
          <p className="text-3xl font-bold text-white mt-2">{stats.totalEmployees}</p>
        </div>
        
        <div className="bg-[#1e293b] p-6 rounded-xl border border-[#334155] relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10"><Activity className="w-16 h-16 text-amber-500" /></div>
          <h3 className="text-slate-400 text-sm font-medium">Active Tasks</h3>
          <p className="text-3xl font-bold text-amber-400 mt-2">{stats.activeTasks}</p>
        </div>
        
        <div className="bg-[#1e293b] p-6 rounded-xl border border-[#334155] relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10"><CheckSquare className="w-16 h-16 text-emerald-500" /></div>
          <h3 className="text-slate-400 text-sm font-medium">Completed Tasks</h3>
          <p className="text-3xl font-bold text-emerald-400 mt-2">{stats.completedTasks}</p>
        </div>
      </div>
      
      <div className="bg-[#1e293b] p-6 rounded-xl border border-[#334155]">
        <div className="flex items-center mb-6">
          <Sparkles className="w-5 h-5 text-indigo-400 mr-2" />
          <h3 className="text-lg font-bold text-white">Weekly Productivity Trend</h3>
        </div>
        
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis dataKey="name" stroke="#94a3b8" tick={{fill: '#94a3b8'}} axisLine={false} tickLine={false} />
              <YAxis stroke="#94a3b8" tick={{fill: '#94a3b8'}} axisLine={false} tickLine={false} />
              <Tooltip 
                cursor={{fill: '#334155', opacity: 0.4}}
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc', borderRadius: '8px' }}
              />
              <Bar dataKey="tasks" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}