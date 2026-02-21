import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import api from '../api/axios';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Users, CheckSquare, Activity, Sparkles, Clock, UserCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function Dashboard() {
  const { token, organization } = useAuthStore();
  const queryClient = useQueryClient();
  const wsRef = useRef<WebSocket | null>(null);
  const [liveEvent, setLiveEvent] = useState<string | null>(null);

  const { data: dashboardData, isLoading: isStatsLoading } = useQuery({
    queryKey: ['dashboardData'],
    queryFn: async () => {
      const [empRes, taskRes] = await Promise.all([
        api.get('/employees'),
        api.get('/tasks')
      ]);

      const employees = empRes.data.data || [];
      const tasks = taskRes.data.data || [];

      return {
        totalEmployees: employees.length,
        activeEmployees: employees.filter((e: any) => e.status === 'active' || !e.status).length,
        assignedTasks: tasks.filter((t: any) => t.status === 'assigned').length,
        inProgressTasks: tasks.filter((t: any) => t.status === 'in_progress').length,
        completedTasks: tasks.filter((t: any) => t.status === 'completed').length,
        totalTasks: tasks.length
      };
    }
  });

  const { data: chartData = [], isLoading: isChartLoading } = useQuery({
    queryKey: ['weeklyStats'],
    queryFn: async () => {
      const res = await api.get('/tasks/stats/weekly');
      return res.data.data;
    }
  });

  useEffect(() => {
    if (!token) return;

    const ws = new WebSocket(`ws://localhost:5000?token=${token}`);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      const parsed = JSON.parse(event.data);
      
      if (parsed.event === 'dashboard.task_completed') {
        setLiveEvent(`Task completed by ID: ${parsed.data.employeeId.substring(0,8)}...`);
        setTimeout(() => setLiveEvent(null), 4000);

        queryClient.invalidateQueries({ queryKey: ['dashboardData'] });
        queryClient.invalidateQueries({ queryKey: ['weeklyStats'] });
        queryClient.invalidateQueries({ queryKey: ['tasks'] });
      }
    };

    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, [token, queryClient]);

  if (isStatsLoading || !dashboardData) {
    return <DashboardSkeleton />;
  }

  const { totalEmployees, activeEmployees, assignedTasks, inProgressTasks, completedTasks, totalTasks } = dashboardData;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const circumference = 2 * Math.PI * 70;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Overview</h1>
          <p className="text-muted-foreground text-sm mt-1">Welcome back to {organization?.name || 'your workspace'}.</p>
        </div>
        
        {liveEvent && (
          <div className="flex items-center px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-full animate-pulse text-sm font-medium">
            <Activity className="w-4 h-4 mr-2" />
            Live: {liveEvent}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="border-border shadow-sm">
          <CardHeader className="pb-2 px-4 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Total Staff</CardTitle>
            <Users className="w-3.5 h-3.5 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-2xl font-bold">{totalEmployees}</p>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardHeader className="pb-2 px-4 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Active Staff</CardTitle>
            <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-2xl font-bold text-emerald-600">{activeEmployees}</p>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardHeader className="pb-2 px-4 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Assigned</CardTitle>
            <Clock className="w-3.5 h-3.5 text-blue-500" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-2xl font-bold text-blue-500">{assignedTasks}</p>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardHeader className="pb-2 px-4 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">In Progress</CardTitle>
            <Activity className="w-3.5 h-3.5 text-amber-500" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-2xl font-bold text-amber-500">{inProgressTasks}</p>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardHeader className="pb-2 px-4 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Completed</CardTitle>
            <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-2xl font-bold text-emerald-600">{completedTasks}</p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-sm border-border">
          <CardHeader className="flex flex-row items-center space-y-0 pb-6">
            <Sparkles className="w-5 h-5 text-primary mr-2" />
            <CardTitle className="text-base font-bold">Weekly Productivity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full">
              {isChartLoading ? (
                <Skeleton className="h-full w-full" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="name" stroke="var(--muted-foreground)" tick={{fontSize: 12, fill: 'var(--muted-foreground)'}} axisLine={false} tickLine={false} />
                    <YAxis stroke="var(--muted-foreground)" tick={{fontSize: 12, fill: 'var(--muted-foreground)'}} axisLine={false} tickLine={false} />
                    <Tooltip 
                      cursor={{fill: 'var(--muted)', opacity: 0.5}}
                      contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', color: 'var(--foreground)', borderRadius: '8px' }}
                    />
                    <Bar dataKey="tasks" fill="var(--primary)" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border flex flex-col">
          <CardHeader className="flex flex-row items-center space-y-0 pb-6">
            <Activity className="w-5 h-5 text-muted-foreground mr-2" />
            <CardTitle className="text-base font-bold">Task Distribution</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col items-center justify-center">
            <div className="relative w-40 h-40 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
                <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-muted/30" />
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  stroke="currentColor"
                  strokeWidth="12"
                  fill="transparent"
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference - (circumference * (completionRate / 100))}
                  strokeLinecap="round"
                  className="text-primary transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-foreground">{completionRate}%</span>
                <span className="text-[10px] uppercase text-muted-foreground font-medium">Done</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 w-full mt-8 pt-4 border-t border-border">
              <div className="text-center">
                <p className="text-[10px] uppercase text-muted-foreground font-semibold">Assigned</p>
                <p className="text-lg font-bold text-blue-500">{assignedTasks}</p>
              </div>
              <div className="text-center border-x border-border">
                <p className="text-[10px] uppercase text-muted-foreground font-semibold">Doing</p>
                <p className="text-lg font-bold text-amber-500">{inProgressTasks}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] uppercase text-muted-foreground font-semibold">Done</p>
                <p className="text-lg font-bold text-emerald-500">{completedTasks}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

const DashboardSkeleton = () => (
  <div className="space-y-6 max-w-7xl mx-auto">
    <div className="mb-8">
      <Skeleton className="h-9 w-48 mb-2" />
      <Skeleton className="h-5 w-64" />
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {[1, 2, 3, 4, 5].map(i => (
        <Card key={i}><CardHeader className="pb-2"><Skeleton className="h-4 w-16" /></CardHeader><CardContent><Skeleton className="h-8 w-10" /></CardContent></Card>
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card><CardHeader><Skeleton className="h-6 w-48" /></CardHeader><CardContent><Skeleton className="h-[250px] w-full" /></CardContent></Card>
      <Card><CardHeader><Skeleton className="h-6 w-48" /></CardHeader><CardContent><Skeleton className="h-[250px] w-full" /></CardContent></Card>
    </div>
  </div>
);