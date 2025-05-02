"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const monitoring_controller_1 = require("../monitoring.controller");
const monitoring_service_1 = require("../../services/monitoring.service");
// Mock the monitoring service
jest.mock('../../services/monitoring.service', () => ({
    monitoringService: {
        getSystemMetrics: jest.fn(),
        getSystemMetricsHistory: jest.fn(),
        getDownloadMetrics: jest.fn(),
        getDownloadMetricsHistory: jest.fn(),
        getStorageMetrics: jest.fn(),
        getStorageMetricsHistory: jest.fn(),
        getActiveAlerts: jest.fn(),
        getAlertHistory: jest.fn(),
        getAlertConfigs: jest.fn(),
        saveAlertConfig: jest.fn(),
        deleteAlertConfig: jest.fn(),
        checkSystemHealth: jest.fn()
    }
}));
// Mock the logger
jest.mock('../../utils/logger', () => ({
    logInfo: jest.fn(),
    logError: jest.fn(),
    logDebug: jest.fn()
}));
describe('MonitoringController', () => {
    let mockRequest;
    let mockResponse;
    let mockNext;
    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();
        // Setup mock request, response, and next
        mockRequest = {
            params: {},
            query: {},
            body: {}
        };
        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        mockNext = jest.fn();
    });
    describe('getSystemMetrics', () => {
        it('should return current system metrics', async () => {
            // Setup mock data
            const mockMetrics = {
                cpu: { usage: 25, cores: 4, loadAverage: [1, 1, 1] },
                memory: { total: 8000, free: 4000, usage: 50 },
                uptime: 3600,
                timestamp: new Date()
            };
            monitoring_service_1.monitoringService.getSystemMetrics.mockReturnValue(mockMetrics);
            // Call the controller method
            await monitoring_controller_1.monitoringController.getSystemMetrics(mockRequest, mockResponse, mockNext);
            // Assert the response
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                data: mockMetrics
            });
            expect(monitoring_service_1.monitoringService.getSystemMetrics).toHaveBeenCalled();
            expect(monitoring_service_1.monitoringService.getSystemMetricsHistory).not.toHaveBeenCalled();
        });
        it('should return system metrics history when query param is set', async () => {
            // Setup mock request with history query param
            mockRequest.query = { history: 'true', limit: '10' };
            // Setup mock data
            const mockHistory = [
                {
                    cpu: { usage: 25, cores: 4, loadAverage: [1, 1, 1] },
                    memory: { total: 8000, free: 4000, usage: 50 },
                    uptime: 3600,
                    timestamp: new Date()
                },
                {
                    cpu: { usage: 30, cores: 4, loadAverage: [1.2, 1.1, 1] },
                    memory: { total: 8000, free: 3800, usage: 52.5 },
                    uptime: 3700,
                    timestamp: new Date()
                }
            ];
            monitoring_service_1.monitoringService.getSystemMetricsHistory.mockReturnValue(mockHistory);
            // Call the controller method
            await monitoring_controller_1.monitoringController.getSystemMetrics(mockRequest, mockResponse, mockNext);
            // Assert the response
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                data: mockHistory
            });
            expect(monitoring_service_1.monitoringService.getSystemMetricsHistory).toHaveBeenCalledWith(10);
            expect(monitoring_service_1.monitoringService.getSystemMetrics).not.toHaveBeenCalled();
        });
        it('should handle errors', async () => {
            // Setup mock to throw error
            monitoring_service_1.monitoringService.getSystemMetrics.mockImplementation(() => {
                throw new Error('Test error');
            });
            // Call the controller method
            await monitoring_controller_1.monitoringController.getSystemMetrics(mockRequest, mockResponse, mockNext);
            // Assert error was passed to next
            expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
        });
    });
    describe('getDownloadMetrics', () => {
        it('should return current download metrics', async () => {
            // Setup mock data
            const mockMetrics = {
                activeJobs: 2,
                queuedJobs: 5,
                completedJobs: 10,
                failedJobs: 1,
                averageSpeed: 1000000,
                totalDownloaded: 5000000000,
                timestamp: new Date()
            };
            monitoring_service_1.monitoringService.getDownloadMetrics.mockReturnValue(mockMetrics);
            // Call the controller method
            await monitoring_controller_1.monitoringController.getDownloadMetrics(mockRequest, mockResponse, mockNext);
            // Assert the response
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                data: mockMetrics
            });
        });
    });
    describe('getStorageMetrics', () => {
        it('should return current storage metrics', async () => {
            // Setup mock data
            const mockMetrics = {
                totalSpace: 1000000000000,
                usedSpace: 250000000000,
                freeSpace: 750000000000,
                providers: {
                    local: { usage: 100000000000, count: 100 },
                    s3: { usage: 150000000000, count: 150 }
                },
                timestamp: new Date()
            };
            monitoring_service_1.monitoringService.getStorageMetrics.mockReturnValue(mockMetrics);
            // Call the controller method
            await monitoring_controller_1.monitoringController.getStorageMetrics(mockRequest, mockResponse, mockNext);
            // Assert the response
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                data: mockMetrics
            });
        });
    });
    describe('Alert management', () => {
        it('should return active alerts', async () => {
            // Setup mock data
            const mockAlerts = [
                {
                    id: 'alert_1',
                    configId: '1',
                    type: 'system',
                    severity: 'warning',
                    message: 'CPU usage high',
                    value: 85,
                    threshold: 80,
                    timestamp: new Date()
                }
            ];
            monitoring_service_1.monitoringService.getActiveAlerts.mockReturnValue(mockAlerts);
            // Call the controller method
            await monitoring_controller_1.monitoringController.getActiveAlerts(mockRequest, mockResponse, mockNext);
            // Assert the response
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                data: mockAlerts
            });
        });
        it('should create alert configuration', async () => {
            // Setup mock request body
            mockRequest.body = {
                name: 'Test Alert',
                type: 'system',
                condition: 'value > threshold',
                threshold: 90,
                severity: 'warning',
                message: 'Test alert triggered'
            };
            // Setup mock response
            const mockConfig = {
                id: 'config_123',
                ...mockRequest.body,
                status: 'active',
                createdAt: new Date()
            };
            monitoring_service_1.monitoringService.saveAlertConfig.mockReturnValue(mockConfig);
            // Call the controller method
            await monitoring_controller_1.monitoringController.createAlertConfig(mockRequest, mockResponse, mockNext);
            // Assert the response
            expect(mockResponse.status).toHaveBeenCalledWith(201);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                data: mockConfig
            });
        });
        it('should update alert configuration', async () => {
            // Setup mock request
            mockRequest.params = { id: 'config_123' };
            mockRequest.body = {
                threshold: 95
            };
            // Setup mock response
            const mockConfig = {
                id: 'config_123',
                name: 'Test Alert',
                type: 'system',
                condition: 'value > threshold',
                threshold: 95, // Updated value
                status: 'active',
                severity: 'warning',
                message: 'Test alert triggered',
                createdAt: new Date()
            };
            monitoring_service_1.monitoringService.saveAlertConfig.mockReturnValue(mockConfig);
            // Call the controller method
            await monitoring_controller_1.monitoringController.updateAlertConfig(mockRequest, mockResponse, mockNext);
            // Assert the response
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                data: mockConfig
            });
            expect(monitoring_service_1.monitoringService.saveAlertConfig).toHaveBeenCalledWith({
                id: 'config_123',
                threshold: 95
            });
        });
        it('should delete alert configuration', async () => {
            // Setup mock request
            mockRequest.params = { id: 'config_123' };
            // Setup mock response
            monitoring_service_1.monitoringService.deleteAlertConfig.mockReturnValue(true);
            // Call the controller method
            await monitoring_controller_1.monitoringController.deleteAlertConfig(mockRequest, mockResponse, mockNext);
            // Assert the response
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                message: expect.stringContaining('deleted successfully')
            });
        });
        it('should handle not found when deleting alert configuration', async () => {
            // Setup mock request
            mockRequest.params = { id: 'nonexistent_id' };
            // Setup mock response - false means not found
            monitoring_service_1.monitoringService.deleteAlertConfig.mockReturnValue(false);
            // Call the controller method
            await monitoring_controller_1.monitoringController.deleteAlertConfig(mockRequest, mockResponse, mockNext);
            // Assert the response
            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: expect.stringContaining('not found')
            });
        });
    });
    describe('getSystemHealth', () => {
        it('should return healthy system status with 200', async () => {
            // Setup mock data
            const mockHealth = {
                status: 'healthy',
                metrics: {
                    cpu: { usage: 25 },
                    memory: { usage: 40 }
                },
                details: {
                    issues: [],
                    activeAlerts: 0
                }
            };
            monitoring_service_1.monitoringService.checkSystemHealth.mockResolvedValue(mockHealth);
            // Call the controller method
            await monitoring_controller_1.monitoringController.getSystemHealth(mockRequest, mockResponse, mockNext);
            // Assert the response
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                data: mockHealth
            });
        });
        it('should return unhealthy system status with 503', async () => {
            // Setup mock data
            const mockHealth = {
                status: 'unhealthy',
                metrics: {
                    cpu: { usage: 95 },
                    memory: { usage: 90 }
                },
                details: {
                    issues: ['CPU usage is extremely high', 'Memory usage is extremely high'],
                    activeAlerts: 2
                }
            };
            monitoring_service_1.monitoringService.checkSystemHealth.mockResolvedValue(mockHealth);
            // Call the controller method
            await monitoring_controller_1.monitoringController.getSystemHealth(mockRequest, mockResponse, mockNext);
            // Assert the response
            expect(mockResponse.status).toHaveBeenCalledWith(503);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                data: mockHealth
            });
        });
    });
    describe('refreshMetrics', () => {
        it('should return latest metrics', async () => {
            // Setup mock data
            const mockSystemMetrics = { cpu: { usage: 30 } };
            const mockDownloadMetrics = { activeJobs: 2 };
            const mockStorageMetrics = { usedSpace: 5000000000 };
            monitoring_service_1.monitoringService.getSystemMetrics.mockReturnValue(mockSystemMetrics);
            monitoring_service_1.monitoringService.getDownloadMetrics.mockReturnValue(mockDownloadMetrics);
            monitoring_service_1.monitoringService.getStorageMetrics.mockReturnValue(mockStorageMetrics);
            // Call the controller method
            await monitoring_controller_1.monitoringController.refreshMetrics(mockRequest, mockResponse, mockNext);
            // Assert the response
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                data: {
                    system: mockSystemMetrics,
                    downloads: mockDownloadMetrics,
                    storage: mockStorageMetrics,
                    timestamp: expect.any(Date)
                }
            });
        });
    });
});
//# sourceMappingURL=monitoring.controller.test.js.map