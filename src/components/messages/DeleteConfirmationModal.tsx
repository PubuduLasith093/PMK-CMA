import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '../../theme/colors';

interface DeleteConfirmationModalProps {
    visible: boolean;
    messageContent: string;
    onClose: () => void;
    onConfirm: () => Promise<void>;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
    visible,
    messageContent,
    onClose,
    onConfirm,
}) => {
    const [deleting, setDeleting] = React.useState(false);

    const handleConfirm = async () => {
        setDeleting(true);
        try {
            await onConfirm();
            onClose();
        } catch (error) {
            console.error('[DeleteConfirmationModal] Failed to delete:', error);
        } finally {
            setDeleting(false);
        }
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
                    {/* Icon */}
                    <View style={styles.iconContainer}>
                        <Ionicons name="trash" size={48} color={colors.status.error} />
                    </View>

                    {/* Title */}
                    <Text style={styles.title}>Delete Message?</Text>

                    {/* Message Preview */}
                    <View style={styles.messagePreview}>
                        <Text style={styles.messagePreviewText} numberOfLines={3}>
                            {messageContent}
                        </Text>
                    </View>

                    {/* Warning */}
                    <Text style={styles.warning}>
                        This message will be deleted for everyone. This action cannot be undone.
                    </Text>

                    {/* Actions */}
                    <View style={styles.actions}>
                        <TouchableOpacity
                            style={[styles.button, styles.buttonCancel]}
                            onPress={onClose}
                            disabled={deleting}
                        >
                            <Text style={styles.buttonTextCancel}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.button, styles.buttonDelete]}
                            onPress={handleConfirm}
                            disabled={deleting}
                        >
                            {deleting ? (
                                <ActivityIndicator size="small" color="#FFFFFF" />
                            ) : (
                                <Text style={styles.buttonTextDelete}>Delete</Text>
                            )}
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
        maxWidth: 340,
        backgroundColor: colors.background.tertiary,
        borderRadius: borderRadius.lg,
        padding: spacing.xl,
        alignItems: 'center',
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: colors.overlay.light,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    title: {
        ...typography.h3,
        color: colors.text.primary,
        marginBottom: spacing.md,
    },
    messagePreview: {
        width: '100%',
        backgroundColor: colors.background.elevated,
        padding: spacing.md,
        borderRadius: borderRadius.md,
        marginBottom: spacing.md,
    },
    messagePreviewText: {
        ...typography.body,
        color: colors.text.secondary,
        fontStyle: 'italic',
    },
    warning: {
        ...typography.caption,
        color: colors.text.tertiary,
        textAlign: 'center',
        marginBottom: spacing.lg,
    },
    actions: {
        flexDirection: 'row',
        gap: spacing.md,
        width: '100%',
    },
    button: {
        flex: 1,
        padding: spacing.md,
        borderRadius: borderRadius.md,
        alignItems: 'center',
    },
    buttonCancel: {
        backgroundColor: colors.background.elevated,
    },
    buttonDelete: {
        backgroundColor: colors.status.error,
    },
    buttonTextCancel: {
        ...typography.body,
        color: colors.text.secondary,
        fontWeight: '600',
    },
    buttonTextDelete: {
        ...typography.body,
        color: '#FFFFFF',
        fontWeight: '600',
    },
});

export default DeleteConfirmationModal;
