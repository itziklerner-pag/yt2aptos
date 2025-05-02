"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const monitoring_controller_1 = require("../controllers/monitoring.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = express_1.default.Router();
/**
 * System statistics routes
 */
// GET system metrics (current or historical)
// GET /api/stats/system - Get current system metrics
// GET /api/stats/system?history=true - Get historical system metrics
// GET /api/stats/system?history=true&limit=10 - Get last 10 historical points
router.get('/system', auth_middleware_1.authMiddleware.authenticate, monitoring_controller_1.monitoringController.getSystemMetrics);
// GET system health status
router.get('/system/health', monitoring_controller_1.monitoringController.getSystemHealth);
// POST refresh metrics (force immediate collection)
router.post('/system/refresh', auth_middleware_1.authMiddleware.authenticate, monitoring_controller_1.monitoringController.refreshMetrics);
/**
 * Download statistics routes
 */
// GET download metrics (current or historical)
// GET /api/stats/downloads - Get current download metrics
// GET /api/stats/downloads?history=true - Get historical download metrics
router.get('/downloads', auth_middleware_1.authMiddleware.authenticate, monitoring_controller_1.monitoringController.getDownloadMetrics);
/**
 * Storage statistics routes
 */
// GET storage metrics (current or historical)
// GET /api/stats/storage - Get current storage metrics
// GET /api/stats/storage?history=true - Get historical storage metrics
router.get('/storage', auth_middleware_1.authMiddleware.authenticate, monitoring_controller_1.monitoringController.getStorageMetrics);
/**
 * Alert management routes
 */
// GET active alerts
router.get('/alerts/active', auth_middleware_1.authMiddleware.authenticate, monitoring_controller_1.monitoringController.getActiveAlerts);
// GET alert history
router.get('/alerts/history', auth_middleware_1.authMiddleware.authenticate, monitoring_controller_1.monitoringController.getAlertHistory);
// GET alert configurations
router.get('/alerts/configs', auth_middleware_1.authMiddleware.authenticate, monitoring_controller_1.monitoringController.getAlertConfigs);
// POST create new alert configuration
router.post('/alerts/configs', auth_middleware_1.authMiddleware.authenticate, monitoring_controller_1.monitoringController.createAlertConfig);
// PUT update existing alert configuration
router.put('/alerts/configs/:id', auth_middleware_1.authMiddleware.authenticate, monitoring_controller_1.monitoringController.updateAlertConfig);
// DELETE alert configuration
router.delete('/alerts/configs/:id', auth_middleware_1.authMiddleware.authenticate, monitoring_controller_1.monitoringController.deleteAlertConfig);
/**
 * Logs routes
 * Note: In a production environment, you might want to implement pagination,
 * filtering by log level, time range, etc.
 */
// GET system logs (placeholder - would typically connect to a log storage system)
router.get('/logs', auth_middleware_1.authMiddleware.authenticate, (req, res) => {
    // This is a placeholder - in a real implementation, you would:
    // 1. Connect to your logging system (e.g., Winston, Pino, or a log aggregation service)
    // 2. Query logs with filters provided in req.query
    // 3. Return paginated results
    res.status(501).json({
        success: false,
        message: 'Log retrieval not implemented yet'
    });
});
exports.default = router;
//# sourceMappingURL=monitoring.routes.js.map