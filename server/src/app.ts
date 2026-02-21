import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import authRoutes from './routes/auth.routes';
import employeeRoutes from './routes/employee.routes';
import taskRoutes from './routes/task.routes';
import aiRoutes from './routes/ai.routes';

class App {
  public express: Application;

  constructor() {
    this.express = express();
    this.initializeSecurityMiddleware();
    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeErrorHandling(); // MUST be the very last thing initialized
  }

  private initializeSecurityMiddleware(): void {
    // 1. Helmet: Sets 15+ security headers
    this.express.use(helmet());

    // 2. Strict CORS: Only allow your specific frontend
    const allowedOrigins = [
      process.env.FRONTEND_URL || 'http://localhost:5173', 
      // Add production URL here later, e.g., 'https://rizeos.vercel.app'
    ];
    
    this.express.use(cors({
      origin: allowedOrigins,
      credentials: true, // Needed if you use cookies later
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    }));

    // 3. Global Rate Limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 200, // Limit each IP to 200 requests per `window`
      message: { success: false, message: 'Too many requests from this IP, please try again later.' },
      standardHeaders: true,
      legacyHeaders: false,
    });
    this.express.use('/api', limiter);
  }

  private initializeMiddleware(): void {
    this.express.use(express.json({ limit: '1mb' })); // Limit JSON body size to prevent payload exhaustion
    this.express.use(express.urlencoded({ extended: true, limit: '1mb' }));
  }

  private initializeRoutes(): void {
    this.express.get('/health', (req: Request, res: Response) => {
      res.status(200).json({ status: 'success', message: 'RizeOS API is running.' });
    });

    this.express.use('/api/auth', authRoutes);
    this.express.use('/api/employees', employeeRoutes);
    this.express.use('/api/tasks', taskRoutes);
    this.express.use('/api/ai', aiRoutes);

    this.express.use((req: Request, res: Response) => {
      res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} not found.`,
      });
    });
  }

  // 4. Global Error Handler
  private initializeErrorHandling(): void {
    this.express.use((err: any, req: Request, res: Response, next: NextFunction) => {
      console.error(`[ERROR] ${req.method} ${req.url} >>`, err.message);

      const statusCode = err.status || 500;
      const message = err.message || 'Internal Server Error';

      res.status(statusCode).json({
        success: false,
        message,
        // Only leak the stack trace in development mode
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
      });
    });
  }
}

export default new App().express;