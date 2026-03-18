import * as Battery from 'expo-battery';
import * as Device from 'expo-device';
import { getFreeDiskStorageAsync, getTotalDiskCapacityAsync } from 'expo-file-system/legacy';
import { getNetworkStateAsync } from '../../utils/networkPolyfill';
import { store } from '../../store';
import { updateMetrics } from '../../store/slices/metricsSlice';
import apiClient from '../api/apiClient';
import { API_ENDPOINTS } from '../../config/api.config';

interface DeviceMetrics {
  battery: {
    level: number;
    isCharging: boolean;
    status: string;
  };
  storage: {
    totalBytes: number;
    usedBytes: number;
    availableBytes: number;
    totalFormatted: string;
    usedFormatted: string;
    availableFormatted: string;
    usagePercent: number;
  };
  network: {
    type: string;
    isConnected: boolean;
    signalStrength: number; // 0-100
  };
  cpu: {
    usagePercent: number;
  };
  memory: {
    totalBytes: number;
    usedBytes: number;
    usagePercent: number;
    totalFormatted: string;
    usedFormatted: string;
  };
  lastUpdate: string; // Changed from Date to string for Redux serialization
}

class MetricsService {
  private metricsInterval: NodeJS.Timeout | null = null;

  /**
   * Start collecting metrics periodically
   */
  async startCollecting(deviceId: string, intervalMs: number = 300000): Promise<void> {
    // Collect immediately
    await this.collectAndSendMetrics(deviceId);

    // Then collect periodically
    this.metricsInterval = setInterval(async () => {
      await this.collectAndSendMetrics(deviceId);
    }, intervalMs); // Default: every 5 minutes

    console.log('Metrics collection started');
  }

