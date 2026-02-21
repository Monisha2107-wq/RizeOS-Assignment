import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { 
  Plus, MoreHorizontal, Search, Clock, CheckCircle2, 
  ChevronLeft, ChevronRight, CircleDashed, AlertCircle, 
  Edit2, Trash2, ShieldCheck 
} from 'lucide-react';
import api from '../api/axios';
import { format, isPast, isWithinInterval, addDays } from 'date-fns';

import CreateTaskModal from '../components/tasks/CreateTaskModal';
import EditTaskModal from '../components/tasks/EditTaskModal';
import DeleteConfirmDialog from '../components/shared/DeleteConfirmDialog';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';

function useDebounce(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export default function Tasks() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search, 400);
  const [modals, setModals] = useState({ create: false, edit: false, delete: false });
  const [selectedTask, setSelectedTask] = useState<any>(null);

  const { data: responseData, isLoading } = useQuery({
    queryKey: ['tasks', page, statusFilter, debouncedSearch],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(debouncedSearch && { search: debouncedSearch })
      });
      const res = await api.get(`/tasks?${params}`);
      return res.data;
    }
  });

  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const res = await api.get('/employees');
      return res.data.data || [];
    }
  });

  const tasks = responseData?.data || [];
  const pagination = responseData?.pagination || { totalPages: 1, total: 0 };

  const editMutation = useMutation({
    mutationFn: async (updates: any) => api.patch(`/tasks/${selectedTask.id}`, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Task updated successfully');
      setModals({ ...modals, edit: false });
    },
    onError: () => toast.error('Failed to update task')
  });

  const deleteMutation = useMutation({
    mutationFn: async () => api.delete(`/tasks/${selectedTask.id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Task deleted');
      setModals({ ...modals, delete: false });
    },
    onError: () => toast.error('Failed to delete task')
  });

  const statusMutation = useMutation({
    mutationFn: async ({ taskId, newStatus }: any) => api.patch(`/tasks/${taskId}/status`, { status: newStatus }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardData'] });
      toast.success('Status updated');
    }
  });

  const getPriorityBadge = (p: string) => {
    switch(p) {
      case 'high': return <Badge variant="destructive" className="uppercase text-[10px]">High</Badge>;
      case 'medium': return <Badge variant="default" className="uppercase text-[10px] bg-amber-500 hover:bg-amber-600 text-white border-transparent">Med</Badge>;
      case 'low': return <Badge variant="secondary" className="uppercase text-[10px]">Low</Badge>;
      default: return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getDeadlineDisplay = (deadline: string | null, status: string) => {
    if (!deadline) return <span className="text-muted-foreground text-xs italic">No deadline</span>;
    const date = new Date(deadline);
    const isCompleted = status === 'completed';

    if (!isCompleted && isPast(date)) {
      return (
        <div className="flex flex-col">
          <span className="text-xs text-destructive font-bold">{format(date, 'MMM d, p')}</span>
          <Badge variant="destructive" className="text-[8px] h-4 w-fit px-1 mt-1">OVERDUE</Badge>
        </div>
      );
    }

    if (!isCompleted && isWithinInterval(date, { start: new Date(), end: addDays(new Date(), 2) })) {
      return (
        <div className="flex flex-col">
          <span className="text-xs text-amber-600 font-bold">{format(date, 'MMM d, p')}</span>
          <Badge variant="outline" className="text-[8px] h-4 w-fit px-1 mt-1 border-amber-500 text-amber-600">DUE SOON</Badge>
        </div>
      );
    }

    return <span className="text-xs text-muted-foreground">{format(date, 'MMM d, yyyy')}</span>;
  };

  const getStatusDisplay = (s: string) => {
    switch(s) {
      case 'assigned': return <div className="flex items-center text-blue-500 font-medium"><CircleDashed className="w-4 h-4 mr-2" /> Assigned</div>;
      case 'in_progress': return <div className="flex items-center text-amber-500 font-medium"><Clock className="w-4 h-4 mr-2" /> In Progress</div>;
      case 'completed': return <div className="flex items-center text-emerald-500 font-medium"><CheckCircle2 className="w-4 h-4 mr-2" /> Completed</div>;
      default: return <div className="flex items-center text-muted-foreground"><AlertCircle className="w-4 h-4 mr-2" /> Unknown</div>;
    }
  };

  const safelyParseSkills = (data: any) => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    try { return JSON.parse(data); } catch { return []; }
  };

  return (
    <div className="h-full flex flex-col space-y-6 max-w-[1400px] mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tasks Directory</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage workforce assignments and deadlines.</p>
        </div>
        <Button onClick={() => setModals({ ...modals, create: true })}>
          <Plus className="w-4 h-4 mr-2" /> Create Task
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row justify-between gap-4 bg-card p-4 rounded-lg border border-border shadow-sm">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search 1M+ tasks..." 
            className="pl-9"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <Select value={statusFilter} onValueChange={(val) => { setStatusFilter(val); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="assigned">Assigned</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden flex-1">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="w-[30%]">Task Detail</TableHead>
              <TableHead>Deadline</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Assignee</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-5 w-[200px]" /><Skeleton className="h-4 w-[120px] mt-2" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-[100px]" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-[80px]" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-[60px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[120px]" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : tasks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-48 text-center text-muted-foreground">
                  No tasks found matching your criteria.
                </TableCell>
              </TableRow>
            ) : (
              tasks.map((task: any) => {
                const assignee = employees.find((e: any) => e.id === task.assigned_to);
                return (
                  <TableRow key={task.id} className="group hover:bg-muted/30 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="font-medium text-foreground">{task.title}</div>
                        {task.status === 'completed' && (
                          <Badge variant="outline" className="h-5 gap-1 bg-indigo-500/5 text-indigo-600 border-indigo-500/20 text-[9px] uppercase font-bold">
                            <ShieldCheck className="w-3 h-3" /> Verified
                          </Badge>
                        )}
                      </div>
                      <div className="flex gap-1.5 mt-1.5">
                        {safelyParseSkills(task.required_skills).map((skill: string, idx: number) => (
                          <Badge key={idx} variant="secondary" className="text-[10px] px-1.5 py-0 font-normal bg-muted text-muted-foreground">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>{getDeadlineDisplay(task.deadline, task.status)}</TableCell>
                    <TableCell>{getStatusDisplay(task.status)}</TableCell>
                    <TableCell>{getPriorityBadge(task.priority)}</TableCell>
                    <TableCell>
                      <span className="text-xs font-medium text-muted-foreground">
                        {assignee ? assignee.name : 'Unassigned'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[180px]">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => { setSelectedTask(task); setModals({ ...modals, edit: true }); }}>
                            <Edit2 className="mr-2 h-4 w-4" /> Edit Details
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuLabel className="text-[10px] text-muted-foreground uppercase">Status</DropdownMenuLabel>
                          {task.status !== 'in_progress' && task.status !== 'completed' && (
                            <DropdownMenuItem onClick={() => statusMutation.mutate({ taskId: task.id, newStatus: 'in_progress' })}>
                              <Clock className="mr-2 h-4 w-4" /> Start Working
                            </DropdownMenuItem>
                          )}
                          {task.status !== 'completed' && (
                            <DropdownMenuItem onClick={() => statusMutation.mutate({ taskId: task.id, newStatus: 'completed' })}>
                              <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-500" /> Mark Done
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive" onClick={() => { setSelectedTask(task); setModals({ ...modals, delete: true }); }}>
                            <Trash2 className="mr-2 h-4 w-4" /> Delete Task
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between px-2 py-4 border-t">
        <p className="text-sm text-muted-foreground">
          Showing {tasks.length} of {pagination.total} tasks
        </p>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium">Page {page} of {pagination.totalPages}</span>
          <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))} disabled={page === pagination.totalPages}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <CreateTaskModal 
        isOpen={modals.create} 
        onClose={() => setModals({ ...modals, create: false })} 
        onSuccess={() => {
          setModals({ ...modals, create: false });
          toast.success("Task added to workforce queue");
          queryClient.invalidateQueries({ queryKey: ['tasks'] });
        }} 
      />

      <EditTaskModal 
        isOpen={modals.edit} 
        task={selectedTask} 
        employees={employees}
        onClose={() => setModals({ ...modals, edit: false })} 
        onUpdate={editMutation.mutate}
        isLoading={editMutation.isPending}
      />
      
      <DeleteConfirmDialog 
        isOpen={modals.delete} 
        onClose={() => setModals({ ...modals, delete: false })} 
        onConfirm={deleteMutation.mutate}
        isLoading={deleteMutation.isPending}
        title="Delete Task"
        description={`Are you sure you want to delete "${selectedTask?.title}"?`}
      />
    </div>
  );
}