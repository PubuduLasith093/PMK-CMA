import React from 'react';
import {
    View,
    StyleSheet,
    Modal,
    TouchableOpacity,
    Image,
    Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../../theme/colors';

interface ImageViewerProps {
    visible: boolean;
    imageUri: string;
    onClose: () => void;
}

const ImageViewer: React.FC<ImageViewerProps> = ({ visible, imageUri, onClose }) => {
    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={styles.container}>
                {/* Close Button */}
                <TouchableOpacity style={styles.closeButton} onPress={onClose} activeOpacity={0.8}>
                    <Ionicons name="close" size={32} color="#FFFFFF" />
                </TouchableOpacity>

                {/* Image */}
                <TouchableOpacity style={styles.imageContainer} activeOpacity={1} onPress={onClose}>
                    <Image source={{ uri: imageUri }} style={styles.image} resizeMode="contain" />
                </TouchableOpacity>

                {/* Download Button (placeholder) */}
                <TouchableOpacity style={styles.downloadButton} activeOpacity={0.8}>
                    <Ionicons name="download-outline" size={24} color="#FFFFFF" />
                </TouchableOpacity>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeButton: {
        position: 'absolute',
        top: 50,
        right: spacing.lg,
        zIndex: 10,
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    imageContainer: {
        width: Dimensions.get('window').width,
        height: Dimensions.get('window').height,
        justifyContent: 'center',
        alignItems: 'center',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    downloadButton: {
        position: 'absolute',
        bottom: 50,
        right: spacing.lg,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: colors.accent.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default ImageViewer;
