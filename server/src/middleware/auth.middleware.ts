import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    orgId: string;
    role: string;
  };
}

export class AuthMiddleware {
  private readonly JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

  public verifyToken = (req: AuthRequest, res: Response, next: NextFunction): void => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
        return;
      }

      const token = authHeader.split(' ')[1];

      const decoded = jwt.verify(token, this.JWT_SECRET) as any;

      req.user = {
        userId: decoded.sub,
        orgId: decoded.orgId,
        role: decoded.role,
      };

      next();
    } catch (error) {
      res.status(403).json({ success: false, message: 'Invalid or expired token.' });
    }
  };

  public requireAdmin = (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (req.user?.role !== 'ADMIN') {
      res.status(403).json({ success: false, message: 'Access denied. Admin privileges required.' });
      return;
    }
    next();
  };
}

export default new AuthMiddleware();