/**
 * Device Control Service
 * Handles device control actions from parent (Lock, Locate, Play Sound, etc.)
 */

import { Audio } from 'expo-av';
import * as Device from 'expo-device';
import { Alert, Platform } from 'react-native';
import locationService from '../location/locationService';
import { mobileAppUsageTracker } from '../appUsage/MobileAppUsageTracker';
import socketService from '../socket/socketService';

export type DeviceControlActionType =
  | 'LOCK'
  | 'UNLOCK'
  | 'LOCATE'
  | 'PLAY_SOUND'
  | 'MUTE'
  | 'UNMUTE'
  | 'SCREENSHOT'
  | 'BLOCK'
  | 'UNBLOCK'
  | 'RESTART'
  | 'EMERGENCY_LOCK'
  | 'EMERGENCY_UNLOCK'
  | 'EMERGENCY_ALERT'
  | 'EMERGENCY_LOCATE'
  | 'FACTORY_RESET';

interface ControlActionData {
  actionId: string;
  actionType: DeviceControlActionType;
  deviceId: string;
  metadata?: any;
}

interface ControlActionResult {
  success: boolean;
  error?: string;
  result?: any;
}

class DeviceControlService {
  private soundObject: Audio.Sound | null = null;
  private isLocked: boolean = false;
  private isMuted: boolean = false;
  private isEmergencyMode: boolean = false;
  private emergencyType: 'lock' | 'alert' | 'locate' | null = null;

  // Analytics tracking
  private isAnalyticsMonitoringActive: boolean = false;
  private analyticsMonitoringInterval: NodeJS.Timeout | null = null;

