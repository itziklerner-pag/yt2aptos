"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.configureApp = configureApp;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const morgan_1 = __importDefault(require("morgan"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
require("express-async-errors");
const error_handler_middleware_1 = require("../middleware/error-handler.middleware");
const env_1 = require("./env");
const logger_1 = require("../utils/logger");
const routes_1 = __importDefault(require("../routes"));
/**
 * Configure and set up the Express application
 * @returns Configured Express application
 */
function configureApp() {
    const app = (0, express_1.default)();
    // Basic middleware
    app.use((0, helmet_1.default)()); // Security headers
    app.use((0, compression_1.default)()); // Response compression
    app.use((0, cors_1.default)({
        origin: env_1.env.CORS_ORIGIN,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    }));
    app.use(express_1.default.json()); // Parse JSON bodies
    app.use(express_1.default.urlencoded({ extended: true })); // Parse URL-encoded bodies
    // Logging middleware
    app.use((0, morgan_1.default)(env_1.env.NODE_ENV === 'production' ? 'combined' : 'dev', {
        stream: logger_1.logStream,
    }));
    // Register API routes
    app.use(env_1.env.API_PREFIX, routes_1.default);
    // Setup static file serving for the local file system provider
    if (env_1.env.STORAGE_TYPE === 'local') {
        app.use('/files', express_1.default.static(env_1.env.STORAGE_PATH));
    }
    // Health check endpoint
    app.get('/health', (req, res) => {
        res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
    });
    // Error handling
    app.use(error_handler_middleware_1.notFoundHandler);
    app.use(error_handler_middleware_1.errorHandler);
    return app;
}
//# sourceMappingURL=app.js.map