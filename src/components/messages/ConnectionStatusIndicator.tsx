import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../../theme/colors';

interface ConnectionStatusIndicatorProps {
    isConnected: boolean;
    reconnecting?: boolean;
}

const ConnectionStatusIndicator: React.FC<ConnectionStatusIndicatorProps> = ({
    isConnected,
    reconnecting,
}) => {
    const [visible, setVisible] = useState(!isConnected);
    const slideAnim = React.useRef(new Animated.Value(-50)).current;
    const pulseAnim = React.useRef(new Animated.Value(1)).current;

    useEffect(() => {
        if (!isConnected || reconnecting) {
            setVisible(true);
            Animated.spring(slideAnim, {
                toValue: 0,
                useNativeDriver: true,
                tension: 50,
                friction: 7,
            }).start();

            if (reconnecting) {
                // Pulsing animation for reconnecting
                Animated.loop(
                    Animated.sequence([
                        Animated.timing(pulseAnim, {
                            toValue: 1.2,
                            duration: 600,
                            useNativeDriver: true,
                        }),
                        Animated.timing(pulseAnim, {
                            toValue: 1,
                            duration: 600,
                            useNativeDriver: true,
                        }),
                    ])
                ).start();
            }
        } else {
            Animated.timing(slideAnim, {
                toValue: -50,
                duration: 300,
                useNativeDriver: true,
            }).start(() => {
                setVisible(false);
                pulseAnim.setValue(1);
            });
        }
    }, [isConnected, reconnecting]);

    if (!visible) return null;

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    transform: [{ translateY: slideAnim }],
                    backgroundColor: reconnecting
                        ? colors.status.warning
                        : colors.status.error,
                },
            ]}
        >
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                <Ionicons
                    name={reconnecting ? 'sync' : 'cloud-offline'}
                    size={16}
                    color="#FFFFFF"
                />
            </Animated.View>
            <Text style={styles.text}>
                {reconnecting ? 'Reconnecting...' : 'No connection'}
            </Text>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.xs,
        paddingHorizontal: spacing.md,
        gap: spacing.sm,
    },
    text: {
        ...typography.small,
        color: '#FFFFFF',
        fontWeight: '600',
    },
});

export default ConnectionStatusIndicator;
