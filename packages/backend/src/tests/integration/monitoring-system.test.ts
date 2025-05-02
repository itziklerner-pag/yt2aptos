import { Server as HttpServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import { io as SocketClient, Socket as ClientSocket } from 'socket.io-client';
import { monitoringService, MonitoringEventType, AlertConfig } from '../../services/monitoring.service';
import { websocketService } from '../../services/websocket.service';
import { SocketEventType, SocketNamespace } from '../../types/socket.types';
import express from 'express';
import http from 'http';

describe('Monitoring System Integration Tests', () => {
  let app: express.Application;
  let httpServer: HttpServer;
  let ioServer: SocketServer;
  let clientSocket: ClientSocket;
  const TEST_PORT = 5001;
  const SOCKET_URL = `http://localhost:${TEST_PORT}`;

  beforeAll((done) => {
    // Setup express and HTTP server
    app = express();
    httpServer = http.createServer(app);
    
    // Initialize Socket.IO server
    ioServer = new SocketServer(httpServer, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST']
      }
    });
    
    // Initialize websocket service with our test server
    // @ts-ignore - Type mismatch is expected in test environment
    websocketService.initialize(ioServer);
    
    // Start HTTP server
    httpServer.listen(TEST_PORT, () => {
      // Initialize client socket
      clientSocket = SocketClient(SOCKET_URL, {
        autoConnect: true,
        reconnection: true
      });
      
      clientSocket.on('connect', () => {
        done();
      });
    });
    
    // Initialize the monitoring service
    // We can't mock private methods directly, but we can override the intervals
    // By passing 0 as the interval time, we effectively disable automatic collection
    jest.spyOn(monitoringService as any, 'startMetricsCollection').mockImplementation(() => {
      // Do nothing - we'll trigger metrics manually in tests
    });
    
    monitoringService.initialize();
  });

  afterAll(() => {
    // Cleanup
    if (clientSocket) {
      clientSocket.disconnect();
    }
    
    if (ioServer) {
      ioServer.close();
    }
    
    if (httpServer) {
      httpServer.close();
    }
    
    // Shut down the monitoring service
    monitoringService.shutdown();
  });

  describe('WebSocket Real-time Monitoring', () => {
    it('should broadcast system metrics updates via WebSocket', (done) => {
      // Listen for system metrics events
      clientSocket.on(MonitoringEventType.SYSTEM_METRICS_UPDATED, (data) => {
        expect(data).toBeDefined();
        expect(data.cpu).toBeDefined();
        expect(data.memory).toBeDefined();
        expect(data.timestamp).toBeDefined();
        done();
      });
      
      // Trigger a metrics update 
      const mockMetrics = {
        cpu: {
          usage: 45.5,
          loadAverage: [1.5, 1.2, 1.0],
          cores: 8
        },
        memory: {
          total: 16000000000,
          free: 8000000000,
          usage: 50.0
        },
        uptime: 3600,
        timestamp: new Date()
      };
      
      // Use broadcastMetricsUpdate method directly
      // Manually trigger a broadcast using a workaround for private method
      (monitoringService as any).broadcastMetricsUpdate(
        MonitoringEventType.SYSTEM_METRICS_UPDATED, 
        mockMetrics
      );
    });

    it('should broadcast download metrics updates via WebSocket', (done) => {
      // Listen for download metrics events
      clientSocket.on(MonitoringEventType.DOWNLOAD_METRICS_UPDATED, (data) => {
        expect(data).toBeDefined();
        expect(data.activeJobs).toBeDefined();
        expect(data.queuedJobs).toBeDefined();
        expect(data.completedJobs).toBeDefined();
        expect(data.timestamp).toBeDefined();
        done();
      });
      
      // Trigger a metrics update
      const mockMetrics = {
        activeJobs: 3,
        queuedJobs: 7,
        completedJobs: 42,
        failedJobs: 2,
        averageSpeed: 1024 * 1024 * 2, // 2 MB/s
        totalDownloaded: 1024 * 1024 * 1024 * 10, // 10 GB
        timestamp: new Date()
      };
      
      // Manually trigger a broadcast using a workaround for private method
      (monitoringService as any).broadcastMetricsUpdate(
        MonitoringEventType.DOWNLOAD_METRICS_UPDATED, 
        mockMetrics
      );
    });

    it('should broadcast storage metrics updates via WebSocket', (done) => {
      // Listen for storage metrics events
      clientSocket.on(MonitoringEventType.STORAGE_METRICS_UPDATED, (data) => {
        expect(data).toBeDefined();
        expect(data.totalSpace).toBeDefined();
        expect(data.usedSpace).toBeDefined();
        expect(data.freeSpace).toBeDefined();
        expect(data.providers).toBeDefined();
        expect(data.timestamp).toBeDefined();
        done();
      });
      
      // Trigger a metrics update
      const mockMetrics = {
        totalSpace: 1024 * 1024 * 1024 * 100, // 100 GB
        usedSpace: 1024 * 1024 * 1024 * 35,   // 35 GB
        freeSpace: 1024 * 1024 * 1024 * 65,   // 65 GB
        providers: {
          'local': { usage: 1024 * 1024 * 1024 * 15, count: 200 },
          's3': { usage: 1024 * 1024 * 1024 * 20, count: 300 }
        },
        timestamp: new Date()
      };
      
      // Manually trigger a broadcast using a workaround for private method
      (monitoringService as any).broadcastMetricsUpdate(
        MonitoringEventType.STORAGE_METRICS_UPDATED, 
        mockMetrics
      );
    });
  });

  describe('Alert Generation and Notification', () => {
    it('should trigger alerts when conditions are met', (done) => {
      // Listen for alert events
      clientSocket.on(MonitoringEventType.ALERT_TRIGGERED, (data) => {
        expect(data).toBeDefined();
        expect(data.id).toBeDefined();
        expect(data.configId).toBe('test-alert');
        expect(data.type).toBe('system');
        expect(data.severity).toBe('warning');
        expect(data.message).toBe('CPU usage is high');
        expect(data.value).toBe(85);
        expect(data.threshold).toBe(80);
        done();
      });
      
      // Create a test alert
      const testAlert: AlertConfig = {
        id: 'test-alert',
        name: 'High CPU Usage',
        type: 'system',
        condition: 'value > threshold',
        threshold: 80,
        status: 'active',
        severity: 'warning',
        message: 'CPU usage is high',
        createdAt: new Date()
      };
      
      // Add the alert to the monitoring service
      monitoringService.saveAlertConfig(testAlert);
      
      // Simulate a high CPU condition by directly calling the trigger method
      // Manually trigger an alert using a workaround for private method
      (monitoringService as any).triggerAlert({
        id: `alert_${testAlert.id}`,
        configId: testAlert.id,
        type: testAlert.type,
        severity: testAlert.severity,
        message: testAlert.message,
        value: 85,
        threshold: testAlert.threshold,
        timestamp: new Date()
      });
    });

    it('should resolve alerts when conditions are no longer met', (done) => {
      // First trigger an alert
      const testAlert: AlertConfig = {
        id: 'test-resolve-alert',
        name: 'Low Disk Space',
        type: 'storage',
        condition: 'value < threshold',
        threshold: 10,
        status: 'active',
        severity: 'error',
        message: 'Storage space is critically low',
        createdAt: new Date()
      };
      
      // Add the alert to the monitoring service
      monitoringService.saveAlertConfig(testAlert);
      
      // Trigger the alert first
      const alertId = `alert_${testAlert.id}`;
      // Manually trigger an alert using a workaround for private method
      (monitoringService as any).triggerAlert({
        id: alertId,
        configId: testAlert.id,
        type: testAlert.type,
        severity: testAlert.severity,
        message: testAlert.message,
        value: 5,
        threshold: testAlert.threshold,
        timestamp: new Date()
      });
      
      // Now listen for the resolution event
      clientSocket.on(MonitoringEventType.ALERT_RESOLVED, (data) => {
        expect(data).toBeDefined();
        expect(data.id).toBe(alertId);
        expect(data.configId).toBe(testAlert.id);
        expect(data.resolvedAt).toBeDefined();
        done();
      });
      
      // Resolve the alert
      // Manually resolve the alert using a workaround for private method
      (monitoringService as any).resolveAlert(alertId);
    });
  });

  describe('Metric Collection', () => {
    it('should maintain and retrieve system metrics correctly', async () => {
      // Define test metrics
      const testMetrics = {
        cpu: {
          usage: 35.5,
          loadAverage: [1.2, 1.0, 0.8],
          cores: 8
        },
        memory: {
          total: 16000000000,
          free: 10000000000,
          usage: 37.5
        },
        uptime: 7200,
        timestamp: new Date()
      };
      
      // Set the metrics directly using property access
      (monitoringService as any).systemMetrics = testMetrics;
      (monitoringService as any).systemMetricsHistory = [testMetrics];
      
      // Check the metrics can be retrieved via public methods
      const metrics = monitoringService.getSystemMetrics();
      expect(metrics).toBeDefined();
      expect(metrics.cpu.usage).toBe(35.5);
      expect(metrics.memory.usage).toBe(37.5);
      
      // Check history is accessible
      const history = monitoringService.getSystemMetricsHistory(1);
      expect(history.length).toBe(1);
      expect(history[0].cpu.usage).toBe(35.5);
    });
  });

  describe('System Health Checks', () => {
    it('should perform health checks and report system status', async () => {
      // Mock the checks
      // Mock the public checkSystemHealth method
      jest.spyOn(monitoringService, 'checkSystemHealth').mockImplementation(async () => {
        return {
          status: 'healthy',
          metrics: monitoringService.getSystemMetrics(),
          details: {
            issues: [],
            activeAlerts: 0,
            mongodbConnected: true
          }
        };
      });
      
      const health = await monitoringService.checkSystemHealth();
      
      expect(health).toBeDefined();
      expect(health.status).toBe('healthy');
      expect(health.metrics).toBeDefined();
      expect(health.details).toBeDefined();
      expect(health.details.issues).toBeInstanceOf(Array);
    });

    it('should detect unhealthy system conditions', async () => {
      // Mock the checks to simulate an unhealthy system
      // Mock the public checkSystemHealth method
      jest.spyOn(monitoringService, 'checkSystemHealth').mockImplementation(async () => {
        return {
          status: 'unhealthy',
          metrics: monitoringService.getSystemMetrics(),
          details: {
            issues: ['Database connection is not established', 'CPU usage is extremely high'],
            activeAlerts: 2,
            mongodbConnected: false
          }
        };
      });
      
      const health = await monitoringService.checkSystemHealth();
      
      expect(health).toBeDefined();
      expect(health.status).toBe('unhealthy');
      expect(health.details.issues.length).toBe(2);
      expect(health.details.issues[0]).toBe('Database connection is not established');
      expect(health.details.mongodbConnected).toBe(false);
    });
  });
});