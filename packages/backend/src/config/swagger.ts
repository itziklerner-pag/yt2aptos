import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';
import path from 'path';
import fs from 'fs';

// Try to read package version
let version = '1.0.0';
try {
  const packageJson = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../../../package.json'), 'utf8')
  );
  version = packageJson.version;
} catch (error) {
  console.warn('Could not read package.json version');
}

// Basic API information
const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'YouTube Content Archiving System API',
    version,
    description: 'API documentation for the YouTube Content Archiving System',
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
    contact: {
      name: 'API Support',
      email: 'support@example.com',
    },
  },
  servers: [
    {
      url: '/api',
      description: 'Development server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your JWT token in the format: Bearer {token}',
      },
      apiKeyAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'x-api-key',
        description: 'API key for external service access',
      },
      apiSecretAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'x-api-secret',
        description: 'API secret for external service access',
      },
    },
    schemas: {
      ApiKey: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            description: 'Unique identifier for the API key',
          },
          key: {
            type: 'string',
            description: 'API key string',
          },
          name: {
            type: 'string',
            description: 'Human-readable name for the API key',
          },
          permissions: {
            type: 'array',
            items: {
              type: 'string',
            },
            description: 'List of permissions assigned to the API key',
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'When the API key was created',
          },
          lastUsed: {
            type: 'string',
            format: 'date-time',
            description: 'When the API key was last used',
            nullable: true,
          },
          isEnabled: {
            type: 'boolean',
            description: 'Whether the API key is currently enabled',
          },
        },
      },
      ApiKeyWithSecret: {
        allOf: [
          { $ref: '#/components/schemas/ApiKey' },
          {
            type: 'object',
            properties: {
              secret: {
                type: 'string',
                description: 'API secret (only provided once upon creation)',
              },
            },
          },
        ],
      },
      Webhook: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            description: 'Unique identifier for the webhook',
          },
          url: {
            type: 'string',
            format: 'uri',
            description: 'Destination URL for webhook deliveries',
          },
          name: {
            type: 'string',
            description: 'Human-readable name for the webhook',
          },
          events: {
            type: 'array',
            items: {
              type: 'string',
              enum: [
                'download.started',
                'download.progress',
                'download.completed',
                'download.failed',
                'channel.updated',
                'playlist.updated',
                'storage.exceeded',
                'system.alert',
              ],
            },
            description: 'List of events the webhook is subscribed to',
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'When the webhook was created',
          },
          lastTriggered: {
            type: 'string',
            format: 'date-time',
            description: 'When the webhook was last triggered',
            nullable: true,
          },
          isEnabled: {
            type: 'boolean',
            description: 'Whether the webhook is currently enabled',
          },
        },
      },
      EventType: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'Event type identifier',
          },
          description: {
            type: 'string',
            description: 'Human-readable description of the event type',
          },
        },
      },
      SystemStatus: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            description: 'Whether the system is operational',
          },
          status: {
            type: 'string',
            enum: ['healthy', 'degraded', 'unhealthy'],
            description: 'Overall system health status',
          },
          version: {
            type: 'string',
            description: 'API version',
          },
          timestamp: {
            type: 'string',
            format: 'date-time',
            description: 'When the status was checked',
          },
          details: {
            type: 'object',
            description: 'Detailed system status information',
          },
        },
      },
      Error: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: false,
          },
          message: {
            type: 'string',
            description: 'Error message',
          },
        },
      },
      WebhookPayload: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            description: 'Unique identifier for the webhook delivery',
          },
          event: {
            type: 'string',
            description: 'Event type that triggered the webhook',
          },
          timestamp: {
            type: 'string',
            format: 'date-time',
            description: 'When the event occurred',
          },
          data: {
            type: 'object',
            description: 'Event-specific payload data',
          },
        },
      },
    },
    responses: {
      UnauthorizedError: {
        description: 'Access token is missing or invalid',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error',
            },
            example: {
              success: false,
              message: 'Authentication required',
            },
          },
        },
      },
      NotFoundError: {
        description: 'The requested resource was not found',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error',
            },
            example: {
              success: false,
              message: 'Resource not found',
            },
          },
        },
      },
      BadRequestError: {
        description: 'Invalid request parameters',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error',
            },
            example: {
              success: false,
              message: 'Invalid request parameters',
            },
          },
        },
      },
    },
  },
  // Define API tags for grouping
  tags: [
    {
      name: 'API Keys',
      description: 'API key management for external services',
    },
    {
      name: 'Webhooks',
      description: 'Webhook registration and management',
    },
    {
      name: 'System',
      description: 'System status and metadata',
    },
    {
      name: 'Events',
      description: 'Event types and test triggers',
    },
  ],
};

// Options for swagger-jsdoc
const options = {
  swaggerDefinition,
  // Path patterns to API route files containing JSDoc comments
  apis: [
    path.join(__dirname, '../routes/*.routes.ts'),
    path.join(__dirname, '../controllers/*.controller.ts'),
  ],
};

// Generate the OpenAPI spec
const swaggerSpec = swaggerJsdoc(options);

/**
 * Configure Swagger UI for Express
 * @param app Express application
 */
export const setupSwagger = (app: Express): void => {
  // Serve Swagger UI
  app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      explorer: true,
      customCss: '.swagger-ui .topbar { display: none }',
    })
  );

  // Serve the OpenAPI spec as JSON
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  console.log(`API Documentation available at /api-docs`);
};

/**
 * Externally expose the OpenAPI spec for documentation purposes
 */
export const getSwaggerSpec = (): object => {
  return swaggerSpec;
};