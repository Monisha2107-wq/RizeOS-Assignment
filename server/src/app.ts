import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes';
import employeeRoutes from './routes/employee.routes';

class App {
  public express: Application;

  constructor() {
    this.express = express();
    this.initializeMiddleware();
    this.initializeRoutes();
  }

  private initializeMiddleware(): void {
    this.express.use(cors());
    this.express.use(express.json()); 
    this.express.use(express.urlencoded({ extended: true }));
  }

  private initializeRoutes(): void {
    this.express.get('/health', (req: Request, res: Response) => {
      res.status(200).json({ status: 'success', message: 'RizeOS API is running.' });
    });

    this.express.use('/api/auth', authRoutes);
    this.express.use('/api/employees', employeeRoutes);
  }
}

export default new App().express;