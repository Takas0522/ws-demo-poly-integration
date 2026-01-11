/**
 * Swagger UI Setup for Authentication Service
 * 
 * This module configures Swagger UI to serve interactive API documentation
 * based on the OpenAPI 3.0 specification.
 */

import { Express } from 'express';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yaml';
import fs from 'fs';
import path from 'path';

export interface SwaggerConfig {
  enabled?: boolean;
  routePath?: string;
  openapiPath?: string;
}

/**
 * Set up Swagger UI for the Express application
 * 
 * @param app - Express application instance
 * @param config - Optional configuration
 */
export function setupSwagger(app: Express, config: SwaggerConfig = {}): void {
  const {
    enabled = process.env.SWAGGER_ENABLED !== 'false',
    routePath = '/api-docs',
    openapiPath = path.join(__dirname, '../../../docs/api/auth-service/openapi.yaml')
  } = config;

  if (!enabled) {
    console.log('📚 Swagger UI is disabled');
    return;
  }

  try {
    // Load OpenAPI specification
    const openapiFile = fs.readFileSync(openapiPath, 'utf8');
    const openapiDocument = YAML.parse(openapiFile);

    // Custom CSS for better appearance
    const customCss = `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info { margin: 20px 0; }
      .swagger-ui .info .title { 
        color: #667eea; 
        font-size: 36px;
      }
      .swagger-ui .scheme-container {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      }
      .swagger-ui .btn.authorize { 
        background-color: #667eea;
        border-color: #667eea;
      }
      .swagger-ui .btn.authorize:hover {
        background-color: #764ba2;
        border-color: #764ba2;
      }
      .swagger-ui .opblock-tag {
        border-bottom: 2px solid #667eea;
      }
    `;

    // Swagger UI options
    const swaggerOptions: swaggerUi.SwaggerUiOptions = {
      customCss,
      customSiteTitle: 'Authentication Service API',
      customfavIcon: '/favicon.ico',
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        filter: true,
        syntaxHighlight: {
          activate: true,
          theme: 'monokai'
        },
        tryItOutEnabled: true
      }
    };

    // Set up Swagger UI
    app.use(routePath, swaggerUi.serve);
    app.get(routePath, swaggerUi.setup(openapiDocument, swaggerOptions));

    // Serve OpenAPI spec as JSON
    app.get(`${routePath}.json`, (req, res) => {
      res.json(openapiDocument);
    });

    // Serve OpenAPI spec as YAML
    app.get(`${routePath}.yaml`, (req, res) => {
      res.type('text/yaml').send(openapiFile);
    });

    console.log(`📚 API Documentation available at: ${routePath}`);
    console.log(`📄 OpenAPI spec (JSON): ${routePath}.json`);
    console.log(`📄 OpenAPI spec (YAML): ${routePath}.yaml`);
  } catch (error) {
    console.error('❌ Failed to setup Swagger UI:', error);
    
    // In production, we might want to fail gracefully
    if (process.env.NODE_ENV === 'production') {
      console.warn('⚠️  Continuing without API documentation');
    } else {
      throw error;
    }
  }
}

/**
 * Environment-specific configuration
 */
export const swaggerConfig = {
  development: {
    enabled: true,
    routePath: '/api-docs',
  },
  staging: {
    enabled: true,
    routePath: '/api-docs',
  },
  production: {
    enabled: process.env.SWAGGER_ENABLED === 'true',
    routePath: '/api-docs',
  }
};

/**
 * Get configuration for current environment
 */
export function getSwaggerConfig(): SwaggerConfig {
  const env = (process.env.NODE_ENV || 'development') as keyof typeof swaggerConfig;
  return swaggerConfig[env] || swaggerConfig.development;
}
