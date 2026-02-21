import { Router } from 'express';
import TaskController from '../controllers/TaskController';
import AuthMiddleware from '../middleware/auth.middleware';

const router = Router();

// 🔒 Apply authentication middleware to all task routes
router.use(AuthMiddleware.verifyToken);

// --- Task CRUD Routes ---

// Create a new task
router.post('/', TaskController.createTask.bind(TaskController));

// Get all tasks (Supports Pagination, Sorting, and Filtering via query params)
// Example: GET /tasks?page=1&limit=10&status=completed&sortBy=priority
router.get('/', TaskController.getTasks.bind(TaskController));

// Update ONLY the status of a task (Specific action)
router.patch('/:id/status', TaskController.updateStatus.bind(TaskController));

// 🚀 NEW: Update any allowed field of a task (Partial update)
router.patch('/:id', TaskController.updateTask.bind(TaskController));

// 🚀 NEW: Delete a task
router.delete('/:id', TaskController.deleteTask.bind(TaskController));

export default router;