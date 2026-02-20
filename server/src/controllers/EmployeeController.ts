// src/controllers/EmployeeController.ts

import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import EmployeeService from '../services/EmployeeService';
import { z } from 'zod';

const createEmployeeSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email format"),
  role: z.string().min(2, "Role is required"),
  department: z.string().optional(),
  skills: z.array(z.string()).optional(),
  wallet_address: z.string().optional()
});

export class EmployeeController {
  
  public async createEmployee(req: AuthRequest, res: Response): Promise<void> {
    try {
      const orgId = req.user!.orgId;

      // 2. Validate input
      const validatedData = createEmployeeSchema.parse(req.body);

      // 3. Pass to service layer
      const newEmployee = await EmployeeService.addEmployee(orgId, validatedData);

      // 4. Return success
      res.status(201).json({
        success: true,
        message: 'Employee added successfully',
        data: newEmployee
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ success: false, errors: error });
      } else {
        res.status(400).json({ success: false, message: error.message });
      }
    }
  }

  public async getEmployees(req: AuthRequest, res: Response): Promise<void> {
    try {
      const orgId = req.user!.orgId;
      const employees = await EmployeeService.getOrgEmployees(orgId);

      res.status(200).json({
        success: true,
        data: employees
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Failed to fetch employees' });
    }
  }
}

export default new EmployeeController();