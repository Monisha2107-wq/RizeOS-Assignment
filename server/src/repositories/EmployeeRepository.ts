import db from '../config/db';
import { IEmployee } from '../interfaces/employee.interface';

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
    
    if (result.rows.length === 0) return null;
    return result.rows[0] as IEmployee;
  }

  public async findAllByOrg(orgId: string): Promise<IEmployee[]> {
    const query = 'SELECT * FROM employees WHERE org_id = $1 ORDER BY created_at DESC';
    const result = await db.query(query, [orgId]);
    return result.rows as IEmployee[];
  }
}

export default new EmployeeRepository();