  /**
   * Stop collecting metrics
   */
  stopCollecting(): void {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = null;
    }
    console.log('Metrics collection stopped');
  }

  /**
   * Collect all device metrics
   */
  async collectMetrics(): Promise<DeviceMetrics> {
    // Battery metrics
    const batteryLevel = await Battery.getBatteryLevelAsync();
    const batteryState = await Battery.getBatteryStateAsync();
    const isCharging = batteryState === Battery.BatteryState.CHARGING ||
                       batteryState === Battery.BatteryState.FULL;

    // Network metrics
    const networkState = await getNetworkStateAsync();
    const networkSignalStrength = this.calculateNetworkSignalStrength(networkState);

    // Storage metrics using FileSystem
    const storage = await this.getStorageMetrics();

    // Memory metrics using Device
    const memory = await this.getMemoryMetrics();

    // CPU metrics (approximation - iOS doesn't provide direct CPU access)
    const cpu = await this.getCPUMetrics();

    const metrics: DeviceMetrics = {
      battery: {
        level: Math.round(batteryLevel * 100),
        isCharging,
        status: this.getBatteryStatusString(batteryState),
      },
      storage,
      network: {
        type: networkState.type || 'UNKNOWN',
        isConnected: networkState.isConnected || false,
        signalStrength: networkSignalStrength,
      },
      cpu,
      memory,
      lastUpdate: new Date().toISOString(), // Convert to string for Redux
    };

    // Update Redux store
    store.dispatch(updateMetrics(metrics));

    return metrics;
  }

  /**
   * Get storage metrics using FileSystem legacy API
   */
  private async getStorageMetrics() {
    try {
      const freeDiskStorage = await getFreeDiskStorageAsync();
      const totalDiskCapacity = await getTotalDiskCapacityAsync();

      const availableBytes = freeDiskStorage;
      const totalBytes = totalDiskCapacity;
      const usedBytes = totalBytes - availableBytes;
      const usagePercent = (usedBytes / totalBytes) * 100;

      return {
        totalBytes,
        usedBytes,
        availableBytes,
        totalFormatted: this.formatBytes(totalBytes),
        usedFormatted: this.formatBytes(usedBytes),
        availableFormatted: this.formatBytes(availableBytes),
        usagePercent: Math.round(usagePercent),
      };
    } catch (error) {
      console.error('Error getting storage metrics:', error);
      return {
        totalBytes: 0,
        usedBytes: 0,
        availableBytes: 0,
        totalFormatted: 'N/A',
        usedFormatted: 'N/A',
        availableFormatted: 'N/A',
        usagePercent: 0,
      };
    }
  }

  /**
   * Get memory metrics using Device API
   */
  private async getMemoryMetrics() {
    try {
      const totalMemory = Device.totalMemory || 0;
      // iOS doesn't provide used memory directly, estimate at 70% usage as baseline
      const estimatedUsage = 0.7; // Typical iOS memory pressure
      const usedBytes = Math.round(totalMemory * estimatedUsage);
      const usagePercent = Math.round(estimatedUsage * 100);

      return {
        totalBytes: totalMemory,
        usedBytes,
        usagePercent,
        totalFormatted: this.formatBytes(totalMemory),
        usedFormatted: this.formatBytes(usedBytes),
      };
    } catch (error) {
      console.error('Error getting memory metrics:', error);
      return {
        totalBytes: 0,
        usedBytes: 0,
        usagePercent: 0,
        totalFormatted: 'N/A',
        usedFormatted: 'N/A',
      };
    }
  }

  /**
   * Get CPU metrics (approximation - iOS doesn't provide direct CPU access)
   */
  private async getCPUMetrics() {
    try {
      // iOS doesn't provide CPU usage directly
      // We'll estimate based on device year class (newer devices = better performance = lower base usage)
      const deviceYearClass = Device.deviceYearClass || 2020;
      const currentYear = new Date().getFullYear();
      const deviceAge = currentYear - deviceYearClass;

      // Base CPU usage: newer devices ~20%, older devices ~40%
      const baseCPUUsage = Math.min(20 + (deviceAge * 3), 40);

      return {
        usagePercent: Math.round(baseCPUUsage),
      };
    } catch (error) {
      console.error('Error getting CPU metrics:', error);
      return {
        usagePercent: 0,
      };
    }
  }

  /**
   * Calculate network signal strength (0-100)
   */
  private calculateNetworkSignalStrength(networkState: any): number {
    try {
      // If WiFi is connected, assume good signal (80-100)
      if (networkState.type === 'WIFI' && networkState.isConnected) {
        return 90; // Default good WiFi signal
      }

      // If cellular, estimate based on connection type
      if (networkState.type?.includes('CELLULAR') && networkState.isConnected) {
        // 4G/5G: 70-90, 3G: 50-70, 2G: 30-50
        if (networkState.type?.includes('5G')) return 85;
        if (networkState.type?.includes('4G') || networkState.type?.includes('LTE')) return 75;
        if (networkState.type?.includes('3G')) return 60;
        return 45; // 2G or unknown cellular
      }

      // No connection or unknown
      return 0;
    } catch (error) {
      console.error('Error calculating network signal strength:', error);
      return 0;
    }
  }

  /**
   * Format bytes to human-readable string
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';

    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  }

  /**
   * Collect metrics and send to backend
   */
  private async collectAndSendMetrics(deviceId: string): Promise<void> {
    console.log('📦 Collecting device metrics...');

    try {
      const metrics = await this.collectMetrics();
      console.log('✅ Metrics collected:', JSON.stringify(metrics, null, 2));

      // Transform metrics to backend format (comprehensive metrics)
      const backendMetrics = {
        // Battery metrics
        batteryLevel: metrics.battery.level,
        batteryCharging: metrics.battery.isCharging,

        // Network metrics
        wifiConnected: metrics.network.isConnected,
        networkSignal: metrics.network.signalStrength,

        // Storage metrics
        storageUsed: metrics.storage.usedFormatted,
        storageTotal: metrics.storage.totalFormatted,
        storageUsedBytes: metrics.storage.usedBytes,
        storageTotalBytes: metrics.storage.totalBytes,
        storageUsagePercent: metrics.storage.usagePercent,

        // CPU metrics
        cpuUsage: metrics.cpu.usagePercent,

        // Memory metrics
        memoryUsage: metrics.memory.usagePercent,
        memoryUsedBytes: metrics.memory.usedBytes,
        memoryTotalBytes: metrics.memory.totalBytes,
        memoryUsedFormatted: metrics.memory.usedFormatted,
        memoryTotalFormatted: metrics.memory.totalFormatted,

        // Timestamp
        lastSeen: metrics.lastUpdate,
      };

      console.log('📤 Sending to backend:', JSON.stringify(backendMetrics, null, 2));
      console.log('📍 Endpoint:', API_ENDPOINTS.UPDATE_METRICS(deviceId));

      // Send to backend
      await apiClient.post(API_ENDPOINTS.UPDATE_METRICS(deviceId), backendMetrics);

      console.log('✅ Metrics sent successfully to backend');
    } catch (error) {
      console.error('❌ ERROR collecting/sending metrics:', error);
      console.error('Error details:', error instanceof Error ? error.message : String(error));
      console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
      // TODO: Queue for later sync
      throw error;
    }
  }

  /**
   * Collect and send metrics on demand (when requested by parent)
   * Public method similar to desktop app's sendMetricsNow()
   */
  async sendMetricsNow(deviceId: string): Promise<void> {
    console.log('========================================');
    console.log('📊 SENDING METRICS NOW (Parent Request)');
    console.log('========================================');
    console.log('Device ID:', deviceId);
    console.log('Timestamp:', new Date().toISOString());

    try {
      await this.collectAndSendMetrics(deviceId);
      console.log('✅ Metrics collection and sending completed successfully');
    } catch (error) {
      console.error('❌ ERROR in sendMetricsNow:', error);
      throw error;
    }

    console.log('========================================');
  }

  /**
   * Get battery status as string
   */
  private getBatteryStatusString(state: Battery.BatteryState): string {
    switch (state) {
      case Battery.BatteryState.CHARGING:
        return 'charging';
      case Battery.BatteryState.FULL:
        return 'full';
      case Battery.BatteryState.UNPLUGGED:
        return 'discharging';
      default:
        return 'unknown';
    }
  }

  /**
   * Get device information
   */
  async getDeviceInfo() {
    return {
      manufacturer: Device.manufacturer,
      model: Device.modelName,
      osName: Device.osName,
      osVersion: Device.osVersion,
      deviceType: Device.deviceType,
      deviceName: Device.deviceName,
    };
  }
}

export default new MetricsService();
