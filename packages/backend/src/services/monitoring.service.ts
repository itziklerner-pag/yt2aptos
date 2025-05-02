import os from 'os';
import { logInfo, logError, logDebug } from '../utils/logger';
import { websocketService } from './websocket.service';
import { SocketEventType, SocketNamespace, SystemNotificationPayload } from '../types/socket.types';
import { DownloadJobStatus } from '../models/download-job.model';
import mongoose from 'mongoose';

/**
 * Types for monitoring metrics
 */
export interface SystemMetrics {
  cpu: {
    usage: number;
    loadAverage: number[];
    cores: number;
  };
  memory: {
    total: number;
    free: number;
    usage: number;
  };
  uptime: number;
  timestamp: Date;
}

export interface DownloadMetrics {
  activeJobs: number;
  queuedJobs: number;
  completedJobs: number;
  failedJobs: number;
  averageSpeed: number; // bytes per second
  totalDownloaded: number; // bytes
  timestamp: Date;
}

export interface StorageMetrics {
  totalSpace: number;
  usedSpace: number;
  freeSpace: number;
  providers: {
    [provider: string]: {
      usage: number;
      count: number;
    };
  };
  timestamp: Date;
}

export interface AlertConfig {
  id: string;
  name: string;
  type: 'system' | 'download' | 'storage';
  condition: string; // JavaScript condition as string (will be evaluated)
  threshold: number;
  status: 'active' | 'inactive';
  severity: 'info' | 'warning' | 'error';
  message: string;
  lastTriggered?: Date;
  createdAt: Date;
}

export interface Alert {
  id: string;
  configId: string;
  type: 'system' | 'download' | 'storage';
  severity: 'info' | 'warning' | 'error';
  message: string;
  value: number;
  threshold: number;
  timestamp: Date;
}

export enum MonitoringEventType {
  SYSTEM_METRICS_UPDATED = 'monitoring:systemMetricsUpdated',
  DOWNLOAD_METRICS_UPDATED = 'monitoring:downloadMetricsUpdated',
  STORAGE_METRICS_UPDATED = 'monitoring:storageMetricsUpdated',
  ALERT_TRIGGERED = 'monitoring:alertTriggered',
  ALERT_RESOLVED = 'monitoring:alertResolved'
}

/**
 * Monitoring Service to track system health metrics and performance
 */
export class MonitoringService {
  private static instance: MonitoringService;
  private systemMetricsInterval: NodeJS.Timeout | null = null;
  private downloadMetricsInterval: NodeJS.Timeout | null = null;
  private storageMetricsInterval: NodeJS.Timeout | null = null;
  private alertCheckInterval: NodeJS.Timeout | null = null;
  
  private systemMetrics: SystemMetrics = {
    cpu: {
      usage: 0,
      loadAverage: [0, 0, 0],
      cores: os.cpus().length
    },
    memory: {
      total: 0,
      free: 0,
      usage: 0
    },
    uptime: 0,
    timestamp: new Date()
  };
  
  private downloadMetrics: DownloadMetrics = {
    activeJobs: 0,
    queuedJobs: 0,
    completedJobs: 0,
    failedJobs: 0,
    averageSpeed: 0,
    totalDownloaded: 0,
    timestamp: new Date()
  };
  
  private storageMetrics: StorageMetrics = {
    totalSpace: 0,
    usedSpace: 0,
    freeSpace: 0,
    providers: {},
    timestamp: new Date()
  };
  
  private activeAlerts: Map<string, Alert> = new Map();
  private alertConfigs: AlertConfig[] = [];
  
  // Performance history - keep limited history for performance reasons
  private systemMetricsHistory: SystemMetrics[] = [];
  private downloadMetricsHistory: DownloadMetrics[] = [];
  private storageMetricsHistory: StorageMetrics[] = [];
  private alertHistory: Alert[] = [];
  private readonly historyLimit = 100; // Keep last 100 data points

  private constructor() {
    // Private constructor for singleton
  }
  
