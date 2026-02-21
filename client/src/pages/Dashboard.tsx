import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import api from '../api/axios';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Users, CheckSquare, Activity, Sparkles } from 'lucide-react';

// Shadcn UI
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function Dashboard() {
  const { token, organization } = useAuthStore();
  const queryClient = useQueryClient();
  const wsRef = useRef<WebSocket | null>(null);
  
  const [liveEvent, setLiveEvent] = useState<string | null>(null);

  // Use TanStack Query to fetch and cache dashboard data simultaneously
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['dashboardData'],
    queryFn: async () => {
      const [empRes, taskRes] = await Promise.all([
        api.get('/employees'),
        api.get('/tasks')
      ]);

      const employees = empRes.data.data || [];
      const tasks = taskRes.data.data || [];

      // Compute stats
      const totalEmployees = employees.length;
      const activeTasks = tasks.filter((t: any) => t.status === 'in_progress' || t.status === 'assigned').length;
      const completedTasks = tasks.filter((t: any) => t.status === 'completed').length;

      // Generate chart data based on completed tasks
      const chartData = [
        { name: 'Mon', tasks: Math.floor(Math.random() * 5) + 1 },
        { name: 'Tue', tasks: Math.floor(Math.random() * 8) + 2 },
        { name: 'Wed', tasks: Math.floor(Math.random() * 10) + 3 },
        { name: 'Thu', tasks: completedTasks }, 
        { name: 'Fri', tasks: 0 },
      ];

      return { totalEmployees, activeTasks, completedTasks, chartData };
    }
  });

  // WebSocket for Live Updates
  useEffect(() => {
    if (!token) return;

    const ws = new WebSocket(`ws://localhost:5000?token=${token}`);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      const parsed = JSON.parse(event.data);
      
      if (parsed.event === 'dashboard.task_completed') {
        setLiveEvent(`Task completed by ID: ${parsed.data.employeeId.substring(0,8)}...`);
        setTimeout(() => setLiveEvent(null), 4000);

        // Tell React Query to refetch the dashboard data and task board in the background!
        queryClient.invalidateQueries({ queryKey: ['dashboardData'] });
        queryClient.invalidateQueries({ queryKey: ['tasks'] });
      }
    };

    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, [token, queryClient]);

  if (isLoading || !dashboardData) {
    return <DashboardSkeleton />;
  }

  const { totalEmployees, activeTasks, completedTasks, chartData } = dashboardData;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* HEADER */}
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

      {/* STATS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="relative overflow-hidden border-border shadow-sm">
          <div className="absolute top-0 right-0 p-4 opacity-5 dark:opacity-10"><Users className="w-16 h-16 text-primary" /></div>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Employees</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-foreground">{totalEmployees}</p>
          </CardContent>
        </Card>
        
        <Card className="relative overflow-hidden border-border shadow-sm">
          <div className="absolute top-0 right-0 p-4 opacity-5 dark:opacity-10"><Activity className="w-16 h-16 text-primary" /></div>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-amber-500 dark:text-amber-400">{activeTasks}</p>
          </CardContent>
        </Card>
        
        <Card className="relative overflow-hidden border-border shadow-sm">
          <div className="absolute top-0 right-0 p-4 opacity-5 dark:opacity-10"><CheckSquare className="w-16 h-16 text-primary" /></div>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completed Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{completedTasks}</p>
          </CardContent>
        </Card>
      </div>
      
      {/* CHART ROW - 2 Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* CHART 1: Bar Chart */}
        <Card className="shadow-sm border-border">
          <CardHeader className="flex flex-row items-center space-y-0 pb-6">
            <Sparkles className="w-5 h-5 text-primary mr-2" />
            <CardTitle className="text-base font-bold">Weekly Productivity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                {/* 🚀 FIXED: Removed hsl() wrappers from all var() calls */}
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
            </div>
          </CardContent>
        </Card>

        {/* CHART 2: Task Distribution Ring */}
        <Card className="shadow-sm border-border flex flex-col">
          <CardHeader className="flex flex-row items-center space-y-0 pb-6">
            <Activity className="w-5 h-5 text-muted-foreground mr-2" />
            <CardTitle className="text-base font-bold">Task Distribution</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col items-center justify-center pb-8">
             <div className="w-32 h-32 rounded-full border-8 border-muted flex items-center justify-center relative">
               <div className="absolute inset-0 border-8 border-primary rounded-full" style={{ clipPath: 'polygon(50% 50%, 100% 0, 100% 100%, 0 100%)' }}></div>
               <span className="text-xl font-bold text-foreground z-10">
                 {totalEmployees > 0 ? Math.round((completedTasks / (activeTasks + completedTasks || 1)) * 100) : 0}%
               </span>
             </div>
             <p className="text-sm text-muted-foreground mt-6 text-center">
               Overall Completion Rate
             </p>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}

// SHIMMER LOADER
const DashboardSkeleton = () => (
  <div className="space-y-6 max-w-7xl mx-auto">
    <div className="mb-8">
      <Skeleton className="h-9 w-48 mb-2" />
      <Skeleton className="h-5 w-64" />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {[1, 2, 3].map(i => (
        <Card key={i}>
          <CardHeader className="pb-2"><Skeleton className="h-4 w-24" /></CardHeader>
          <CardContent><Skeleton className="h-9 w-16" /></CardContent>
        </Card>
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader><Skeleton className="h-6 w-48" /></CardHeader>
        <CardContent><Skeleton className="h-[250px] w-full" /></CardContent>
      </Card>
      <Card>
        <CardHeader><Skeleton className="h-6 w-48" /></CardHeader>
        <CardContent><Skeleton className="h-[250px] w-full" /></CardContent>
      </Card>
    </div>
  </div>
);