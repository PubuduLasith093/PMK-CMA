import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TextInput,
    TouchableOpacity,
    RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Thread } from '../../services/api/types';
import { colors, spacing, typography, borderRadius } from '../../theme/colors';
import ThreadItem from './ThreadItem';

interface ThreadListProps {
    threads: Thread[];
    selectedThread: Thread | null;
    onThreadSelect: (thread: Thread) => void;
    searchTerm: string;
    onSearchChange: (term: string) => void;
    showArchivedChats: boolean;
    onToggleArchive: () => void;
    archivedCount: number;
    activeCount: number;
}

const ThreadList: React.FC<ThreadListProps> = ({
    threads,
    selectedThread,
    onThreadSelect,
    searchTerm,
    onSearchChange,
    showArchivedChats,
    onToggleArchive,
    archivedCount,
    activeCount,
}) => {
    const [refreshing, setRefreshing] = React.useState(false);

    const onRefresh = async () => {
        setRefreshing(true);
        // Refresh will be handled by parent component
        setTimeout(() => setRefreshing(false), 1000);
    };

    return (
        <View style={styles.container}>
            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <View style={styles.searchInputContainer}>
                    <Ionicons name="search" size={20} color={colors.text.tertiary} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search conversations..."
                        placeholderTextColor={colors.text.tertiary}
                        value={searchTerm}
                        onChangeText={onSearchChange}
                    />
                    {searchTerm.length > 0 && (
                        <TouchableOpacity onPress={() => onSearchChange('')}>
                            <Ionicons name="close-circle" size={20} color={colors.text.tertiary} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Archive Toggle */}
            <View style={styles.archiveToggleContainer}>
                <TouchableOpacity style={styles.archiveToggle} onPress={onToggleArchive} activeOpacity={0.7}>
                    <Ionicons
                        name={showArchivedChats ? 'chatbubbles' : 'archive'}
                        size={18}
                        color={colors.accent.primary}
                    />
                    <Text style={styles.archiveToggleText}>
                        {showArchivedChats ? `Active (${activeCount})` : `Archived (${archivedCount})`}
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Thread List */}
            <FlatList
                data={threads}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <ThreadItem
                        thread={item}
                        isSelected={selectedThread?.id === item.id}
                        onSelect={() => onThreadSelect(item)}
                    />
                )}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={colors.accent.primary}
                        colors={[colors.accent.primary]}
                    />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="chatbubbles-outline" size={48} color={colors.text.tertiary} />
                        <Text style={styles.emptyText}>
                            {showArchivedChats ? 'No archived conversations' : 'No conversations yet'}
                        </Text>
                        <Text style={styles.emptySubtext}>
                            {showArchivedChats
                                ? 'Archived chats will appear here'
                                : 'Start chatting with your family'}
                        </Text>
                    </View>
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background.primary,
    },
    searchContainer: {
        padding: spacing.md,
        backgroundColor: colors.background.tertiary,
        borderBottomWidth: 1,
        borderBottomColor: colors.border.default,
    },
    searchInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.background.elevated,
        borderRadius: borderRadius.md,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        gap: spacing.sm,
    },
    searchInput: {
        flex: 1,
        ...typography.body,
        color: colors.text.primary,
        padding: 0,
    },
    archiveToggleContainer: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
        backgroundColor: colors.background.tertiary,
        borderBottomWidth: 1,
        borderBottomColor: colors.border.default,
    },
    archiveToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    archiveToggleText: {
        ...typography.body,
        color: colors.accent.primary,
        fontWeight: '600',
    },
    listContent: {
        flexGrow: 1,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xl,
        paddingTop: spacing.xxl * 2,
    },
    emptyText: {
        ...typography.body,
        color: colors.text.secondary,
        marginTop: spacing.lg,
        textAlign: 'center',
    },
    emptySubtext: {
        ...typography.caption,
        color: colors.text.tertiary,
        marginTop: spacing.xs,
        textAlign: 'center',
    },
});

export default ThreadList;
