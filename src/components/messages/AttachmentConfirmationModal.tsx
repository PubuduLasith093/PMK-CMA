import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    Image,
    ScrollView,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme/colors';

interface AttachmentItem {
    uri: string;
    type: string;
    name: string;
    size?: number;
}

interface AttachmentConfirmationModalProps {
    visible: boolean;
    attachments: AttachmentItem[];
    onConfirm: () => void;
    onCancel: () => void;
    uploading?: boolean;
}

const AttachmentConfirmationModal: React.FC<AttachmentConfirmationModalProps> = ({
    visible,
    attachments,
    onConfirm,
    onCancel,
    uploading = false,
}) => {
    const formatFileSize = (bytes?: number) => {
        if (!bytes) return 'Unknown size';
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const getFileIcon = (type: string) => {
        if (type.includes('image')) return 'image';
        if (type.includes('video')) return 'videocam';
        if (type.includes('pdf')) return 'document-text';
        if (type.includes('audio')) return 'musical-notes';
        return 'document';
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onCancel}
        >
            <View style={styles.overlay}>
                <View style={styles.container}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>
                            {uploading ? 'Uploading...' : 'Send Attachments'}
                        </Text>
                        <Text style={styles.headerSubtitle}>
                            {attachments.length} {attachments.length === 1 ? 'file' : 'files'} selected
                        </Text>
                    </View>

                    {/* Attachments Preview */}
                    <ScrollView
                        style={styles.scrollView}
                        contentContainerStyle={styles.attachmentsList}
                        showsVerticalScrollIndicator={false}
                    >
                        {attachments.map((attachment, index) => (
                            <View key={index} style={styles.attachmentItem}>
                                {/* Preview */}
                                <View style={styles.attachmentPreview}>
                                    {attachment.type === 'image' || attachment.type.includes('image') ? (
                                        <Image
                                            source={{ uri: attachment.uri }}
                                            style={styles.previewImage}
                                            resizeMode="cover"
                                        />
                                    ) : (
                                        <View style={styles.previewIconContainer}>
                                            <Ionicons
                                                name={getFileIcon(attachment.type) as any}
                                                size={32}
                                                color={colors.accent.primary}
                                            />
                                        </View>
                                    )}
                                </View>

                                {/* Info */}
                                <View style={styles.attachmentInfo}>
                                    <Text style={styles.attachmentName} numberOfLines={2}>
                                        {attachment.name}
                                    </Text>
                                    <Text style={styles.attachmentSize}>
                                        {formatFileSize(attachment.size)}
                                    </Text>
                                </View>
                            </View>
                        ))}
                    </ScrollView>

                    {/* Action Buttons */}
                    {uploading ? (
                        <View style={styles.uploadingContainer}>
                            <ActivityIndicator size="large" color={colors.accent.primary} />
                            <Text style={styles.uploadingText}>Uploading files...</Text>
                        </View>
                    ) : (
                        <View style={styles.actions}>
                            <TouchableOpacity
                                style={[styles.button, styles.cancelButton]}
                                onPress={onCancel}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.button, styles.confirmButton]}
                                onPress={onConfirm}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="send" size={18} color="#FFFFFF" />
                                <Text style={styles.confirmButtonText}>Send</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xl,
    },
    container: {
        width: '100%',
        maxWidth: 400,
        maxHeight: '80%',
        backgroundColor: colors.background.tertiary,
        borderRadius: borderRadius.xl,
        overflow: 'hidden',
        ...shadows.xl,
    },
    header: {
        padding: spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: colors.border.default,
        backgroundColor: colors.background.elevated,
    },
    headerTitle: {
        ...typography.h4,
        color: colors.text.primary,
        marginBottom: spacing.xs,
    },
    headerSubtitle: {
        ...typography.caption,
        color: colors.text.secondary,
    },
    scrollView: {
        maxHeight: 400,
    },
    attachmentsList: {
        padding: spacing.md,
        gap: spacing.md,
    },
    attachmentItem: {
        flexDirection: 'row',
        backgroundColor: colors.background.elevated,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        gap: spacing.md,
        ...shadows.sm,
    },
    attachmentPreview: {
        width: 60,
        height: 60,
        borderRadius: borderRadius.md,
        overflow: 'hidden',
        backgroundColor: colors.background.tertiary,
    },
    previewImage: {
        width: '100%',
        height: '100%',
    },
    previewIconContainer: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background.secondary,
    },
    attachmentInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    attachmentName: {
        ...typography.body,
        color: colors.text.primary,
        fontWeight: '600',
        marginBottom: spacing.xs,
    },
    attachmentSize: {
        ...typography.small,
        color: colors.text.tertiary,
    },
    uploadingContainer: {
        padding: spacing.xl,
        alignItems: 'center',
        gap: spacing.md,
    },
    uploadingText: {
        ...typography.body,
        color: colors.text.secondary,
    },
    actions: {
        flexDirection: 'row',
        padding: spacing.md,
        gap: spacing.md,
        borderTopWidth: 1,
        borderTopColor: colors.border.default,
    },
    button: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.md,
        borderRadius: borderRadius.lg,
        gap: spacing.xs,
    },
    cancelButton: {
        backgroundColor: colors.background.elevated,
        borderWidth: 1,
        borderColor: colors.border.default,
    },
    cancelButtonText: {
        ...typography.body,
        color: colors.text.secondary,
        fontWeight: '600',
    },
    confirmButton: {
        backgroundColor: colors.accent.primary,
    },
    confirmButtonText: {
        ...typography.body,
        color: '#FFFFFF',
        fontWeight: '600',
    },
});

export default AttachmentConfirmationModal;
