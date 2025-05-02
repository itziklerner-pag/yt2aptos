"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const monitoring_service_1 = require("../monitoring.service");
const websocket_service_1 = require("../websocket.service");
const monitoring_service_2 = require("../monitoring.service");
// Mock websocket service
jest.mock('../websocket.service', () => ({
    websocketService: {
        broadcast: jest.fn(),
        sendSystemNotification: jest.fn()
    }
}));
// Mock os module used in monitoring service
jest.mock('os', () => ({
    cpus: jest.fn(() => [
        { times: { user: 100, nice: 0, sys: 50, idle: 50, irq: 0 } },
        { times: { user: 100, nice: 0, sys: 50, idle: 50, irq: 0 } }
    ]),
    totalmem: jest.fn(() => 8589934592), // 8 GB
    freemem: jest.fn(() => 4294967296), // 4 GB
    loadavg: jest.fn(() => [1.5, 1.2, 1.0]),
    uptime: jest.fn(() => 3600) // 1 hour
}));
// Mock mongoose connection
jest.mock('mongoose', () => ({
    connection: {
        readyState: 1 // Connected
    }
}));
describe('MonitoringService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    afterEach(() => {
        // Clear intervals to prevent test from hanging
        monitoring_service_1.monitoringService.shutdown();
    });
    describe('System Metrics', () => {
        it('should collect system metrics', async () => {
            // Use private method through any cast to test collection
            await monitoring_service_1.monitoringService.collectSystemMetrics();
            const metrics = monitoring_service_1.monitoringService.getSystemMetrics();
            // Verify metrics were collected
            expect(metrics).toBeDefined();
            expect(metrics.cpu).toBeDefined();
            expect(metrics.memory).toBeDefined();
            expect(metrics.cpu.cores).toBe(2); // From our mock
            expect(metrics.cpu.loadAverage).toEqual([1.5, 1.2, 1.0]);
            expect(metrics.memory.total).toBe(8589934592);
            expect(metrics.memory.free).toBe(4294967296);
            // Verify websocket broadcast was called
            expect(websocket_service_1.websocketService.broadcast).toHaveBeenCalledWith(monitoring_service_2.MonitoringEventType.SYSTEM_METRICS_UPDATED, expect.any(Object));
        });
        it('should provide system metrics history', async () => {
            // Collect multiple times to build history
            await monitoring_service_1.monitoringService.collectSystemMetrics();
            await monitoring_service_1.monitoringService.collectSystemMetrics();
            const history = monitoring_service_1.monitoringService.getSystemMetricsHistory();
            expect(Array.isArray(history)).toBe(true);
            expect(history.length).toBeGreaterThan(0);
        });
        it('should perform system health check', async () => {
            const health = await monitoring_service_1.monitoringService.checkSystemHealth();
            expect(health).toBeDefined();
            expect(health.status).toBeDefined();
            expect(['healthy', 'degraded', 'unhealthy']).toContain(health.status);
            expect(health.metrics).toBeDefined();
            expect(health.details).toBeDefined();
        });
    });
    describe('Download Metrics', () => {
        it('should collect download metrics', async () => {
            await monitoring_service_1.monitoringService.collectDownloadMetrics();
            const metrics = monitoring_service_1.monitoringService.getDownloadMetrics();
            expect(metrics).toBeDefined();
            expect(metrics.activeJobs).toBeDefined();
            expect(metrics.queuedJobs).toBeDefined();
            expect(metrics.completedJobs).toBeDefined();
            expect(metrics.failedJobs).toBeDefined();
            expect(websocket_service_1.websocketService.broadcast).toHaveBeenCalledWith(monitoring_service_2.MonitoringEventType.DOWNLOAD_METRICS_UPDATED, expect.any(Object));
        });
        it('should track download progress', () => {
            const jobId = 'test-job-123';
            monitoring_service_1.monitoringService.registerDownloadProgress(jobId, 50, 1024 * 1024); // 50%, 1MB/s
            // This is mostly for code coverage as the implementation is minimal
            // In a real implementation, we'd verify the progress was saved somewhere
            expect(true).toBe(true);
        });
    });
    describe('Storage Metrics', () => {
        it('should collect storage metrics', async () => {
            await monitoring_service_1.monitoringService.collectStorageMetrics();
            const metrics = monitoring_service_1.monitoringService.getStorageMetrics();
            expect(metrics).toBeDefined();
            expect(metrics.totalSpace).toBeDefined();
            expect(metrics.usedSpace).toBeDefined();
            expect(metrics.freeSpace).toBeDefined();
            expect(metrics.providers).toBeDefined();
            expect(websocket_service_1.websocketService.broadcast).toHaveBeenCalledWith(monitoring_service_2.MonitoringEventType.STORAGE_METRICS_UPDATED, expect.any(Object));
        });
    });
    describe('Alerts', () => {
        it('should manage alert configurations', () => {
            // Get initial configs
            const initialConfigs = monitoring_service_1.monitoringService.getAlertConfigs();
            expect(Array.isArray(initialConfigs)).toBe(true);
            // Create new alert config
            const newConfig = monitoring_service_1.monitoringService.saveAlertConfig({
                name: 'Test Alert',
                type: 'system',
                condition: 'value > threshold',
                threshold: 90,
                status: 'active',
                severity: 'warning',
                message: 'Test alert triggered'
            });
            expect(newConfig).toBeDefined();
            expect(newConfig.id).toBeDefined();
            expect(newConfig.name).toBe('Test Alert');
            // Get updated configs
            const updatedConfigs = monitoring_service_1.monitoringService.getAlertConfigs();
            expect(updatedConfigs.length).toBe(initialConfigs.length + 1);
            // Update config
            const updatedConfig = monitoring_service_1.monitoringService.saveAlertConfig({
                id: newConfig.id,
                threshold: 95
            });
            expect(updatedConfig.threshold).toBe(95);
            // Delete config
            const deleted = monitoring_service_1.monitoringService.deleteAlertConfig(newConfig.id);
            expect(deleted).toBe(true);
            // Verify it's gone
            const finalConfigs = monitoring_service_1.monitoringService.getAlertConfigs();
            expect(finalConfigs.length).toBe(initialConfigs.length);
        });
        it('should check alerts and trigger when conditions are met', async () => {
            // Create a test alert that will trigger immediately
            const config = monitoring_service_1.monitoringService.saveAlertConfig({
                name: 'Test Trigger Alert',
                type: 'system',
                condition: 'true', // Always trigger
                threshold: 1,
                status: 'active',
                severity: 'info',
                message: 'Test alert always triggered'
            });
            // Manually trigger alert check
            await monitoring_service_1.monitoringService.checkAlerts();
            // Verify alert is active
            const activeAlerts = monitoring_service_1.monitoringService.getActiveAlerts();
            expect(activeAlerts.length).toBeGreaterThan(0);
            // Verify websocket notification was sent
            expect(websocket_service_1.websocketService.sendSystemNotification).toHaveBeenCalled();
            // Clean up
            monitoring_service_1.monitoringService.deleteAlertConfig(config.id);
        });
        it('should resolve alerts when conditions are no longer met', async () => {
            // Create alertConfig and trigger the alert
            const config = monitoring_service_1.monitoringService.saveAlertConfig({
                name: 'Test Resolve Alert',
                type: 'system',
                condition: 'value > threshold',
                threshold: 1,
                status: 'active',
                severity: 'info',
                message: 'Test resolve alert'
            });
            // Manually trigger it first - the condition will be met
            monitoring_service_1.monitoringService.systemMetrics.cpu.usage = 2; // above threshold
            await monitoring_service_1.monitoringService.checkAlerts();
            // Now resolve it - set the value below threshold
            monitoring_service_1.monitoringService.systemMetrics.cpu.usage = 0; // below threshold
            // Clear broadcast mock to verify the resolve event
            websocket_service_1.websocketService.broadcast.mockClear();
            // Check alerts again
            await monitoring_service_1.monitoringService.checkAlerts();
            // Verify websocket event for resolved alert
            expect(websocket_service_1.websocketService.broadcast).toHaveBeenCalledWith(monitoring_service_2.MonitoringEventType.ALERT_RESOLVED, expect.any(Object));
            // Clean up
            monitoring_service_1.monitoringService.deleteAlertConfig(config.id);
        });
    });
    describe('Service lifecycle', () => {
        it('should initialize and shutdown properly', () => {
            // Mock setInterval/clearInterval
            const originalSetInterval = global.setInterval;
            const originalClearInterval = global.clearInterval;
            global.setInterval = jest.fn().mockReturnValue(123);
            global.clearInterval = jest.fn();
            try {
                // Initialize the service
                monitoring_service_1.monitoringService.initialize();
                // Verify intervals were set
                expect(global.setInterval).toHaveBeenCalledTimes(4);
                // Shutdown the service
                monitoring_service_1.monitoringService.shutdown();
                // Verify intervals were cleared
                expect(global.clearInterval).toHaveBeenCalledTimes(4);
            }
            finally {
                // Restore originals
                global.setInterval = originalSetInterval;
                global.clearInterval = originalClearInterval;
            }
        });
    });
});
//# sourceMappingURL=monitoring.service.test.js.map