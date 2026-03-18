import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MessageAttachment } from '../../services/api/types';
import { colors, spacing, typography, borderRadius } from '../../theme/colors';

interface AttachmentPreviewProps {
    attachment: MessageAttachment;
    onPress?: () => void;
}

const AttachmentPreview: React.FC<AttachmentPreviewProps> = ({ attachment, onPress }) => {
    const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const getFileIcon = (fileType: string): string => {
        if (!fileType) return 'document-attach';
        const lowerType = fileType.toLowerCase();
        if (lowerType.includes('pdf')) return 'document-text';
        if (lowerType.includes('word') || lowerType.includes('document')) return 'document';
        if (lowerType.includes('excel') || lowerType.includes('spreadsheet')) return 'grid';
        if (lowerType.includes('powerpoint') || lowerType.includes('presentation')) return 'easel';
        if (lowerType.includes('zip') || lowerType.includes('rar')) return 'archive';
        if (lowerType.includes('audio')) return 'musical-notes';
        if (lowerType.includes('video')) return 'videocam';
        if (lowerType.includes('location')) return 'location';
        return 'document-attach';
    };

    // Check if this is a location attachment (stored in metadata)
    const isLocation = attachment.metadata &&
        attachment.metadata.latitude !== undefined &&
        attachment.metadata.longitude !== undefined;

    const isImage = attachment.fileType?.startsWith('image/') || false;
    const isVideo = attachment.fileType?.startsWith('video/') || false;

    // Handle location display
    if (isLocation) {
        const { latitude, longitude, address, name } = attachment.metadata;
        const googleMapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
        const appleMapsUrl = `http://maps.apple.com/?ll=${latitude},${longitude}`;

        return (
            <TouchableOpacity
                style={styles.locationContainer}
                onPress={() => {
                    if (onPress) {
                        onPress();
                    } else {
                        Linking.openURL(googleMapsUrl);
                    }
                }}
                activeOpacity={0.7}
            >
                <View style={styles.locationIcon}>
                    <Ionicons name="location" size={32} color={colors.accent.primary} />
                </View>
                <View style={styles.locationInfo}>
                    <Text style={styles.locationName} numberOfLines={1}>
                        {name || 'Shared Location'}
                    </Text>
                    <Text style={styles.locationAddress} numberOfLines={2}>
                        {address || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`}
                    </Text>
                    <TouchableOpacity
                        onPress={() => Linking.openURL(googleMapsUrl)}
                        style={styles.viewMapButton}
                    >
                        <Ionicons name="map-outline" size={14} color={colors.accent.primary} />
                        <Text style={styles.viewMapText}>Open in Maps</Text>
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        );
    }

    if (isImage) {
        return (
            <TouchableOpacity style={styles.imageContainer} onPress={onPress} activeOpacity={0.8}>
                <Image
                    source={{ uri: attachment.thumbnailUrl || attachment.url }}
                    style={styles.image}
                    resizeMode="cover"
                />
                {attachment.thumbnailUrl && (
                    <View style={styles.imageOverlay}>
                        <Ionicons name="expand" size={20} color="#FFFFFF" />
                    </View>
                )}
            </TouchableOpacity>
        );
    }

    if (isVideo) {
        return (
            <TouchableOpacity style={styles.videoContainer} onPress={onPress} activeOpacity={0.8}>
                {attachment.thumbnailUrl && (
                    <Image
                        source={{ uri: attachment.thumbnailUrl }}
                        style={styles.videoThumbnail}
                        resizeMode="cover"
                    />
                )}
                <View style={styles.videoOverlay}>
                    <View style={styles.playButton}>
                        <Ionicons name="play" size={32} color="#FFFFFF" />
                    </View>
                </View>
            </TouchableOpacity>
        );
    }

    // Document/File
    return (
        <TouchableOpacity
            style={styles.documentContainer}
            onPress={() => {
                if (onPress) {
                    onPress();
                } else {
                    Linking.openURL(attachment.url);
                }
            }}
            activeOpacity={0.7}
        >
            <View style={styles.documentIcon}>
                <Ionicons name={getFileIcon(attachment.fileType) as any} size={32} color={colors.accent.primary} />
            </View>
            <View style={styles.documentInfo}>
                <Text style={styles.documentName} numberOfLines={1}>
                    {attachment.fileName}
                </Text>
                <Text style={styles.documentSize}>{formatFileSize(attachment.fileSize)}</Text>
            </View>
            <Ionicons name="download-outline" size={20} color={colors.text.tertiary} />
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    imageContainer: {
        width: 200,
        height: 200,
        borderRadius: borderRadius.md,
        overflow: 'hidden',
        position: 'relative',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    imageOverlay: {
        position: 'absolute',
        bottom: spacing.sm,
        right: spacing.sm,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        borderRadius: borderRadius.sm,
        padding: spacing.xs,
    },
    videoContainer: {
        width: 200,
        height: 200,
        borderRadius: borderRadius.md,
        overflow: 'hidden',
        position: 'relative',
        backgroundColor: colors.background.elevated,
    },
    videoThumbnail: {
        width: '100%',
        height: '100%',
    },
    videoOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
    },
    playButton: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: colors.accent.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    documentContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        backgroundColor: colors.background.elevated,
        borderRadius: borderRadius.md,
        gap: spacing.md,
        maxWidth: 280,
    },
    documentIcon: {
        width: 48,
        height: 48,
        borderRadius: borderRadius.sm,
        backgroundColor: colors.background.tertiary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    documentInfo: {
        flex: 1,
    },
    documentName: {
        ...typography.body,
        color: colors.text.primary,
        fontWeight: '600',
        marginBottom: spacing.xs,
    },
    documentSize: {
        ...typography.caption,
        color: colors.text.secondary,
    },
    locationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        backgroundColor: colors.background.elevated,
        borderRadius: borderRadius.md,
        gap: spacing.md,
        maxWidth: 280,
    },
    locationIcon: {
        width: 48,
        height: 48,
        borderRadius: borderRadius.sm,
        backgroundColor: colors.background.secondary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    locationInfo: {
        flex: 1,
    },
    locationName: {
        ...typography.body,
        color: colors.text.primary,
        fontWeight: '600',
        marginBottom: spacing.xs - 2,
    },
    locationAddress: {
        ...typography.small,
        color: colors.text.secondary,
        lineHeight: 18,
        marginBottom: spacing.xs,
    },
    viewMapButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs - 2,
    },
    viewMapText: {
        ...typography.small,
        color: colors.accent.primary,
        fontWeight: '600',
    },
});

export default AttachmentPreview;
