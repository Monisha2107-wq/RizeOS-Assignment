import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import TaskService from '../services/TaskService';
import { z } from 'zod';

const createTaskSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  assigned_to: z.string().uuid("Invalid Employee ID format").optional().nullable(),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  required_skills: z.array(z.string()).optional()
});

const updateStatusSchema = z.object({
  status: z.enum(['assigned', 'in_progress', 'completed'])
});

export class TaskController {
  
  public async createTask(req: AuthRequest, res: Response): Promise<void> {
    try {
      const orgId = req.user!.orgId;
      const createdBy = req.user!.userId;
      
      const validatedData = createTaskSchema.parse(req.body);
      const newTask = await TaskService.createTask(orgId, createdBy, validatedData);

      res.status(201).json({ success: true, data: newTask });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ success: false, errors: error });
      } else {
        res.status(400).json({ success: false, message: error.message });
      }
    }
  }

  public async getTasks(req: AuthRequest, res: Response): Promise<void> {
    try {
      const orgId = req.user!.orgId;
      const tasks = await TaskService.getOrgTasks(orgId);
      res.status(200).json({ success: true, data: tasks });
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Failed to fetch tasks' });
    }
  }

  public async updateStatus(req: AuthRequest, res: Response): Promise<void> {
    try {
      const orgId = req.user!.orgId;
      const taskId = req.params.id as string; 
      
      const validatedData = updateStatusSchema.parse(req.body);
      const updatedTask = await TaskService.updateTaskStatus(taskId, orgId, validatedData.status);

      res.status(200).json({ success: true, data: updatedTask });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ success: false, errors: error });
      } else {
        res.status(404).json({ success: false, message: error.message });
      }
    }
  }
}

export default new TaskController();