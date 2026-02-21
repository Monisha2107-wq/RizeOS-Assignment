export interface ITask {
  id?: string;
  org_id: string;
  title: string;
  description?: string;
  assigned_to?: string | null;
  created_by?: string;
  status?: 'assigned' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  deadline?: string | Date | null; 
  required_skills?: string[] | string;
  created_at?: Date;
  updated_at?: Date;
  completed_at?: Date | null;
}

export interface IWeeklyTaskStat {
  name: string;
  tasks: number;
}