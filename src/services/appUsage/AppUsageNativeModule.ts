/**
 * Native Module Bridge for Android App Usage Tracking
 */

import { NativeModules, Platform } from 'react-native';

interface AppUsageStats {
  packageName: string;
  appName: string;
  totalTimeInForeground: number;
  lastTimeUsed: number;
  firstTimeStamp: number;
  lastTimeStamp: number;
}

interface InstalledApp {
  packageName: string;
  appName: string;
  isSystemApp: boolean;
}

interface CurrentApp {
  packageName: string;
  appName: string;
  lastTimeUsed: number;
}

interface IAppUsageModule {
  hasUsageStatsPermission(): Promise<boolean>;
  requestUsageStatsPermission(): Promise<boolean>;
  getAppUsageStats(startTimeMs: number, endTimeMs: number): Promise<AppUsageStats[]>;
  getInstalledApps(): Promise<InstalledApp[]>;
  getCurrentForegroundApp(): Promise<CurrentApp | null>;
  getTodayUsageStats(): Promise<AppUsageStats[]>;
}

const { AppUsageModule } = NativeModules;

class AppUsageNativeModuleWrapper implements IAppUsageModule {
  /**
   * Check if app has usage stats permission
   */
  async hasUsageStatsPermission(): Promise<boolean> {
    if (Platform.OS !== 'android') {
      return false;
    }

    if (!AppUsageModule) {
      console.warn('[AppUsageNativeModule] Native module not loaded - using fallback mode');
      return false;
    }

    try {
      return await AppUsageModule.hasUsageStatsPermission();
    } catch (error) {
      console.error('[AppUsageNativeModule] Error checking usage stats permission:', error);
      return false;
    }
  }

  /**
   * Request usage stats permission (opens settings)
   */
  async requestUsageStatsPermission(): Promise<boolean> {
    if (Platform.OS !== 'android' || !AppUsageModule) {
      return false;
    }

    try {
      return await AppUsageModule.requestUsageStatsPermission();
    } catch (error) {
      console.error('[AppUsageNativeModule] Error requesting usage stats permission:', error);
      return false;
    }
  }

  /**
   * Get app usage statistics for a time range
   */
  async getAppUsageStats(startTimeMs: number, endTimeMs: number): Promise<AppUsageStats[]> {
    if (Platform.OS !== 'android' || !AppUsageModule) {
      return [];
    }

    try {
      const stats = await AppUsageModule.getAppUsageStats(startTimeMs, endTimeMs);
      return stats || [];
    } catch (error) {
      console.error('[AppUsageNativeModule] Error getting app usage stats:', error);
      return [];
    }
  }

  /**
   * Get list of installed apps
   */
  async getInstalledApps(): Promise<InstalledApp[]> {
    if (Platform.OS !== 'android' || !AppUsageModule) {
      return [];
    }

    try {
      const apps = await AppUsageModule.getInstalledApps();
      return apps || [];
    } catch (error) {
      console.error('[AppUsageNativeModule] Error getting installed apps:', error);
      return [];
    }
  }

  /**
   * Get current foreground app
   */
  async getCurrentForegroundApp(): Promise<CurrentApp | null> {
    if (Platform.OS !== 'android' || !AppUsageModule) {
      return null;
    }

    try {
      const app = await AppUsageModule.getCurrentForegroundApp();
      return app || null;
    } catch (error) {
      console.error('[AppUsageNativeModule] Error getting current foreground app:', error);
      return null;
    }
  }

  /**
   * Get today's usage statistics
   */
  async getTodayUsageStats(): Promise<AppUsageStats[]> {
    if (Platform.OS !== 'android' || !AppUsageModule) {
      return [];
    }

    try {
      const stats = await AppUsageModule.getTodayUsageStats();
      return stats || [];
    } catch (error) {
      console.error('[AppUsageNativeModule] Error getting today usage stats:', error);
      return [];
    }
  }
}

export const AppUsageNativeModule = new AppUsageNativeModuleWrapper();
export type { AppUsageStats, InstalledApp, CurrentApp };
