import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Thread } from '../../services/api/types';
import { colors, spacing, typography, borderRadius } from '../../theme/colors';

interface ForwardModalProps {
    visible: boolean;
    threads: Thread[];
    onClose: () => void;
    onForward: (threadIds: string[]) => Promise<void>;
}

const ForwardModal: React.FC<ForwardModalProps> = ({
    visible,
    threads,
    onClose,
    onForward,
}) => {
    const [selectedThreads, setSelectedThreads] = useState<Set<string>>(new Set());
    const [forwarding, setForwarding] = useState(false);

    const toggleThread = (threadId: string) => {
        setSelectedThreads((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(threadId)) {
                newSet.delete(threadId);
            } else {
                newSet.add(threadId);
            }
            return newSet;
        });
    };

    const handleForward = async () => {
        if (selectedThreads.size === 0) return;

        setForwarding(true);
        try {
            await onForward(Array.from(selectedThreads));
            setSelectedThreads(new Set());
            onClose();
        } catch (error) {
            console.error('[ForwardModal] Failed to forward:', error);
        } finally {
            setForwarding(false);
        }
    };

    const handleClose = () => {
        setSelectedThreads(new Set());
        onClose();
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={handleClose}
        >
            <View style={styles.overlay}>
                <View style={styles.container}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>Forward Message</Text>
                        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                            <Ionicons name="close" size={24} color={colors.text.secondary} />
                        </TouchableOpacity>
                    </View>

                    {/* Thread List */}
                    <FlatList
                        data={threads}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={styles.listContent}
                        renderItem={({ item }) => {
                            const isSelected = selectedThreads.has(item.id);
                            const threadName = item.threadName || item.name || 'Unknown';

                            return (
                                <TouchableOpacity
                                    style={[styles.threadItem, isSelected && styles.threadItemSelected]}
                                    onPress={() => toggleThread(item.id)}
                                    activeOpacity={0.7}
                                >
                                    <View style={styles.threadInfo}>
                                        <View style={styles.avatar}>
                                            <Ionicons
                                                name={item.isGroup ? 'people' : 'person'}
                                                size={20}
                                                color={colors.accent.primary}
                                            />
                                        </View>
                                        <Text style={styles.threadName}>{threadName}</Text>
                                    </View>
                                    <View
                                        style={[styles.checkbox, isSelected && styles.checkboxSelected]}
                                    >
                                        {isSelected && (
                                            <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                                        )}
                                    </View>
                                </TouchableOpacity>
                            );
                        }}
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <Text style={styles.emptyText}>No conversations available</Text>
                            </View>
                        }
                    />

                    {/* Footer */}
                    <View style={styles.footer}>
                        <Text style={styles.selectedCount}>
                            {selectedThreads.size} selected
                        </Text>
                        <TouchableOpacity
                            style={[
                                styles.forwardButton,
                                selectedThreads.size === 0 && styles.forwardButtonDisabled,
                            ]}
                            onPress={handleForward}
                            disabled={selectedThreads.size === 0 || forwarding}
                        >
                            {forwarding ? (
                                <ActivityIndicator size="small" color="#FFFFFF" />
                            ) : (
                                <Text style={styles.forwardButtonText}>Forward</Text>
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
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    container: {
        backgroundColor: colors.background.tertiary,
        borderTopLeftRadius: borderRadius.xl,
        borderTopRightRadius: borderRadius.xl,
        maxHeight: '80%',
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
    listContent: {
        padding: spacing.md,
    },
    threadItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: spacing.md,
        backgroundColor: colors.background.elevated,
        borderRadius: borderRadius.md,
        marginBottom: spacing.sm,
    },
    threadItemSelected: {
        backgroundColor: colors.overlay.light,
        borderWidth: 1,
        borderColor: colors.accent.primary,
    },
    threadInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: spacing.md,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.background.tertiary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    threadName: {
        ...typography.body,
        color: colors.text.primary,
        flex: 1,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: colors.border.light,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxSelected: {
        backgroundColor: colors.accent.primary,
        borderColor: colors.accent.primary,
    },
    emptyContainer: {
        padding: spacing.xl,
        alignItems: 'center',
    },
    emptyText: {
        ...typography.body,
        color: colors.text.tertiary,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: spacing.lg,
        borderTopWidth: 1,
        borderTopColor: colors.border.default,
    },
    selectedCount: {
        ...typography.body,
        color: colors.text.secondary,
    },
    forwardButton: {
        backgroundColor: colors.accent.primary,
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.md,
        minWidth: 100,
        alignItems: 'center',
    },
    forwardButtonDisabled: {
        backgroundColor: colors.background.elevated,
    },
    forwardButtonText: {
        ...typography.body,
        color: '#FFFFFF',
        fontWeight: '600',
    },
});

export default ForwardModal;
