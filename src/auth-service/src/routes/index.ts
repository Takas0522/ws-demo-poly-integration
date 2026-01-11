import { Router, Request, Response } from 'express';

const router = Router();

/**
 * GET /health
 * Health check endpoint
 */
router.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    service: 'auth-service',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

/**
 * GET /
 * Root endpoint
 */
router.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    service: 'SaaS Auth Service',
    version: '1.0.0',
    description: 'JWT Authentication Service with tenant-aware authentication',
    endpoints: {
      health: 'GET /health',
      login: 'POST /auth/login',
      logout: 'POST /auth/logout',
      refresh: 'POST /auth/refresh',
      verify: 'GET /auth/verify',
      me: 'GET /auth/me',
    },
  });
});

export default router;
