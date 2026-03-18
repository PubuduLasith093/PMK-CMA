import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { colors, spacing, typography, borderRadius } from '../../theme/colors';

// Detect if running in Expo Go or production build
const isExpoGo = Constants.appOwnership === 'expo';

interface AttachmentSelectorProps {
    visible: boolean;
    onClose: () => void;
    onSelectImage: () => void;
    onSelectDocument: () => void;
    onSelectLocation: () => void;
}

const AttachmentSelector: React.FC<AttachmentSelectorProps> = ({
    visible,
    onClose,
    onSelectImage,
    onSelectDocument,
    onSelectLocation,
}) => {
    const attachmentOptions = [
        {
            icon: 'image',
            label: 'Photo/Video',
            description: isExpoGo ? 'Share media (one at a time)' : 'Share photos and videos',
            color: '#E85D4A',
            action: () => {
                onClose();
                setTimeout(onSelectImage, 300);
            },
        },
        {
            icon: 'document-text',
            label: 'Document',
            description: isExpoGo ? 'Share a file (one at a time)' : 'Share files and documents',
            color: '#4A90E2',
            action: () => {
                onClose();
                setTimeout(onSelectDocument, 300);
            },
        },
        {
            icon: 'location',
            label: 'Location',
            description: 'Share your location',
            color: '#50C878',
            action: () => {
                onClose();
                setTimeout(onSelectLocation, 300);
            },
        },
    ];

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <TouchableOpacity
                style={styles.overlay}
                activeOpacity={1}
                onPress={onClose}
            >
                <View style={styles.container}>
                    <View style={styles.content}>
                        {/* Header */}
                        <View style={styles.header}>
                            <Text style={styles.headerTitle}>Share</Text>
                        </View>

                        {/* Options - Horizontal Row */}
                        <View style={styles.optionsRow}>
                            {attachmentOptions.map((option, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={styles.optionButton}
                                    onPress={option.action}
                                    activeOpacity={0.7}
                                >
                                    <View style={[styles.optionIconCircle, { backgroundColor: option.color }]}>
                                        <Ionicons name={option.icon as any} size={28} color="#FFFFFF" />
                                    </View>
                                    <Text style={styles.optionLabel}>{option.label}</Text>
                                    <Text style={styles.optionDescription} numberOfLines={1}>{option.description}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Cancel Button */}
                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={onClose}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </TouchableOpacity>
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
        maxWidth: 360,
    },
    content: {
        backgroundColor: colors.background.tertiary,
        borderRadius: borderRadius.xl,
        overflow: 'hidden',
    },
    header: {
        padding: spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: colors.border.default,
    },
    headerTitle: {
        ...typography.h4,
        color: colors.text.primary,
        textAlign: 'center',
    },
    optionsRow: {
        flexDirection: 'row',
        padding: spacing.lg,
        paddingTop: spacing.md,
        gap: spacing.sm,
        justifyContent: 'space-between',
    },
    optionButton: {
        flex: 1,
        alignItems: 'center',
        padding: spacing.md,
        backgroundColor: colors.background.elevated,
        borderRadius: borderRadius.lg,
        gap: spacing.xs,
    },
    optionIconCircle: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.xs,
    },
    optionLabel: {
        ...typography.body,
        fontSize: 13,
        color: colors.text.primary,
        fontWeight: '600',
        textAlign: 'center',
    },
    optionDescription: {
        ...typography.caption,
        fontSize: 10,
        color: colors.text.tertiary,
        textAlign: 'center',
    },
    cancelButton: {
        padding: spacing.lg,
        borderTopWidth: 1,
        borderTopColor: colors.border.default,
        alignItems: 'center',
    },
    cancelButtonText: {
        ...typography.body,
        color: colors.text.secondary,
        fontWeight: '600',
    },
});

export default AttachmentSelector;
