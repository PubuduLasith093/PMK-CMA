import React, { useRef, useEffect, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    ActivityIndicator,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Thread, Message } from '../../services/api/types';
import { colors, spacing, typography } from '../../theme/colors';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import TypingIndicator from './TypingIndicator';
import DateSeparator from './DateSeparator';

interface ChatAreaProps {
    thread: Thread;
    messages: Message[];
    loading: boolean;
    onSendMessage: (content: string, attachments?: any[], replyToId?: string, messageType?: string, metadata?: any) => void;
    onEditMessage?: (message: Message) => void;
    onDeleteMessage?: (messageId: string) => void;
    onReplyMessage?: (message: Message | null) => void;
    onForwardMessage?: (message: Message) => void;
    onReactMessage?: (messageId: string, emoji: string) => void;
    replyToMessage?: Message | null;
    typingUser?: { userName: string; isTyping: boolean} | null;
    isArchived?: boolean;
    onArchive?: () => void;
    onUnarchive?: (threadId: string) => void;
}

// Type for items in the FlatList (can be message or date separator)
type ChatItem =
    | { type: 'date'; date: string; id: string }
    | { type: 'message'; message: Message; showSender: boolean; senderName?: string; id: string };

const ChatArea: React.FC<ChatAreaProps> = ({
    thread,
    messages,
    loading,
    onSendMessage,
    onEditMessage,
    onDeleteMessage,
    onReplyMessage,
    onForwardMessage,
    onReactMessage,
    replyToMessage,
    typingUser,
    isArchived,
    onArchive,
    onUnarchive
}) => {
    const flatListRef = useRef<FlatList>(null);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        if (messages.length > 0 && !loading) {
            setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
        }
    }, [messages.length, loading]);

    // Auto-scroll to bottom when keyboard shows
    useEffect(() => {
        const keyboardDidShowListener = Keyboard.addListener(
            'keyboardDidShow',
            () => {
                setTimeout(() => {
                    flatListRef.current?.scrollToEnd({ animated: true });
                }, 100);
            }
        );

        return () => {
            keyboardDidShowListener.remove();
        };
    }, []);

    // Process messages to add date separators and sender info
    const chatItems = useMemo(() => {
        const items: ChatItem[] = [];
        let lastDate: string | null = null;

        messages.forEach((message, index) => {
            const messageDate = new Date(message.createdAt).toDateString();

            // Add date separator if date changed
            if (messageDate !== lastDate) {
                items.push({
                    type: 'date',
                    date: message.createdAt,
                    id: `date-${messageDate}`,
                });
                lastDate = messageDate;
            }

            // Determine if we should show sender name (for group chats)
            const isGroup = thread.isGroup || thread.threadType === 'GROUP' || thread.threadType === 'FAMILY';
            const previousMessage = index > 0 ? messages[index - 1] : null;
            const showSender = isGroup && (
                !previousMessage ||
                previousMessage.senderId !== message.senderId ||
                previousMessage.senderType !== message.senderType
            );

            // Get sender name from participants
            let senderName: string | undefined;
            if (showSender && message.senderType === 'USER') {
                const participant = thread.participants.find(p => p.userId === message.senderId);
                senderName = participant?.user?.name || 'Parent';
            } else if (showSender && message.senderType === 'CHILD') {
                const participant = thread.participants.find(p => p.childId === message.senderId);
                senderName = participant?.child?.name || 'Child';
            }

            items.push({
                type: 'message',
                message,
                showSender,
                senderName,
                id: message.id,
            });
        });

        return items;
    }, [messages, thread]);

    // Get thread name
    const threadName = thread.threadName || thread.name || 'Unknown';

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
            {/* Messages List */}
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.accent.primary} />
                    <Text style={styles.loadingText}>Loading messages...</Text>
                </View>
            ) : (
                <FlatList
                    ref={flatListRef}
                    data={chatItems}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => {
                        if (item.type === 'date') {
                            return <DateSeparator date={item.date} />;
                        } else {
                            return (
                                <MessageBubble
                                    message={item.message}
                                    onEdit={onEditMessage}
                                    onDelete={onDeleteMessage}
                                    onReply={onReplyMessage}
                                    onForward={onForwardMessage}
                                    onReact={onReactMessage}
                                    showSender={item.showSender}
                                    senderName={item.senderName}
                                />
                            );
                        }
                    }}
                    contentContainerStyle={styles.messagesList}
                    showsVerticalScrollIndicator={false}
                    onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>No messages yet</Text>
                            <Text style={styles.emptySubtext}>Start the conversation!</Text>
                        </View>
                    }
                />
            )}

            {/* Typing Indicator */}
            {typingUser && (
                <TypingIndicator userName={typingUser.userName} isTyping={typingUser.isTyping} />
            )}

            {/* Message Input */}
            <MessageInput
                onSendMessage={onSendMessage}
                replyTo={replyToMessage ? {
                    id: replyToMessage.id,
                    content: replyToMessage.content,
                    author: replyToMessage.senderType === 'USER' ? 'Parent' : 'You'
                } : undefined}
                onCancelReply={() => onReplyMessage?.(null)}
            />
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background.primary,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: spacing.md,
    },
    loadingText: {
        ...typography.body,
        color: colors.text.secondary,
    },
    messagesList: {
        padding: spacing.md,
        paddingBottom: spacing.lg,
        flexGrow: 1,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: spacing.xxl * 2,
    },
    emptyText: {
        ...typography.body,
        color: colors.text.secondary,
        marginBottom: spacing.xs,
    },
    emptySubtext: {
        ...typography.caption,
        color: colors.text.tertiary,
    },
});

export default ChatArea;
