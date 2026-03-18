import * as SecureStore from 'expo-secure-store';
import * as Device from 'expo-device';
import apiClient from './apiClient';
import { API_CONFIG, API_ENDPOINTS } from '../../config/api.config';

// Device Credentials Interface (matches desktop app's app_registered_id.json)
export interface DeviceCredentials {
  deviceId: string;
  childId: string;
  userId: string;
  token: string;
  childName: string;
  parentName: string;
  deviceName: string;
  deviceUUID: string;
  lastUpdated: string;
}

// Access Key Validation Response (matches PMK backend)
export interface AccessKeyValidationResponse {
  success: boolean;
  isValid: boolean;
  data?: {
    childName: string;
    parentName: string;
    childId: string;
    userId: string;
  };
  message: string;
}

// Device Registration Request (matches desktop app's format)
export interface DeviceRegistrationRequest {
  accessKey: string;
  deviceUUID: string;
  deviceName: string;
  deviceType: 'SMARTPHONE' | 'TABLET' | 'LAPTOP' | 'DESKTOP' | 'SMARTWATCH' | 'OTHER';
  os: string;
  osVersion: string;
  appVersion: string;
  systemInfo: {
    manufacturer?: string;
    model?: string;
    deviceYearClass?: number;
    totalMemory?: string;
  };
}

// Device Registration Response (matches PMK backend)
export interface DeviceRegistrationResponse {
  success: boolean;
  deviceId: string;
  status: 'ACTIVE' | 'PENDING' | 'BLOCKED';
  message: string;
  isNewDevice: boolean;
  childId: string;
  childName: string;
  userId: string;
  parentName: string;
  token: string;
}

class DeviceService {
  private readonly CREDENTIALS_KEY = 'pmk_device_credentials';

  /**
   * Check if device is already registered
   * Similar to desktop app checking app_registered_id.json
   */
  async isDeviceRegistered(): Promise<boolean> {
    try {
      const credentials = await SecureStore.getItemAsync(this.CREDENTIALS_KEY);
      return credentials !== null;
    } catch (error) {
      console.error('Error checking device registration:', error);
      return false;
    }
  }

  /**
   * Get stored device credentials
   */
  async getDeviceCredentials(): Promise<DeviceCredentials | null> {
    try {
      const credentialsJson = await SecureStore.getItemAsync(this.CREDENTIALS_KEY);
      if (!credentialsJson) {
        return null;
      }
      return JSON.parse(credentialsJson) as DeviceCredentials;
    } catch (error) {
      console.error('Error getting device credentials:', error);
      return null;
    }
  }

  /**
   * Save device credentials securely
   */
  async saveDeviceCredentials(credentials: DeviceCredentials): Promise<void> {
    try {
      // Save full credentials object
      await SecureStore.setItemAsync(
        this.CREDENTIALS_KEY,
        JSON.stringify(credentials)
      );

      // Also save token separately for apiClient interceptor
      await SecureStore.setItemAsync('deviceToken', credentials.token);
    } catch (error) {
      console.error('Error saving device credentials:', error);
      throw new Error('Failed to save device credentials');
    }
  }

