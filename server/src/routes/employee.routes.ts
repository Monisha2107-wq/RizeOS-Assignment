import { Router } from 'express';
import EmployeeController from '../controllers/EmployeeController';
import AuthMiddleware from '../middleware/auth.middleware';

const router = Router();

router.use(AuthMiddleware.verifyToken);

router.get('/', EmployeeController.getEmployees.bind(EmployeeController));

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