import db from '../config/db';
import { ITask } from '../interfaces/task.interface';

export interface ITaskQueryParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  order?: 'asc' | 'desc';
  status?: string;
  priority?: string;
  assigned_to?: string;
  search?: string;
}

export class TaskRepository {
  
  public async create(task: ITask): Promise<ITask> {
    const query = `
      INSERT INTO tasks (
        org_id, 
        title, 
        description, 
        priority, 
        deadline, 
        required_skills, 
        assigned_to
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const values = [
      task.org_id,
      task.title,
      task.description || '',
      task.priority || 'medium',
      task.deadline || null,
      JSON.stringify(task.required_skills || []),
      task.assigned_to || null
    ];
    
    const result = await db.query(query, values);
    return result.rows[0] as ITask;
  }

  public async findAllByOrg(orgId: string, params: ITaskQueryParams = {}): Promise<{ data: ITask[], total: number }> {
    const { 
      page = 1, 
      limit = 10, 
      sortBy = 'created_at', 
      order = 'desc',
      status,
      priority,
      assigned_to,
      search
    } = params;

    const offset = (page - 1) * limit;
    
    const conditions = ['org_id = $1'];
    const values: any[] = [orgId];
    let paramIndex = 2;

    if (status) {
      conditions.push(`status = $${paramIndex++}`);
      values.push(status);
    }
    if (priority) {
      conditions.push(`priority = $${paramIndex++}`);
      values.push(priority);
    }
    if (assigned_to) {
      conditions.push(`assigned_to = $${paramIndex++}`);
      values.push(assigned_to);
    }
    if (search) {
      conditions.push(`title ILIKE $${paramIndex++}`);
      values.push(`%${search}%`);
    }

    const whereClause = conditions.join(' AND ');

    const allowedSortColumns = ['created_at', 'updated_at', 'title', 'priority', 'status', 'deadline'];
    const safeSortBy = allowedSortColumns.includes(sortBy) ? sortBy : 'created_at';
    const safeOrder = order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    const dataQuery = `
      SELECT * FROM tasks 
      WHERE ${whereClause} 
      ORDER BY ${safeSortBy} ${safeOrder} 
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    
    const countQuery = `SELECT COUNT(*) FROM tasks WHERE ${whereClause}`;

    const [dataResult, countResult] = await Promise.all([
      db.query(dataQuery, [...values, limit, offset]),
      db.query(countQuery, values)
    ]);

    return {
      data: dataResult.rows as ITask[],
      total: parseInt(countResult.rows[0].count, 10)
    };
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
    return result.rows.length ? (result.rows[0] as ITask) : null;
  }

  public async update(taskId: string, orgId: string, updates: Partial<ITask>): Promise<ITask | null> {
    const setClauses: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    const updatableFields = ['title', 'description', 'priority', 'assigned_to', 'required_skills', 'deadline'];

    for (const [key, value] of Object.entries(updates)) {
      if (updatableFields.includes(key) && value !== undefined) {
        setClauses.push(`${key} = $${paramIndex++}`);
        if (key === 'required_skills' && Array.isArray(value)) {
          values.push(JSON.stringify(value));
        } else {
          values.push(value);
        }
      }
    }

    if (setClauses.length === 0) return null; 

    setClauses.push(`updated_at = CURRENT_TIMESTAMP`);

    const query = `
      UPDATE tasks
      SET ${setClauses.join(', ')}
      WHERE id = $${paramIndex++} AND org_id = $${paramIndex}
      RETURNING *;
    `;

    values.push(taskId, orgId);

    const result = await db.query(query, values);
    return result.rows.length ? (result.rows[0] as ITask) : null;
  }

  public async delete(taskId: string, orgId: string): Promise<boolean> {
    const query = `
      DELETE FROM tasks 
      WHERE id = $1 AND org_id = $2
      RETURNING id;
    `;
    const result = await db.query(query, [taskId, orgId]);
    return (result.rowCount ?? 0) > 0;
  }

  public async findAllByEmployee(employeeId: string, page = 1, limit = 10): Promise<{ data: ITask[], total: number }> {
    const offset = (page - 1) * limit;
    
    const dataQuery = `
      SELECT * FROM tasks 
      WHERE assigned_to = $1 
      ORDER BY created_at DESC 
      LIMIT $2 OFFSET $3
    `;
    const countQuery = `SELECT COUNT(*) FROM tasks WHERE assigned_to = $1`;

    const [dataResult, countResult] = await Promise.all([
      db.query(dataQuery, [employeeId, limit, offset]),
      db.query(countQuery, [employeeId])
    ]);

    return {
      data: dataResult.rows as ITask[],
      total: parseInt(countResult.rows[0].count, 10)
    };
  }

  public async getWeeklyStats(orgId: string): Promise<{ date: string; count: number }[]> {
    const query = `
      SELECT 
        TO_CHAR(updated_at, 'YYYY-MM-DD') as date, 
        COUNT(*)::int as count
      FROM tasks
      WHERE 
        org_id = $1 AND 
        status = 'completed' AND 
        updated_at >= CURRENT_DATE - INTERVAL '6 days'
      GROUP BY date
      ORDER BY date ASC;
    `;

    const result = await db.query(query, [orgId]);
    return result.rows;
  }
}

export default new TaskRepository();