  /**
   * Get the singleton instance
   */
  public static getInstance(): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService();
    }
    return MonitoringService.instance;
  }
  
  /**
   * Initialize the monitoring service
   */
  public initialize(): void {
    this.loadAlertConfigs();
    this.startMetricsCollection();
    
    // Register with socket.io to monitor download progress updates
    this.setupWebSocketEvents();
    
    logInfo('Monitoring service initialized');
  }
  
  /**
   * Start collecting metrics at regular intervals
   */
  private startMetricsCollection(): void {
    // Collect system metrics every 30 seconds
    this.systemMetricsInterval = setInterval(() => {
      this.collectSystemMetrics();
    }, 30000);
    
    // Collect download metrics every minute
    this.downloadMetricsInterval = setInterval(() => {
      this.collectDownloadMetrics();
    }, 60000);
    
    // Collect storage metrics every 5 minutes
    this.storageMetricsInterval = setInterval(() => {
      this.collectStorageMetrics();
    }, 300000);
    
    // Check alerts every minute
    this.alertCheckInterval = setInterval(() => {
      this.checkAlerts();
    }, 60000);
    
    // Collect initial metrics immediately
    this.collectSystemMetrics();
    this.collectDownloadMetrics();
    this.collectStorageMetrics();
    
    logInfo('Metrics collection started');
  }
  
  /**
   * Stop collecting metrics
   */
  public shutdown(): void {
    if (this.systemMetricsInterval) clearInterval(this.systemMetricsInterval);
    if (this.downloadMetricsInterval) clearInterval(this.downloadMetricsInterval);
    if (this.storageMetricsInterval) clearInterval(this.storageMetricsInterval);
    if (this.alertCheckInterval) clearInterval(this.alertCheckInterval);
    
    logInfo('Monitoring service shut down');
  }
  
  /**
   * Collect system metrics (CPU, memory, uptime)
   */
  private async collectSystemMetrics(): Promise<void> {
    try {
      const cpus = os.cpus();
      let totalIdle = 0;
      let totalTick = 0;
      
      // Calculate CPU usage across all cores
      cpus.forEach(cpu => {
        for (const type in cpu.times) {
          totalTick += cpu.times[type as keyof typeof cpu.times];
        }
        totalIdle += cpu.times.idle;
      });
      
      const idlePercentage = totalIdle / totalTick;
      const usagePercentage = 100 - (idlePercentage * 100);
      
      // Update system metrics
      this.systemMetrics = {
        cpu: {
          usage: Math.round(usagePercentage * 100) / 100, // Round to 2 decimal places
          loadAverage: os.loadavg(),
          cores: cpus.length
        },
        memory: {
          total: os.totalmem(),
          free: os.freemem(),
          usage: Math.round(((os.totalmem() - os.freemem()) / os.totalmem() * 100) * 100) / 100
        },
        uptime: os.uptime(),
        timestamp: new Date()
      };
      
      // Store in history, maintain limit
      this.systemMetricsHistory.push(this.systemMetrics);
      if (this.systemMetricsHistory.length > this.historyLimit) {
        this.systemMetricsHistory.shift();
      }
      
      // Broadcast through WebSocket
      this.broadcastMetricsUpdate(MonitoringEventType.SYSTEM_METRICS_UPDATED, this.systemMetrics);
      
      logDebug(`System metrics collected - CPU: ${this.systemMetrics.cpu.usage}%, Memory: ${this.systemMetrics.memory.usage}%`);
    } catch (error) {
      logError(`Error collecting system metrics: ${error}`);
    }
  }
  
  /**
   * Collect download metrics by querying the database
   */
  private async collectDownloadMetrics(): Promise<void> {
    try {
      // We'll need to query the database to get real metrics
      // This is a placeholder for now - in a real implementation, you'd query MongoDB
      // const DownloadJob = require('../models/download-job.model').DownloadJob;
      
      // Example with mongoose query (commented out)
      // const activeCount = await DownloadJob.countDocuments({ status: DownloadJobStatus.DOWNLOADING });
      // const queuedCount = await DownloadJob.countDocuments({ status: DownloadJobStatus.QUEUED });
      // const completedCount = await DownloadJob.countDocuments({ status: DownloadJobStatus.COMPLETED });
      // const failedCount = await DownloadJob.countDocuments({ status: DownloadJobStatus.FAILED });
      
      // Placeholder metrics for demo purposes
      this.downloadMetrics = {
        activeJobs: 2,
        queuedJobs: 5,
        completedJobs: 45,
        failedJobs: 3,
        averageSpeed: 1500000, // 1.5 MB/s
        totalDownloaded: 1024 * 1024 * 1024 * 5, // 5 GB
        timestamp: new Date()
      };
      
      // Store in history, maintain limit
      this.downloadMetricsHistory.push(this.downloadMetrics);
      if (this.downloadMetricsHistory.length > this.historyLimit) {
        this.downloadMetricsHistory.shift();
      }
      
      // Broadcast through WebSocket
      this.broadcastMetricsUpdate(MonitoringEventType.DOWNLOAD_METRICS_UPDATED, this.downloadMetrics);
      
      logDebug(`Download metrics collected - Active: ${this.downloadMetrics.activeJobs}, Queued: ${this.downloadMetrics.queuedJobs}`);
    } catch (error) {
      logError(`Error collecting download metrics: ${error}`);
    }
  }
  
  /**
   * Collect storage metrics by querying storage providers
   */
  private async collectStorageMetrics(): Promise<void> {
    try {
      // In a real implementation, you'd query each storage provider
      // For now, using placeholder metrics
      this.storageMetrics = {
        totalSpace: 1024 * 1024 * 1024 * 100, // 100 GB
        usedSpace: 1024 * 1024 * 1024 * 25, // 25 GB
        freeSpace: 1024 * 1024 * 1024 * 75, // 75 GB
        providers: {
          'local': {
            usage: 1024 * 1024 * 1024 * 10, // 10 GB
            count: 150
          },
          's3': {
            usage: 1024 * 1024 * 1024 * 15, // 15 GB
            count: 200
          }
        },
        timestamp: new Date()
      };
      
      // Store in history, maintain limit
      this.storageMetricsHistory.push(this.storageMetrics);
      if (this.storageMetricsHistory.length > this.historyLimit) {
        this.storageMetricsHistory.shift();
      }
      
      // Broadcast through WebSocket
      this.broadcastMetricsUpdate(MonitoringEventType.STORAGE_METRICS_UPDATED, this.storageMetrics);
      
      logDebug(`Storage metrics collected - Used: ${Math.round(this.storageMetrics.usedSpace / 1024 / 1024 / 1024)}GB, Free: ${Math.round(this.storageMetrics.freeSpace / 1024 / 1024 / 1024)}GB`);
    } catch (error) {
      logError(`Error collecting storage metrics: ${error}`);
    }
  }
  
  /**
   * Load alert configurations from database or config
   */
  private async loadAlertConfigs(): Promise<void> {
    // In real implementation, load from database
    // For now, adding default alert configs
    this.alertConfigs = [
      {
        id: '1',
        name: 'High CPU Usage',
        type: 'system',
        condition: 'value > threshold',
        threshold: 80, // 80% CPU usage
        status: 'active',
        severity: 'warning',
        message: 'CPU usage is high',
        createdAt: new Date()
      },
      {
        id: '2',
        name: 'Low Disk Space',
        type: 'storage',
        condition: 'value < threshold',
        threshold: 10, // Less than 10% free space
        status: 'active',
        severity: 'error',
        message: 'Storage space is critically low',
        createdAt: new Date()
      },
      {
        id: '3',
        name: 'High Download Queue',
        type: 'download',
        condition: 'value > threshold',
        threshold: 20, // More than 20 queued jobs
        status: 'active',
        severity: 'info',
        message: 'Download queue is building up',
        createdAt: new Date()
      }
    ];
    
    logInfo(`Loaded ${this.alertConfigs.length} alert configurations`);
  }
  
  /**
   * Check for alert conditions and trigger alerts if needed
   */
  private checkAlerts(): void {
    for (const config of this.alertConfigs) {
      if (config.status !== 'active') continue;
      
      let currentValue = 0;
      let condition = false;
      
      // Get current value based on alert type
      switch (config.type) {
        case 'system':
          currentValue = this.systemMetrics.cpu.usage;
          break;
        case 'download':
          currentValue = this.downloadMetrics.queuedJobs;
          break;
        case 'storage':
          // Calculate free space percentage
          currentValue = (this.storageMetrics.freeSpace / this.storageMetrics.totalSpace) * 100;
          break;
      }
      
      // Evaluate condition
      try {
        // Using Function constructor to evaluate the condition string
        // Note: In production, you should use a safer evaluation method
        const evalFn = new Function('value', 'threshold', `return ${config.condition};`);
        condition = evalFn(currentValue, config.threshold);
      } catch (error) {
        logError(`Error evaluating alert condition: ${error}`);
        continue;
      }
      
      const alertId = `alert_${config.id}`;
      
      // If condition is met and alert not already active, trigger a new alert
      if (condition && !this.activeAlerts.has(alertId)) {
        const alert: Alert = {
          id: alertId,
          configId: config.id,
          type: config.type,
          severity: config.severity,
          message: config.message,
          value: currentValue,
          threshold: config.threshold,
          timestamp: new Date()
        };
        
        this.triggerAlert(alert);
      } 
      // If condition is no longer met but alert is active, resolve it
      else if (!condition && this.activeAlerts.has(alertId)) {
        this.resolveAlert(alertId);
      }
    }
  }
  
  /**
   * Trigger a new alert
   */
  private triggerAlert(alert: Alert): void {
    this.activeAlerts.set(alert.id, alert);
    
    // Add to history
    this.alertHistory.push(alert);
    if (this.alertHistory.length > this.historyLimit) {
      this.alertHistory.shift();
    }
    
    // Update the last triggered timestamp on the config
    const configIndex = this.alertConfigs.findIndex(c => c.id === alert.configId);
    if (configIndex !== -1) {
      this.alertConfigs[configIndex].lastTriggered = new Date();
    }
    
    // Create system notification
    const notification: SystemNotificationPayload = {
      level: alert.severity,
      message: alert.message,
      timestamp: alert.timestamp,
      code: `ALERT_${alert.configId}`,
      metadata: {
        type: alert.type,
        value: alert.value,
        threshold: alert.threshold
      }
    };
    
    // Send notification through WebSocket
    websocketService.sendSystemNotification(notification);
    
    // Broadcast alert through monitoring channel
    this.broadcastMetricsUpdate(MonitoringEventType.ALERT_TRIGGERED, alert);
    
    logInfo(`Alert triggered: ${alert.message} (${alert.value} ${alert.type === 'storage' ? 'below' : 'exceeds'} threshold of ${alert.threshold})`);
  }
  
  /**
   * Resolve an active alert
   */
  private resolveAlert(alertId: string): void {
    const alert = this.activeAlerts.get(alertId);
    if (!alert) return;
    
    this.activeAlerts.delete(alertId);
    
    // Create resolved alert notification
    const resolvedAlert = {
      ...alert,
      resolvedAt: new Date()
    };
    
    // Broadcast resolved alert
    this.broadcastMetricsUpdate(MonitoringEventType.ALERT_RESOLVED, resolvedAlert);
    
    logInfo(`Alert resolved: ${alert.message}`);
  }
  
  /**
   * Broadcast metrics update through WebSocket
   */
  private broadcastMetricsUpdate(eventType: MonitoringEventType, data: any): void {
    // Using system namespace for monitoring events
    websocketService.broadcast(eventType as unknown as SocketEventType, data);
  }
  
  /**
   * Setup event listeners for WebSocket events that monitoring should track
   */
  private setupWebSocketEvents(): void {
    // Here we would register listeners for download progress events
    // For now, we'll rely on the polling mechanism
    logDebug('WebSocket event listeners set up for monitoring');
  }
  
  /**
   * Register a download progress update
   */
  public registerDownloadProgress(jobId: string, progress: number, speed: number): void {
    // Update speed and progress tracking in real-time
    // This would be called from the download service when progress updates
    logDebug(`Download progress for job ${jobId}: ${progress}% at ${Math.round(speed / 1024 / 1024 * 100) / 100} MB/s`);
    
    // This could trigger an immediate metrics update if needed
    // For now, we'll rely on the polling mechanism
  }
  
  /**
   * Get current system metrics
   */
  public getSystemMetrics(): SystemMetrics {
    return this.systemMetrics;
  }
  
  /**
   * Get system metrics history
   */
  public getSystemMetricsHistory(limit: number = this.historyLimit): SystemMetrics[] {
    return this.systemMetricsHistory.slice(-limit);
  }
  
  /**
   * Get current download metrics
   */
  public getDownloadMetrics(): DownloadMetrics {
    return this.downloadMetrics;
  }
  
  /**
   * Get download metrics history
   */
  public getDownloadMetricsHistory(limit: number = this.historyLimit): DownloadMetrics[] {
    return this.downloadMetricsHistory.slice(-limit);
  }
  
  /**
   * Get current storage metrics
   */
  public getStorageMetrics(): StorageMetrics {
    return this.storageMetrics;
  }
  
  /**
   * Get storage metrics history
   */
  public getStorageMetricsHistory(limit: number = this.historyLimit): StorageMetrics[] {
    return this.storageMetricsHistory.slice(-limit);
  }
  
  /**
   * Get active alerts
   */
  public getActiveAlerts(): Alert[] {
    return Array.from(this.activeAlerts.values());
  }
  
  /**
   * Get alert history
   */
  public getAlertHistory(limit: number = this.historyLimit): Alert[] {
    return this.alertHistory.slice(-limit);
  }
  
  /**
   * Get alert configurations
   */
  public getAlertConfigs(): AlertConfig[] {
    return this.alertConfigs;
  }
  
  /**
   * Create or update an alert configuration
   */
  public saveAlertConfig(config: Partial<AlertConfig>): AlertConfig {
    if (!config.id) {
      // Create new alert config
      const newConfig: AlertConfig = {
        id: `config_${Date.now()}`,
        name: config.name || 'New Alert',
        type: config.type || 'system',
        condition: config.condition || 'value > threshold',
        threshold: config.threshold || 90,
        status: config.status || 'active',
        severity: config.severity || 'info',
        message: config.message || 'Alert triggered',
        createdAt: new Date()
      };
      
      this.alertConfigs.push(newConfig);
      logInfo(`New alert configuration created: ${newConfig.name}`);
      return newConfig;
    } else {
      // Update existing config
      const index = this.alertConfigs.findIndex(c => c.id === config.id);
      if (index === -1) {
        throw new Error(`Alert configuration with ID ${config.id} not found`);
      }
      
      const updatedConfig = {
        ...this.alertConfigs[index],
        ...config
      };
      
      this.alertConfigs[index] = updatedConfig;
      logInfo(`Alert configuration updated: ${updatedConfig.name}`);
      return updatedConfig;
    }
  }
  
  /**
   * Delete an alert configuration
   */
  public deleteAlertConfig(id: string): boolean {
    const index = this.alertConfigs.findIndex(c => c.id === id);
    if (index === -1) {
      return false;
    }
    
    this.alertConfigs.splice(index, 1);
    
    // Remove any active alerts associated with this config
    const alertId = `alert_${id}`;
    if (this.activeAlerts.has(alertId)) {
      this.activeAlerts.delete(alertId);
    }
    
    logInfo(`Alert configuration deleted: ${id}`);
    return true;
  }
  
  /**
   * Run a system health check and return status
   */
  public async checkSystemHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy',
    metrics: SystemMetrics,
    details: Record<string, any>
  }> {
    await this.collectSystemMetrics();
    
    // Determine system health based on metrics
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    const issues: string[] = [];
    
    if (this.systemMetrics.cpu.usage > 90) {
      status = 'degraded';
      issues.push('CPU usage is extremely high');
    } else if (this.systemMetrics.cpu.usage > 75) {
      if (status === 'healthy') status = 'degraded';
      issues.push('CPU usage is high');
    }
    
    if (this.systemMetrics.memory.usage > 90) {
      status = 'degraded';
      issues.push('Memory usage is extremely high');
    } else if (this.systemMetrics.memory.usage > 75) {
      if (status === 'healthy') status = 'degraded';
      issues.push('Memory usage is high');
    }
    
    // Check database connection
    try {
      const dbStatus = mongoose.connection.readyState;
      if (dbStatus !== 1) { // 1 = connected
        status = 'unhealthy';
        issues.push('Database connection is not established');
      }
    } catch (error) {
      status = 'unhealthy';
      issues.push(`Database error: ${error}`);
    }
    
    // If any active alerts with severity 'error', system is unhealthy
    const criticalAlerts = Array.from(this.activeAlerts.values())
      .filter(alert => alert.severity === 'error');
    
    if (criticalAlerts.length > 0) {
      status = 'unhealthy';
      issues.push(`${criticalAlerts.length} critical alerts active`);
    }
    
    return {
      status,
      metrics: this.systemMetrics,
      details: {
        issues,
        activeAlerts: this.getActiveAlerts().length,
        mongodbConnected: mongoose.connection.readyState === 1
      }
    };
  }
}

// Create and export singleton instance
export const monitoringService = MonitoringService.getInstance();