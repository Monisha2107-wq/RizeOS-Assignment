import db from '../config/db';
import { ITask } from '../interfaces/task.interface';

export class TaskRepository {
  
  public async create(task: ITask): Promise<ITask> {
    const query = `
      INSERT INTO tasks (org_id, assigned_to, created_by, title, description, priority, required_skills)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *;
    `;
    
    const values = [
      task.org_id,
      task.assigned_to || null,
      task.created_by || null,
      task.title,
      task.description || '',
      task.priority || 'medium',
      task.required_skills || '[]'
    ];
    
    const result = await db.query(query, values);
    return result.rows[0] as ITask;
  }

  public async findAllByOrg(orgId: string): Promise<ITask[]> {
    const query = 'SELECT * FROM tasks WHERE org_id = $1 ORDER BY created_at DESC';
    const result = await db.query(query, [orgId]);
    return result.rows as ITask[];
  }

  public async updateStatus(taskId: string, orgId: string, status: string): Promise<ITask | null> {
    const completedAtChunk = status === 'completed' ? 'CURRENT_TIMESTAMP' : 'NULL';
    
    const query = `
      UPDATE tasks 
      SET status = $1, 
          completed_at = ${completedAtChunk},
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $2 AND org_id = $3
      RETURNING *;
    `;
    
    const result = await db.query(query, [status, taskId, orgId]);
    
    if (result.rows.length === 0) return null;
    return result.rows[0] as ITask;
  }

  public async findAllByEmployee(employeeId: string): Promise<ITask[]> {
    const query = 'SELECT * FROM tasks WHERE assigned_to = $1';
    const result = await db.query(query, [employeeId]);
    return result.rows as ITask[];
  }
}

export default new TaskRepository();