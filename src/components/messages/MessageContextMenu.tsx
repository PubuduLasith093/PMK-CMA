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
import { Message } from '../../services/api/types';
import { colors, spacing, typography, borderRadius } from '../../theme/colors';

interface MessageContextMenuProps {
    visible: boolean;
    message: Message | null;
    isOwnMessage: boolean;
    onClose: () => void;
    onReply: () => void;
    onEdit: () => void;
    onDelete: () => void;
    onForward: () => void;
    onCopy: () => void;
    onReact: () => void;
}

const MessageContextMenu: React.FC<MessageContextMenuProps> = ({
    visible,
    message,
    isOwnMessage,
    onClose,
    onReply,
    onEdit,
    onDelete,
    onForward,
    onCopy,
    onReact,
}) => {
    if (!message) return null;

    const menuItems = [
        {
            icon: 'return-down-forward',
            label: 'Reply',
            action: onReply,
            show: true,
        },
        {
            icon: 'happy-outline',
            label: 'React',
            action: onReact,
            show: true,
        },
        {
            icon: 'share-outline',
            label: 'Forward',
            action: onForward,
            show: true,
        },
        {
            icon: 'copy-outline',
            label: 'Copy',
            action: onCopy,
            show: true,
        },
        {
            icon: 'create-outline',
            label: 'Edit',
            action: onEdit,
            show: isOwnMessage && !message.deletedAt,
        },
        {
            icon: 'trash-outline',
            label: 'Delete',
            action: onDelete,
            show: isOwnMessage && !message.deletedAt,
            danger: true,
        },
    ].filter((item) => item.show);

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
                    {/* Message Preview */}
                    <View style={styles.messagePreview}>
                        <Text style={styles.messagePreviewText} numberOfLines={2}>
                            {message.content}
                        </Text>
                    </View>

                    {/* Menu Items */}
                    <View style={styles.menuItems}>
                        {menuItems.map((item, index) => (
                            <TouchableOpacity
                                key={index}
                                style={[
                                    styles.menuItem,
                                    index !== menuItems.length - 1 && styles.menuItemBorder,
                                ]}
                                onPress={() => {
                                    item.action();
                                    onClose();
                                }}
                                activeOpacity={0.7}
                            >
                                <Ionicons
                                    name={item.icon as any}
                                    size={22}
                                    color={item.danger ? colors.status.error : colors.accent.primary}
                                />
                                <Text
                                    style={[
                                        styles.menuItemText,
                                        item.danger && styles.menuItemTextDanger,
                                    ]}
                                >
                                    {item.label}
                                </Text>
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
        maxWidth: 320,
    },
    messagePreview: {
        backgroundColor: colors.background.elevated,
        padding: spacing.md,
        borderRadius: borderRadius.lg,
        marginBottom: spacing.md,
    },
    messagePreviewText: {
        ...typography.body,
        color: colors.text.secondary,
        fontStyle: 'italic',
    },
    menuItems: {
        backgroundColor: colors.background.tertiary,
        borderRadius: borderRadius.lg,
        overflow: 'hidden',
        marginBottom: spacing.md,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.lg,
        gap: spacing.md,
    },
    menuItemBorder: {
        borderBottomWidth: 1,
        borderBottomColor: colors.border.default,
    },
    menuItemText: {
        ...typography.body,
        color: colors.text.primary,
        fontWeight: '600',
    },
    menuItemTextDanger: {
        color: colors.status.error,
    },
    cancelButton: {
        backgroundColor: colors.background.tertiary,
        padding: spacing.lg,
        borderRadius: borderRadius.lg,
        alignItems: 'center',
    },
    cancelButtonText: {
        ...typography.body,
        color: colors.text.secondary,
        fontWeight: '600',
    },
});

export default MessageContextMenu;
