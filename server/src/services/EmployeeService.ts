import EmployeeRepository, { IEmployeeQueryParams } from '../repositories/EmployeeRepository';
import { IEmployee } from '../interfaces/employee.interface';

export class EmployeeService {
  
  public async addEmployee(orgId: string, employeeData: any): Promise<IEmployee> {
    const existingEmployee = await EmployeeRepository.findByEmail(employeeData.email);
    if (existingEmployee) {
      throw new Error('An employee with this email already exists in the system.');
    }

    const skills = Array.isArray(employeeData.skills) ? JSON.stringify(employeeData.skills) : '[]';

    const newEmployee: IEmployee = {
      org_id: orgId,
      name: employeeData.name,
      email: employeeData.email,
      role: employeeData.role,
      department: employeeData.department,
      skills: skills,
      wallet_address: employeeData.wallet_address
    };

    return await EmployeeRepository.create(newEmployee);
  }

  // 🚀 UPGRADED: Returns pagination metadata
  public async getOrgEmployees(orgId: string, params: IEmployeeQueryParams) {
    return await EmployeeRepository.findAllByOrg(orgId, params);
  }

  // 🚀 NEW: Update Employee
  public async updateEmployee(employeeId: string, orgId: string, updates: Partial<IEmployee>): Promise<IEmployee> {
    if (updates.skills && Array.isArray(updates.skills)) {
      updates.skills = JSON.stringify(updates.skills) as any;
    }

    const updatedEmployee = await EmployeeRepository.update(employeeId, orgId, updates);
    if (!updatedEmployee) {
      throw new Error('Employee not found or you do not have permission to update.');
    }
    
    return updatedEmployee;
  }

  // 🚀 NEW: Delete Employee
  public async deleteEmployee(employeeId: string, orgId: string): Promise<void> {
    const isDeleted = await EmployeeRepository.delete(employeeId, orgId);
    if (!isDeleted) {
      throw new Error('Employee not found or you do not have permission to delete.');
    }
  }
}

export default new EmployeeService();