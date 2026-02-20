import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import OrgRepository from '../repositories/OrgRepository';
import EmployeeRepository from '../repositories/EmployeeRepository';
import { ICreateOrgDTO } from '../interfaces/org.interface';

export class AuthService {
  private readonly SALT_ROUNDS = 12;
  private readonly JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

  public async registerOrganization(data: ICreateOrgDTO) {
    const existingOrg = await OrgRepository.findByEmail(data.email);
    if (existingOrg) {
      throw new Error('An organization with this email already exists.');
    }

    const passwordHash = await bcrypt.hash(data.password, this.SALT_ROUNDS);

    const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    const newOrg = await OrgRepository.create({
      name: data.name,
      slug: slug,
      email: data.email,
      password_hash: passwordHash
    });

    const adminEmployee = await EmployeeRepository.create({
      org_id: newOrg.id!,
      name: `Admin (${data.name})`,
      email: data.email,
      role: 'ADMIN',
      department: 'Founders'
    });

    const token = this.generateToken(adminEmployee.id!, newOrg.id!, adminEmployee.role);

    return {
      token,
      organization: { id: newOrg.id, name: newOrg.name, slug: newOrg.slug },
      employee: { id: adminEmployee.id, role: adminEmployee.role }
    };
  }

  public async login(email: string, password: string) {
    const org = await OrgRepository.findByEmail(email);
    if (!org) {
      throw new Error('Invalid email or password.');
    }
    
    const isPasswordValid = await bcrypt.compare(password, org.password_hash);
    if (!isPasswordValid) {
      throw new Error('Invalid email or password.');
    }

    const adminEmployee = await EmployeeRepository.findByEmail(email);
    if (!adminEmployee) {
      throw new Error('Admin employee record missing.');
    }

    const token = this.generateToken(adminEmployee.id!, org.id!, adminEmployee.role);

    return {
      token,
      organization: { id: org.id, name: org.name, slug: org.slug }
    };
  }

  private generateToken(userId: string, orgId: string, role: string): string {
    return jwt.sign(
      { sub: userId, orgId, role },
      this.JWT_SECRET,
      { expiresIn: '7d' }
    );
  }
}

export default new AuthService();