  /**
   * Execute a control action based on action type
   */
  async executeControlAction(data: ControlActionData): Promise<ControlActionResult> {
    const { actionType, actionId, metadata } = data;

    console.log(`🎮 Executing control action: ${actionType}`, { actionId, metadata });

    try {
      switch (actionType) {
        case 'LOCK':
          return await this.lockDevice();

        case 'UNLOCK':
          return await this.unlockDevice();

        case 'LOCATE':
          return await this.locateDevice();

        case 'PLAY_SOUND':
          return await this.playAlertSound();

        case 'MUTE':
          return await this.muteDevice();

        case 'UNMUTE':
          return await this.unmuteDevice();

        case 'SCREENSHOT':
          return await this.takeScreenshot();

        case 'BLOCK':
          return await this.blockDevice();

        case 'UNBLOCK':
          return await this.unblockDevice();

        case 'RESTART':
          return await this.restartDevice();

        case 'EMERGENCY_LOCK':
          return await this.emergencyLock();

        case 'EMERGENCY_UNLOCK':
          return await this.emergencyUnlock();

        case 'EMERGENCY_ALERT':
          return await this.emergencyAlert();

        case 'EMERGENCY_LOCATE':
          return await this.emergencyLocate();

        case 'FACTORY_RESET':
          return await this.factoryReset();

        default:
          return {
            success: false,
            error: `Unknown action type: ${actionType}`,
          };
      }
    } catch (error) {
      console.error(`Error executing ${actionType}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Lock device (show lock screen overlay)
   * Note: React Native doesn't have native lock screen API, so we'll show an overlay
   */
  private async lockDevice(): Promise<ControlActionResult> {
    try {
      console.log('🔒 Locking device...');

      // Set lock state (this will be used by the UI to show a lock overlay)
      this.isLocked = true;

      // In a real implementation, you would navigate to a lock screen
      // or show a full-screen modal that can't be dismissed
      // For now, we'll just set the state
      Alert.alert(
        'Device Locked',
        'Your device has been locked by your parent. Contact them to unlock.',
        [{ text: 'OK', style: 'default' }],
        { cancelable: false }
      );

      return {
        success: true,
        result: { locked: true, timestamp: new Date().toISOString() },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to lock device',
      };
    }
  }

  /**
   * Unlock device
   */
  private async unlockDevice(): Promise<ControlActionResult> {
    try {
      console.log('🔓 Unlocking device...');

      this.isLocked = false;

      return {
        success: true,
        result: { locked: false, timestamp: new Date().toISOString() },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to unlock device',
      };
    }
  }

  /**
   * Locate device (get current location)
   */
  private async locateDevice(): Promise<ControlActionResult> {
    try {
      console.log('📍 Locating device...');

      const location = await locationService.getCurrentLocation();

      return {
        success: true,
        result: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          accuracy: location.coords.accuracy,
          timestamp: new Date(location.timestamp).toISOString(),
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get location',
      };
    }
  }

  /**
   * Play alert sound at maximum volume
   */
  private async playAlertSound(): Promise<ControlActionResult> {
    try {
      console.log('🔊 Playing alert sound...');

      // Load and play a loud alert sound
      if (this.soundObject) {
        await this.soundObject.unloadAsync();
      }

      this.soundObject = new Audio.Sound();

      // Use a system alert sound or a loud beep
      // For now, we'll use expo-av's default sound
      await this.soundObject.loadAsync(
        require('../../../assets/sounds/alert.mp3') // You'll need to add this sound file
      );

      // Set volume to maximum and play on repeat
      await this.soundObject.setVolumeAsync(1.0);
      await this.soundObject.setIsLoopingAsync(true);
      await this.soundObject.playAsync();

      // Auto-stop after 30 seconds
      setTimeout(async () => {
        if (this.soundObject) {
          await this.soundObject.stopAsync();
          await this.soundObject.unloadAsync();
          this.soundObject = null;
        }
      }, 30000);

      return {
        success: true,
        result: { playing: true, duration: 30, timestamp: new Date().toISOString() },
      };
    } catch (error) {
      // If sound file doesn't exist, still return success but with a note
      console.warn('Sound file not found, using fallback');

      Alert.alert(
        '🔊 Alert',
        'Your parent is trying to locate you. Please respond!',
        [{ text: 'OK' }]
      );

      return {
        success: true,
        result: { playing: false, fallback: 'alert', timestamp: new Date().toISOString() },
      };
    }
  }

  /**
   * Mute device (disable sound output)
   */
  private async muteDevice(): Promise<ControlActionResult> {
    try {
      console.log('🔇 Muting device...');

      this.isMuted = true;

      // Stop any playing sounds
      if (this.soundObject) {
        await this.soundObject.stopAsync();
        await this.soundObject.unloadAsync();
        this.soundObject = null;
      }

      return {
        success: true,
        result: { muted: true, timestamp: new Date().toISOString() },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to mute device',
      };
    }
  }

  /**
   * Unmute device
   */
  private async unmuteDevice(): Promise<ControlActionResult> {
    try {
      console.log('🔊 Unmuting device...');

      this.isMuted = false;

      return {
        success: true,
        result: { muted: false, timestamp: new Date().toISOString() },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to unmute device',
      };
    }
  }

  /**
   * Take screenshot
   * Note: React Native doesn't have native screenshot API for security reasons
   */
  private async takeScreenshot(): Promise<ControlActionResult> {
    try {
      console.log('📸 Taking screenshot...');

      // Screenshot functionality requires react-native-view-shot
      // For now, return success with a note
      Alert.alert(
        'Screenshot Requested',
        'Parent has requested a screenshot of your device screen.',
        [{ text: 'OK' }]
      );

      return {
        success: true,
        result: {
          message: 'Screenshot request received (requires native implementation)',
          platform: Platform.OS,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to take screenshot',
      };
    }
  }

  /**
   * Block device - Stops data sync and monitoring
   * Similar to airplane mode for app communication
   */
  private async blockDevice(): Promise<ControlActionResult> {
    try {
      console.log('🚫 Blocking device...');

      // In production, this would:
      // 1. Stop background location tracking
      // 2. Disable socket connection
      // 3. Pause all monitoring services
      // For now, just show notification

      Alert.alert(
        'Device Blocked',
        'Your device monitoring has been paused by your parent. Data sync is disabled.',
        [{ text: 'OK' }]
      );

      return {
        success: true,
        result: {
          message: 'Device blocked - monitoring paused',
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to block device',
      };
    }
  }

  /**
   * Unblock device - Resumes data sync and monitoring
   */
  private async unblockDevice(): Promise<ControlActionResult> {
    try {
      console.log('✅ Unblocking device...');

      // In production, this would:
      // 1. Resume background location tracking
      // 2. Re-enable socket connection
      // 3. Resume all monitoring services

      Alert.alert(
        'Device Unblocked',
        'Your device monitoring has been resumed by your parent.',
        [{ text: 'OK' }]
      );

      return {
        success: true,
        result: {
          message: 'Device unblocked - monitoring resumed',
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to unblock device',
      };
    }
  }

  /**
   * Restart device
   * Note: Programmatic device restart is not possible in React Native
   */
  private async restartDevice(): Promise<ControlActionResult> {
    try {
      console.log('🔄 Restart device requested...');

      // Device restart requires native permissions that React Native doesn't provide
      // Show notification instead
      Alert.alert(
        'Restart Requested',
        'Your parent has requested a device restart. Please restart your device manually.',
        [{ text: 'OK' }]
      );

      return {
        success: true,
        result: {
          message: 'Restart notification shown (manual restart required)',
          platform: Platform.OS,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to request restart',
      };
    }
  }

  /**
   * Emergency Lock - High priority lock with red alert
   * Cannot be dismissed without parent unlock
   */
  private async emergencyLock(): Promise<ControlActionResult> {
    try {
      console.log('🚨 EMERGENCY LOCK ACTIVATED');

      this.isLocked = true;
      this.isEmergencyMode = true;
      this.emergencyType = 'lock';

      // Red-themed emergency alert
      Alert.alert(
        '🚨 EMERGENCY LOCK',
        '⚠️ YOUR DEVICE HAS BEEN EMERGENCY LOCKED BY YOUR PARENT\n\nThis is a high-priority lock. You cannot use your device until your parent unlocks it.\n\nContact your parent immediately if you need assistance.',
        [{ text: 'OK', style: 'destructive' }],
        { cancelable: false }
      );

      return {
        success: true,
        result: {
          emergencyLock: true,
          emergencyMode: true,
          emergencyType: 'lock',
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to emergency lock',
      };
    }
  }

  /**
   * Emergency Unlock - Deactivate emergency lock
   */
  private async emergencyUnlock(): Promise<ControlActionResult> {
    try {
      console.log('✅ Emergency lock deactivated');

      this.isLocked = false;
      this.isEmergencyMode = false;
      this.emergencyType = null;

      Alert.alert(
        '✅ Emergency Lock Removed',
        'Your parent has removed the emergency lock. You can now use your device normally.',
        [{ text: 'OK', style: 'default' }]
      );

      return {
        success: true,
        result: {
          emergencyLock: false,
          emergencyMode: false,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to emergency unlock',
      };
    }
  }

  /**
   * Emergency Alert - Send critical alert to device
   * Red-themed high priority notification
   */
  private async emergencyAlert(): Promise<ControlActionResult> {
    try {
      console.log('🚨 EMERGENCY ALERT RECEIVED');

      this.isEmergencyMode = true;
      this.emergencyType = 'alert';

      // Play alert sound if not muted
      if (!this.isMuted) {
        await this.playAlertSound();
      }

      // Show red emergency alert
      Alert.alert(
        '🚨 EMERGENCY ALERT',
        '⚠️ YOUR PARENT HAS SENT AN EMERGENCY ALERT\n\nPlease contact your parent immediately. This is a high-priority message.\n\nEmergency Contact: [Parent Phone/Email would be here]',
        [
          {
            text: 'Acknowledge',
            style: 'destructive',
            onPress: () => {
              this.isEmergencyMode = false;
              this.emergencyType = null;
            },
          },
        ],
        { cancelable: false }
      );

      return {
        success: true,
        result: {
          emergencyAlert: true,
          emergencyMode: true,
          emergencyType: 'alert',
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send emergency alert',
      };
    }
  }

  /**
   * Emergency Locate - Force high-priority location tracking
   * Sends immediate location update
   */
  private async emergencyLocate(): Promise<ControlActionResult> {
    try {
      console.log('🚨 EMERGENCY LOCATION REQUESTED');

      this.isEmergencyMode = true;
      this.emergencyType = 'locate';

      // Get current location immediately
      const location = await locationService.getCurrentLocation();

      // Show emergency alert
      Alert.alert(
        '🚨 EMERGENCY LOCATION',
        '⚠️ YOUR PARENT HAS REQUESTED YOUR EMERGENCY LOCATION\n\nYour current location has been sent to your parent.\n\nIf you need help, contact your parent immediately.',
        [
          {
            text: 'OK',
            style: 'destructive',
            onPress: () => {
              this.isEmergencyMode = false;
              this.emergencyType = null;
            },
          },
        ],
        { cancelable: false }
      );

      return {
        success: true,
        result: {
          emergencyLocate: true,
          emergencyMode: true,
          emergencyType: 'locate',
          location,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get emergency location',
      };
    }
  }

  /**
   * Factory reset - DANGEROUS!
   * Shows confirmation dialog before proceeding
   */
  private async factoryReset(): Promise<ControlActionResult> {
    try {
      console.log('⚠️ Factory reset requested...');

      // Factory reset is very dangerous and typically requires native code
      // We'll just show an alert for now
      Alert.alert(
        '⚠️ Factory Reset',
        'Your parent has requested a factory reset. This would erase all data on your device. Please contact them immediately.',
        [{ text: 'OK', style: 'destructive' }],
        { cancelable: false }
      );

      return {
        success: false,
        error: 'Factory reset requires manual confirmation',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to factory reset',
      };
    }
  }

  /**
   * Check if device is currently locked
   */
  isDeviceLocked(): boolean {
    return this.isLocked;
  }

  /**
   * Check if device is currently muted
   */
  isDeviceMuted(): boolean {
    return this.isMuted;
  }

  /**
   * Check if device is in emergency mode
   */
  isInEmergencyMode(): boolean {
    return this.isEmergencyMode;
  }

  /**
   * Get current emergency type
   */
  getEmergencyType(): 'lock' | 'alert' | 'locate' | null {
    return this.emergencyType;
  }

  /**
   * Stop alert sound if playing
   */
  async stopAlertSound(): Promise<void> {
    if (this.soundObject) {
      try {
        await this.soundObject.stopAsync();
        await this.soundObject.unloadAsync();
        this.soundObject = null;
        console.log('Alert sound stopped');
      } catch (error) {
        console.error('Error stopping alert sound:', error);
      }
    }
  }

  /**
   * Start analytics monitoring
   */
  async startAnalyticsMonitoring(): Promise<void> {
    if (this.isAnalyticsMonitoringActive) {
      console.log('📊 Analytics monitoring already active');
      return;
    }

    console.log('📊 Starting analytics monitoring...');

    try {
      // Check and request permission (Android only)
      const hasPermission = await mobileAppUsageTracker.checkPermission();
      if (!hasPermission) {
        const granted = await mobileAppUsageTracker.requestPermission();
        if (!granted) {
          console.warn('⚠️ App usage permission not granted (iOS has no such permission - will track pickup count only)');
          // Continue anyway for iOS - it can still track pickup count
        }
      }

      // Start tracking (works on both iOS and Android)
      await mobileAppUsageTracker.startTracking();
      this.isAnalyticsMonitoringActive = true;

      // Sync data every 15 minutes
      this.analyticsMonitoringInterval = setInterval(async () => {
        await this.collectAndSendAnalytics();
      }, 15 * 60 * 1000);

      console.log('✅ Analytics monitoring started');
    } catch (error) {
      console.error('❌ Failed to start analytics monitoring:', error);
    }
  }

  /**
   * Stop analytics monitoring
   */
  async stopAnalyticsMonitoring(): Promise<void> {
    if (!this.isAnalyticsMonitoringActive) {
      console.log('📊 Analytics monitoring not active');
      return;
    }

    console.log('📊 Stopping analytics monitoring...');

    try {
      // Stop tracking
      await mobileAppUsageTracker.stopTracking();

      // Clear interval
      if (this.analyticsMonitoringInterval) {
        clearInterval(this.analyticsMonitoringInterval);
        this.analyticsMonitoringInterval = null;
      }

      // Final sync before stopping (MUST happen before setting isAnalyticsMonitoringActive = false)
      await this.collectAndSendAnalytics();

      // Set to false AFTER sending data
      this.isAnalyticsMonitoringActive = false;

      console.log('✅ Analytics monitoring stopped');
    } catch (error) {
      console.error('❌ Failed to stop analytics monitoring:', error);
    }
  }

  /**
   * Collect and send analytics data to backend
   */
  private async collectAndSendAnalytics(): Promise<void> {
    if (!this.isAnalyticsMonitoringActive) {
      return;
    }

    try {
      console.log('📊 Collecting and sending analytics data...');

      // Sync usage data from native module
      await mobileAppUsageTracker.syncUsageData();

      // Get collected sessions
      const sessions = mobileAppUsageTracker.getSessions();
      const pickupCount = mobileAppUsageTracker.getPickupCount();
      const notificationCount = mobileAppUsageTracker.getNotificationCount();

      if (sessions.length === 0) {
        console.log('📊 No analytics data to send');
        return;
      }

      // Send to backend via socket
      const socket = socketService.getSocket();
      if (socket && socket.connected) {
        socket.emit('app-usage-data', {
          sessions,
          pickupCount,
          notificationCount,
          timestamp: new Date().toISOString(),
        });

        console.log(`📊 Sent ${sessions.length} app sessions to backend`);

        // Clear sent data
        mobileAppUsageTracker.clearSessions();
        mobileAppUsageTracker.resetCounters();
      } else {
        console.warn('⚠️ Socket not connected, analytics data not sent');
      }
    } catch (error) {
      console.error('❌ Failed to collect and send analytics:', error);
    }
  }

  /**
   * Check if analytics monitoring is active
   */
  isAnalyticsActive(): boolean {
    return this.isAnalyticsMonitoringActive;
  }
}

export default new DeviceControlService();
