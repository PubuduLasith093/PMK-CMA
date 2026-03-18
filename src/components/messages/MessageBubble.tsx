import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { RootState } from '../../store';
import { Message } from '../../services/api/types';
import { colors, spacing, typography, borderRadius } from '../../theme/colors';
import MessageContextMenu from './MessageContextMenu';
import AttachmentPreview from './AttachmentPreview';
import ImageViewer from './ImageViewer';
import ReactionPicker from './ReactionPicker';

interface MessageBubbleProps {
    message: Message;
    onEdit?: (message: Message) => void;
    onDelete?: (messageId: string) => void;
    onReply?: (message: Message) => void;
    onForward?: (message: Message) => void;
    onReact?: (messageId: string, emoji: string) => void;
    showSender?: boolean; // Show sender name/avatar for group messages
    senderName?: string; // Sender display name for group messages
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
    message,
    onEdit,
    onDelete,
    onReply,
    onForward,
    onReact,
    showSender = false,
    senderName
}) => {
    const [showContextMenu, setShowContextMenu] = useState(false);
    const [showReactionPicker, setShowReactionPicker] = useState(false);
    const [viewingImage, setViewingImage] = useState<string | null>(null);
    const { childId } = useSelector((state: RootState) => state.auth);

    // Determine if message is from current user (child)
    const isOwnMessage = message.senderType === 'CHILD' && message.senderId === childId;

    // Format timestamp
    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    };

    // Check if message was edited
    const isEdited = !!message.editedAt;

    // Check if message is emergency
    const isEmergency = message.isEmergency;

    // Handle long press to show context menu
    const handleLongPress = () => {
        setShowContextMenu(true);
    };

    // Handle context menu actions
    const handleEdit = () => {
        setShowContextMenu(false);
        onEdit?.(message);
    };

    const handleDelete = () => {
        setShowContextMenu(false);
        onDelete?.(message.id);
    };

    const handleReply = () => {
        setShowContextMenu(false);
        onReply?.(message);
    };

    const handleForward = () => {
        setShowContextMenu(false);
        onForward?.(message);
    };

    const handleOpenReactionPicker = () => {
        setShowContextMenu(false);
        setShowReactionPicker(true);
    };

    const handleReaction = (emoji: string) => {
        onReact?.(message.id, emoji);
    };

    return (
        <View style={[styles.container, isOwnMessage ? styles.containerOwn : styles.containerOther]}>
            <Pressable
                onLongPress={handleLongPress}
                delayLongPress={500}
                style={[
                    styles.bubble,
                    isOwnMessage ? styles.bubbleOwn : styles.bubbleOther,
                    isEmergency && styles.bubbleEmergency,
                ]}
            >
                {/* Sender name for group messages */}
                {showSender && !isOwnMessage && senderName && (
                    <Text style={styles.senderName}>{senderName}</Text>
                )}

                {/* Reply indicator (if replying to another message) */}
                {message.replyTo && (
                    <View style={styles.replyContainer}>
                        <View style={styles.replyBar} />
                        <View style={styles.replyContent}>
                            <Text style={styles.replyAuthor}>
                                {message.replyTo.senderType === 'USER' ? 'Parent' : 'You'}
                            </Text>
                            <Text style={styles.replyText} numberOfLines={2}>
                                {message.replyTo.content}
                            </Text>
                        </View>
                    </View>
                )}

                {/* Message content */}
                {message.content && (
                    <Text style={[styles.messageText, isOwnMessage ? styles.messageTextOwn : styles.messageTextOther]}>
                        {message.content}
                    </Text>
                )}

                {/* Attachments */}
                {message.attachments && message.attachments.length > 0 && (
                    <View style={styles.attachmentsContainer}>
                        {message.attachments.map((attachment, index) => (
                            <AttachmentPreview
                                key={index}
                                attachment={attachment}
                                onPress={() => {
                                    if (attachment.fileType.startsWith('image/')) {
                                        setViewingImage(attachment.url);
                                    }
                                }}
                            />
                        ))}
                    </View>
                )}

                {/* Location from message metadata (LOCATION messageType) */}
                {message.messageType === 'LOCATION' && message.metadata && message.metadata.latitude !== undefined && message.metadata.longitude !== undefined && (
                    <View style={styles.attachmentsContainer}>
                        <AttachmentPreview
                            attachment={{
                                id: 'location-metadata',
                                messageId: message.id,
                                fileName: 'location',
                                fileType: 'location',
                                fileSize: 0,
                                url: '',
                                metadata: message.metadata,
                                createdAt: message.createdAt,
                            }}
                        />
                    </View>
                )}

                {/* Message metadata */}
                <View style={styles.metadata}>
                    {isEdited && (
                        <Text style={[styles.metadataText, isOwnMessage && styles.metadataTextOwn]}>
                            Edited •{' '}
                        </Text>
                    )}
                    <Text style={[styles.metadataText, isOwnMessage && styles.metadataTextOwn]}>
                        {formatTime(message.createdAt)}
                    </Text>
                    {isOwnMessage && (
                        <Ionicons
                            name="checkmark-done"
                            size={16}
                            color={isOwnMessage ? colors.text.inverse : colors.text.tertiary}
                            style={styles.readReceipt}
                        />
                    )}
                </View>

                {/* Emergency indicator */}
                {isEmergency && (
                    <View style={styles.emergencyBadge}>
                        <Ionicons name="warning" size={12} color="#FFFFFF" />
                        <Text style={styles.emergencyText}>Emergency</Text>
                    </View>
                )}

                {/* Reactions (placeholder for Phase 4) */}
                {message.reactions && message.reactions.length > 0 && (
                    <View style={styles.reactionsContainer}>
                        {message.reactions.slice(0, 3).map((reaction, index) => (
                            <View key={index} style={styles.reactionBubble}>
                                <Text style={styles.reactionEmoji}>{reaction.emoji}</Text>
                            </View>
                        ))}
                        {message.reactions.length > 3 && (
                            <Text style={styles.reactionMore}>+{message.reactions.length - 3}</Text>
                        )}
                    </View>
                )}
            </Pressable>

            {/* Context Menu Modal */}
            {showContextMenu && (
                <MessageContextMenu
                    visible={showContextMenu}
                    message={message}
                    isOwnMessage={isOwnMessage}
                    onClose={() => setShowContextMenu(false)}
                    onReply={handleReply}
                    onEdit={isOwnMessage ? handleEdit : undefined}
                    onDelete={isOwnMessage ? handleDelete : undefined}
                    onForward={handleForward}
                    onReact={handleOpenReactionPicker}
                />
            )}

            {/* Reaction Picker Modal */}
            <ReactionPicker
                visible={showReactionPicker}
                onClose={() => setShowReactionPicker(false)}
                onSelectReaction={handleReaction}
            />

            {/* Image Viewer Modal */}
            {viewingImage && (
                <ImageViewer
                    visible={!!viewingImage}
                    imageUri={viewingImage}
                    onClose={() => setViewingImage(null)}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: spacing.sm,
        flexDirection: 'row',
        paddingHorizontal: spacing.xs,
    },
    containerOwn: {
        justifyContent: 'flex-end',
    },
    containerOther: {
        justifyContent: 'flex-start',
    },
    bubble: {
        maxWidth: '80%',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm + 2,
        borderRadius: borderRadius.lg,
        position: 'relative',
    },
    bubbleOwn: {
        backgroundColor: colors.accent.primary,
        borderBottomRightRadius: 6,
    },
    bubbleOther: {
        backgroundColor: colors.background.elevated,
        borderBottomLeftRadius: 6,
    },
    bubbleEmergency: {
        borderWidth: 2,
        borderColor: colors.status.error,
    },
    replyContainer: {
        flexDirection: 'row',
        marginBottom: spacing.sm,
        paddingBottom: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.2)',
    },
    replyBar: {
        width: 3,
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
        borderRadius: 2,
        marginRight: spacing.sm,
    },
    replyContent: {
        flex: 1,
    },
    replyAuthor: {
        ...typography.small,
        color: 'rgba(255, 255, 255, 0.8)',
        fontWeight: '600',
        marginBottom: 2,
    },
    replyText: {
        ...typography.small,
        color: 'rgba(255, 255, 255, 0.6)',
        fontStyle: 'italic',
    },
    messageText: {
        ...typography.body,
        fontSize: 16,
        lineHeight: 22,
    },
    messageTextOwn: {
        color: '#FFFFFF',
    },
    messageTextOther: {
        color: colors.text.primary,
    },
    metadata: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: spacing.xs,
        gap: 4,
    },
    metadataText: {
        ...typography.small,
        color: colors.text.tertiary,
        fontSize: 12,
    },
    metadataTextOwn: {
        color: 'rgba(255, 255, 255, 0.8)',
    },
    readReceipt: {
        marginLeft: 2,
    },
    emergencyBadge: {
        position: 'absolute',
        top: -8,
        right: -8,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.status.error,
        paddingHorizontal: spacing.sm,
        paddingVertical: 2,
        borderRadius: borderRadius.sm,
        gap: 4,
    },
    emergencyText: {
        ...typography.small,
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 10,
    },
    reactionsContainer: {
        flexDirection: 'row',
        marginTop: spacing.xs,
        gap: spacing.xs,
    },
    reactionBubble: {
        backgroundColor: colors.background.primary,
        borderRadius: borderRadius.full,
        paddingHorizontal: spacing.sm,
        paddingVertical: 2,
    },
    reactionEmoji: {
        fontSize: 14,
    },
    reactionMore: {
        ...typography.small,
        color: colors.text.tertiary,
        fontSize: 11,
    },
    attachmentsContainer: {
        marginTop: spacing.sm,
        gap: spacing.sm,
    },
    senderName: {
        ...typography.small,
        color: colors.accent.secondary,
        fontWeight: '700',
        marginBottom: spacing.xs - 2,
        fontSize: 13,
    },
});

export default MessageBubble;
