import { Router } from 'express';
import AIController from '../controllers/AIController';
import AuthMiddleware from '../middleware/auth.middleware';

const router = Router();

router.use(AuthMiddleware.verifyToken);

router.post('/smart-assign', AIController.getSmartAssignment.bind(AIController));

export default router;