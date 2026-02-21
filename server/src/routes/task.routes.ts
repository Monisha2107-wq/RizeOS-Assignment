import { Router } from 'express';
import TaskController from '../controllers/TaskController';
import AuthMiddleware from '../middleware/auth.middleware';

const router = Router();

router.use(AuthMiddleware.verifyToken);

router.get('/stats/weekly', TaskController.getWeeklyStats.bind(TaskController));

router.post('/', TaskController.createTask.bind(TaskController));

router.get('/', TaskController.getTasks.bind(TaskController));

router.patch('/:id/status', TaskController.updateStatus.bind(TaskController));

router.patch('/:id', TaskController.updateTask.bind(TaskController));

router.delete('/:id', TaskController.deleteTask.bind(TaskController));

export default router;