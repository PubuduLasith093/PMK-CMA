import * as Location from 'expo-location';
import { store } from '../../store';
import { updateCurrent, setPermissionGranted, setTracking } from '../../store/slices/locationSlice';
import apiClient from '../api/apiClient';
import { API_CONFIG, API_ENDPOINTS } from '../../config/api.config';

class LocationService {
  private locationSubscription: Location.LocationSubscription | null = null;
  private isTracking: boolean = false;

  /**
   * Get address using Google Geocoding API (more accurate than Expo's reverse geocoding)
   */
  private async getGoogleGeocodedAddress(latitude: number, longitude: number): Promise<{
    address: string | null;
    city: string | null;
    region: string | null;
    country: string | null;
  }> {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${API_CONFIG.GOOGLE_MAPS_API_KEY}`
      );

      const data = await response.json();

      if (data.status === 'OK' && data.results && data.results.length > 0) {
        const result = data.results[0];

        // Extract address components
        let streetNumber = '';
        let route = '';
        let locality = '';
        let adminArea1 = '';
        let country = '';

        for (const component of result.address_components) {
          const types = component.types;

          // Skip if types is not an array
          if (!types || !Array.isArray(types)) continue;

          if (types.includes('street_number')) {
            streetNumber = component.long_name;
          } else if (types.includes('route')) {
            route = component.long_name;
          } else if (types.includes('locality') || types.includes('postal_town')) {
            locality = component.long_name;
          } else if (types.includes('administrative_area_level_1')) {
            adminArea1 = component.long_name;
          } else if (types.includes('country')) {
            country = component.long_name;
          }
        }

        // Build full address - use formatted_address for complete address
        // Only use street-level address if we have both street number and route
        const addressParts = [streetNumber, route].filter(Boolean);
        const address = addressParts.length >= 2 ? addressParts.join(' ') : result.formatted_address;

        return {
          address: address || null,
          city: locality || null,
          region: adminArea1 || null,
          country: country || null,
        };
      }

      return {
        address: null,
        city: null,
        region: null,
        country: null,
      };
    } catch (error) {
      console.error('Google Geocoding API error:', error);
      return {
        address: null,
        city: null,
        region: null,
        country: null,
      };
    }
  }

  /**
   * Request location permissions
   */
  async requestPermissions(): Promise<boolean> {
    try {
      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();

      if (foregroundStatus !== 'granted') {
        console.log('Foreground location permission not granted');
        store.dispatch(setPermissionGranted(false));
        return false;
      }

      // Request background permission
      const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();

      const granted = backgroundStatus === 'granted';
      store.dispatch(setPermissionGranted(granted));

      return granted || foregroundStatus === 'granted'; // Return true if at least foreground is granted
    } catch (error) {
      console.error('Error requesting location permissions:', error);
      return false;
    }
  }

  /**
   * Start location tracking
   */
  async startTracking(deviceId: string): Promise<void> {
    if (this.isTracking) {
      console.log('Location tracking already started');
      return;
    }

    try {
      // Check permissions first
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== 'granted') {
        const granted = await this.requestPermissions();
        if (!granted) {
          throw new Error('Location permissions not granted');
        }
      }

      // Start watching location
      this.locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 30000, // 30 seconds
          distanceInterval: 10, // 10 meters
        },
        async (location) => {
          // Get reverse geocoded address using Google Geocoding API (more accurate)
          let address = null;
          let city = null;
          let region = null;
          let country = null;

          try {
            // Try Google Geocoding API first
            const googleResult = await this.getGoogleGeocodedAddress(
              location.coords.latitude,
              location.coords.longitude
            );

            address = googleResult.address;
            city = googleResult.city;
            region = googleResult.region;
            country = googleResult.country;

            // Fallback to Expo's reverse geocoding if Google API didn't return results
            if (!address || !city) {
              console.log('Google geocoding incomplete, falling back to Expo geocoding');
              const geocode = await Location.reverseGeocodeAsync({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
              });

              if (geocode && geocode.length > 0) {
                const place = geocode[0];
                // Build full address
                const addressParts = [
                  place.streetNumber,
                  place.street,
                  place.district,
                ].filter(Boolean);
                address = address || (addressParts.length > 0 ? addressParts.join(', ') : null);
                city = city || place.city || place.subregion || null;
                region = region || place.region || null;
                country = country || place.country || null;
              }
            }
          } catch (geocodeError) {
            console.error('Error reverse geocoding location:', geocodeError);
            // Continue without address if geocoding fails
          }

          const locationData = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            accuracy: location.coords.accuracy || 0,
            altitude: location.coords.altitude ?? undefined,
            speed: location.coords.speed ?? undefined,
            heading: location.coords.heading ?? undefined,
            timestamp: new Date(location.timestamp),
            address: address ?? undefined,
            city: city ?? undefined,
            region: region ?? undefined,
            country: country ?? undefined,
          };

          // Update Redux store
          store.dispatch(updateCurrent(locationData));

          // Send to backend
          try {
            await this.sendLocationUpdate(deviceId, locationData);
          } catch (error) {
            console.error('Error sending location update:', error);
            // TODO: Queue for later sync
          }
        }
      );

      this.isTracking = true;
      store.dispatch(setTracking(true));
      console.log('Location tracking started');
    } catch (error) {
      console.error('Error starting location tracking:', error);
      throw error;
    }
  }

  /**
   * Stop location tracking
   */
  async stopTracking(): Promise<void> {
    if (this.locationSubscription) {
      this.locationSubscription.remove();
      this.locationSubscription = null;
    }

    this.isTracking = false;
    store.dispatch(setTracking(false));
    console.log('Location tracking stopped');
  }

  /**
   * Get current location (one-time)
   */
  async getCurrentLocation(): Promise<Location.LocationObject> {
    const { status } = await Location.getForegroundPermissionsAsync();
    if (status !== 'granted') {
      const granted = await this.requestPermissions();
      if (!granted) {
        throw new Error('Location permissions not granted');
      }
    }

    return await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });
  }

  /**
   * Send location update to backend
   */
  private async sendLocationUpdate(deviceId: string, locationData: any): Promise<void> {
    await apiClient.post(API_ENDPOINTS.UPDATE_LOCATION(deviceId), locationData);
  }

  /**
   * Get current location and send to backend (one-time update)
   * Used when HomeScreen loads or parent refreshes
   */
  async updateLocationOnce(deviceId: string): Promise<void> {
    try {
      // Get current location
      const location = await this.getCurrentLocation();

      // Get geocoded address
      let address = null;
      let city = null;
      let region = null;
      let country = null;

      try {
        const googleResult = await this.getGoogleGeocodedAddress(
          location.coords.latitude,
          location.coords.longitude
        );

        address = googleResult.address;
        city = googleResult.city;
        region = googleResult.region;
        country = googleResult.country;

        // Fallback to Expo if Google fails
        if (!address || !city) {
          const geocode = await Location.reverseGeocodeAsync({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });

          if (geocode && geocode.length > 0) {
            const place = geocode[0];
            const addressParts = [
              place.streetNumber,
              place.street,
              place.district,
            ].filter(Boolean);
            address = address || (addressParts.length > 0 ? addressParts.join(', ') : null);
            city = city || place.city || place.subregion || null;
            region = region || place.region || null;
            country = country || place.country || null;
          }
        }
      } catch (geocodeError) {
        console.error('Error geocoding:', geocodeError);
      }

      const locationData = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy || 0,
        altitude: location.coords.altitude ?? undefined,
        speed: location.coords.speed ?? undefined,
        heading: location.coords.heading ?? undefined,
        timestamp: new Date(location.timestamp),
        address: address ?? undefined,
        city: city ?? undefined,
        region: region ?? undefined,
        country: country ?? undefined,
      };

      // Update Redux store
      store.dispatch(updateCurrent(locationData));

      // Send to backend
      await this.sendLocationUpdate(deviceId, locationData);
      console.log('Location updated successfully (one-time)');
    } catch (error) {
      console.error('Error updating location:', error);
      throw error;
    }
  }

  /**
   * Check if currently tracking
   */
  isCurrentlyTracking(): boolean {
    return this.isTracking;
  }
}

export default new LocationService();
