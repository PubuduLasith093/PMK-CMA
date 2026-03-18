import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
} from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '../../theme/colors';

interface LocationPickerProps {
    visible: boolean;
    onClose: () => void;
    onLocationSelected: (locationData: {
        latitude: number;
        longitude: number;
        address: string;
        name?: string;
    }) => void;
}

const LocationPicker: React.FC<LocationPickerProps> = ({ visible, onClose, onLocationSelected }) => {
    const [currentLocation, setCurrentLocation] = useState<{
        latitude: number;
        longitude: number;
        address: string;
    } | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (visible) {
            getCurrentLocation();
        }
    }, [visible]);

    const getCurrentLocation = async () => {
        setLoading(true);
        try {
            // Request permission
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Required', 'Location permission is required to share your location.');
                setLoading(false);
                return;
            }

            // Get current position
            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High,
            });

            // Reverse geocode to get address
            const geocode = await Location.reverseGeocodeAsync({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
            });

            if (geocode && geocode.length > 0) {
                const place = geocode[0];
                const address = [
                    place.street,
                    place.city,
                    place.region,
                    place.country,
                ]
                    .filter(Boolean)
                    .join(', ');

                setCurrentLocation({
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                    address: address || 'Unknown location',
                });
            } else {
                setCurrentLocation({
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                    address: `${location.coords.latitude.toFixed(6)}, ${location.coords.longitude.toFixed(6)}`,
                });
            }
        } catch (error) {
            console.error('[LocationPicker] Error:', error);
            Alert.alert('Error', 'Failed to get current location');
        } finally {
            setLoading(false);
        }
    };

    const handleSend = () => {
        if (currentLocation) {
            onLocationSelected({
                latitude: currentLocation.latitude,
                longitude: currentLocation.longitude,
                address: currentLocation.address,
            });
            setCurrentLocation(null);
            onClose();
        }
    };

    const handleClose = () => {
        setCurrentLocation(null);
        onClose();
    };

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
            <View style={styles.overlay}>
                <View style={styles.container}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>Share Location</Text>
                        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                            <Ionicons name="close" size={24} color={colors.text.secondary} />
                        </TouchableOpacity>
                    </View>

                    {/* Content */}
                    <View style={styles.content}>
                        {loading ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="large" color={colors.accent.primary} />
                                <Text style={styles.loadingText}>Getting your location...</Text>
                            </View>
                        ) : currentLocation ? (
                            <View style={styles.locationContainer}>
                                {/* Map Placeholder */}
                                <View style={styles.mapPlaceholder}>
                                    <Ionicons name="location" size={64} color={colors.accent.primary} />
                                    <Text style={styles.coordinatesText}>
                                        {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
                                    </Text>
                                </View>

                                {/* Address */}
                                <View style={styles.addressContainer}>
                                    <Ionicons name="navigate" size={20} color={colors.accent.primary} />
                                    <Text style={styles.addressText}>{currentLocation.address}</Text>
                                </View>

                                {/* Actions */}
                                <View style={styles.actions}>
                                    <TouchableOpacity
                                        style={[styles.button, styles.buttonSecondary]}
                                        onPress={getCurrentLocation}
                                    >
                                        <Ionicons name="refresh" size={20} color={colors.text.primary} />
                                        <Text style={styles.buttonTextSecondary}>Refresh</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={[styles.button, styles.buttonPrimary]} onPress={handleSend}>
                                        <Ionicons name="send" size={20} color="#FFFFFF" />
                                        <Text style={styles.buttonTextPrimary}>Send Location</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ) : (
                            <View style={styles.errorContainer}>
                                <Ionicons name="location-outline" size={64} color={colors.text.tertiary} />
                                <Text style={styles.errorText}>Unable to get location</Text>
                                <TouchableOpacity style={styles.retryButton} onPress={getCurrentLocation}>
                                    <Text style={styles.retryButtonText}>Try Again</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
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
        backgroundColor: colors.background.tertiary,
        borderTopLeftRadius: borderRadius.xl,
        borderTopRightRadius: borderRadius.xl,
        maxHeight: '70%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: colors.border.default,
    },
    headerTitle: {
        ...typography.h4,
        color: colors.text.primary,
    },
    closeButton: {
        padding: spacing.xs,
    },
    content: {
        padding: spacing.lg,
    },
    loadingContainer: {
        alignItems: 'center',
        paddingVertical: spacing.xxl,
        gap: spacing.md,
    },
    loadingText: {
        ...typography.body,
        color: colors.text.secondary,
    },
    locationContainer: {
        gap: spacing.lg,
    },
    mapPlaceholder: {
        height: 200,
        backgroundColor: colors.background.elevated,
        borderRadius: borderRadius.lg,
        justifyContent: 'center',
        alignItems: 'center',
        gap: spacing.md,
    },
    coordinatesText: {
        ...typography.caption,
        color: colors.text.secondary,
        fontFamily: 'monospace',
    },
    addressContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: spacing.md,
        backgroundColor: colors.background.elevated,
        borderRadius: borderRadius.md,
        gap: spacing.sm,
    },
    addressText: {
        ...typography.body,
        color: colors.text.primary,
        flex: 1,
    },
    actions: {
        flexDirection: 'row',
        gap: spacing.md,
    },
    button: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.md,
        borderRadius: borderRadius.md,
        gap: spacing.sm,
    },
    buttonPrimary: {
        backgroundColor: colors.accent.primary,
    },
    buttonSecondary: {
        backgroundColor: colors.background.elevated,
    },
    buttonTextPrimary: {
        ...typography.body,
        color: '#FFFFFF',
        fontWeight: '600',
    },
    buttonTextSecondary: {
        ...typography.body,
        color: colors.text.primary,
        fontWeight: '600',
    },
    errorContainer: {
        alignItems: 'center',
        paddingVertical: spacing.xxl,
        gap: spacing.md,
    },
    errorText: {
        ...typography.body,
        color: colors.text.secondary,
    },
    retryButton: {
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.md,
        backgroundColor: colors.accent.primary,
        borderRadius: borderRadius.md,
        marginTop: spacing.md,
    },
    retryButtonText: {
        ...typography.body,
        color: '#FFFFFF',
        fontWeight: '600',
    },
});

export default LocationPicker;
