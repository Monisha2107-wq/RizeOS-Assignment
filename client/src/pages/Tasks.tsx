import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { 
  Plus, MoreHorizontal, Search, Clock, CheckCircle2, 
  ArrowRight, CircleDashed, AlertCircle, Edit2, Trash2 
} from 'lucide-react';
import api from '../api/axios';

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

export default function Tasks() {
  const queryClient = useQueryClient();
  const [modals, setModals] = useState({ create: false, edit: false, delete: false });
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const res = await api.get('/tasks');
      return res.data.data || []; 
    }
  });

  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const res = await api.get('/employees');
      return res.data.data || [];
    }
  });

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

  const filteredTasks = tasks.filter((task: any) => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getPriorityBadge = (p: string) => {
    switch(p) {
      case 'high': return <Badge variant="destructive" className="uppercase text-[10px]">High</Badge>;
      case 'medium': return <Badge variant="default" className="uppercase text-[10px] bg-amber-500 hover:bg-amber-600 text-white border-transparent">Med</Badge>;
      case 'low': return <Badge variant="secondary" className="uppercase text-[10px]">Low</Badge>;
      default: return <Badge variant="outline">Unknown</Badge>;
    }
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
          <p className="text-muted-foreground text-sm mt-1">Manage and track workforce assignments.</p>
        </div>
        <Button onClick={() => setModals({ ...modals, create: true })}>
          <Plus className="w-4 h-4 mr-2" /> Create Task
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row justify-between gap-4 bg-card p-4 rounded-lg border border-border shadow-sm">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search tasks..." 
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
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
              <TableHead className="w-[40%]">Task Detail</TableHead>
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
                  <TableCell><Skeleton className="h-5 w-[250px]" /><Skeleton className="h-4 w-[150px] mt-2" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-[100px]" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-[60px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[120px]" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : filteredTasks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-48 text-center text-muted-foreground">
                  No tasks found matching your criteria.
                </TableCell>
              </TableRow>
            ) : (
              filteredTasks.map((task: any) => {
                const assignee = employees.find((e: any) => e.id === task.assigned_to);
                return (
                  <TableRow key={task.id} className="group hover:bg-muted/30 transition-colors">
                    <TableCell>
                      <div className="font-medium text-foreground">{task.title}</div>
                      <div className="flex gap-1.5 mt-1.5">
                        {safelyParseSkills(task.required_skills).map((skill: string, idx: number) => (
                          <Badge key={idx} variant="secondary" className="text-[10px] px-1.5 py-0 font-normal bg-muted text-muted-foreground">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
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
                          {task.status !== 'in_progress' && (
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

      <CreateTaskModal 
        isOpen={modals.create} 
        onClose={() => setModals({ ...modals, create: false })} 
        onSuccess={() => {
          setModals({ ...modals, create: false });
          toast.success("Task added to workforce queue");
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