  /**
   * Clear device credentials (for logout/reset)
   */
  async clearDeviceCredentials(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(this.CREDENTIALS_KEY);
      await SecureStore.deleteItemAsync('deviceToken');
      await SecureStore.deleteItemAsync('device_uuid');
    } catch (error) {
      console.error('Error clearing device credentials:', error);
    }
  }

  /**
   * Validate access key with PMK backend
   * Matches desktop app's access key validation
   */
  async validateAccessKey(accessKey: string): Promise<AccessKeyValidationResponse> {
    try {
      // Call PMK backend to validate access key
      // apiClient.get already returns response.data directly
      const data = await apiClient.get<AccessKeyValidationResponse>(
        `/device-access/verify/${accessKey.trim().toUpperCase()}`
      );

      console.log('Access key validation response:', data);
      return data;
    } catch (error: any) {
      console.error('Access key validation error:', error);

      // Return error response
      return {
        success: false,
        isValid: false,
        message: error.response?.data?.message || 'Failed to validate access key',
      };
    }
  }

  /**
   * Generate unique device UUID
   * Similar to desktop app's machine-id
   */
  private async getDeviceUUID(): Promise<string> {
    try {
      // Try to get existing UUID from storage
      let uuid = await SecureStore.getItemAsync('device_uuid');

      if (!uuid) {
        // Generate new UUID if not exists
        // Use device manufacturer + model + os version as seed for consistency
        const deviceInfo = `${Device.manufacturer}-${Device.modelName}-${Device.osVersion}`;

        // Create a simple hash using btoa (React Native compatible base64 encoding)
        uuid = btoa(deviceInfo).substring(0, 32);

        // Store for future use
        await SecureStore.setItemAsync('device_uuid', uuid);
      }

      return uuid;
    } catch (error) {
      console.error('Error generating device UUID:', error);
      // Fallback to timestamp-based UUID
      return `mobile-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    }
  }

  /**
   * Get device system information
   */
  private async getSystemInfo() {
    return {
      manufacturer: Device.manufacturer || 'Unknown',
      model: Device.modelName || 'Unknown',
      deviceYearClass: Device.deviceYearClass || undefined,
      totalMemory: Device.totalMemory ? `${(Device.totalMemory / (1024 * 1024 * 1024)).toFixed(2)} GB` : undefined,
    };
  }

  /**
   * Register device with PMK backend
   * Matches desktop app's registration flow exactly
   */
  async registerDevice(accessKey: string): Promise<DeviceRegistrationResponse> {
    try {
      // Get device UUID (similar to desktop's machine-id)
      const deviceUUID = await this.getDeviceUUID();

      // Get device name (similar to desktop's computer name)
      const deviceName = Device.deviceName || `${Device.manufacturer} ${Device.modelName}`;

      // Determine device type (matching Prisma DeviceType enum)
      const deviceType: 'SMARTPHONE' | 'TABLET' =
        Device.deviceType === Device.DeviceType.TABLET ? 'TABLET' : 'SMARTPHONE';

      // Get OS info
      const os = Device.osName || 'Unknown';
      const osVersion = Device.osVersion || 'Unknown';

      // Get app version from package.json
      const appVersion = '1.0.0'; // TODO: Import from package.json

      // Get system info
      const systemInfo = await this.getSystemInfo();

      // Prepare registration request (matches desktop app format exactly)
      const registrationData: DeviceRegistrationRequest = {
        accessKey: accessKey.trim().toUpperCase(),
        deviceUUID,
        deviceName,
        deviceType,
        os,
        osVersion,
        appVersion,
        systemInfo,
        // Also send manufacturer and model as top-level fields for easier backend extraction
        manufacturer: systemInfo.manufacturer,
        deviceModel: systemInfo.model,
      };

      console.log('Registering device with PMK:', registrationData);

      // Call PMK backend registration endpoint
      // apiClient.post already returns response.data directly
      const data = await apiClient.post<DeviceRegistrationResponse>(
        API_ENDPOINTS.REGISTER_DEVICE,
        registrationData
      );

      console.log('Device registration response:', data);

      // If successful, save credentials (like desktop app saves to app_registered_id.json)
      if (data.success) {
        const credentials: DeviceCredentials = {
          deviceId: data.deviceId,
          childId: data.childId,
          userId: data.userId,
          token: data.token,
          childName: data.childName,
          parentName: data.parentName,
          deviceName,
          deviceUUID,
          lastUpdated: new Date().toISOString(),
        };

        await this.saveDeviceCredentials(credentials);
      }

      return data;
    } catch (error: any) {
      console.error('Device registration error:', error);

      throw new Error(
        error.response?.data?.message ||
        error.message ||
        'Failed to register device'
      );
    }
  }

  /**
   * Get stored device ID
   */
  async getStoredDeviceId(): Promise<string | null> {
    const credentials = await this.getDeviceCredentials();
    return credentials?.deviceId || null;
  }

  /**
   * Validate device credentials with backend
   * Checks if device still exists and token is still valid
   */
  async validateDeviceWithBackend(): Promise<{
    success: boolean;
    isValid: boolean;
    message: string;
  }> {
    try {
      const credentials = await this.getDeviceCredentials();

      if (!credentials) {
        return {
          success: true,
          isValid: false,
          message: 'No stored credentials found',
        };
      }

      // Call backend validation endpoint
      const data = await apiClient.post<{
        success: boolean;
        isValid: boolean;
        message: string;
      }>(API_ENDPOINTS.VALIDATE_DEVICE, {
        deviceId: credentials.deviceId,
        token: credentials.token,
      });

      return data;
    } catch (error: any) {
      console.error('Device validation error:', error);
      return {
        success: false,
        isValid: false,
        message: error.response?.data?.message || 'Failed to validate device credentials',
      };
    }
  }
}

export default new DeviceService();
