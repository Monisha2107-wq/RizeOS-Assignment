import db from '../config/db';
import { IOrganization } from '../interfaces/org.interface';

export class OrgRepository {
  public async findByEmail(email: string): Promise<IOrganization | null> {
    const query = 'SELECT * FROM organizations WHERE email = $1 LIMIT 1';
    const result = await db.query(query, [email]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return result.rows[0] as IOrganization;
  }
  
  public async create(org: Omit<IOrganization, 'id' | 'created_at' | 'plan'>): Promise<IOrganization> {
    const query = `
      INSERT INTO organizations (name, slug, email, password_hash)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;
    
    const values = [org.name, org.slug, org.email, org.password_hash];
    const result = await db.query(query, values);
    
    return result.rows[0] as IOrganization;
  }
}

export default new OrgRepository();