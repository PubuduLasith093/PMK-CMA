import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme/colors';

interface LocationConfirmationModalProps {
    visible: boolean;
    onClose: () => void;
    onSend: () => void;
    location: {
        latitude: number;
        longitude: number;
        address: string;
        name?: string;
    } | null;
}

const LocationConfirmationModal: React.FC<LocationConfirmationModalProps> = ({
    visible,
    onClose,
    onSend,
    location,
}) => {
    if (!location) return null;

    const googleMapsUrl = `https://www.google.com/maps?q=${location.latitude},${location.longitude}`;

    const handleSend = () => {
        onSend();
        onClose();
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.container}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>Confirm Location</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Ionicons name="close" size={24} color={colors.text.primary} />
                        </TouchableOpacity>
                    </View>

                    {/* Location Preview */}
                    <View style={styles.previewContainer}>
                        <View style={styles.locationIcon}>
                            <Ionicons name="location" size={48} color={colors.accent.primary} />
                        </View>

                        <Text style={styles.locationName} numberOfLines={2}>
                            {location.name || 'Selected Location'}
                        </Text>

                        <Text style={styles.locationAddress} numberOfLines={3}>
                            {location.address}
                        </Text>

                        <View style={styles.coordinatesContainer}>
                            <Ionicons name="navigate-outline" size={16} color={colors.text.tertiary} />
                            <Text style={styles.coordinates}>
                                {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                            </Text>
                        </View>

                        {/* View on Map Button */}
                        <TouchableOpacity
                            style={styles.viewMapButton}
                            onPress={() => Linking.openURL(googleMapsUrl)}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="map-outline" size={18} color={colors.accent.primary} />
                            <Text style={styles.viewMapText}>View on Google Maps</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.actionsContainer}>
                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={onClose}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.sendButton}
                            onPress={handleSend}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="send" size={18} color="#FFFFFF" />
                            <Text style={styles.sendButtonText}>Send Location</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xl,
    },
    container: {
        width: '100%',
        maxWidth: 400,
        backgroundColor: colors.background.elevated,
        borderRadius: borderRadius.xl,
        overflow: 'hidden',
        ...shadows.lg,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
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
    previewContainer: {
        padding: spacing.xl,
        alignItems: 'center',
    },
    locationIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: colors.background.secondary,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    locationName: {
        ...typography.h3,
        color: colors.text.primary,
        textAlign: 'center',
        marginBottom: spacing.sm,
    },
    locationAddress: {
        ...typography.body,
        color: colors.text.secondary,
        textAlign: 'center',
        marginBottom: spacing.md,
        lineHeight: 20,
    },
    coordinatesContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        marginBottom: spacing.lg,
    },
    coordinates: {
        ...typography.caption,
        color: colors.text.tertiary,
    },
    viewMapButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        backgroundColor: colors.background.tertiary,
        borderRadius: borderRadius.md,
    },
    viewMapText: {
        ...typography.small,
        color: colors.accent.primary,
        fontWeight: '600',
    },
    actionsContainer: {
        flexDirection: 'row',
        padding: spacing.lg,
        gap: spacing.md,
        borderTopWidth: 1,
        borderTopColor: colors.border.default,
    },
    cancelButton: {
        flex: 1,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        backgroundColor: colors.background.secondary,
        borderRadius: borderRadius.lg,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelButtonText: {
        ...typography.body,
        color: colors.text.primary,
        fontWeight: '600',
    },
    sendButton: {
        flex: 1,
        flexDirection: 'row',
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        backgroundColor: colors.accent.primary,
        borderRadius: borderRadius.lg,
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
    },
    sendButtonText: {
        ...typography.body,
        color: '#FFFFFF',
        fontWeight: '600',
    },
});

export default LocationConfirmationModal;
