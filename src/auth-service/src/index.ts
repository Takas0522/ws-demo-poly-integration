import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { config } from './config';
import { CosmosDbService } from './services/cosmosdb.service';
import { generalRateLimiter } from './middleware/rate-limit.middleware';
import authRoutes from './routes/auth.routes';
import indexRoutes from './routes/index';

/**
 * Create and configure Express application
 */
export function createApp(): Express {
  const app = express();

  // Middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // CORS
  app.use(
    cors({
      origin: config.cors.origins,
      credentials: config.cors.credentials,
    })
  );

  // Rate limiting
  app.use(generalRateLimiter);

  // Request logging
  if (config.nodeEnv === 'development') {
    app.use((req: Request, _res: Response, next: NextFunction) => {
      console.log(`${req.method} ${req.path}`);
      next();
    });
  }

  // Routes
  app.use('/', indexRoutes);
  app.use('/auth', authRoutes);

  // Error handling middleware
  app.use((err: Error, _req: Request, res: Response) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
      error: true,
      message: config.nodeEnv === 'development' ? err.message : 'Internal server error',
      code: 'INTERNAL_ERROR',
    });
  });

  // 404 handler
  app.use((_req: Request, res: Response) => {
    res.status(404).json({
      error: true,
      message: 'Endpoint not found',
      code: 'NOT_FOUND',
    });
  });

  return app;
}

/**
 * Initialize database and start server
 */
async function startServer(): Promise<void> {
  try {
    // Initialize CosmosDB
    console.log('Initializing CosmosDB connection...');
    const cosmosDb = CosmosDbService.getInstance();
    await cosmosDb.initialize();
    console.log('CosmosDB initialized successfully');

    // Create Express app
    const app = createApp();

    // Start server
    app.listen(config.port, () => {
      console.log(`Auth Service running on port ${config.port}`);
      console.log(`Environment: ${config.nodeEnv}`);
      console.log(`JWT Algorithm: ${config.jwt.algorithm}`);
      console.log(`Rate Limiting: ${config.features.rateLimiting ? 'enabled' : 'disabled'}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start server if this file is run directly
if (require.main === module) {
  startServer();
}

export { startServer };
