import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { UserPlus, Briefcase, Mail, Code2, Wallet } from 'lucide-react';
import api from '../api/axios';
import AddEmployeeModal from '../components/employees/AddEmployeeModal';

// Shadcn UI
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

export default function Employees() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // TanStack Query handles caching and loading states automatically
  const { data: employees = [], isLoading } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const res = await api.get('/employees');
      return res.data.data || [];
    }
  });

  const safelyParseSkills = (skillsData: any): string[] => {
    if (!skillsData) return [];
    if (Array.isArray(skillsData)) return skillsData; 
    try {
      const parsed = JSON.parse(skillsData);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return []; 
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Team Directory</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your workforce, skills, and blockchain wallets.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <UserPlus className="w-4 h-4 mr-2" />
          Add Employee
        </Button>
      </div>

      {/* CONTENT GRID */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => <EmployeeSkeleton key={i} />)}
        </div>
      ) : employees.length === 0 ? (
        <div className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl p-12 text-center bg-muted/20">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
            <UserPlus className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-1">No employees found</h3>
          <p className="text-sm text-muted-foreground mb-4">Get started by adding your first team member.</p>
          <Button variant="outline" onClick={() => setIsModalOpen(true)}>Add Employee</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {employees.map((emp: any) => {
            const skillsArray = safelyParseSkills(emp.skills);

            return (
              <Card key={emp.id} className="group hover:border-primary/50 transition-colors shadow-sm">
                
                <CardHeader className="pb-3 flex flex-row justify-between items-start">
                  <div className="space-y-1">
                    <CardTitle className="text-xl">{emp.name}</CardTitle>
                    <div className="flex items-center text-muted-foreground text-sm font-medium">
                      <Briefcase className="w-3.5 h-3.5 mr-1.5" />
                      {emp.role} {emp.department && `• ${emp.department}`}
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
                    Active
                  </Badge>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center text-muted-foreground text-sm">
                      <Mail className="w-3.5 h-3.5 mr-2" />
                      {emp.email}
                    </div>
                    {emp.wallet_address && (
                      <div className="flex items-center text-muted-foreground text-sm">
                        <Wallet className="w-3.5 h-3.5 mr-2" />
                        <span className="truncate font-mono text-xs" title={emp.wallet_address}>
                          {emp.wallet_address}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-border">
                    <div className="flex items-center text-foreground text-sm mb-2 font-medium">
                      <Code2 className="w-4 h-4 mr-1.5" /> Skills
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {skillsArray.length > 0 ? (
                        skillsArray.map((skill: string, idx: number) => (
                          <Badge key={idx} variant="secondary" className="font-normal text-[10px] px-2 py-0.5">
                            {skill}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-muted-foreground text-xs italic">No skills listed</span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <AddEmployeeModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}

// SHIMMER LOADER
const EmployeeSkeleton = () => (
  <Card className="shadow-sm">
    <CardHeader className="pb-3 flex flex-row justify-between items-start">
      <div className="space-y-2">
        <Skeleton className="h-6 w-32 rounded" />
        <Skeleton className="h-4 w-40 rounded" />
      </div>
      <Skeleton className="h-5 w-16 rounded-full" />
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="space-y-2">
        <Skeleton className="h-4 w-full rounded" />
        <Skeleton className="h-4 w-3/4 rounded" />
      </div>
      <div className="pt-4 border-t border-border space-y-2">
        <Skeleton className="h-4 w-20 rounded" />
        <div className="flex gap-2">
          <Skeleton className="h-5 w-16 rounded" />
          <Skeleton className="h-5 w-20 rounded" />
          <Skeleton className="h-5 w-14 rounded" />
        </div>
      </div>
    </CardContent>
  </Card>
);