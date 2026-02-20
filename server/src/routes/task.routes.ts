import { Router } from 'express';
import TaskController from '../controllers/TaskController';
import AuthMiddleware from '../middleware/auth.middleware';

const router = Router();

router.use(AuthMiddleware.verifyToken);

router.post('/', TaskController.createTask.bind(TaskController));
router.get('/', TaskController.getTasks.bind(TaskController));
router.patch('/:id/status', TaskController.updateStatus.bind(TaskController));

export default router;