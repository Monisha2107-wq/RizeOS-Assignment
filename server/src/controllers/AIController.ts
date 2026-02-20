import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import SmartAssignEngine from '../services/ai/SmartAssignEngine';
import { z } from 'zod';

const smartAssignSchema = z.object({
  required_skills: z.array(z.string()).min(1, "At least one required skill must be provided")
});

export class AIController {
  
  public async getSmartAssignment(req: AuthRequest, res: Response): Promise<void> {
    try {
      const orgId = req.user!.orgId;
      
      const validatedData = smartAssignSchema.parse(req.body);

      const recommendations = await SmartAssignEngine.recommendAssignees(
        orgId, 
        validatedData.required_skills
      );

      res.status(200).json({ 
        success: true, 
        data: recommendations 
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ success: false, errors: error });
      } else {
        res.status(400).json({ success: false, message: error.message });
      }
    }
  }

  // Add this below your existing getSmartAssignment method
  public async getScores(req: AuthRequest, res: Response): Promise<void> {
    try {
      const orgId = req.user!.orgId;
      // We join the employees and ai_scores tables to get the names AND the scores
      const query = `
        SELECT e.name, e.role, a.productivity_score, a.task_completion_rate, a.trend, a.computed_at 
        FROM employees e 
        JOIN ai_scores a ON e.id = a.employee_id 
        WHERE e.org_id = $1
        ORDER BY a.productivity_score DESC
      `;
      
      // Note: You'll need to import 'db' at the top of AIController if it's not there:
      // import db from '../config/db';
      const { default: db } = await import('../config/db'); 

      const result = await db.query(query, [orgId]);
      res.status(200).json({ success: true, data: result.rows });
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Failed to fetch AI scores' });
    }
  }
}

export default new AIController();