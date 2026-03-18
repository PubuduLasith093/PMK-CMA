import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    ScrollView,
    TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '../theme/colors';

const SettingsScreen: React.FC = () => {
    console.log('[SettingsScreen] Component rendering...');
    const settingsSections = [
        {
            title: 'General',
            items: [
                { icon: 'notifications-outline', label: 'Notifications', value: 'On' },
                { icon: 'language-outline', label: 'Language', value: 'English' },
                { icon: 'moon-outline', label: 'Dark Mode', value: 'On' },
            ],
        },
        {
            title: 'Privacy & Security',
            items: [
                { icon: 'lock-closed-outline', label: 'Privacy Settings', value: '' },
                { icon: 'shield-checkmark-outline', label: 'Security', value: '' },
            ],
        },
        {
            title: 'About',
            items: [
                { icon: 'information-circle-outline', label: 'App Version', value: 'v1.0.0' },
                { icon: 'help-circle-outline', label: 'Help & Support', value: '' },
            ],
        },
    ];

    return (
        <View style={styles.container}>
            <LinearGradient colors={[colors.background.primary, colors.background.secondary]} style={styles.gradient}>
                <SafeAreaView style={styles.safeArea}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>Settings</Text>
                        <Text style={styles.headerSubtitle}>Manage your preferences</Text>
                    </View>

                    <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                        {settingsSections.map((section, sectionIndex) => (
                            <View key={sectionIndex} style={styles.section}>
                                <Text style={styles.sectionTitle}>{section.title}</Text>
                                <View style={styles.sectionCard}>
                                    {section.items.map((item, itemIndex) => (
                                        <TouchableOpacity
                                            key={itemIndex}
                                            style={[
                                                styles.settingItem,
                                                itemIndex !== section.items.length - 1 && styles.settingItemBorder,
                                            ]}
                                            activeOpacity={0.7}
                                        >
                                            <View style={styles.settingItemLeft}>
                                                <Ionicons name={item.icon as any} size={24} color={colors.accent.primary} />
                                                <Text style={styles.settingItemLabel}>{item.label}</Text>
                                            </View>
                                            <View style={styles.settingItemRight}>
                                                {item.value && <Text style={styles.settingItemValue}>{item.value}</Text>}
                                                <Ionicons name="chevron-forward" size={20} color={colors.text.tertiary} />
                                            </View>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        ))}
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
    scrollContent: { paddingBottom: spacing.xl },
    header: {
        paddingTop: spacing.md,
        paddingBottom: spacing.lg,
        paddingHorizontal: spacing.lg,
    },
    headerTitle: { ...typography.h2, color: colors.text.primary },
    headerSubtitle: { ...typography.body, color: colors.text.secondary, marginTop: spacing.xs },
    section: {
        marginBottom: spacing.lg,
        paddingHorizontal: spacing.lg,
    },
    sectionTitle: {
        ...typography.caption,
        color: colors.text.tertiary,
        textTransform: 'uppercase',
        fontWeight: '600',
        marginBottom: spacing.sm,
        letterSpacing: 0.5,
    },
    sectionCard: {
        backgroundColor: colors.background.tertiary,
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        borderColor: colors.border.default,
        overflow: 'hidden',
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
    },
    settingItemBorder: {
        borderBottomWidth: 1,
        borderBottomColor: colors.border.default,
    },
    settingItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    settingItemLabel: {
        ...typography.body,
        color: colors.text.primary,
        marginLeft: spacing.md,
    },
    settingItemRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    settingItemValue: {
        ...typography.body,
        color: colors.text.secondary,
    },
});

export default SettingsScreen;
