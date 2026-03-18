import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    TextInput,
    FlatList,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme/colors';

interface LocationResult {
    name: string;
    address: string;
    latitude: number;
    longitude: number;
}

interface LocationShareModalProps {
    visible: boolean;
    onClose: () => void;
    onSelectLocation: (location: { latitude: number; longitude: number; address: string; name?: string }) => void;
}

const LocationShareModal: React.FC<LocationShareModalProps> = ({
    visible,
    onClose,
    onSelectLocation,
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searching, setSearching] = useState(false);
    const [gettingLiveLocation, setGettingLiveLocation] = useState(false);
    const [searchResults, setSearchResults] = useState<LocationResult[]>([]);
    const searchTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

    // Request location permissions on mount
    useEffect(() => {
        (async () => {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                console.warn('[LocationShare] Location permission not granted');
            }
        })();
    }, []);

    // Debounced search handler
    const handleSearchInput = (query: string) => {
        setSearchQuery(query);

        // Clear previous timeout
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        if (query.length < 3) {
            setSearchResults([]);
            setSearching(false);
            return;
        }

        // Set searching indicator
        setSearching(true);

        // Debounce search by 500ms
        searchTimeoutRef.current = setTimeout(() => {
            performSearch(query);
        }, 500);
    };

    // Perform actual search
    const performSearch = async (query: string) => {
        try {
            console.log('[LocationShare] Starting search for:', query);

            // Get auth token from secure storage
            const SecureStore = await import('expo-secure-store');
            const credentials = await SecureStore.getItemAsync('pmk_device_credentials');
            if (!credentials) {
                console.error('[LocationShare] No credentials found');
                Alert.alert('Error', 'Authentication required');
                setSearching(false);
                return;
            }

            const { token } = JSON.parse(credentials);
            const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:5000/api/v1';
            const autocompleteUrl = `${API_BASE_URL}/maps/places/autocomplete?input=${encodeURIComponent(query)}`;

            console.log('[LocationShare] Fetching from:', autocompleteUrl);

            // Call backend autocomplete endpoint
            const response = await fetch(autocompleteUrl, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            console.log('[LocationShare] Response status:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('[LocationShare] Response not OK:', errorText);
                throw new Error(`API returned ${response.status}: ${errorText}`);
            }

            const data = await response.json();
            console.log('[LocationShare] Autocomplete response:', JSON.stringify(data, null, 2));

            if (data.success && data.data?.predictions && data.data.predictions.length > 0) {
                console.log('[LocationShare] Found', data.data.predictions.length, 'predictions');

                // Get place details for each prediction (limit to 5)
                const results: LocationResult[] = await Promise.all(
                    data.data.predictions.slice(0, 5).map(async (prediction: any, index: number) => {
                        try {
                            console.log(`[LocationShare] Fetching details for prediction ${index + 1}:`, prediction.description);
                            console.log(`[LocationShare] Place ID (camelCase):`, prediction.placeId);

                            const detailsUrl = `${API_BASE_URL}/maps/places/${prediction.placeId}`; // FIX: Use camelCase placeId
                            console.log(`[LocationShare] Details URL ${index + 1}:`, detailsUrl);

                            const detailsResponse = await fetch(detailsUrl, {
                                headers: {
                                    'Authorization': `Bearer ${token}`,
                                    'Content-Type': 'application/json',
                                },
                            });

                            console.log(`[LocationShare] Place details response ${index + 1} status:`, detailsResponse.status);

                            if (!detailsResponse.ok) {
                                const errorText = await detailsResponse.text();
                                console.error(`[LocationShare] Place details error ${index + 1}:`, errorText);
                                return null;
                            }

                            const detailsData = await detailsResponse.json();
                            console.log(`[LocationShare] Place details ${index + 1}:`, JSON.stringify(detailsData, null, 2));

                            if (detailsData.success && detailsData.data) {
                                const place = detailsData.data;

                                // Extract coordinates - try multiple possible paths
                                let latitude = 0;
                                let longitude = 0;

                                if (place.geometry?.location?.lat && place.geometry?.location?.lng) {
                                    latitude = place.geometry.location.lat;
                                    longitude = place.geometry.location.lng;
                                } else if (place.geometry?.location?.latitude && place.geometry?.location?.longitude) {
                                    latitude = place.geometry.location.latitude;
                                    longitude = place.geometry.location.longitude;
                                } else if (place.lat && place.lng) {
                                    latitude = place.lat;
                                    longitude = place.lng;
                                } else if (place.latitude && place.longitude) {
                                    latitude = place.latitude;
                                    longitude = place.longitude;
                                }

                                console.log(`[LocationShare] Extracted coordinates ${index + 1}:`, { latitude, longitude });
                                console.log(`[LocationShare] Geometry object ${index + 1}:`, place.geometry);

                                // If coordinates are still 0,0, try geocoding the address
                                if (latitude === 0 && longitude === 0) {
                                    try {
                                        console.log(`[LocationShare] Geocoding address ${index + 1}:`, place.formatted_address || prediction.description);
                                        const geocoded = await Location.geocodeAsync(place.formatted_address || prediction.description);
                                        if (geocoded && geocoded.length > 0) {
                                            latitude = geocoded[0].latitude;
                                            longitude = geocoded[0].longitude;
                                            console.log(`[LocationShare] Geocoded coordinates ${index + 1}:`, { latitude, longitude });
                                        }
                                    } catch (geocodeError) {
                                        console.error(`[LocationShare] Geocoding failed ${index + 1}:`, geocodeError);
                                    }
                                }

                                const result = {
                                    name: place.name || prediction.structuredFormatting?.mainText || prediction.description,
                                    address: place.formatted_address || place.formattedAddress || prediction.description,
                                    latitude,
                                    longitude,
                                };

                                console.log(`[LocationShare] Created result ${index + 1}:`, result);
                                return result;
                            }
                        } catch (error) {
                            console.error(`[LocationShare] Error fetching place details ${index + 1}:`, error);
                        }
                        return null;
                    })
                );

                const validResults = results.filter(Boolean) as LocationResult[];
                console.log('[LocationShare] Valid results:', validResults.length);
                setSearchResults(validResults);
            } else {
                console.warn('[LocationShare] No predictions in response or invalid format:', data);
                setSearchResults([]);
            }
        } catch (error: any) {
            console.error('[LocationShare] Search error:', error);
            Alert.alert('Error', 'Failed to search locations: ' + (error?.message || 'Unknown error'));
            setSearchResults([]);
        } finally {
            setSearching(false);
        }
    };

    // Get current live location
    const handleLiveLocation = async () => {
        setGettingLiveLocation(true);
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert(
                    'Permission Required',
                    'Please grant location permission to share your live location'
                );
                setGettingLiveLocation(false);
                return;
            }

            console.log('[LocationShareModal] Getting current location...');
            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High,
            });

            console.log('[LocationShareModal] Got location, reverse geocoding...');
            // Reverse geocode to get address
            const addresses = await Location.reverseGeocodeAsync({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
            });

            let address = 'Current Location';
            if (addresses.length > 0) {
                const addr = addresses[0];
                address = [
                    addr.street,
                    addr.city,
                    addr.region,
                    addr.postalCode,
                    addr.country,
                ]
                    .filter(Boolean)
                    .join(', ');
            }

            console.log('[LocationShareModal] Live location ready:', {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                address,
            });

            // Pass to parent for confirmation
            onSelectLocation({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                address,
                name: 'My Current Location',
            });
            // Parent will show confirmation modal
        } catch (error) {
            console.error('[LocationShare] Live location error:', error);
            Alert.alert('Error', 'Failed to get current location');
        } finally {
            setGettingLiveLocation(false);
        }
    };

    const handleSelectLocation = (location: LocationResult) => {
        console.log('[LocationShareModal] User selected location:', location);
        onSelectLocation({
            latitude: location.latitude,
            longitude: location.longitude,
            address: location.address,
            name: location.name,
        });
        // Parent component will close this modal and show confirmation modal
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.container}>
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Ionicons name="close" size={24} color={colors.text.primary} />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Share Location</Text>
                        <View style={styles.placeholder} />
                    </View>

                    {/* Search Input */}
                    <View style={styles.searchContainer}>
                        <Ionicons name="search" size={20} color={colors.text.tertiary} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search for a location..."
                            placeholderTextColor={colors.text.tertiary}
                            value={searchQuery}
                            onChangeText={handleSearchInput}
                            autoFocus
                        />
                        {searching && <ActivityIndicator size="small" color={colors.accent.primary} />}
                    </View>

                    {/* Live Location Button */}
                    <TouchableOpacity
                        style={styles.liveLocationButton}
                        onPress={handleLiveLocation}
                        disabled={gettingLiveLocation}
                        activeOpacity={0.7}
                    >
                        <View style={styles.liveLocationIcon}>
                            {gettingLiveLocation ? (
                                <ActivityIndicator size="small" color="#FFFFFF" />
                            ) : (
                                <Ionicons name="navigate" size={20} color="#FFFFFF" />
                            )}
                        </View>
                        <View style={styles.liveLocationText}>
                            <Text style={styles.liveLocationTitle}>Send Live Location</Text>
                            <Text style={styles.liveLocationSubtitle}>
                                Share your current location instantly
                            </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={colors.text.tertiary} />
                    </TouchableOpacity>

                    {/* Search Results */}
                    <FlatList
                        data={searchResults}
                        keyExtractor={(item, index) => `${item.latitude}-${item.longitude}-${index}`}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={styles.resultItem}
                                onPress={() => handleSelectLocation(item)}
                                activeOpacity={0.7}
                            >
                                <View style={styles.resultIcon}>
                                    <Ionicons name="location" size={20} color={colors.accent.primary} />
                                </View>
                                <View style={styles.resultText}>
                                    <Text style={styles.resultName}>{item.name}</Text>
                                    <Text style={styles.resultAddress} numberOfLines={2}>
                                        {item.address}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        )}
                        ListEmptyComponent={
                            searchQuery.length >= 3 && !searching ? (
                                <View style={styles.emptyContainer}>
                                    <Ionicons name="search-outline" size={48} color={colors.text.tertiary} />
                                    <Text style={styles.emptyText}>No locations found</Text>
                                    <Text style={styles.emptySubtext}>
                                        Try a different search term
                                    </Text>
                                </View>
                            ) : searchQuery.length === 0 ? (
                                <View style={styles.emptyContainer}>
                                    <Ionicons name="map-outline" size={48} color={colors.text.tertiary} />
                                    <Text style={styles.emptyText}>Search for a location</Text>
                                    <Text style={styles.emptySubtext}>
                                        Or send your live location
                                    </Text>
                                </View>
                            ) : null
                        }
                        contentContainerStyle={styles.resultsList}
                        showsVerticalScrollIndicator={false}
                    />
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    container: {
        height: '85%',
        backgroundColor: colors.background.primary,
        borderTopLeftRadius: borderRadius.xl,
        borderTopRightRadius: borderRadius.xl,
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: colors.border.default,
        backgroundColor: colors.background.tertiary,
    },
    closeButton: {
        padding: spacing.xs,
    },
    headerTitle: {
        ...typography.h4,
        color: colors.text.primary,
    },
    placeholder: {
        width: 40,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        margin: spacing.md,
        padding: spacing.md,
        backgroundColor: colors.background.elevated,
        borderRadius: borderRadius.lg,
        gap: spacing.sm,
    },
    searchInput: {
        flex: 1,
        ...typography.body,
        color: colors.text.primary,
        padding: 0,
    },
    liveLocationButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: spacing.md,
        marginBottom: spacing.md,
        padding: spacing.md,
        backgroundColor: colors.background.elevated,
        borderRadius: borderRadius.lg,
        gap: spacing.md,
        ...shadows.sm,
    },
    liveLocationIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.accent.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    liveLocationText: {
        flex: 1,
    },
    liveLocationTitle: {
        ...typography.body,
        color: colors.text.primary,
        fontWeight: '600',
        marginBottom: 2,
    },
    liveLocationSubtitle: {
        ...typography.small,
        color: colors.text.secondary,
    },
    resultsList: {
        paddingHorizontal: spacing.md,
        paddingBottom: spacing.xl,
    },
    resultItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        backgroundColor: colors.background.elevated,
        borderRadius: borderRadius.lg,
        marginBottom: spacing.sm,
        gap: spacing.md,
    },
    resultIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.background.secondary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    resultText: {
        flex: 1,
    },
    resultName: {
        ...typography.body,
        color: colors.text.primary,
        fontWeight: '600',
        marginBottom: 2,
    },
    resultAddress: {
        ...typography.small,
        color: colors.text.secondary,
        lineHeight: 18,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.xxl * 2,
    },
    emptyText: {
        ...typography.body,
        color: colors.text.secondary,
        marginTop: spacing.md,
        marginBottom: spacing.xs,
    },
    emptySubtext: {
        ...typography.caption,
        color: colors.text.tertiary,
    },
});

export default LocationShareModal;
