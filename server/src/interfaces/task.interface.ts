export interface ITask {
  id?: string;
  org_id: string;
  assigned_to?: string | null;
  created_by?: string | null;
  title: string;
  description?: string;
  priority?: string;
  status?: string;
  required_skills?: any; 
  due_date?: Date;
  completed_at?: Date;
  created_at?: Date;
  updated_at?: Date;
}