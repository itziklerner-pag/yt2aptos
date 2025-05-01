import express, { Express } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import compression from 'compression';
import 'express-async-errors';
import { errorHandler, notFoundHandler } from '../middleware/error-handler.middleware';
import { env } from './env';
import { logStream } from '../utils/logger';
import routes from '../routes';

/**
 * Configure and set up the Express application
 * @returns Configured Express application
 */
export function configureApp(): Express {
  const app = express();
  
  // Basic middleware
  app.use(helmet()); // Security headers
  app.use(compression()); // Response compression
  app.use(cors({
    origin: env.CORS_ORIGIN,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));
  app.use(express.json()); // Parse JSON bodies
  app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
  
  // Logging middleware
  app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev', {
    stream: logStream,
  }));
  
  // Register API routes
  app.use(env.API_PREFIX, routes);
  
  // Setup static file serving for the local file system provider
  if (env.STORAGE_TYPE === 'local') {
    app.use('/files', express.static(env.STORAGE_PATH));
  }
  
  // Health check endpoint
  app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });
  
  // Error handling
  app.use(notFoundHandler);
  app.use(errorHandler);
  
  return app;
}