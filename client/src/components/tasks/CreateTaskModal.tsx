import React, { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Sparkles, UserCheck, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../api/axios';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

const taskSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  priority: z.enum(['low', 'medium', 'high']),
  required_skills: z.string().optional(),
  assigned_to: z.string().optional(),
});

type TaskFormValues = z.infer<typeof taskSchema>;

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateTaskModal({ isOpen, onClose, onSuccess }: CreateTaskModalProps) {
  const queryClient = useQueryClient();
  const [aiRecommendations, setAiRecommendations] = useState<any[]>([]);

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: '',
      priority: 'medium',
      required_skills: '',
      assigned_to: '',
    },
  });

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      form.reset();
      setAiRecommendations([]);
      onClose();
    }
  };

  const createTaskMutation = useMutation({
    mutationFn: async (data: TaskFormValues) => {
      const skillsArray = data.required_skills
        ? data.required_skills.split(',').map(s => s.trim()).filter(Boolean)
        : [];
      
      const payload: any = { ...data, required_skills: skillsArray };
      if (!payload.assigned_to) delete payload.assigned_to; 

      return await api.post('/tasks', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      onSuccess(); 
      handleOpenChange(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to create task.');
    }
  });

  const askAiMutation = useMutation({
    mutationFn: async (skills: string) => {
      const skillsArray = skills.split(',').map(s => s.trim()).filter(Boolean);
      const res = await api.post('/ai/smart-assign', { required_skills: skillsArray });
      return res.data.data;
    },
    onSuccess: (data) => {
      setAiRecommendations(data);
      if (data.length === 0) toast.info("No highly matched employees found.");
      else toast.success("AI generated matching recommendations!");
    },
    onError: () => {
      toast.error("Failed to fetch AI recommendations.");
    }
  });

  const handleAiClick = () => {
    const skills = form.getValues('required_skills');
    if (!skills) {
      form.setError('required_skills', { type: 'manual', message: 'Enter required skills first (e.g., React, Node)' });
      return;
    }
    askAiMutation.mutate(skills);
  };

  const onSubmit = (data: TaskFormValues) => {
    createTaskMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden bg-background">
        
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="text-xl">Create Task</DialogTitle>
          <DialogDescription>Assign a new task to your workforce or let AI find the perfect match.</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col">
            
            <ScrollArea className="max-h-[60vh] w-full">
              <div className="px-6 py-4 space-y-5">
                
                <FormField control={form.control} name="title" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Task Title <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Build Dashboard UI" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="priority" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="required_skills" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Required Skills</FormLabel>
                      <FormControl>
                        <Input placeholder="React, Node.js" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                <div className="pt-4 border-t border-border mt-2">
                  <div className="flex justify-between items-end mb-3">
                    <FormLabel className="mb-0">Assign To (Employee UUID)</FormLabel>
                    <Button 
                      type="button" 
                      variant="secondary" 
                      size="sm" 
                      onClick={handleAiClick}
                      disabled={askAiMutation.isPending}
                      className="h-8 text-xs bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20"
                    >
                      {askAiMutation.isPending ? (
                        <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                      ) : (
                        <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                      )}
                      {askAiMutation.isPending ? 'Analyzing...' : 'Ask AI'}
                    </Button>
                  </div>

                  <FormField control={form.control} name="assigned_to" render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input className="font-mono text-sm" placeholder="Paste UUID or select below" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  {aiRecommendations.length > 0 && (
                    <div className="space-y-2 mt-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Top AI Matches</p>
                      {aiRecommendations.map((rec, idx) => {
                        const isSelected = form.watch('assigned_to') === rec.employee_id;
                        return (
                          <div 
                            key={idx} 
                            onClick={() => form.setValue('assigned_to', rec.employee_id, { shouldValidate: true })}
                            className={`p-3 rounded-lg border cursor-pointer transition-all flex justify-between items-center group
                              ${isSelected 
                                ? 'bg-indigo-500/10 border-indigo-500 dark:border-indigo-400' 
                                : 'bg-card hover:border-primary border-border'
                              }`}
                          >
                            <div className="flex-1 pr-4">
                              <div className="font-medium text-foreground text-sm flex items-center gap-2">
                                {rec.name}
                                <Badge variant="secondary" className="text-[10px] py-0 px-1 font-normal h-4">{rec.role}</Badge>
                              </div>
                              <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{rec.explanation}</div>
                            </div>
                            <div className="flex flex-col items-end shrink-0">
                              <span className={`text-sm font-bold ${rec.match_score >= 80 ? 'text-emerald-500' : 'text-amber-500'}`}>
                                {rec.match_score}% Match
                              </span>
                              {isSelected && <UserCheck className="w-4 h-4 text-indigo-500 mt-1 animate-in zoom-in" />}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </ScrollArea>

            <DialogFooter className="px-6 py-4 border-t bg-muted/40">
              <Button type="button" variant="ghost" onClick={() => handleOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createTaskMutation.isPending}>
                {createTaskMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {createTaskMutation.isPending ? 'Creating...' : 'Create Task'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}