import { Router } from 'express';
import EmployeeController from '../controllers/EmployeeController';
import AuthMiddleware from '../middleware/auth.middleware';

const router = Router();

// Apply base authentication to all routes
router.use(AuthMiddleware.verifyToken);

// Any authenticated user in the org can VIEW employees
router.get('/', EmployeeController.getEmployees.bind(EmployeeController));

// 🔒 ONLY Admins can modify employees
router.post(
  '/', 
  AuthMiddleware.requireAdmin, 
  EmployeeController.createEmployee.bind(EmployeeController)
);

router.patch(
  '/:id', 
  AuthMiddleware.requireAdmin, 
  EmployeeController.updateEmployee.bind(EmployeeController)
);

router.delete(
  '/:id', 
  AuthMiddleware.requireAdmin, 
  EmployeeController.deleteEmployee.bind(EmployeeController)
);

export default router;