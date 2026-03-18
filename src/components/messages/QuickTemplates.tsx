import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    FlatList,
    TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '../../theme/colors';

interface QuickTemplatesProps {
    visible: boolean;
    onClose: () => void;
    onSelectTemplate: (message: string) => void;
}

const TEMPLATE_CATEGORIES = [
    {
        name: 'Safety',
        icon: 'shield-checkmark',
        templates: [
            "I'm safe and sound 👍",
            "Reached home safely 🏠",
            "Everything is okay here ✅",
            "I'm with friends, all good 👥",
        ],
    },
    {
        name: 'Daily',
        icon: 'calendar',
        templates: [
            "Good morning! 🌅",
            "Good night! 🌙",
            "On my way home 🚶",
            "Leaving school now 🎒",
            "Homework done ✏️",
        ],
    },
    {
        name: 'Transport',
        icon: 'car',
        templates: [
            "Waiting for the bus 🚌",
            "In the car now 🚗",
            "Walking home 🚶",
            "Got a ride with [friend's parent] 🚙",
        ],
    },
    {
        name: 'Activities',
        icon: 'football',
        templates: [
            "At practice now ⚽",
            "Study group session 📚",
            "At the library 📖",
            "Playing outside 🏃",
        ],
    },
    {
        name: 'Needs',
        icon: 'help-circle',
        templates: [
            "Can you pick me up? 🚗",
            "Need help with homework 📝",
            "Feeling sick 🤒",
            "Forgot my lunch 🍱",
        ],
    },
];

const QuickTemplates: React.FC<QuickTemplatesProps> = ({ visible, onClose, onSelectTemplate }) => {
    const [selectedCategory, setSelectedCategory] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');

    const handleSelectTemplate = (template: string) => {
        onSelectTemplate(template);
        setSearchQuery('');
        onClose();
    };

    // Filter templates based on search
    const filteredTemplates = searchQuery
        ? TEMPLATE_CATEGORIES.flatMap((category) =>
            category.templates.filter((t) =>
                (t || '').toLowerCase().includes((searchQuery || '').toLowerCase())
            )
        )
        : TEMPLATE_CATEGORIES[selectedCategory]?.templates || [];

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={styles.container}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>Quick Messages</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Ionicons name="close" size={24} color={colors.text.secondary} />
                        </TouchableOpacity>
                    </View>

                    {/* Search */}
                    <View style={styles.searchContainer}>
                        <Ionicons name="search" size={20} color={colors.text.tertiary} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search templates..."
                            placeholderTextColor={colors.text.tertiary}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                        {searchQuery.length > 0 && (
                            <TouchableOpacity onPress={() => setSearchQuery('')}>
                                <Ionicons name="close-circle" size={20} color={colors.text.tertiary} />
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Categories */}
                    {!searchQuery && (
                        <View style={styles.categories}>
                            {TEMPLATE_CATEGORIES.map((category, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={[
                                        styles.categoryButton,
                                        selectedCategory === index && styles.categoryButtonActive,
                                    ]}
                                    onPress={() => setSelectedCategory(index)}
                                >
                                    <Ionicons
                                        name={category.icon as any}
                                        size={20}
                                        color={selectedCategory === index ? '#FFFFFF' : colors.text.secondary}
                                    />
                                    <Text
                                        style={[
                                            styles.categoryText,
                                            selectedCategory === index && styles.categoryTextActive,
                                        ]}
                                    >
                                        {category.name}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}

                    {/* Templates List */}
                    <FlatList
                        data={filteredTemplates}
                        keyExtractor={(item, index) => `${item}-${index}`}
                        contentContainerStyle={styles.templatesList}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={styles.templateItem}
                                onPress={() => handleSelectTemplate(item)}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.templateText}>{item}</Text>
                                <Ionicons name="send" size={18} color={colors.accent.primary} />
                            </TouchableOpacity>
                        )}
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <Ionicons name="search-outline" size={48} color={colors.text.tertiary} />
                                <Text style={styles.emptyText}>No templates found</Text>
                            </View>
                        }
                    />
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
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        paddingHorizontal: spacing.lg,
        gap: spacing.sm,
        backgroundColor: colors.background.elevated,
        margin: spacing.md,
        borderRadius: borderRadius.md,
    },
    searchInput: {
        flex: 1,
        ...typography.body,
        color: colors.text.primary,
        padding: 0,
    },
    categories: {
        flexDirection: 'row',
        paddingHorizontal: spacing.md,
        paddingBottom: spacing.md,
        gap: spacing.sm,
        flexWrap: 'wrap',
    },
    categoryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        backgroundColor: colors.background.elevated,
        borderRadius: borderRadius.full,
        gap: spacing.xs,
    },
    categoryButtonActive: {
        backgroundColor: colors.accent.primary,
    },
    categoryText: {
        ...typography.caption,
        color: colors.text.secondary,
        fontWeight: '600',
    },
    categoryTextActive: {
        color: '#FFFFFF',
    },
    templatesList: {
        padding: spacing.md,
    },
    templateItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: spacing.md,
        backgroundColor: colors.background.elevated,
        borderRadius: borderRadius.md,
        marginBottom: spacing.sm,
    },
    templateText: {
        ...typography.body,
        color: colors.text.primary,
        flex: 1,
        marginRight: spacing.md,
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: spacing.xxl,
        gap: spacing.md,
    },
    emptyText: {
        ...typography.body,
        color: colors.text.tertiary,
    },
});

export default QuickTemplates;
