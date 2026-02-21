import React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../api/axios';

// Shadcn Components
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

// 1. ZOD SCHEMA for Validation
const employeeSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  role: z.string().min(2, "Role is required"),
  department: z.string().optional(),
  skills: z.string().optional(),
  wallet_address: z.string().optional(),
});

type EmployeeFormValues = z.infer<typeof employeeSchema>;

interface AddEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddEmployeeModal({ isOpen, onClose }: AddEmployeeModalProps) {
  const queryClient = useQueryClient();

  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      name: '',
      email: '',
      role: '',
      department: '',
      skills: '',
      wallet_address: '',
    },
  });

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      form.reset();
      onClose();
    }
  };

  const createEmployeeMutation = useMutation({
    mutationFn: async (data: EmployeeFormValues) => {
      // Parse comma-separated skills into an array
      const skillsArray = data.skills
        ? data.skills.split(',').map(s => s.trim()).filter(Boolean)
        : [];
      
      const payload = { ...data, skills: skillsArray };
      return await api.post('/employees', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.success("Employee added successfully!");
      handleOpenChange(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || err.response?.data?.errors?.[0]?.message || 'Failed to add employee.');
    }
  });

  const onSubmit = (data: EmployeeFormValues) => {
    createEmployeeMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden bg-background">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="text-xl">Add New Employee</DialogTitle>
          <DialogDescription>Add a new member to your organization's workforce.</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col max-h-[70vh]">
            <ScrollArea className="px-6 py-4">
              <div className="space-y-4 pr-2">
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name <span className="text-destructive">*</span></FormLabel>
                      <FormControl><Input placeholder="Jane Doe" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email <span className="text-destructive">*</span></FormLabel>
                      <FormControl><Input placeholder="jane@company.com" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="role" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role <span className="text-destructive">*</span></FormLabel>
                      <FormControl><Input placeholder="Frontend Dev" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="department" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department</FormLabel>
                      <FormControl><Input placeholder="Engineering" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                <FormField control={form.control} name="skills" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Skills (comma separated)</FormLabel>
                    <FormControl><Input placeholder="React, Node.js, Design" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="wallet_address" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Wallet Address (Optional)</FormLabel>
                    <FormControl><Input className="font-mono text-sm" placeholder="0x..." {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

              </div>
            </ScrollArea>

            <DialogFooter className="px-6 py-4 border-t bg-muted/40">
              <Button type="button" variant="ghost" onClick={() => handleOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={createEmployeeMutation.isPending}>
                {createEmployeeMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {createEmployeeMutation.isPending ? 'Adding...' : 'Add Employee'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}