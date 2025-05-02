import { configureApp } from './config/app';
import { connectDatabase } from './config/database';
import { env, validateEnv } from './config/env';
import { logInfo, logError } from './utils/logger';
import { storageService } from './services/storage.service';
import { youtubeService } from './services/youtube.service';
import { websocketService } from './services/websocket.service';
import { monitoringService } from './services/monitoring.service';
import { externalApiService } from './services/external-api.service';

/**
 * Start the application server
 */
async function startServer() {
  try {
    // Validate environment variables
    validateEnv();
    
    // Configure Express app
    const app = configureApp();
    
    // Connect to MongoDB
    await connectDatabase();
    
    // Initialize services
    logInfo(`Storage service initialized with provider: ${env.STORAGE_TYPE}`);
    logInfo('YouTube API service initialized');
    
    // Start the server
    const server = app.listen(env.PORT, () => {
      logInfo(`Server started in ${env.NODE_ENV} mode`);
      logInfo(`Listening on port ${env.PORT}`);
      logInfo(`API available at ${env.API_PREFIX}`);
    });
    
    // Initialize WebSocket service with HTTP server
    websocketService.initialize(server);
    logInfo('WebSocket server initialized');
    
    // Initialize monitoring service
    monitoringService.initialize();
    logInfo('Monitoring service initialized');
    
    // Initialize external API service
    externalApiService.initialize();
    logInfo('External API service initialized');
    
    // Handle graceful shutdown
    const shutdown = async () => {
      logInfo('Shutting down server...');
      
      // Shut down services
      monitoringService.shutdown();
      externalApiService.shutdown();
      
      server.close(() => {
        logInfo('Express server closed');
        process.exit(0);
      });
      
      // If server hasn't closed in 10 seconds, force shut down
      setTimeout(() => {
        logError('Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 10000);
    };
    
    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
    
  } catch (error) {
    logError('Failed to start server', error as Error);
    process.exit(1);
  }
}

// Start the server
startServer();