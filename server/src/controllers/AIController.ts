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
}

export default new AIController();