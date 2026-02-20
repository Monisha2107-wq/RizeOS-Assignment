// src/routes/employee.routes.ts

import { Router } from 'express';
import EmployeeController from '../controllers/EmployeeController';
import AuthMiddleware from '../middleware/auth.middleware';

const router = Router();

// Route: GET /api/employees
// Protected: Any logged-in user in the org can view employees
router.get(
  '/', 
  AuthMiddleware.verifyToken, 
  EmployeeController.getEmployees.bind(EmployeeController)
);

// Route: POST /api/employees
// Protected: ONLY Admins can add new employees
router.post(
  '/', 
  AuthMiddleware.verifyToken, 
  AuthMiddleware.requireAdmin, 
  EmployeeController.createEmployee.bind(EmployeeController)
);

export default router;