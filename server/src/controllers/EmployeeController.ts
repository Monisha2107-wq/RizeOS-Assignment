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

// 🚀 NEW: Zod Schema for Pagination/Filtering
const getEmployeesQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  sortBy: z.enum(['created_at', 'name', 'role', 'department']).default('created_at'),
  order: z.enum(['asc', 'desc']).default('desc'),
  department: z.string().optional(),
  role: z.string().optional()
});

// 🚀 NEW: Zod Schema for partial updates
const updateEmployeeSchema = z.object({
  name: z.string().min(2).optional(),
  role: z.string().min(2).optional(),
  department: z.string().optional(),
  skills: z.array(z.string()).optional(),
  wallet_address: z.string().optional()
}).refine(data => Object.keys(data).length > 0, {
  message: "At least one field must be provided to update"
});

export class EmployeeController {
  
  public async createEmployee(req: AuthRequest, res: Response): Promise<void> {
    try {
      const orgId = req.user!.orgId;
      const validatedData = createEmployeeSchema.parse(req.body);
      const newEmployee = await EmployeeService.addEmployee(orgId, validatedData);

      res.status(201).json({ success: true, message: 'Employee added successfully', data: newEmployee });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ success: false, errors: error });
      } else {
        res.status(400).json({ success: false, message: error.message });
      }
    }
  }

  // 🚀 UPGRADED: Handing Pagination & Query Validation
  public async getEmployees(req: AuthRequest, res: Response): Promise<void> {
    try {
      const orgId = req.user!.orgId;
      const queryParams = getEmployeesQuerySchema.parse(req.query);
      
      const { data, total } = await EmployeeService.getOrgEmployees(orgId, queryParams);

      res.status(200).json({
        success: true,
        data: data,
        pagination: {
          total,
          page: queryParams.page,
          limit: queryParams.limit,
          totalPages: Math.ceil(total / queryParams.limit)
        }
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ success: false, errors: error });
      } else {
        res.status(500).json({ success: false, message: 'Failed to fetch employees' });
      }
    }
  }

  // 🚀 NEW: Update Employee HTTP handler
  public async updateEmployee(req: AuthRequest, res: Response): Promise<void> {
    try {
      const orgId = req.user!.orgId;
      const employeeId = req.params.id as string;
      
      const validatedData = updateEmployeeSchema.parse(req.body);
      const updatedEmployee = await EmployeeService.updateEmployee(employeeId, orgId, validatedData);

      res.status(200).json({ success: true, data: updatedEmployee });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ success: false, errors: error });
      } else {
        res.status(404).json({ success: false, message: error.message });
      }
    }
  }

  // 🚀 NEW: Delete Employee HTTP handler
  public async deleteEmployee(req: AuthRequest, res: Response): Promise<void> {
    try {
      const orgId = req.user!.orgId;
      const employeeId = req.params.id as string;

      await EmployeeService.deleteEmployee(employeeId, orgId);

      res.status(200).json({ success: true, message: 'Employee deleted successfully' });
    } catch (error: any) {
      res.status(404).json({ success: false, message: error.message });
    }
  }
}

export default new EmployeeController();