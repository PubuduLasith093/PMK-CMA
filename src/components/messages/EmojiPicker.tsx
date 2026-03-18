import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    FlatList,
    Dimensions,
} from 'react-native';
import { colors, spacing, typography, borderRadius } from '../../theme/colors';

interface EmojiPickerProps {
    visible: boolean;
    onClose: () => void;
    onSelectEmoji: (emoji: string) => void;
}

const EMOJI_CATEGORIES = [
    {
        name: 'Smileys',
        emojis: ['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳'],
    },
    {
        name: 'Gestures',
        emojis: ['👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '👇', '☝️', '✋', '🤚', '🖐️', '🖖', '👋', '🤝', '👏', '🙌', '👐', '🤲', '🙏', '✍️', '💪'],
    },
    {
        name: 'Hearts',
        emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟'],
    },
    {
        name: 'Objects',
        emojis: ['🎉', '🎊', '🎈', '🎁', '🏆', '🥇', '🥈', '🥉', '⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🏉', '🎱', '🎮', '🎯', '🎲', '🎰', '🎳'],
    },
];

const EmojiPicker: React.FC<EmojiPickerProps> = ({ visible, onClose, onSelectEmoji }) => {
    const [selectedCategory, setSelectedCategory] = React.useState(0);

    const handleEmojiSelect = (emoji: string) => {
        onSelectEmoji(emoji);
        onClose();
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <TouchableOpacity
                style={styles.overlay}
                activeOpacity={1}
                onPress={onClose}
            >
                <TouchableOpacity
                    activeOpacity={1}
                    style={styles.container}
                    onPress={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>Select Emoji</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Text style={styles.closeButtonText}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Category Tabs */}
                    <View style={styles.categoryTabs}>
                        {EMOJI_CATEGORIES.map((category, index) => (
                            <TouchableOpacity
                                key={index}
                                style={[
                                    styles.categoryTab,
                                    selectedCategory === index && styles.categoryTabActive,
                                ]}
                                onPress={() => setSelectedCategory(index)}
                            >
                                <Text
                                    style={[
                                        styles.categoryTabText,
                                        selectedCategory === index && styles.categoryTabTextActive,
                                    ]}
                                >
                                    {category.name}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Emoji Grid */}
                    <FlatList
                        data={EMOJI_CATEGORIES[selectedCategory].emojis}
                        keyExtractor={(item, index) => `${item}-${index}`}
                        numColumns={6}
                        contentContainerStyle={styles.emojiGrid}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={styles.emojiButton}
                                onPress={() => handleEmojiSelect(item)}
                            >
                                <Text style={styles.emoji}>{item}</Text>
                            </TouchableOpacity>
                        )}
                    />
                </TouchableOpacity>
            </TouchableOpacity>
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
        maxHeight: Dimensions.get('window').height * 0.6,
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
    closeButtonText: {
        ...typography.h3,
        color: colors.text.secondary,
    },
    categoryTabs: {
        flexDirection: 'row',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: colors.border.default,
    },
    categoryTab: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        marginRight: spacing.sm,
        borderRadius: borderRadius.md,
    },
    categoryTabActive: {
        backgroundColor: colors.accent.primary,
    },
    categoryTabText: {
        ...typography.caption,
        color: colors.text.secondary,
        fontWeight: '600',
    },
    categoryTabTextActive: {
        color: '#FFFFFF',
    },
    emojiGrid: {
        padding: spacing.md,
    },
    emojiButton: {
        width: Dimensions.get('window').width / 6 - spacing.md,
        aspectRatio: 1,
        justifyContent: 'center',
        alignItems: 'center',
        margin: spacing.xs,
    },
    emoji: {
        fontSize: 32,
    },
});

export default EmojiPicker;
