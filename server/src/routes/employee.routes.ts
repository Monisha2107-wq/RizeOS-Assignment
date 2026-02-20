import { Router } from 'express';
import EmployeeController from '../controllers/EmployeeController';
import AuthMiddleware from '../middleware/auth.middleware';

const router = Router();

router.get(
  '/', 
  AuthMiddleware.verifyToken, 
  EmployeeController.getEmployees.bind(EmployeeController)
);

router.post(
  '/', 
  AuthMiddleware.verifyToken, 
  AuthMiddleware.requireAdmin, 
  EmployeeController.createEmployee.bind(EmployeeController)
);

export default router;