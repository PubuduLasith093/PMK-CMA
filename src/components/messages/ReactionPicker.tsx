import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Pressable } from 'react-native';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme/colors';

interface ReactionPickerProps {
    visible: boolean;
    onClose: () => void;
    onSelectReaction: (emoji: string) => void;
}

const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏', '🔥', '👏'];

const ReactionPicker: React.FC<ReactionPickerProps> = ({
    visible,
    onClose,
    onSelectReaction,
}) => {
    const handleSelect = (emoji: string) => {
        onSelectReaction(emoji);
        onClose();
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <Pressable style={styles.overlay} onPress={onClose}>
                <Pressable style={styles.container} onPress={(e) => e.stopPropagation()}>
                    <Text style={styles.title}>React to message</Text>
                    <View style={styles.reactionsGrid}>
                        {QUICK_REACTIONS.map((emoji) => (
                            <TouchableOpacity
                                key={emoji}
                                style={styles.reactionButton}
                                onPress={() => handleSelect(emoji)}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.reactionEmoji}>{emoji}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </Pressable>
            </Pressable>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: {
        backgroundColor: colors.background.elevated,
        borderRadius: borderRadius.xl,
        padding: spacing.lg,
        width: '80%',
        maxWidth: 320,
        ...shadows.lg,
    },
    title: {
        ...typography.h4,
        color: colors.text.primary,
        marginBottom: spacing.md,
        textAlign: 'center',
    },
    reactionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: spacing.sm,
    },
    reactionButton: {
        width: 60,
        height: 60,
        borderRadius: borderRadius.md,
        backgroundColor: colors.background.tertiary,
        justifyContent: 'center',
        alignItems: 'center',
        ...shadows.sm,
    },
    reactionEmoji: {
        fontSize: 32,
    },
});

export default ReactionPicker;
