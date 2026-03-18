import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../theme/colors';

const ContactsScreen: React.FC = () => {
    console.log('[ContactsScreen] Component rendering...');
    return (
        <View style={styles.container}>
            <LinearGradient colors={[colors.background.primary, colors.background.secondary]} style={styles.gradient}>
                <SafeAreaView style={styles.safeArea}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>Contacts</Text>
                        <Text style={styles.headerSubtitle}>Family Members</Text>
                    </View>

                    <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                        {/* Placeholder Content */}
                        <View style={styles.placeholderContainer}>
                            <View style={styles.iconCircle}>
                                <Ionicons name="people-outline" size={64} color={colors.accent.primary} />
                            </View>
                            <Text style={styles.placeholderTitle}>Contacts Coming Soon</Text>
                            <Text style={styles.placeholderText}>
                                View and manage your family members and emergency contacts here.
                            </Text>
                        </View>
                    </ScrollView>
                </SafeAreaView>
            </LinearGradient>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    gradient: { flex: 1 },
    safeArea: { flex: 1 },
    scrollView: { flex: 1 },
    scrollContent: { flexGrow: 1 },
    header: {
        paddingTop: spacing.md,
        paddingBottom: spacing.lg,
        paddingHorizontal: spacing.lg,
    },
    headerTitle: { ...typography.h2, color: colors.text.primary },
    headerSubtitle: { ...typography.body, color: colors.text.secondary, marginTop: spacing.xs },
    placeholderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.xxl,
    },
    iconCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: colors.background.elevated,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.xl,
        borderWidth: 2,
        borderColor: colors.border.light,
    },
    placeholderTitle: {
        ...typography.h3,
        color: colors.text.primary,
        marginBottom: spacing.md,
        textAlign: 'center',
    },
    placeholderText: {
        ...typography.body,
        color: colors.text.secondary,
        textAlign: 'center',
        lineHeight: 24,
    },
});

export default ContactsScreen;
