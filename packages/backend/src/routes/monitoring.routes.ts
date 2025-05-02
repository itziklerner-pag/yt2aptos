import express from 'express';
import { monitoringController } from '../controllers/monitoring.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = express.Router();

/**
 * System statistics routes
 */

// GET system metrics (current or historical)
// GET /api/stats/system - Get current system metrics
// GET /api/stats/system?history=true - Get historical system metrics
// GET /api/stats/system?history=true&limit=10 - Get last 10 historical points
router.get('/system', authMiddleware.authenticate, monitoringController.getSystemMetrics);

// GET system health status
router.get('/system/health', monitoringController.getSystemHealth);

// POST refresh metrics (force immediate collection)
router.post('/system/refresh', authMiddleware.authenticate, monitoringController.refreshMetrics);

/**
 * Download statistics routes
 */

// GET download metrics (current or historical)
// GET /api/stats/downloads - Get current download metrics
// GET /api/stats/downloads?history=true - Get historical download metrics
router.get('/downloads', authMiddleware.authenticate, monitoringController.getDownloadMetrics);

/**
 * Storage statistics routes
 */

// GET storage metrics (current or historical)
// GET /api/stats/storage - Get current storage metrics
// GET /api/stats/storage?history=true - Get historical storage metrics
router.get('/storage', authMiddleware.authenticate, monitoringController.getStorageMetrics);

/**
 * Alert management routes
 */

// GET active alerts
router.get('/alerts/active', authMiddleware.authenticate, monitoringController.getActiveAlerts);

// GET alert history
router.get('/alerts/history', authMiddleware.authenticate, monitoringController.getAlertHistory);

// GET alert configurations
router.get('/alerts/configs', authMiddleware.authenticate, monitoringController.getAlertConfigs);

// POST create new alert configuration
router.post('/alerts/configs', authMiddleware.authenticate, monitoringController.createAlertConfig);

// PUT update existing alert configuration
router.put('/alerts/configs/:id', authMiddleware.authenticate, monitoringController.updateAlertConfig);

// DELETE alert configuration
router.delete('/alerts/configs/:id', authMiddleware.authenticate, monitoringController.deleteAlertConfig);

/**
 * Logs routes
 * Note: In a production environment, you might want to implement pagination,
 * filtering by log level, time range, etc.
 */

// GET system logs (placeholder - would typically connect to a log storage system)
router.get('/logs', authMiddleware.authenticate, (req, res) => {
  // This is a placeholder - in a real implementation, you would:
  // 1. Connect to your logging system (e.g., Winston, Pino, or a log aggregation service)
  // 2. Query logs with filters provided in req.query
  // 3. Return paginated results
  
  res.status(501).json({
    success: false,
    message: 'Log retrieval not implemented yet'
  });
});

export default router;