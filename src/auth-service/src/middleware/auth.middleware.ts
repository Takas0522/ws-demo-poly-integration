import { Request, Response, NextFunction } from 'express';
import { TokenService } from '../services/token.service';
import { JWTAccessPayload } from '@saas-app/types';

// Extend Express Request to include user info
// eslint-disable-next-line @typescript-eslint/no-namespace
declare global {
  namespace Express {
    interface Request {
      user?: JWTAccessPayload;
    }
  }
}

/**
 * Authentication middleware
 * Verifies JWT access token and attaches user info to request
 */
export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      res.status(401).json({
        error: true,
        message: 'No authorization token provided',
        code: 'NO_TOKEN',
      });
      return;
    }

    // Extract token from "Bearer <token>" format
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      res.status(401).json({
        error: true,
        message: 'Invalid authorization header format',
        code: 'INVALID_HEADER',
      });
      return;
    }

    const token = parts[1];

    // Validate token format (should be non-empty and reasonable length)
    if (!token || token.length < 10 || token.length > 2000) {
      res.status(401).json({
        error: true,
        message: 'Invalid token format',
        code: 'INVALID_TOKEN',
      });
      return;
    }

    // Verify token
    const verificationResult = TokenService.verifyAccessToken(token);
    if (!verificationResult.valid) {
      res.status(401).json({
        error: true,
        message: verificationResult.error || 'Invalid token',
        code: verificationResult.errorCode || 'INVALID_TOKEN',
      });
      return;
    }

    // Attach user info to request
    req.user = verificationResult.payload;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({
      error: true,
      message: 'Authentication failed',
      code: 'AUTH_ERROR',
    });
  }
};

/**
 * Optional authentication middleware
 * Attaches user info if token is present but doesn't fail if missing
 */
export const optionalAuthenticate = (req: Request, _res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      next();
      return;
    }

    const parts = authHeader.split(' ');
    if (parts.length === 2 && parts[0] === 'Bearer') {
      const token = parts[1];
      const verificationResult = TokenService.verifyAccessToken(token);
      if (verificationResult.valid) {
        req.user = verificationResult.payload;
      }
    }

    next();
  } catch (error) {
    console.error('Optional authentication error:', error);
    next();
  }
};

/**
 * Tenant isolation middleware
 * Ensures user can only access resources from their tenant
 */
export const requireTenant = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({
      error: true,
      message: 'Authentication required',
      code: 'AUTH_REQUIRED',
    });
    return;
  }

  const tenantId = req.params.tenantId || req.body.tenantId || req.query.tenantId;
  if (tenantId && tenantId !== req.user.tenantId) {
    res.status(403).json({
      error: true,
      message: 'Access denied to this tenant',
      code: 'TENANT_ACCESS_DENIED',
    });
    return;
  }

  next();
};
