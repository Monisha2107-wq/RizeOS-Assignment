import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserPlus, Briefcase, Mail, Code2, Wallet, MoreVertical, Edit2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import api from '../api/axios';

import AddEmployeeModal from '../components/employees/AddEmployeeModal';
import EditEmployeeModal from '../components/employees/EditEmployeeModal';
import DeleteConfirmDialog from '../components/shared/DeleteConfirmDialog';

import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';

export default function Employees() {
  const queryClient = useQueryClient();
  const [modals, setModals] = useState({ add: false, edit: false, delete: false });
  const [selectedEmp, setSelectedEmp] = useState<any>(null);

  const { data: employees = [], isLoading } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const res = await api.get('/employees');
      return res.data.data || [];
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (updates: any) => api.patch(`/employees/${selectedEmp.id}`, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.success('Employee updated');
      setModals({ ...modals, edit: false });
    },
    onError: () => toast.error('Update failed')
  });

  const deleteMutation = useMutation({
    mutationFn: async () => api.delete(`/employees/${selectedEmp.id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.success('Employee removed');
      setModals({ ...modals, delete: false });
    },
    onError: () => toast.error('Delete failed')
  });

  const safelyParseSkills = (skillsData: any): string[] => {
    if (!skillsData) return [];
    if (Array.isArray(skillsData)) return skillsData; 
    try { return JSON.parse(skillsData) || []; } catch { return []; }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team Directory</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage workforce skills and profiles.</p>
        </div>
        <Button onClick={() => setModals({ ...modals, add: true })}>
          <UserPlus className="w-4 h-4 mr-2" /> Add Employee
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <EmployeeSkeleton key={i} />)}
        </div>
      ) : employees.length === 0 ? (
        <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-12 bg-muted/20">
          <UserPlus className="h-8 w-8 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No employees yet</h3>
          <Button variant="outline" className="mt-4" onClick={() => setModals({ ...modals, add: true })}>Add First member</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {employees.map((emp: any) => (
            <Card key={emp.id} className="group hover:border-primary/40 transition-all shadow-sm">
              <CardHeader className="pb-3 flex flex-row justify-between items-start">
                <div className="space-y-1">
                  <CardTitle className="text-xl">{emp.name}</CardTitle>
                  <div className="flex items-center text-muted-foreground text-xs font-medium">
                    <Briefcase className="w-3 h-3 mr-1" /> {emp.role} {emp.department && `• ${emp.department}`}
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => { setSelectedEmp(emp); setModals({ ...modals, edit: true }); }}>
                      <Edit2 className="w-4 h-4 mr-2" /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive" onClick={() => { setSelectedEmp(emp); setModals({ ...modals, delete: true }); }}>
                      <Trash2 className="w-4 h-4 mr-2" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center"><Mail className="w-3.5 h-3.5 mr-2" /> {emp.email}</div>
                  {emp.wallet_address && <div className="flex items-center"><Wallet className="w-3.5 h-3.5 mr-2" /> <span className="truncate font-mono text-[10px]">{emp.wallet_address}</span></div>}
                </div>
                <div className="pt-4 border-t">
                  <div className="flex items-center text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2"><Code2 className="w-3 h-3 mr-1.5" /> Skills</div>
                  <div className="flex flex-wrap gap-1.5">
                    {safelyParseSkills(emp.skills).map((s, i) => <Badge key={i} variant="secondary" className="text-[10px] px-2 py-0">{s}</Badge>)}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AddEmployeeModal isOpen={modals.add} onClose={() => setModals({ ...modals, add: false })} />
      <EditEmployeeModal 
        isOpen={modals.edit} 
        employee={selectedEmp} 
        onClose={() => setModals({ ...modals, edit: false })} 
        onUpdate={updateMutation.mutate}
        isLoading={updateMutation.isPending}
      />
      <DeleteConfirmDialog 
        isOpen={modals.delete} 
        onClose={() => setModals({ ...modals, delete: false })} 
        onConfirm={deleteMutation.mutate}
        isLoading={deleteMutation.isPending}
        title="Delete Employee"
        description={`Are you sure you want to remove ${selectedEmp?.name}?`}
      />
    </div>
  );
}

const EmployeeSkeleton = () => (
  <Card className="shadow-sm"><CardHeader className="pb-3"><Skeleton className="h-6 w-32" /><Skeleton className="h-4 w-40 mt-2" /></CardHeader><CardContent className="space-y-4"><Skeleton className="h-4 w-full" /><div className="pt-4 border-t"><Skeleton className="h-4 w-20 mb-2" /><div className="flex gap-2"><Skeleton className="h-5 w-16" /><Skeleton className="h-5 w-16" /></div></div></CardContent></Card>
);