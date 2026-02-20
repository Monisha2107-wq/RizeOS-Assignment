import { Request, Response } from 'express';
import AuthService from '../services/AuthService';
import { z } from 'zod';

const registerSchema = z.object({
  name: z.string().min(2, "Company name must be at least 2 characters"),
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

export class AuthController {
  
  public async register(req: Request, res: Response): Promise<void> {
    try {
      const validatedData = registerSchema.parse(req.body);

      const result = await AuthService.registerOrganization(validatedData);

      res.status(201).json({
        success: true,
        message: 'Organization registered successfully',
        data: result
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ success: false, errors: error });
      } else {
        res.status(400).json({ success: false, message: error.message });
      }
    }
  }

  public async login(req: Request, res: Response): Promise<void> {
    try {
      const validatedData = loginSchema.parse(req.body);

      const result = await AuthService.login(validatedData.email, validatedData.password);

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: result
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ success: false, errors: error });
      } else {
        res.status(401).json({ success: false, message: error.message });
      }
    }
  }
}

export default new AuthController();