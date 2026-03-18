import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography, borderRadius } from '../../theme/colors';

interface DateSeparatorProps {
    date: string; // ISO date string
}

const DateSeparator: React.FC<DateSeparatorProps> = ({ date }) => {
    const formatDate = (dateString: string) => {
        const messageDate = new Date(dateString);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        // Reset time to compare dates only
        today.setHours(0, 0, 0, 0);
        yesterday.setHours(0, 0, 0, 0);
        messageDate.setHours(0, 0, 0, 0);

        if (messageDate.getTime() === today.getTime()) {
            return 'Today';
        } else if (messageDate.getTime() === yesterday.getTime()) {
            return 'Yesterday';
        } else {
            // Format as "Dec 25, 2024"
            return messageDate.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
            });
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.separator}>
                <View style={styles.line} />
                <Text style={styles.dateText}>{formatDate(date)}</Text>
                <View style={styles.line} />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        marginVertical: spacing.md,
    },
    separator: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: spacing.md,
    },
    line: {
        flex: 1,
        height: 1,
        backgroundColor: colors.border.default,
        opacity: 0.5,
    },
    dateText: {
        ...typography.caption,
        color: colors.text.tertiary,
        backgroundColor: colors.background.elevated,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs - 2,
        borderRadius: borderRadius.full,
        marginHorizontal: spacing.sm,
        fontWeight: '600',
        overflow: 'hidden',
    },
});

export default DateSeparator;
