import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    ScrollView,
    Image,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import Constants from 'expo-constants';
import { colors, spacing, typography, borderRadius } from '../../theme/colors';
import AttachmentSelector from './AttachmentSelector';
import AttachmentConfirmationModal from './AttachmentConfirmationModal';
import LocationShareModal from './LocationShareModal';
import LocationConfirmationModal from './LocationConfirmationModal';
import EmojiPicker from './EmojiPicker';
import QuickTemplates from './QuickTemplates';
import { messageApi } from '../../services/api/messageApi';

// Detect if running in Expo Go or production build
const isExpoGo = Constants.appOwnership === 'expo';

interface MessageInputProps {
    onSendMessage: (content: string, attachments?: any[], replyToId?: string, messageType?: string, metadata?: any) => void;
    replyTo?: { id: string; content: string; author: string } | null;
    onCancelReply?: () => void;
}

const MessageInput: React.FC<MessageInputProps> = ({ onSendMessage, replyTo, onCancelReply }) => {
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [showAttachmentSelector, setShowAttachmentSelector] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [showLocationModal, setShowLocationModal] = useState(false);
    const [showLocationConfirmation, setShowLocationConfirmation] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState<{ latitude: number; longitude: number; address: string; name?: string } | null>(null);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showQuickTemplates, setShowQuickTemplates] = useState(false);
    const [attachments, setAttachments] = useState<Array<{ uri: string; type: string; name: string; size?: number }>>([]);
    const [uploading, setUploading] = useState(false);
    const [pickerActive, setPickerActive] = useState(false); // Prevent concurrent picker calls

    // Request permissions on mount
    React.useEffect(() => {
        (async () => {
            const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
            const { status: mediaStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (cameraStatus !== 'granted' || mediaStatus !== 'granted') {
                console.warn('[MessageInput] Camera/Media permissions not granted');
            }
        })();
    }, []);

    const handleImagePicker = async () => {
        // Prevent concurrent picker calls
        if (pickerActive) {
            console.log('[MessageInput] Picker already active, ignoring duplicate call');
            return;
        }

        try {
            setPickerActive(true);
            console.log('[MessageInput] Opening image picker...');
            console.log('[MessageInput] Environment:', isExpoGo ? 'Expo Go' : 'Production/Dev Build');

            // Add timeout to reset picker flag if it gets stuck
            const timeoutId = setTimeout(() => {
                console.warn('[MessageInput] Image picker timeout - resetting flag');
                setPickerActive(false);
            }, 60000); // 60 second timeout

            // Request permissions first
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            console.log('[MessageInput] Permission status:', status);

            if (status !== 'granted') {
                clearTimeout(timeoutId);
                Alert.alert(
                    'Permission Required',
                    'Please grant media library permission to select images',
                    [{ text: 'OK' }]
                );
                return;
            }

            // Use simpler configuration for better Expo Go compatibility
            const pickerOptions: ImagePicker.ImagePickerOptions = {
                mediaTypes: ImagePicker.MediaTypeOptions.Images, // Use enum for better Expo Go compatibility
                allowsMultipleSelection: false, // Always single selection for Expo Go compatibility
                quality: 0.8,
                allowsEditing: false,
            };

            console.log('[MessageInput] Launching image picker with options:', pickerOptions);

            // Show helpful message for Expo Go users on iOS
            if (isExpoGo) {
                console.log('[MessageInput] Running on Expo Go - using single selection mode');
            }

            const result = await ImagePicker.launchImageLibraryAsync(pickerOptions);

            clearTimeout(timeoutId);
            console.log('[MessageInput] Image picker returned');
            console.log('[MessageInput] Canceled:', result.canceled);

            if (!result.canceled && result.assets && result.assets.length > 0) {
                console.log('[MessageInput] Selected', result.assets.length, 'item(s)');

                // Process all selected assets (single in Expo Go, multiple in production)
                const newAttachments = result.assets.map((asset, index) => {
                    console.log(`[MessageInput] Processing asset ${index + 1}:`, {
                        uri: asset.uri,
                        type: asset.type,
                        fileName: asset.fileName,
                        width: asset.width,
                        height: asset.height,
                    });

                    return {
                        uri: asset.uri,
                        type: asset.type === 'video' ? 'video/mp4' : 'image/jpeg',
                        name: asset.fileName || `${asset.type === 'video' ? 'video' : 'image'}-${Date.now()}-${index}.${asset.type === 'video' ? 'mp4' : 'jpg'}`,
                        size: asset.fileSize,
                    };
                });

                console.log('[MessageInput] Created', newAttachments.length, 'attachment(s)');
                setAttachments((prev) => [...prev, ...newAttachments]);
                setShowConfirmation(true);
            } else if (result.canceled) {
                console.log('[MessageInput] User canceled image picker');
            } else {
                console.warn('[MessageInput] Unexpected result format:', result);
            }
        } catch (error: any) {
            console.error('[MessageInput] Image picker error:', error);
            console.error('[MessageInput] Error details:', {
                message: error?.message,
                code: error?.code,
                stack: error?.stack,
            });
            Alert.alert('Error', 'Failed to pick image: ' + (error?.message || 'Unknown error'));
        } finally {
            setPickerActive(false);
        }
    };

    const handleDocumentPicker = async () => {
        // Prevent concurrent picker calls
        if (pickerActive) {
            console.log('[MessageInput] Picker already active, ignoring duplicate call');
            return;
        }

        try {
            setPickerActive(true);
            console.log('[MessageInput] Opening document picker...');
            console.log('[MessageInput] Environment:', isExpoGo ? 'Expo Go' : 'Production/Dev Build');

            // Add timeout to reset picker flag if it gets stuck
            const timeoutId = setTimeout(() => {
                console.warn('[MessageInput] Document picker timeout - resetting flag');
                setPickerActive(false);
            }, 60000); // 60 second timeout

            // Use simplest configuration for better Expo Go compatibility
            const pickerOptions: DocumentPicker.DocumentPickerOptions = {
                type: '*/*',
                multiple: false, // Always single selection for Expo Go compatibility
                copyToCacheDirectory: true,
            };

            console.log('[MessageInput] Document picker options:', pickerOptions);

            const result = await DocumentPicker.getDocumentAsync(pickerOptions);

            clearTimeout(timeoutId);
            console.log('[MessageInput] Document picker returned');
            console.log('[MessageInput] Document picker canceled:', result.canceled);

            if (!result.canceled && result.assets && result.assets.length > 0) {
                console.log('[MessageInput] Selected', result.assets.length, 'document(s)');

                // Process all selected documents (single in Expo Go, multiple in production)
                const newAttachments = result.assets.map((asset, index) => {
                    console.log(`[MessageInput] Processing document ${index + 1}:`, {
                        name: asset.name,
                        uri: asset.uri,
                        mimeType: asset.mimeType,
                        size: asset.size,
                    });

                    return {
                        uri: asset.uri,
                        type: asset.mimeType || 'application/octet-stream',
                        name: asset.name,
                        size: asset.size,
                    };
                });

                console.log('[MessageInput] Created', newAttachments.length, 'document attachment(s)');
                setAttachments((prev) => [...prev, ...newAttachments]);
                setShowConfirmation(true);
            } else if (result.canceled) {
                console.log('[MessageInput] User canceled document picker');
            } else {
                console.warn('[MessageInput] Unexpected document picker result:', result);
            }
        } catch (error: any) {
            console.error('[MessageInput] Document picker error:', error);
            console.error('[MessageInput] Error details:', {
                message: error?.message,
                code: error?.code,
                stack: error?.stack,
            });
            Alert.alert('Error', 'Failed to pick document: ' + (error?.message || 'Unknown error'));
        } finally {
            setPickerActive(false);
        }
    };

    const handleLocationShare = () => {
        setShowLocationModal(true);
    };

    const handleSelectLocation = (location: { latitude: number; longitude: number; address: string; name?: string }) => {
        // Store selected location and show confirmation modal
        console.log('[MessageInput] Location selected, showing confirmation:', location);
        setSelectedLocation(location);
        setShowLocationModal(false);
        setShowLocationConfirmation(true);
    };

    const handleSendLocation = async () => {
        if (!selectedLocation) return;

        try {
            console.log('[MessageInput] Sending location:', selectedLocation);
            // Send location message with proper format
            // Location data goes in metadata field, NOT attachments
            await onSendMessage(
                `📍 ${selectedLocation.name || 'Shared Location'}`,
                [], // Empty attachments - location is not a file!
                replyTo?.id,
                'LOCATION', // messageType
                {
                    // Metadata for location
                    latitude: selectedLocation.latitude,
                    longitude: selectedLocation.longitude,
                    address: selectedLocation.address,
                    name: selectedLocation.name,
                }
            );

            // Clear state
            setSelectedLocation(null);
            setShowLocationConfirmation(false);

            if (onCancelReply) {
                onCancelReply();
            }
        } catch (error) {
            console.error('[MessageInput] Failed to send location:', error);
            Alert.alert('Error', 'Failed to send location');
        }
    };

    const removeAttachment = (index: number) => {
        setAttachments((prev) => prev.filter((_, i) => i !== index));
    };

    const handleEmojiSelect = (emoji: string) => {
        setMessage((prev) => prev + emoji);
    };

    const handleTemplateSelect = (template: string) => {
        setMessage(template);
    };

    const handleConfirmSend = async () => {
        if ((!message.trim() && attachments.length === 0) || sending) {
            return;
        }

        setSending(true);
        setUploading(true);
        try {
            let uploadedFiles: any[] = [];

            // Upload attachments if present
            if (attachments.length > 0) {
                console.log('[MessageInput] Uploading', attachments.length, 'attachments...');

                for (const attachment of attachments) {
                    try {
                        const uploadedFile = await messageApi.uploadFile({
                            uri: attachment.uri,
                            name: attachment.name,
                            type: attachment.type,
                        });
                        uploadedFiles.push(uploadedFile);
                    } catch (error) {
                        console.error('[MessageInput] Failed to upload attachment:', error);
                        Alert.alert('Upload Error', `Failed to upload ${attachment.name}`);
                    }
                }
            }

            // Send message with attachments
            await onSendMessage(message.trim() || '📎 Attachment', uploadedFiles, replyTo?.id);

            // Clear inputs and close modal
            setMessage('');
            setAttachments([]);
            setShowConfirmation(false);
            if (onCancelReply) {
                onCancelReply();
            }
        } catch (error) {
            console.error('[MessageInput] Failed to send message:', error);
            Alert.alert('Error', 'Failed to send message');
        } finally {
            setSending(false);
            setUploading(false);
        }
    };

    const handleSend = async () => {
        // If there are attachments, show confirmation modal
        if (attachments.length > 0) {
            setShowConfirmation(true);
            return;
        }

        // Otherwise send text message directly
        if (!message.trim() || sending) {
            return;
        }

        setSending(true);
        try {
            await onSendMessage(message.trim(), [], replyTo?.id);
            setMessage('');
            if (onCancelReply) {
                onCancelReply();
            }
        } catch (error) {
            console.error('[MessageInput] Failed to send message:', error);
            Alert.alert('Error', 'Failed to send message');
        } finally {
            setSending(false);
        }
    };

    const canSend = (message.trim().length > 0 || attachments.length > 0) && !sending;

    return (
        <View style={styles.container}>
                {/* Reply indicator */}
                {replyTo && (
                    <View style={styles.replyIndicator}>
                        <View style={styles.replyBar} />
                        <View style={styles.replyContent}>
                            <Ionicons name="return-down-forward" size={16} color={colors.accent.primary} />
                            <View style={styles.replyTextContainer}>
                                <View style={styles.replyHeader}>
                                    <Ionicons name="person" size={12} color={colors.text.secondary} />
                                    <View style={styles.replyAuthor}>
                                        <Text style={styles.replyAuthorText}>{replyTo.author}</Text>
                                    </View>
                                </View>
                                <Text style={styles.replyText} numberOfLines={1}>
                                    {replyTo.content}
                                </Text>
                            </View>
                        </View>
                        {onCancelReply && (
                            <TouchableOpacity onPress={onCancelReply} style={styles.cancelReplyButton}>
                                <Ionicons name="close" size={20} color={colors.text.tertiary} />
                            </TouchableOpacity>
                        )}
                    </View>
                )}

                {/* Attachment Previews */}
                {attachments.length > 0 && (
                    <ScrollView
                        horizontal
                        style={styles.attachmentsContainer}
                        contentContainerStyle={styles.attachmentsContent}
                        showsHorizontalScrollIndicator={false}
                    >
                        {attachments.map((attachment, index) => (
                            <View key={index} style={styles.attachmentPreview}>
                                {attachment.type === 'image' ? (
                                    <Image source={{ uri: attachment.uri }} style={styles.attachmentImage} />
                                ) : (
                                    <View style={styles.attachmentFile}>
                                        <Ionicons
                                            name={attachment.type === 'video' ? 'videocam' : 'document-text'}
                                            size={32}
                                            color={colors.accent.primary}
                                        />
                                    </View>
                                )}
                                <TouchableOpacity
                                    style={styles.removeAttachment}
                                    onPress={() => removeAttachment(index)}
                                >
                                    <Ionicons name="close-circle" size={20} color={colors.status.error} />
                                </TouchableOpacity>
                            </View>
                        ))}
                    </ScrollView>
                )}

                {/* Upload Progress */}
                {uploading && (
                    <View style={styles.uploadingContainer}>
                        <ActivityIndicator size="small" color={colors.accent.primary} />
                        <Text style={styles.uploadingText}>Uploading attachments...</Text>
                    </View>
                )}

                {/* Quick Templates Button */}
                <TouchableOpacity
                    style={styles.quickTemplateButton}
                    onPress={() => setShowQuickTemplates(true)}
                    activeOpacity={0.7}
                >
                    <Ionicons name="flash" size={16} color={colors.accent.primary} />
                    <Text style={styles.quickTemplateText}>Quick Messages</Text>
                </TouchableOpacity>

                {/* Input container */}
                <View style={styles.inputContainer}>
                    {/* Attachment button */}
                    <TouchableOpacity
                        style={styles.iconButton}
                        activeOpacity={0.7}
                        onPress={() => setShowAttachmentSelector(true)}
                    >
                        <Ionicons name="add-circle-outline" size={24} color={colors.text.secondary} />
                    </TouchableOpacity>

                    {/* Text input */}
                    <TextInput
                        style={styles.input}
                        placeholder="Type a message..."
                        placeholderTextColor={colors.text.tertiary}
                        value={message}
                        onChangeText={setMessage}
                        multiline
                        maxLength={2000}
                        editable={!sending}
                    />

                    {/* Emoji button */}
                    <TouchableOpacity
                        style={styles.iconButton}
                        activeOpacity={0.7}
                        onPress={() => setShowEmojiPicker(true)}
                    >
                        <Ionicons name="happy-outline" size={24} color={colors.text.secondary} />
                    </TouchableOpacity>

                    {/* Send button */}
                    <TouchableOpacity
                        style={[styles.sendButton, canSend && styles.sendButtonActive]}
                        onPress={handleSend}
                        disabled={!canSend}
                        activeOpacity={0.7}
                    >
                        {sending ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                            <Ionicons name="send" size={20} color={canSend ? '#FFFFFF' : colors.text.tertiary} />
                        )}
                    </TouchableOpacity>
                </View>

                {/* Attachment Selector Modal */}
                <AttachmentSelector
                    visible={showAttachmentSelector}
                    onClose={() => setShowAttachmentSelector(false)}
                    onSelectImage={handleImagePicker}
                    onSelectDocument={handleDocumentPicker}
                    onSelectLocation={handleLocationShare}
                />

                {/* Attachment Confirmation Modal */}
                <AttachmentConfirmationModal
                    visible={showConfirmation}
                    attachments={attachments}
                    onConfirm={handleConfirmSend}
                    onCancel={() => {
                        setShowConfirmation(false);
                        setAttachments([]);
                    }}
                    uploading={uploading}
                />

                {/* Location Share Modal */}
                <LocationShareModal
                    visible={showLocationModal}
                    onClose={() => setShowLocationModal(false)}
                    onSelectLocation={handleSelectLocation}
                />

                {/* Location Confirmation Modal */}
                <LocationConfirmationModal
                    visible={showLocationConfirmation}
                    onClose={() => {
                        setShowLocationConfirmation(false);
                        setSelectedLocation(null);
                    }}
                    onSend={handleSendLocation}
                    location={selectedLocation}
                />

                {/* Emoji Picker Modal */}
                <EmojiPicker
                    visible={showEmojiPicker}
                    onClose={() => setShowEmojiPicker(false)}
                    onSelectEmoji={handleEmojiSelect}
                />

                {/* Quick Templates Modal */}
                <QuickTemplates
                    visible={showQuickTemplates}
                    onClose={() => setShowQuickTemplates(false)}
                    onSelectTemplate={handleTemplateSelect}
                />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        borderTopWidth: 1,
        borderTopColor: colors.border.default,
        backgroundColor: colors.background.tertiary,
    },
    replyIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.sm,
        paddingHorizontal: spacing.md,
        backgroundColor: colors.background.elevated,
        borderBottomWidth: 1,
        borderBottomColor: colors.border.default,
    },
    replyBar: {
        width: 3,
        height: '100%',
        backgroundColor: colors.accent.primary,
        borderRadius: 2,
        marginRight: spacing.sm,
    },
    replyContent: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    replyTextContainer: {
        flex: 1,
    },
    replyHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        marginBottom: 2,
    },
    replyAuthor: {
        flex: 1,
    },
    replyAuthorText: {
        ...typography.small,
        color: colors.text.secondary,
        fontWeight: '600',
    },
    replyText: {
        ...typography.caption,
        color: colors.text.tertiary,
    },
    cancelReplyButton: {
        padding: spacing.xs,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        padding: spacing.md,
        gap: spacing.sm,
    },
    iconButton: {
        padding: spacing.xs,
        justifyContent: 'center',
        alignItems: 'center',
    },
    input: {
        flex: 1,
        ...typography.body,
        color: colors.text.primary,
        backgroundColor: colors.background.elevated,
        borderRadius: borderRadius.lg,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        maxHeight: 100,
        minHeight: 40,
    },
    sendButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.background.elevated,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendButtonActive: {
        backgroundColor: colors.accent.primary,
    },
    attachmentsContainer: {
        maxHeight: 100,
        borderBottomWidth: 1,
        borderBottomColor: colors.border.default,
        backgroundColor: colors.background.elevated,
    },
    attachmentsContent: {
        padding: spacing.sm,
        gap: spacing.sm,
    },
    attachmentPreview: {
        width: 80,
        height: 80,
        borderRadius: borderRadius.md,
        overflow: 'hidden',
        position: 'relative',
    },
    attachmentImage: {
        width: '100%',
        height: '100%',
    },
    attachmentFile: {
        width: '100%',
        height: '100%',
        backgroundColor: colors.background.tertiary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    removeAttachment: {
        position: 'absolute',
        top: 4,
        right: 4,
        backgroundColor: colors.background.tertiary,
        borderRadius: 10,
    },
    uploadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.sm,
        paddingHorizontal: spacing.md,
        backgroundColor: colors.background.elevated,
        borderBottomWidth: 1,
        borderBottomColor: colors.border.default,
        gap: spacing.sm,
    },
    uploadingText: {
        ...typography.small,
        color: colors.text.secondary,
    },
    quickTemplateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.sm,
        paddingHorizontal: spacing.md,
        backgroundColor: colors.background.elevated,
        borderBottomWidth: 1,
        borderBottomColor: colors.border.default,
        gap: spacing.xs,
    },
    quickTemplateText: {
        ...typography.small,
        color: colors.accent.primary,
        fontWeight: '600',
    },
});

export default MessageInput;
