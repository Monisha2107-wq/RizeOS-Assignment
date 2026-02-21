import { NextFunction, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import TaskService from '../services/TaskService';
import { z } from 'zod';
import { IWeeklyTaskStat } from '../interfaces/task.interface';

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

const getTasksQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10), 
  sortBy: z.enum(['created_at', 'updated_at', 'title', 'priority', 'status']).default('created_at'),
  order: z.enum(['asc', 'desc']).default('desc'),
  status: z.string().optional(),
  priority: z.string().optional(),
  assigned_to: z.string().uuid().optional()
});

const updateTaskSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").optional(),
  description: z.string().optional(),
  assigned_to: z.string().uuid("Invalid Employee ID format").optional().nullable(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  required_skills: z.array(z.string()).optional()
}).refine(data => Object.keys(data).length > 0, {
  message: "At least one field must be provided to update"
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
      const queryParams = getTasksQuerySchema.parse(req.query);
      
      const { data, total } = await TaskService.getOrgTasks(orgId, queryParams);
      
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
        res.status(500).json({ success: false, message: 'Failed to fetch tasks' });
      }
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

  public async updateTask(req: AuthRequest, res: Response): Promise<void> {
    try {
      const orgId = req.user!.orgId;
      const taskId = req.params.id as string;
      
      const validatedData = updateTaskSchema.parse(req.body);
      const updatedTask = await TaskService.updateTask(taskId, orgId, validatedData);

      res.status(200).json({ success: true, data: updatedTask });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ success: false, errors: error });
      } else {
        res.status(404).json({ success: false, message: error.message });
      }
    }
  }

  public async deleteTask(req: AuthRequest, res: Response): Promise<void> {
    try {
      const orgId = req.user!.orgId;
      const taskId = req.params.id as string;

      await TaskService.deleteTask(taskId, orgId);

      res.status(200).json({ success: true, message: 'Task deleted successfully' });
    } catch (error: any) {
      res.status(404).json({ success: false, message: error.message });
    }
  }

  public async getWeeklyStats(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = req.user!.orgId;

      const stats: IWeeklyTaskStat[] =
        await TaskService.getWeeklyTaskStats(orgId);

      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new TaskController();