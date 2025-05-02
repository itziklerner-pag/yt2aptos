"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./config/app");
const database_1 = require("./config/database");
const env_1 = require("./config/env");
const logger_1 = require("./utils/logger");
const websocket_service_1 = require("./services/websocket.service");
const monitoring_service_1 = require("./services/monitoring.service");
const external_api_service_1 = require("./services/external-api.service");
/**
 * Start the application server
 */
async function startServer() {
    try {
        // Validate environment variables
        (0, env_1.validateEnv)();
        // Configure Express app
        const app = (0, app_1.configureApp)();
        // Connect to MongoDB
        await (0, database_1.connectDatabase)();
        // Initialize services
        (0, logger_1.logInfo)(`Storage service initialized with provider: ${env_1.env.STORAGE_TYPE}`);
        (0, logger_1.logInfo)('YouTube API service initialized');
        // Start the server
        const server = app.listen(env_1.env.PORT, () => {
            (0, logger_1.logInfo)(`Server started in ${env_1.env.NODE_ENV} mode`);
            (0, logger_1.logInfo)(`Listening on port ${env_1.env.PORT}`);
            (0, logger_1.logInfo)(`API available at ${env_1.env.API_PREFIX}`);
        });
        // Initialize WebSocket service with HTTP server
        websocket_service_1.websocketService.initialize(server);
        (0, logger_1.logInfo)('WebSocket server initialized');
        // Initialize monitoring service
        monitoring_service_1.monitoringService.initialize();
        (0, logger_1.logInfo)('Monitoring service initialized');
        // Initialize external API service
        external_api_service_1.externalApiService.initialize();
        (0, logger_1.logInfo)('External API service initialized');
        // Handle graceful shutdown
        const shutdown = async () => {
            (0, logger_1.logInfo)('Shutting down server...');
            // Shut down services
            monitoring_service_1.monitoringService.shutdown();
            external_api_service_1.externalApiService.shutdown();
            server.close(() => {
                (0, logger_1.logInfo)('Express server closed');
                process.exit(0);
            });
            // If server hasn't closed in 10 seconds, force shut down
            setTimeout(() => {
                (0, logger_1.logError)('Could not close connections in time, forcefully shutting down');
                process.exit(1);
            }, 10000);
        };
        process.on('SIGTERM', shutdown);
        process.on('SIGINT', shutdown);
    }
    catch (error) {
        (0, logger_1.logError)('Failed to start server', error);
        process.exit(1);
    }
}
// Start the server
startServer();
//# sourceMappingURL=index.js.map