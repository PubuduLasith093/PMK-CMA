import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
} from 'react-native';
import * as DocumentPickerLib from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '../../theme/colors';

interface DocumentPickerProps {
    visible: boolean;
    onClose: () => void;
    onDocumentSelected: (documentData: {
        uri: string;
        name: string;
        type: string;
        size: number;
    }) => void;
}

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

const DocumentPicker: React.FC<DocumentPickerProps> = ({ visible, onClose, onDocumentSelected }) => {
    const [selectedDocument, setSelectedDocument] = useState<{
        uri: string;
        name: string;
        type: string;
        size: number;
    } | null>(null);
    const [loading, setLoading] = useState(false);

    const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const getFileIcon = (mimeType: string): string => {
        if (!mimeType) return 'document-attach';
        const lowerType = mimeType.toLowerCase();
        if (lowerType.includes('pdf')) return 'document-text';
        if (lowerType.includes('word') || lowerType.includes('document')) return 'document';
        if (lowerType.includes('excel') || lowerType.includes('spreadsheet')) return 'grid';
        if (lowerType.includes('powerpoint') || lowerType.includes('presentation')) return 'easel';
        if (lowerType.includes('zip') || lowerType.includes('rar')) return 'archive';
        return 'document-attach';
    };

    const pickDocument = async () => {
        setLoading(true);
        try {
            const result = await DocumentPickerLib.getDocumentAsync({
                type: [
                    'application/pdf',
                    'application/msword',
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    'application/vnd.ms-excel',
                    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    'text/plain',
                ],
                copyToCacheDirectory: true,
            });

            if (result.canceled === false && result.assets && result.assets.length > 0) {
                const asset = result.assets[0];

                // Check file size
                if (asset.size && asset.size > MAX_FILE_SIZE) {
                    Alert.alert('File Too Large', `Maximum file size is ${formatFileSize(MAX_FILE_SIZE)}`);
                    return;
                }

                setSelectedDocument({
                    uri: asset.uri,
                    name: asset.name,
                    type: asset.mimeType || 'application/octet-stream',
                    size: asset.size || 0,
                });
            }
        } catch (error) {
            console.error('[DocumentPicker] Error:', error);
            Alert.alert('Error', 'Failed to select document');
        } finally {
            setLoading(false);
        }
    };

    const handleSend = () => {
        if (selectedDocument) {
            onDocumentSelected(selectedDocument);
            setSelectedDocument(null);
            onClose();
        }
    };

    const handleClose = () => {
        setSelectedDocument(null);
        onClose();
    };

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
            <View style={styles.overlay}>
                <View style={styles.container}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>Select Document</Text>
                        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                            <Ionicons name="close" size={24} color={colors.text.secondary} />
                        </TouchableOpacity>
                    </View>

                    {/* Content */}
                    {selectedDocument ? (
                        <View style={styles.previewContainer}>
                            <View style={styles.documentPreview}>
                                <View style={styles.documentIcon}>
                                    <Ionicons
                                        name={getFileIcon(selectedDocument.type) as any}
                                        size={48}
                                        color={colors.accent.primary}
                                    />
                                </View>
                                <View style={styles.documentInfo}>
                                    <Text style={styles.documentName} numberOfLines={2}>
                                        {selectedDocument.name}
                                    </Text>
                                    <Text style={styles.documentSize}>{formatFileSize(selectedDocument.size)}</Text>
                                </View>
                            </View>

                            <View style={styles.previewActions}>
                                <TouchableOpacity
                                    style={[styles.button, styles.buttonSecondary]}
                                    onPress={() => setSelectedDocument(null)}
                                >
                                    <Ionicons name="refresh" size={20} color={colors.text.primary} />
                                    <Text style={styles.buttonTextSecondary}>Choose Another</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.button, styles.buttonPrimary]} onPress={handleSend}>
                                    <Ionicons name="send" size={20} color="#FFFFFF" />
                                    <Text style={styles.buttonTextPrimary}>Send</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ) : (
                        <View style={styles.optionsContainer}>
                            {loading ? (
                                <ActivityIndicator size="large" color={colors.accent.primary} />
                            ) : (
                                <>
                                    <TouchableOpacity style={styles.option} onPress={pickDocument} activeOpacity={0.7}>
                                        <View style={styles.optionIcon}>
                                            <Ionicons name="folder-open" size={32} color={colors.accent.primary} />
                                        </View>
                                        <View style={styles.optionContent}>
                                            <Text style={styles.optionText}>Browse Files</Text>
                                            <Text style={styles.optionSubtext}>PDF, Word, Excel, Text (Max 50MB)</Text>
                                        </View>
                                    </TouchableOpacity>

                                    <View style={styles.infoBox}>
                                        <Ionicons name="information-circle" size={20} color={colors.text.tertiary} />
                                        <Text style={styles.infoText}>
                                            Supported formats: PDF, Word, Excel, PowerPoint, Text files
                                        </Text>
                                    </View>
                                </>
                            )}
                        </View>
                    )}
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
        maxHeight: '70%',
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
    optionsContainer: {
        padding: spacing.xl,
        gap: spacing.lg,
    },
    option: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.lg,
        backgroundColor: colors.background.elevated,
        borderRadius: borderRadius.lg,
        gap: spacing.lg,
    },
    optionIcon: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: colors.background.tertiary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    optionContent: {
        flex: 1,
    },
    optionText: {
        ...typography.body,
        color: colors.text.primary,
        fontWeight: '600',
        marginBottom: spacing.xs,
    },
    optionSubtext: {
        ...typography.caption,
        color: colors.text.secondary,
    },
    infoBox: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: spacing.md,
        backgroundColor: colors.background.elevated,
        borderRadius: borderRadius.md,
        gap: spacing.sm,
    },
    infoText: {
        ...typography.caption,
        color: colors.text.tertiary,
        flex: 1,
    },
    previewContainer: {
        padding: spacing.lg,
    },
    documentPreview: {
        flexDirection: 'row',
        padding: spacing.lg,
        backgroundColor: colors.background.elevated,
        borderRadius: borderRadius.lg,
        gap: spacing.md,
        marginBottom: spacing.lg,
    },
    documentIcon: {
        width: 60,
        height: 60,
        borderRadius: borderRadius.md,
        backgroundColor: colors.background.tertiary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    documentInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    documentName: {
        ...typography.body,
        color: colors.text.primary,
        fontWeight: '600',
        marginBottom: spacing.xs,
    },
    documentSize: {
        ...typography.caption,
        color: colors.text.secondary,
    },
    previewActions: {
        flexDirection: 'row',
        gap: spacing.md,
    },
    button: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.md,
        borderRadius: borderRadius.md,
        gap: spacing.sm,
    },
    buttonPrimary: {
        backgroundColor: colors.accent.primary,
    },
    buttonSecondary: {
        backgroundColor: colors.background.elevated,
    },
    buttonTextPrimary: {
        ...typography.body,
        color: '#FFFFFF',
        fontWeight: '600',
    },
    buttonTextSecondary: {
        ...typography.body,
        color: colors.text.primary,
        fontWeight: '600',
    },
});

export default DocumentPicker;
