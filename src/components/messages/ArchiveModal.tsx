import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Thread } from '../../services/api/types';
import { colors, spacing, typography, borderRadius } from '../../theme/colors';

interface ArchiveModalProps {
    visible: boolean;
    thread: Thread | null;
    isArchived: boolean;
    onClose: () => void;
    onConfirm: () => Promise<void>;
}

const ArchiveModal: React.FC<ArchiveModalProps> = ({
    visible,
    thread,
    isArchived,
    onClose,
    onConfirm,
}) => {
    const [loading, setLoading] = useState(false);

    const handleConfirm = async () => {
        setLoading(true);
        try {
            await onConfirm();
            onClose();
        } catch (error) {
            console.error('[ArchiveModal] Failed:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!thread) return null;

    const threadName = thread.threadName || thread.name || 'Unknown';

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={styles.container}>
                    {/* Icon */}
                    <View style={styles.iconContainer}>
                        <Ionicons
                            name={isArchived ? 'arrow-undo' : 'archive'}
                            size={48}
                            color={colors.accent.primary}
                        />
                    </View>

                    {/* Title */}
                    <Text style={styles.title}>
                        {isArchived ? 'Unarchive Conversation?' : 'Archive Conversation?'}
                    </Text>

                    {/* Thread Name */}
                    <View style={styles.threadPreview}>
                        <Text style={styles.threadName} numberOfLines={1}>
                            {threadName}
                        </Text>
                    </View>

                    {/* Description */}
                    <Text style={styles.description}>
                        {isArchived
                            ? 'This conversation will be moved back to your active chats.'
                            : 'This conversation will be hidden from your main chat list. You can find it in archived chats.'}
                    </Text>

                    {/* Actions */}
                    <View style={styles.actions}>
                        <TouchableOpacity
                            style={[styles.button, styles.buttonCancel]}
                            onPress={onClose}
                            disabled={loading}
                        >
                            <Text style={styles.buttonTextCancel}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.button, styles.buttonConfirm]}
                            onPress={handleConfirm}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator size="small" color="#FFFFFF" />
                            ) : (
                                <Text style={styles.buttonTextConfirm}>
                                    {isArchived ? 'Unarchive' : 'Archive'}
                                </Text>
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
    threadPreview: {
        width: '100%',
        backgroundColor: colors.background.elevated,
        padding: spacing.md,
        borderRadius: borderRadius.md,
        marginBottom: spacing.md,
    },
    threadName: {
        ...typography.body,
        color: colors.text.primary,
        fontWeight: '600',
        textAlign: 'center',
    },
    description: {
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
    buttonConfirm: {
        backgroundColor: colors.accent.primary,
    },
    buttonTextCancel: {
        ...typography.body,
        color: colors.text.secondary,
        fontWeight: '600',
    },
    buttonTextConfirm: {
        ...typography.body,
        color: '#FFFFFF',
        fontWeight: '600',
    },
});

export default ArchiveModal;
