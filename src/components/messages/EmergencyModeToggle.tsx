import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '../../theme/colors';

interface EmergencyModeToggleProps {
    isEmergency: boolean;
    onToggle: () => void;
}

const EmergencyModeToggle: React.FC<EmergencyModeToggleProps> = ({ isEmergency, onToggle }) => {
    const pulseAnim = React.useRef(new Animated.Value(1)).current;

    React.useEffect(() => {
        if (isEmergency) {
            // Pulsing animation for emergency mode
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1.1,
                        duration: 800,
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 800,
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        } else {
            pulseAnim.setValue(1);
        }
    }, [isEmergency]);

    return (
        <View style={styles.container}>
            {isEmergency && (
                <View style={styles.emergencyBanner}>
                    <Ionicons name="warning" size={20} color="#FFFFFF" />
                    <Text style={styles.emergencyBannerText}>Emergency Mode Active</Text>
                </View>
            )}

            <TouchableOpacity
                style={[
                    styles.toggleButton,
                    isEmergency && styles.toggleButtonActive,
                ]}
                onPress={onToggle}
                activeOpacity={0.8}
            >
                <Animated.View
                    style={[
                        styles.toggleContent,
                        { transform: [{ scale: isEmergency ? pulseAnim : 1 }] },
                    ]}
                >
                    <Ionicons
                        name={isEmergency ? 'warning' : 'warning-outline'}
                        size={24}
                        color={isEmergency ? '#FFFFFF' : colors.status.error}
                    />
                    <Text style={[styles.toggleText, isEmergency && styles.toggleTextActive]}>
                        {isEmergency ? 'Exit Emergency Mode' : 'Emergency Mode'}
                    </Text>
                </Animated.View>
            </TouchableOpacity>

            {isEmergency && (
                <Text style={styles.helpText}>
                    All messages will be marked as emergency and sent with high priority
                </Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: spacing.md,
    },
    emergencyBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.status.error,
        padding: spacing.sm,
        gap: spacing.sm,
    },
    emergencyBannerText: {
        ...typography.body,
        color: '#FFFFFF',
        fontWeight: '700',
    },
    toggleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.md,
        backgroundColor: colors.background.elevated,
        borderRadius: borderRadius.md,
        borderWidth: 2,
        borderColor: colors.status.error,
    },
    toggleButtonActive: {
        backgroundColor: colors.status.error,
        borderColor: colors.status.error,
    },
    toggleContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    toggleText: {
        ...typography.body,
        color: colors.status.error,
        fontWeight: '700',
    },
    toggleTextActive: {
        color: '#FFFFFF',
    },
    helpText: {
        ...typography.caption,
        color: colors.text.secondary,
        textAlign: 'center',
        marginTop: spacing.sm,
        paddingHorizontal: spacing.md,
    },
});

export default EmergencyModeToggle;
