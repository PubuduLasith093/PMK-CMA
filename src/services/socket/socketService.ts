import { io, Socket } from 'socket.io-client';
import { API_CONFIG, SOCKET_EVENTS, API_ENDPOINTS } from '../../config/api.config';
import { store } from '../../store';
import { setConnectionStatus } from '../../store/slices/deviceSlice';
import deviceService from '../api/deviceService';
import locationService from '../location/locationService';
import metricsService from '../metrics/metricsService';
import apiClient from '../api/apiClient';

class SocketService {
  private socket: Socket | null = null;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 1000; // Start with 1 second
  private maxReconnectDelay: number = 30000; // Max 30 seconds
  private reconnectTimer: NodeJS.Timeout | null = null;

  /**
   * Connect to Socket.IO server with JWT authentication
   * Matches desktop app's socket connection pattern
   */
  async connect(): Promise<void> {
    try {
      // Reset reconnection state when manually connecting
      this.reconnectAttempts = 0;
      this.reconnectDelay = 1000;
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }

      // Get device credentials (like desktop reads app_registered_id.json)
      const credentials = await deviceService.getDeviceCredentials();

      if (!credentials) {
        throw new Error('No device credentials found. Please register the device first.');
      }

      console.log('Connecting to Socket.IO with credentials:', {
        deviceId: credentials.deviceId,
        hasToken: !!credentials.token,
      });

      // Initialize socket connection with JWT authentication
      this.socket = io(API_CONFIG.SOCKET_URL, {
        auth: {
          token: credentials.token, // JWT token from registration
          deviceId: credentials.deviceId,
          childId: credentials.childId,
          userId: credentials.userId,
        },
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 10000,
      });

      this.setupEventListeners();

      console.log('Socket.IO connection initiated for device:', credentials.deviceId);
    } catch (error) {
      console.error('Error connecting to Socket.IO:', error);
      throw error;
    }
  }

  /**
   * Set up Socket.IO event listeners
   */
  private setupEventListeners(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('========================================');
      console.log('✅ Socket.IO connected successfully');
      console.log('========================================');

      // Reset reconnection state on successful connection
      this.reconnectAttempts = 0;
      this.reconnectDelay = 1000; // Reset to initial delay
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }

      store.dispatch(setConnectionStatus('connected'));

      // Authentication already handled via socket.io auth option
      // No need to emit separate device connect event
      const state = store.getState();
      console.log('📱 Connected as device:', state.auth.deviceId);
      console.log('🔌 Socket ID:', this.socket?.id);
      console.log('🎯 Ready to receive events:');
      console.log('   - request-metrics-sync');
      console.log('   - device:locate-request');
      console.log('   - device:control:execute');
      console.log('========================================');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket.IO disconnected:', reason);
      store.dispatch(setConnectionStatus('disconnected'));
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket.IO connection error:', error);
      store.dispatch(setConnectionStatus('disconnected'));
      this.reconnectAttempts++;

      console.log(`Connection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} failed`);

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.log('Max reconnection attempts reached. Stopping automatic reconnection.');
        console.log('User can manually retry from the UI.');
        // Don't disconnect completely - keep socket instance for manual retry
        // this.disconnect();
      } else {
        // Implement exponential backoff for retry delay
        const currentDelay = Math.min(
          this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1),
          this.maxReconnectDelay
        );

        console.log(`Next reconnection attempt in ${currentDelay / 1000} seconds...`);

        // Clear any existing timer
        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer);
        }

        // Schedule reconnection with exponential backoff
        this.reconnectTimer = setTimeout(() => {
          if (this.socket && !this.socket.connected) {
            console.log(`Attempting to reconnect (${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})...`);
            this.socket.connect();
          }
        }, currentDelay);
      }
    });

    // Server events (from PMK backend)
    this.socket.on(SOCKET_EVENTS.CONFIG_UPDATED, (config) => {
      console.log('Config updated:', config);
      // TODO: Handle config updates
    });

    this.socket.on(SOCKET_EVENTS.DEVICE_LOCK, () => {
      console.log('Device lock requested');
      // TODO: Implement device lock
    });

    this.socket.on(SOCKET_EVENTS.DEVICE_UNLOCK, () => {
      console.log('Device unlock requested');
      // TODO: Implement device unlock
    });

    this.socket.on(SOCKET_EVENTS.DEVICE_LOCATE_REQUEST, async () => {
      console.log('Location request received from parent');
      await this.handleLocationRequest();
    });

    this.socket.on('request-metrics-sync', async (data) => {
      console.log('========================================');
      console.log('📊 METRICS REQUEST RECEIVED FROM PARENT');
      console.log('========================================');
      console.log('Event data:', JSON.stringify(data, null, 2));
      console.log('Timestamp:', new Date().toISOString());
      await this.handleMetricsRequest();
      console.log('========================================');
    });

    // PMK: Device control actions handler
    this.socket.on('device:control:execute', async (data) => {
      console.log('========================================');
      console.log('🎮 CONTROL ACTION RECEIVED FROM PARENT');
      console.log('========================================');
      console.log('Action data:', JSON.stringify(data, null, 2));
      console.log('Timestamp:', new Date().toISOString());
      await this.handleControlAction(data);
      console.log('========================================');
    });

    // PMK: Analytics monitoring control
    this.socket.on('analytics:start-monitoring', async () => {
      console.log('========================================');
      console.log('📊 ANALYTICS START MONITORING RECEIVED');
      console.log('========================================');
      await this.handleStartAnalyticsMonitoring();
    });

    this.socket.on('analytics:stop-monitoring', async () => {
      console.log('========================================');
      console.log('📊 ANALYTICS STOP MONITORING RECEIVED');
      console.log('========================================');
      await this.handleStopAnalyticsMonitoring();
    });

    // Analytics data acknowledgment
    this.socket.on('app-usage-data-ack', (data) => {
      console.log('📊 Analytics data acknowledged by server:', data);
    });
  }

  /**
   * Emit location update
   */
  emitLocationUpdate(locationData: any): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit(SOCKET_EVENTS.LOCATION_UPDATE, locationData);
    } else {
      console.warn('Socket not connected, location update not sent');
    }
  }

  /**
   * Emit metrics update
   */
  emitMetricsUpdate(metricsData: any): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit(SOCKET_EVENTS.METRICS_UPDATE, metricsData);
    } else {
      console.warn('Socket not connected, metrics update not sent');
    }
  }

  /**
   * Emit heartbeat
   */
  emitHeartbeat(heartbeatData: any): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit(SOCKET_EVENTS.HEARTBEAT_SEND, heartbeatData);
    } else {
      console.warn('Socket not connected, heartbeat not sent');
    }
  }

  /**
   * Handle location request from parent (via Socket.IO)
   */
  private async handleLocationRequest(): Promise<void> {
    try {
      const state = store.getState();
      const deviceId = state.auth.deviceId;

      if (!deviceId) {
        console.error('No device ID found, cannot send location');
        return;
      }

      console.log('📍 Starting location request handler...');

      // Get current location (one-time)
      const location = await locationService.getCurrentLocation();
      console.log('✅ GPS location obtained:', {
        lat: location.coords.latitude,
        lng: location.coords.longitude,
        accuracy: location.coords.accuracy,
      });

      let address = null;
      let city = null;
      let region = null;
      let country = null;

      // Get geocoded address using Google Geocoding API with timeout
      console.log('🌐 Starting geocoding request...');
      try {
        // Create a timeout promise that rejects after 3 seconds
        const geocodingTimeout = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Geocoding timeout')), 3000);
        });

        // Race between geocoding and timeout
        const geocodeResult = await Promise.race([
          fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?latlng=${location.coords.latitude},${location.coords.longitude}&key=${API_CONFIG.GOOGLE_MAPS_API_KEY}`
          ),
          geocodingTimeout,
        ]) as Response;

        const geocodeData = await geocodeResult.json();

        if (geocodeData.status === 'OK' && geocodeData.results && geocodeData.results.length > 0) {
          const result = geocodeData.results[0];
          address = result.formatted_address;

          // Extract city, region, country from address components
          for (const component of result.address_components) {
            // Skip if types is not an array
            if (!component.types || !Array.isArray(component.types)) continue;

            if (component.types.includes('locality') || component.types.includes('postal_town')) {
              city = component.long_name;
            } else if (component.types.includes('administrative_area_level_1')) {
              region = component.long_name;
            } else if (component.types.includes('country')) {
              country = component.long_name;
            }
          }
          console.log('✅ Geocoding successful:', { address, city, region, country });
        } else {
          console.warn('⚠️ Geocoding returned no results:', geocodeData.status);
        }
      } catch (geocodeError) {
        // If geocoding fails or times out, continue with null address fields
        console.warn('⚠️ Geocoding failed or timed out, sending location without address:', geocodeError);
      }

      // Send location to backend (always send, even if geocoding failed)
      console.log('📤 Sending location update to backend...');
      await apiClient.post(
        API_ENDPOINTS.UPDATE_LOCATION(deviceId),
        {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          accuracy: location.coords.accuracy || 0,
          altitude: location.coords.altitude || null,
          speed: location.coords.speed || null,
          heading: location.coords.heading || null,
          timestamp: new Date(location.timestamp).toISOString(),
          address,
          city,
          region,
          country,
        }
      );

      console.log('✅ Location sent successfully in response to parent request');
    } catch (error) {
      console.error('❌ Error handling location request:', error);
    }
  }

  /**
   * Handle metrics request from parent (via Socket.IO)
   */
  private async handleMetricsRequest(): Promise<void> {
    console.log('🔄 Starting metrics request handler...');
    try {
      const state = store.getState();
      const deviceId = state.auth.deviceId;

      console.log('Device ID from state:', deviceId);

      if (!deviceId) {
        console.error('❌ ERROR: No device ID found, cannot send metrics');
        return;
      }

      console.log('✅ Device ID found, collecting metrics...');

      // Collect and send metrics immediately
      await metricsService.sendMetricsNow(deviceId);

      console.log('✅ Metrics sent successfully in response to parent request');
      console.log('📤 Check backend logs to verify metrics were received');
    } catch (error) {
      console.error('❌ ERROR handling metrics request:', error);
      console.error('Error details:', error instanceof Error ? error.message : String(error));
      console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
    }
  }

  /**
   * Handle device control action from parent (via Socket.IO)
   */
  private async handleControlAction(data: any): Promise<void> {
    console.log('🎮 Starting control action handler...');

    const { actionId, actionType, deviceId, metadata } = data;

    try {
      console.log('Action details:', { actionId, actionType, deviceId });

      if (!actionId || !actionType) {
        console.error('❌ ERROR: Invalid control action data');
        this.emitControlActionResponse(actionId, false, 'Invalid action data');
        return;
      }

      // Send acknowledgment that we received the action
      console.log('📨 Sending acknowledgment to backend...');
      this.socket?.emit('device:control:ack', {
        actionId,
        success: true,
        timestamp: new Date().toISOString(),
      });

      // Import device control service
      const { default: deviceControlService } = await import(
        '../deviceControl/deviceControlService'
      );

      // Execute the control action
      console.log('⚙️ Executing control action...');
      const result = await deviceControlService.executeControlAction({
        actionId,
        actionType,
        deviceId,
        metadata,
      });

      console.log('✅ Control action result:', result);

      // Send completion response to backend
      this.socket?.emit('device:control:complete', {
        actionId,
        success: result.success,
        error: result.error,
        result: result.result,
        timestamp: new Date().toISOString(),
      });

      console.log('📤 Control action completion sent to backend');
    } catch (error) {
      console.error('❌ ERROR handling control action:', error);

      // Send failure response to backend
      this.socket?.emit('device:control:complete', {
        actionId,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Emit control action response (helper method)
   */
  private emitControlActionResponse(
    actionId: string,
    success: boolean,
    error?: string
  ): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit('device:control:ack', {
        actionId,
        success,
        error,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Handle start analytics monitoring request
   */
  private async handleStartAnalyticsMonitoring(): Promise<void> {
    try {
      console.log('📊 Starting analytics monitoring...');

      // Import device control service dynamically to avoid circular dependency
      const { default: deviceControlService } = await import(
        '../deviceControl/deviceControlService'
      );

      // Start monitoring
      await deviceControlService.startAnalyticsMonitoring();

      // Send status back to backend
      this.socket?.emit('analytics:monitoring-status', {
        isMonitoring: true,
        timestamp: new Date().toISOString(),
      });

      console.log('✅ Analytics monitoring started successfully');
    } catch (error) {
      console.error('❌ Failed to start analytics monitoring:', error);

      this.socket?.emit('analytics:monitoring-status', {
        isMonitoring: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Handle stop analytics monitoring request
   */
  private async handleStopAnalyticsMonitoring(): Promise<void> {
    try {
      console.log('📊 Stopping analytics monitoring...');

      // Import device control service dynamically to avoid circular dependency
      const { default: deviceControlService } = await import(
        '../deviceControl/deviceControlService'
      );

      // Stop monitoring
      await deviceControlService.stopAnalyticsMonitoring();

      // Send status back to backend
      this.socket?.emit('analytics:monitoring-status', {
        isMonitoring: false,
        timestamp: new Date().toISOString(),
      });

      console.log('✅ Analytics monitoring stopped successfully');
    } catch (error) {
      console.error('❌ Failed to stop analytics monitoring:', error);

      this.socket?.emit('analytics:monitoring-status', {
        isMonitoring: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Disconnect from Socket.IO server
   */
  disconnect(): void {
    // Clear any pending reconnection timer
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    // Reset reconnection state
    this.reconnectAttempts = 0;
    this.reconnectDelay = 1000;

    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      store.dispatch(setConnectionStatus('disconnected'));
      console.log('Socket.IO disconnected and reconnection timers cleared');
    }
  }

  /**
   * Check if socket is connected
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Get socket instance
   */
  getSocket(): Socket | null {
    return this.socket;
  }
}

export default new SocketService();
