import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { 
  Plus, 
  MoreHorizontal, 
  Search, 
  Clock, 
  CheckCircle2, 
  ArrowRight,
  CircleDashed,
  AlertCircle
} from 'lucide-react';
import api from '../api/axios';
import CreateTaskModal from '../components/tasks/CreateTaskModal';

// Shadcn UI Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export default function Tasks() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  const queryClient = useQueryClient();

  // 1. DATA FETCHING
  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const res = await api.get('/tasks');
      return res.data.data || []; 
    }
  });

  // 2. MUTATION: Update Status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ taskId, newStatus }: { taskId: string, newStatus: string }) => {
      await api.patch(`/tasks/${taskId}/status`, { status: newStatus });
    },
    onMutate: async ({ taskId, newStatus }) => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] });
      const previousTasks = queryClient.getQueryData(['tasks']);
      queryClient.setQueryData(['tasks'], (old: any) => 
        old?.map((t: any) => t.id === taskId ? { ...t, status: newStatus } : t)
      );
      return { previousTasks };
    },
    onError: (err, newTodo, context) => {
      queryClient.setQueryData(['tasks'], context?.previousTasks);
      toast.error('Failed to update task status');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
    onSuccess: (_, variables) => {
      toast.success(`Task status updated`);
    }
  });

  const updateStatus = (taskId: string, newStatus: string) => {
    updateStatusMutation.mutate({ taskId, newStatus });
  };

  // 3. FILTERING LOGIC
  const filteredTasks = tasks.filter((task: any) => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // 4. UI HELPERS
  const getPriorityBadge = (priority: string) => {
    switch(priority) {
      case 'high': return <Badge variant="destructive" className="uppercase text-[10px]">High</Badge>;
      case 'medium': return <Badge variant="default" className="uppercase text-[10px] bg-amber-500 hover:bg-amber-600 text-white border-transparent">Med</Badge>;
      case 'low': return <Badge variant="secondary" className="uppercase text-[10px]">Low</Badge>;
      default: return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getStatusDisplay = (status: string) => {
    switch(status) {
      case 'assigned': 
        return <div className="flex items-center text-blue-500 font-medium"><CircleDashed className="w-4 h-4 mr-2" /> Assigned</div>;
      case 'in_progress': 
        return <div className="flex items-center text-amber-500 font-medium"><Clock className="w-4 h-4 mr-2" /> In Progress</div>;
      case 'completed': 
        return <div className="flex items-center text-emerald-500 font-medium"><CheckCircle2 className="w-4 h-4 mr-2" /> Completed</div>;
      default: 
        return <div className="flex items-center text-muted-foreground"><AlertCircle className="w-4 h-4 mr-2" /> Unknown</div>;
    }
  };

  const safelyParseJSON = (data: any) => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    try { return JSON.parse(data); } catch { return []; }
  };

  return (
    <div className="h-full flex flex-col space-y-6 max-w-[1400px] mx-auto">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Tasks Directory</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage, filter, and track workforce assignments at scale.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" /> Create Task
        </Button>
      </div>

      {/* TOOLBAR (Filters & Search) */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 bg-card p-4 rounded-lg border border-border shadow-sm">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search tasks by title..." 
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="assigned">Assigned</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* DATA TABLE */}
      <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden flex-1">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-[40%]">Task Detail</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Assignee ID</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                // Loading State
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-[250px]" /><Skeleton className="h-4 w-[150px] mt-2" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-[100px]" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-[60px]" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-[120px]" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto rounded-md" /></TableCell>
                  </TableRow>
                ))
              ) : filteredTasks.length === 0 ? (
                // Empty State
                <TableRow>
                  <TableCell colSpan={5} className="h-48 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <CircleDashed className="h-8 w-8 mb-2 opacity-20" />
                      <p>No tasks found matching your criteria.</p>
                      <Button variant="link" onClick={() => {setSearchQuery(''); setStatusFilter('all');}}>Clear filters</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                // Data Rows
                filteredTasks.map((task: any) => (
                  <TableRow key={task.id} className="group hover:bg-muted/30 transition-colors">
                    
                    <TableCell>
                      <div className="font-medium text-foreground">{task.title}</div>
                      <div className="flex gap-1.5 mt-1.5">
                        {safelyParseJSON(task.required_skills).map((skill: string, idx: number) => (
                          <Badge key={idx} variant="secondary" className="text-[10px] px-1.5 py-0 font-normal bg-muted text-muted-foreground">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>

                    <TableCell>
                      {getStatusDisplay(task.status)}
                    </TableCell>

                    <TableCell>
                      {getPriorityBadge(task.priority)}
                    </TableCell>

                    <TableCell>
                      <span className="font-mono text-xs text-muted-foreground truncate block max-w-[150px]" title={task.assigned_to}>
                        {task.assigned_to || 'Unassigned'}
                      </span>
                    </TableCell>

                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[160px]">
                          <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          
                          {task.status !== 'assigned' && (
                            <DropdownMenuItem onClick={() => updateStatus(task.id, 'assigned')}>
                              <ArrowRight className="mr-2 h-4 w-4 transform rotate-180" /> Re-Assign
                            </DropdownMenuItem>
                          )}
                          
                          {task.status !== 'in_progress' && (
                            <DropdownMenuItem onClick={() => updateStatus(task.id, 'in_progress')}>
                              <Clock className="mr-2 h-4 w-4" /> Start Task
                            </DropdownMenuItem>
                          )}
                          
                          {task.status !== 'completed' && (
                            <DropdownMenuItem onClick={() => updateStatus(task.id, 'completed')}>
                              <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-500" /> Complete Task
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>

                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        
        {/* Pagination Placeholder (Ready for Backend integration later) */}
        {!isLoading && filteredTasks.length > 0 && (
          <div className="border-t border-border p-4 flex items-center justify-between text-sm text-muted-foreground bg-muted/20">
            <div>Showing {filteredTasks.length} of {tasks.length} total tasks</div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled>Previous</Button>
              <Button variant="outline" size="sm" disabled>Next</Button>
            </div>
          </div>
        )}
      </div>

      <CreateTaskModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={() => { 
          setIsModalOpen(false); 
          queryClient.invalidateQueries({ queryKey: ['tasks'] }); 
          toast.success("Task created successfully!");
        }} 
      />
    </div>
  );
}