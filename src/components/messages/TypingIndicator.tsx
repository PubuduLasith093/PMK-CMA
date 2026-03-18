import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { colors, spacing, typography } from '../../theme/colors';

interface TypingIndicatorProps {
    userName?: string;
    isTyping: boolean;
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ userName, isTyping }) => {
    const [visible, setVisible] = useState(false);
    const dot1Anim = React.useRef(new Animated.Value(0)).current;
    const dot2Anim = React.useRef(new Animated.Value(0)).current;
    const dot3Anim = React.useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (isTyping) {
            setVisible(true);

            // Animated dots
            const createDotAnimation = (anim: Animated.Value, delay: number) => {
                return Animated.loop(
                    Animated.sequence([
                        Animated.delay(delay),
                        Animated.timing(anim, {
                            toValue: -5,
                            duration: 400,
                            useNativeDriver: true,
                        }),
                        Animated.timing(anim, {
                            toValue: 0,
                            duration: 400,
                            useNativeDriver: true,
                        }),
                    ])
                );
            };

            Animated.parallel([
                createDotAnimation(dot1Anim, 0),
                createDotAnimation(dot2Anim, 150),
                createDotAnimation(dot3Anim, 300),
            ]).start();
        } else {
            dot1Anim.setValue(0);
            dot2Anim.setValue(0);
            dot3Anim.setValue(0);
            setTimeout(() => setVisible(false), 300);
        }
    }, [isTyping]);

    if (!visible) return null;

    return (
        <View style={styles.container}>
            <View style={styles.bubble}>
                <Text style={styles.userName}>{userName || 'Someone'} is typing</Text>
                <View style={styles.dotsContainer}>
                    <Animated.View
                        style={[styles.dot, { transform: [{ translateY: dot1Anim }] }]}
                    />
                    <Animated.View
                        style={[styles.dot, { transform: [{ translateY: dot2Anim }] }]}
                    />
                    <Animated.View
                        style={[styles.dot, { transform: [{ translateY: dot3Anim }] }]}
                    />
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
    },
    bubble: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.background.elevated,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: 16,
        alignSelf: 'flex-start',
        gap: spacing.sm,
    },
    userName: {
        ...typography.caption,
        color: colors.text.secondary,
        fontStyle: 'italic',
    },
    dotsContainer: {
        flexDirection: 'row',
        gap: 4,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: colors.accent.primary,
    },
});

export default TypingIndicator;
