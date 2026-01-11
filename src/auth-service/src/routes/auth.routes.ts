import { Router, Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { authRateLimiter } from '../middleware/rate-limit.middleware';
import { authenticate } from '../middleware/auth.middleware';
import { LoginRequest, RefreshTokenRequest, LogoutRequest } from '@saas-app/types';

const router = Router();
const authService = new AuthService();

/**
 * POST /auth/login
 * Authenticate user and return JWT tokens
 */
router.post('/login', authRateLimiter, async (req: Request, res: Response) => {
  try {
    const loginRequest: LoginRequest = req.body;

    // Validate required fields
    if (!loginRequest.email || !loginRequest.password) {
      res.status(400).json({
        error: true,
        message: 'Email and password are required',
        code: 'MISSING_FIELDS',
      });
      return;
    }

    const response = await authService.login(loginRequest);

    res.status(200).json({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(401).json({
      error: true,
      message: error instanceof Error ? error.message : 'Login failed',
      code: 'LOGIN_FAILED',
    });
  }
});

/**
 * POST /auth/refresh
 * Refresh access token using refresh token
 */
router.post('/refresh', authRateLimiter, async (req: Request, res: Response) => {
  try {
    const refreshRequest: RefreshTokenRequest = req.body;

    // Validate required fields
    if (!refreshRequest.refreshToken) {
      res.status(400).json({
        error: true,
        message: 'Refresh token is required',
        code: 'MISSING_REFRESH_TOKEN',
      });
      return;
    }

    const response = await authService.refreshToken(refreshRequest);

    res.status(200).json({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(401).json({
      error: true,
      message: error instanceof Error ? error.message : 'Token refresh failed',
      code: 'REFRESH_FAILED',
    });
  }
});

/**
 * POST /auth/logout
 * Logout user by revoking refresh tokens
 */
router.post('/logout', authenticate, async (req: Request, res: Response) => {
  try {
    const logoutRequest: LogoutRequest = req.body;
    const refreshToken = req.body.refreshToken;
    const userId = req.user!.sub;

    await authService.logout(userId, refreshToken, logoutRequest.allDevices);

    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      error: true,
      message: error instanceof Error ? error.message : 'Logout failed',
      code: 'LOGOUT_FAILED',
    });
  }
});

/**
 * GET /auth/verify
 * Verify current access token
 */
router.get('/verify', authenticate, (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    data: {
      valid: true,
      user: req.user,
    },
  });
});

/**
 * GET /auth/me
 * Get current user info from token
 */
router.get('/me', authenticate, (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    data: {
      id: req.user!.sub,
      email: req.user!.email,
      displayName: req.user!.displayName,
      tenantId: req.user!.tenantId,
      roles: req.user!.roles,
      permissions: req.user!.permissions,
    },
  });
});

export default router;
