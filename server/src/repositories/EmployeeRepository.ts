import db from '../config/db';
import { IEmployee } from '../interfaces/employee.interface';

export interface IEmployeeQueryParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  order?: 'asc' | 'desc';
  department?: string;
  role?: string;
}

export class EmployeeRepository {
  
  public async create(employee: IEmployee): Promise<IEmployee> {
    const query = `
      INSERT INTO employees (org_id, name, email, role, department, skills, wallet_address)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *;
    `;
    
    const values = [
      employee.org_id, 
      employee.name, 
      employee.email, 
      employee.role, 
      employee.department || 'Management',
      employee.skills || '[]',       
      employee.wallet_address || null  
    ];
    
    const result = await db.query(query, values);
    return result.rows[0] as IEmployee;
  }
  
  public async findByEmail(email: string): Promise<IEmployee | null> {
    const query = 'SELECT * FROM employees WHERE email = $1 LIMIT 1';
    const result = await db.query(query, [email]);
    return result.rows.length ? (result.rows[0] as IEmployee) : null;
  }

  // 🚀 UPGRADED: Pagination & Filtering added
  public async findAllByOrg(orgId: string, params: IEmployeeQueryParams = {}): Promise<{ data: IEmployee[], total: number }> {
    const { 
      page = 1, 
      limit = 10, 
      sortBy = 'created_at', 
      order = 'desc',
      department,
      role
    } = params;

    const offset = (page - 1) * limit;
    
    const conditions = ['org_id = $1'];
    const values: any[] = [orgId];
    let paramIndex = 2;

    if (department) {
      conditions.push(`department = $${paramIndex++}`);
      values.push(department);
    }
    if (role) {
      conditions.push(`role = $${paramIndex++}`);
      values.push(role);
    }

    const whereClause = conditions.join(' AND ');
    
    const allowedSortColumns = ['created_at', 'name', 'role', 'department'];
    const safeSortBy = allowedSortColumns.includes(sortBy) ? sortBy : 'created_at';
    const safeOrder = order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    const dataQuery = `
      SELECT * FROM employees 
      WHERE ${whereClause} 
      ORDER BY ${safeSortBy} ${safeOrder} 
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    
    const countQuery = `SELECT COUNT(*) FROM employees WHERE ${whereClause}`;

    const [dataResult, countResult] = await Promise.all([
      db.query(dataQuery, [...values, limit, offset]),
      db.query(countQuery, values)
    ]);

    return {
      data: dataResult.rows as IEmployee[],
      total: parseInt(countResult.rows[0].count, 10)
    };
  }

  // 🚀 NEW: Full Edit Capability
  public async update(employeeId: string, orgId: string, updates: Partial<IEmployee>): Promise<IEmployee | null> {
    const setClauses: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    const updatableFields = ['name', 'role', 'department', 'skills', 'wallet_address'];

    for (const [key, value] of Object.entries(updates)) {
      if (updatableFields.includes(key) && value !== undefined) {
        setClauses.push(`${key} = $${paramIndex++}`);
        values.push(value);
      }
    }

    if (setClauses.length === 0) return null;

    setClauses.push(`updated_at = CURRENT_TIMESTAMP`);

    const query = `
      UPDATE employees
      SET ${setClauses.join(', ')}
      WHERE id = $${paramIndex++} AND org_id = $${paramIndex}
      RETURNING *;
    `;

    values.push(employeeId, orgId);

    const result = await db.query(query, values);
    return result.rows.length ? (result.rows[0] as IEmployee) : null;
  }

  // 🚀 NEW: Delete Capability
  public async delete(employeeId: string, orgId: string): Promise<boolean> {
    const query = `
      DELETE FROM employees 
      WHERE id = $1 AND org_id = $2
      RETURNING id;
    `;
    const result = await db.query(query, [employeeId, orgId]);
    return (result.rowCount ?? 0) > 0;
  }
}

export default new EmployeeRepository();