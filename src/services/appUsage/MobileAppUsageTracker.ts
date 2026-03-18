/**
 * Mobile App Usage Tracker
 * Tracks app usage on Android devices using native module
 */

import { AppState, AppStateStatus, Platform } from 'react-native';
import { AppUsageNativeModule, AppUsageStats } from './AppUsageNativeModule';

export interface AppSession {
  appName: string;
  appPackage: string;
  appCategory: string;
  sessionStart: Date;
  sessionEnd?: Date;
  durationMinutes?: number;
}

// App Category Mapping (same as desktop)
const APP_CATEGORIES: Record<string, string> = {
  // Social
  'Instagram': 'Social',
  'Facebook': 'Social',
  'Twitter': 'Social',
  'TikTok': 'Social',
  'Snapchat': 'Social',
  'LinkedIn': 'Social',
  'Reddit': 'Social',

  // Entertainment
  'YouTube': 'Entertainment',
  'Netflix': 'Entertainment',
  'Spotify': 'Entertainment',
  'Disney+': 'Entertainment',
  'Amazon Prime': 'Entertainment',
  'Twitch': 'Entertainment',

  // Productivity
  'Gmail': 'Productivity',
  'Chrome': 'Productivity',
  'Google Drive': 'Productivity',
  'Microsoft Office': 'Productivity',
  'Outlook': 'Productivity',

  // Communication
  'WhatsApp': 'Communication',
  'Telegram': 'Communication',
  'Discord': 'Communication',
  'Messenger': 'Communication',
  'Signal': 'Communication',

  // Games
  'PUBG': 'Games',
  'Call of Duty': 'Games',
  'Among Us': 'Games',
  'Minecraft': 'Games',

  // Education
  'Khan Academy': 'Education',
  'Duolingo': 'Education',
  'Coursera': 'Education',
};

class MobileAppUsageTracker {
  private isTracking: boolean = false;
  private sessions: AppSession[] = [];
  private currentApp: AppSession | null = null;
  private trackingInterval: NodeJS.Timeout | null = null;
  private appStateListener: any = null;
  private pickupCount: number = 0;
  private notificationCount: number = 0;
  private lastSyncTime: Date | null = null;
  private hasPermission: boolean = false;

  /**
   * Check if we have usage stats permission
   */
  async checkPermission(): Promise<boolean> {
    if (Platform.OS !== 'android') {
      console.log('[MobileAppUsageTracker] Not on Android, permissions not required');
      return false;
    }

    try {
      // Check if native module is available
      if (!AppUsageNativeModule || typeof AppUsageNativeModule.hasUsageStatsPermission !== 'function') {
        console.warn('[MobileAppUsageTracker] Native module not available - using fallback mode');
        this.hasPermission = false;
        return false;
      }

      this.hasPermission = await AppUsageNativeModule.hasUsageStatsPermission();
      return this.hasPermission;
    } catch (error) {
      console.error('[MobileAppUsageTracker] Error checking permission - using fallback mode:', error);
      this.hasPermission = false;
      return false;
    }
  }

  /**
   * Request usage stats permission
   */
  async requestPermission(): Promise<boolean> {
    if (Platform.OS !== 'android') {
      return false;
    }

    try {
      await AppUsageNativeModule.requestUsageStatsPermission();
      // User needs to manually grant permission, check again after they return
      return true;
    } catch (error) {
      console.error('[MobileAppUsageTracker] Error requesting permission:', error);
      return false;
    }
  }

  /**
   * Start tracking app usage
   */
  async startTracking(): Promise<void> {
    if (this.isTracking) {
      console.log('[MobileAppUsageTracker] Already tracking');
      return;
    }

    // Check permission first
    const hasPermission = await this.checkPermission();
    if (!hasPermission) {
      console.warn('[MobileAppUsageTracker] No usage stats permission - using fallback mode (pickup counts + PMK app usage only)');
      // Still start tracking for foreground/background events
    }

    console.log('[MobileAppUsageTracker] Starting app usage tracking');
    this.isTracking = true;
    this.sessions = [];
    this.pickupCount = 0;
    this.notificationCount = 0;
    this.lastSyncTime = new Date();

    // Track current foreground app every 30 seconds (Android with permission)
    if (Platform.OS === 'android' && hasPermission) {
      this.trackingInterval = setInterval(async () => {
        await this.checkCurrentApp();
      }, 30000); // 30 seconds

      // Initial check
      await this.checkCurrentApp();
    }

    // Listen to app state changes for pickup counting
    // This works for both iOS and Android fallback mode
    this.appStateListener = AppState.addEventListener('change', this.handleAppStateChange.bind(this));
  }

  /**
   * Stop tracking app usage
   */
  async stopTracking(): Promise<void> {
    if (!this.isTracking) {
      return;
    }

    console.log('[MobileAppUsageTracker] Stopping app usage tracking');
    this.isTracking = false;

    // Clear interval
    if (this.trackingInterval) {
      clearInterval(this.trackingInterval);
      this.trackingInterval = null;
    }

    // Remove app state listener
    if (this.appStateListener) {
      this.appStateListener.remove();
      this.appStateListener = null;
    }

    // End current session
    if (this.currentApp) {
      this.endCurrentSession();
    }

    // Sync final data
    await this.syncUsageData();
  }

  /**
   * Check current foreground app (Android only)
   */
  private async checkCurrentApp(): Promise<void> {
    if (!this.hasPermission) {
      return;
    }

    try {
      const currentApp = await AppUsageNativeModule.getCurrentForegroundApp();

      if (!currentApp) {
        return;
      }

      // If same app, continue current session
      if (this.currentApp && this.currentApp.appPackage === currentApp.packageName) {
        return;
      }

      // Different app, end current session and start new one
      if (this.currentApp) {
        this.endCurrentSession();
      }

      // Start new session
      this.startNewSession(currentApp.appName, currentApp.packageName);
    } catch (error) {
      console.error('[MobileAppUsageTracker] Error checking current app:', error);
    }
  }

