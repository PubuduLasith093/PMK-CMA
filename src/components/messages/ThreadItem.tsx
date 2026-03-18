import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Thread } from '../../services/api/types';
import { colors, spacing, typography, borderRadius } from '../../theme/colors';

interface ThreadItemProps {
    thread: Thread;
    isSelected: boolean;
    onSelect: () => void;
}

const ThreadItem: React.FC<ThreadItemProps> = ({ thread, isSelected, onSelect }) => {
    // Get thread name
    const threadName = thread.threadName || thread.name || 'Unknown';

    // Get last message preview
    const lastMessagePreview = thread.lastMessage
        ? thread.lastMessage.content.substring(0, 50) + (thread.lastMessage.content.length > 50 ? '...' : '')
        : 'No messages yet';

    // Format timestamp
    const formatTimestamp = (dateString?: string) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m`;
        if (diffHours < 24) return `${diffHours}h`;
        if (diffDays < 7) return `${diffDays}d`;
        return date.toLocaleDateString();
    };

    const timestamp = formatTimestamp(thread.lastMessageAt || thread.updatedAt);

    // Get unread count
    const unreadCount = thread.unreadCount || 0;

    // Check if online (placeholder - will be implemented with real online status)
    const isOnline = false;

    return (
        <TouchableOpacity
            style={[styles.container, isSelected && styles.containerSelected]}
            onPress={onSelect}
            activeOpacity={0.7}
        >
            {/* Avatar */}
            <View style={styles.avatarContainer}>
                <View style={styles.avatar}>
                    <Ionicons
                        name={thread.isGroup ? 'people' : 'person'}
                        size={24}
                        color={colors.accent.primary}
                    />
                </View>
                {isOnline && <View style={styles.onlineIndicator} />}
            </View>

            {/* Content */}
            <View style={styles.content}>
                <View style={styles.header}>
                    <Text style={styles.name} numberOfLines={1}>
                        {threadName}
                    </Text>
                    {timestamp && <Text style={styles.timestamp}>{timestamp}</Text>}
                </View>
                <View style={styles.messageRow}>
                    <Text style={styles.lastMessage} numberOfLines={1}>
                        {lastMessagePreview}
                    </Text>
                    {unreadCount > 0 && (
                        <View style={styles.unreadBadge}>
                            <Text style={styles.unreadText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
                        </View>
                    )}
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        borderBottomWidth: 0.5,
        borderBottomColor: colors.border.default,
        backgroundColor: 'transparent',
    },
    containerSelected: {
        backgroundColor: colors.background.elevated,
    },
    avatarContainer: {
        position: 'relative',
        marginRight: spacing.md,
    },
    avatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: colors.background.elevated,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: colors.accent.primary,
    },
    onlineIndicator: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: colors.accent.success,
        borderWidth: 2,
        borderColor: colors.background.primary,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.xs,
    },
    name: {
        ...typography.body,
        fontSize: 17,
        color: colors.text.primary,
        fontWeight: '600',
        flex: 1,
        marginRight: spacing.sm,
    },
    timestamp: {
        ...typography.small,
        fontSize: 13,
        color: colors.text.tertiary,
    },
    messageRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    lastMessage: {
        ...typography.caption,
        fontSize: 15,
        color: colors.text.secondary,
        flex: 1,
        marginRight: spacing.sm,
    },
    unreadBadge: {
        backgroundColor: colors.accent.primary,
        borderRadius: borderRadius.full,
        minWidth: 22,
        height: 22,
        paddingHorizontal: spacing.xs,
        justifyContent: 'center',
        alignItems: 'center',
    },
    unreadText: {
        ...typography.small,
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 12,
    },
});

export default ThreadItem;
