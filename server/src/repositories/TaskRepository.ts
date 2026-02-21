import db from '../config/db';
import { ITask } from '../interfaces/task.interface';

// We define an interface for our new query parameters
export interface ITaskQueryParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  order?: 'asc' | 'desc';
  status?: string;
  priority?: string;
  assigned_to?: string;
}

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
      task.required_skills || '[]' // Ensure this is stringified JSON if stored as JSONB
    ];
    
    const result = await db.query(query, values);
    return result.rows[0] as ITask;
  }

  // 🚀 UPGRADED: Now supports Pagination, Filtering, and Sorting
  public async findAllByOrg(orgId: string, params: ITaskQueryParams = {}): Promise<{ data: ITask[], total: number }> {
    const { 
      page = 1, 
      limit = 10, 
      sortBy = 'created_at', 
      order = 'desc',
      status,
      priority,
      assigned_to
    } = params;

    const offset = (page - 1) * limit;
    
    // 1. Build the dynamic WHERE clause
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

    const whereClause = conditions.join(' AND ');

    // 2. Whitelist sort columns to prevent SQL Injection
    const allowedSortColumns = ['created_at', 'updated_at', 'title', 'priority', 'status'];
    const safeSortBy = allowedSortColumns.includes(sortBy) ? sortBy : 'created_at';
    const safeOrder = order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    // 3. Execute the data query
    const dataQuery = `
      SELECT * FROM tasks 
      WHERE ${whereClause} 
      ORDER BY ${safeSortBy} ${safeOrder} 
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    
    // 4. Execute a count query for frontend pagination numbers
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

  // 🚀 NEW: Full Edit Capability
  public async update(taskId: string, orgId: string, updates: Partial<ITask>): Promise<ITask | null> {
    // Dynamically build the UPDATE set clause based on provided fields
    const setClauses: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    const updatableFields = ['title', 'description', 'priority', 'assigned_to', 'required_skills'];

    for (const [key, value] of Object.entries(updates)) {
      if (updatableFields.includes(key) && value !== undefined) {
        setClauses.push(`${key} = $${paramIndex++}`);
        values.push(value);
      }
    }

    if (setClauses.length === 0) return null; // Nothing to update

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

  // 🚀 NEW: Delete Capability
  public async delete(taskId: string, orgId: string): Promise<boolean> {
    const query = `
      DELETE FROM tasks 
      WHERE id = $1 AND org_id = $2
      RETURNING id;
    `;
    const result = await db.query(query, [taskId, orgId]);
    return (result.rowCount ?? 0) > 0;
  }

  // Also upgrading this to support pagination
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
}

export default new TaskRepository();