  /**
   * Handle app state changes (foreground/background)
   */
  private handleAppStateChange(nextAppState: AppStateStatus): void {
    if (nextAppState === 'active') {
      // App came to foreground - count as pickup
      this.pickupCount++;
      console.log(`[MobileAppUsageTracker] Pickup count: ${this.pickupCount}`);

      // iOS OR Android fallback mode: Track PMK app usage when coming to foreground
      if (Platform.OS === 'ios' || (Platform.OS === 'android' && !this.hasPermission)) {
        const appName = 'PMK Child Monitor';
        const packageName = 'com.pmk.childapp';
        this.startNewSession(appName, packageName);
      }
    } else if (nextAppState === 'background' || nextAppState === 'inactive') {
      // App went to background - end current session
      if (this.currentApp) {
        this.endCurrentSession();
      }
    }
  }

  /**
   * Start new app session
   */
  private startNewSession(appName: string, packageName: string): void {
    this.currentApp = {
      appName,
      appPackage: packageName,
      appCategory: this.categorizeApp(appName, packageName),
      sessionStart: new Date(),
    };

    console.log(`[MobileAppUsageTracker] Started session: ${appName}`);
  }

  /**
   * End current app session
   */
  private endCurrentSession(): void {
    if (!this.currentApp) {
      return;
    }

    const sessionEnd = new Date();
    const durationMs = sessionEnd.getTime() - this.currentApp.sessionStart.getTime();
    const durationMinutes = Math.round(durationMs / 60000);

    // Only save sessions longer than 10 seconds
    if (durationMinutes > 0 || durationMs > 10000) {
      this.currentApp.sessionEnd = sessionEnd;
      this.currentApp.durationMinutes = Math.max(1, durationMinutes);

      this.sessions.push({ ...this.currentApp });

      console.log(`[MobileAppUsageTracker] Ended session: ${this.currentApp.appName} (${this.currentApp.durationMinutes}m)`);
    }

    this.currentApp = null;
  }

  /**
   * Sync usage data from Android UsageStatsManager
   */
  async syncUsageData(): Promise<void> {
    if (!this.hasPermission || Platform.OS !== 'android') {
      return;
    }

    try {
      const startTime = this.lastSyncTime?.getTime() || Date.now() - 24 * 60 * 60 * 1000;
      const endTime = Date.now();

      const usageStats = await AppUsageNativeModule.getAppUsageStats(startTime, endTime);

      console.log(`[MobileAppUsageTracker] Synced ${usageStats.length} app usage stats`);

      // Convert usage stats to sessions
      for (const stat of usageStats) {
        const durationMinutes = Math.round(stat.totalTimeInForeground / 60000);

        if (durationMinutes > 0) {
          const session: AppSession = {
            appName: stat.appName,
            appPackage: stat.packageName,
            appCategory: this.categorizeApp(stat.appName, stat.packageName),
            sessionStart: new Date(stat.firstTimeStamp),
            sessionEnd: new Date(stat.lastTimeStamp),
            durationMinutes,
          };

          this.sessions.push(session);
        }
      }

      this.lastSyncTime = new Date();
    } catch (error) {
      console.error('[MobileAppUsageTracker] Error syncing usage data:', error);
    }
  }

  /**
   * Categorize app based on name or package
   */
  private categorizeApp(appName: string, packageName: string): string {
    // Check predefined categories
    if (APP_CATEGORIES[appName]) {
      return APP_CATEGORIES[appName];
    }

    // Check package name patterns
    const lowerPackage = (packageName || '').toLowerCase();
    const lowerName = (appName || '').toLowerCase();

    if (lowerPackage.includes('social') || lowerName.includes('social')) {
      return 'Social';
    }
    if (lowerPackage.includes('game') || lowerName.includes('game')) {
      return 'Games';
    }
    if (lowerPackage.includes('music') || lowerPackage.includes('video') || lowerName.includes('music') || lowerName.includes('video')) {
      return 'Entertainment';
    }
    if (lowerPackage.includes('mail') || lowerPackage.includes('message') || lowerName.includes('mail') || lowerName.includes('message')) {
      return 'Communication';
    }
    if (lowerPackage.includes('office') || lowerPackage.includes('doc') || lowerName.includes('office')) {
      return 'Productivity';
    }
    if (lowerPackage.includes('edu') || lowerName.includes('learn') || lowerName.includes('education')) {
      return 'Education';
    }

    return 'Utilities';
  }

  /**
   * Get collected sessions
   */
  getSessions(): AppSession[] {
    return [...this.sessions];
  }

  /**
   * Clear sessions
   */
  clearSessions(): void {
    this.sessions = [];
  }

  /**
   * Get pickup count
   */
  getPickupCount(): number {
    return this.pickupCount;
  }

  /**
   * Get notification count
   */
  getNotificationCount(): number {
    return this.notificationCount;
  }

  /**
   * Reset counters
   */
  resetCounters(): void {
    this.pickupCount = 0;
    this.notificationCount = 0;
  }

  /**
   * Increment notification count
   */
  incrementNotificationCount(): void {
    this.notificationCount++;
  }

  /**
   * Check if tracking is active
   */
  isActive(): boolean {
    return this.isTracking;
  }

  /**
   * Check if has permission
   */
  hasPermissionGranted(): boolean {
    return this.hasPermission;
  }
}

export const mobileAppUsageTracker = new MobileAppUsageTracker();
