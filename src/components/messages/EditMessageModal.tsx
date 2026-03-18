import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import { colors, spacing, typography, borderRadius } from '../../theme/colors';

interface EditMessageModalProps {
    visible: boolean;
    originalContent: string;
    onClose: () => void;
    onSave: (newContent: string) => Promise<void>;
}

const EditMessageModal: React.FC<EditMessageModalProps> = ({
    visible,
    originalContent,
    onClose,
    onSave,
}) => {
    const [content, setContent] = useState(originalContent);
    const [saving, setSaving] = useState(false);

    React.useEffect(() => {
        if (visible) {
            setContent(originalContent);
        }
    }, [visible, originalContent]);

    const handleSave = async () => {
        if (!content.trim() || content.trim() === originalContent.trim()) {
            onClose();
            return;
        }

        setSaving(true);
        try {
            await onSave(content.trim());
            onClose();
        } catch (error) {
            console.error('[EditMessageModal] Failed to save:', error);
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.container}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>Edit Message</Text>
                    </View>

                    {/* Input */}
                    <TextInput
                        style={styles.input}
                        value={content}
                        onChangeText={setContent}
                        multiline
                        maxLength={2000}
                        placeholder="Type your message..."
                        placeholderTextColor={colors.text.tertiary}
                        autoFocus
                        editable={!saving}
                    />

                    {/* Character Count */}
                    <Text style={styles.charCount}>{content.length} / 2000</Text>

                    {/* Actions */}
                    <View style={styles.actions}>
                        <TouchableOpacity
                            style={[styles.button, styles.buttonCancel]}
                            onPress={onClose}
                            disabled={saving}
                        >
                            <Text style={styles.buttonTextCancel}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.button, styles.buttonSave]}
                            onPress={handleSave}
                            disabled={saving || !content.trim() || content.trim() === originalContent.trim()}
                        >
                            {saving ? (
                                <ActivityIndicator size="small" color="#FFFFFF" />
                            ) : (
                                <Text style={styles.buttonTextSave}>Save</Text>
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
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xl,
    },
    container: {
        width: '100%',
        maxWidth: 400,
        backgroundColor: colors.background.tertiary,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
    },
    header: {
        marginBottom: spacing.md,
    },
    headerTitle: {
        ...typography.h4,
        color: colors.text.primary,
    },
    input: {
        ...typography.body,
        color: colors.text.primary,
        backgroundColor: colors.background.elevated,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        minHeight: 100,
        maxHeight: 200,
        textAlignVertical: 'top',
    },
    charCount: {
        ...typography.small,
        color: colors.text.tertiary,
        textAlign: 'right',
        marginTop: spacing.xs,
    },
    actions: {
        flexDirection: 'row',
        gap: spacing.md,
        marginTop: spacing.lg,
    },
    button: {
        flex: 1,
        padding: spacing.md,
        borderRadius: borderRadius.md,
        alignItems: 'center',
    },
    buttonCancel: {
        backgroundColor: colors.background.elevated,
    },
    buttonSave: {
        backgroundColor: colors.accent.primary,
    },
    buttonTextCancel: {
        ...typography.body,
        color: colors.text.secondary,
        fontWeight: '600',
    },
    buttonTextSave: {
        ...typography.body,
        color: '#FFFFFF',
        fontWeight: '600',
    },
});

export default EditMessageModal;
