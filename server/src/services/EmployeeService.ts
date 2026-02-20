import EmployeeRepository from '../repositories/EmployeeRepository';
import { IEmployee } from '../interfaces/employee.interface';

export class EmployeeService {
  
  public async addEmployee(orgId: string, employeeData: any) {
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

  public async getOrgEmployees(orgId: string) {
    return await EmployeeRepository.findAllByOrg(orgId);
  }
}

export default new EmployeeService();