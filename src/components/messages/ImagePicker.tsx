import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    Image,
    Alert,
    ActivityIndicator,
} from 'react-native';
import * as ImagePickerLib from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '../../theme/colors';

interface ImagePickerProps {
    visible: boolean;
    onClose: () => void;
    onImageSelected: (imageUri: string, imageData: {
        uri: string;
        name: string;
        type: string;
    }) => void;
}

const ImagePicker: React.FC<ImagePickerProps> = ({ visible, onClose, onImageSelected }) => {
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const requestPermissions = async (type: 'camera' | 'library') => {
        if (type === 'camera') {
            const { status } = await ImagePickerLib.requestCameraPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Required', 'Camera permission is required to take photos.');
                return false;
            }
        } else {
            const { status } = await ImagePickerLib.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Required', 'Photo library permission is required to select images.');
                return false;
            }
        }
        return true;
    };

    const pickImageFromCamera = async () => {
        const hasPermission = await requestPermissions('camera');
        if (!hasPermission) return;

        setLoading(true);
        try {
            const result = await ImagePickerLib.launchCameraAsync({
                mediaTypes: ImagePickerLib.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.8,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                const asset = result.assets[0];
                setSelectedImage(asset.uri);
            }
        } catch (error) {
            console.error('[ImagePicker] Camera error:', error);
            Alert.alert('Error', 'Failed to take photo');
        } finally {
            setLoading(false);
        }
    };

    const pickImageFromGallery = async () => {
        const hasPermission = await requestPermissions('library');
        if (!hasPermission) return;

        setLoading(true);
        try {
            const result = await ImagePickerLib.launchImageLibraryAsync({
                mediaTypes: ImagePickerLib.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.8,
                allowsMultipleSelection: false,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                const asset = result.assets[0];
                setSelectedImage(asset.uri);
            }
        } catch (error) {
            console.error('[ImagePicker] Gallery error:', error);
            Alert.alert('Error', 'Failed to select image');
        } finally {
            setLoading(false);
        }
    };

    const handleSend = () => {
        if (selectedImage) {
            const fileName = selectedImage.split('/').pop() || 'image.jpg';
            onImageSelected(selectedImage, {
                uri: selectedImage,
                name: fileName,
                type: 'image/jpeg',
            });
            setSelectedImage(null);
            onClose();
        }
    };

    const handleClose = () => {
        setSelectedImage(null);
        onClose();
    };

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
            <View style={styles.overlay}>
                <View style={styles.container}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>Select Image</Text>
                        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                            <Ionicons name="close" size={24} color={colors.text.secondary} />
                        </TouchableOpacity>
                    </View>

                    {/* Preview or Options */}
                    {selectedImage ? (
                        <View style={styles.previewContainer}>
                            <Image source={{ uri: selectedImage }} style={styles.previewImage} resizeMode="contain" />
                            <View style={styles.previewActions}>
                                <TouchableOpacity
                                    style={[styles.button, styles.buttonSecondary]}
                                    onPress={() => setSelectedImage(null)}
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
                                    <TouchableOpacity style={styles.option} onPress={pickImageFromCamera} activeOpacity={0.7}>
                                        <View style={styles.optionIcon}>
                                            <Ionicons name="camera" size={32} color={colors.accent.primary} />
                                        </View>
                                        <Text style={styles.optionText}>Take Photo</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity style={styles.option} onPress={pickImageFromGallery} activeOpacity={0.7}>
                                        <View style={styles.optionIcon}>
                                            <Ionicons name="images" size={32} color={colors.accent.primary} />
                                        </View>
                                        <Text style={styles.optionText}>Choose from Gallery</Text>
                                    </TouchableOpacity>
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
    optionText: {
        ...typography.body,
        color: colors.text.primary,
        fontWeight: '600',
    },
    previewContainer: {
        padding: spacing.lg,
    },
    previewImage: {
        width: '100%',
        height: 300,
        borderRadius: borderRadius.lg,
        backgroundColor: colors.background.elevated,
    },
    previewActions: {
        flexDirection: 'row',
        gap: spacing.md,
        marginTop: spacing.lg,
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

export default ImagePicker;
