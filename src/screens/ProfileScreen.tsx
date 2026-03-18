import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    ScrollView,
    TouchableOpacity,
} from 'react-native';
import { useSelector } from 'react-redux';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { RootState } from '../store';
import { colors, spacing, typography, borderRadius } from '../theme/colors';

const ProfileScreen: React.FC = () => {
    console.log('[ProfileScreen] Component rendering...');
    const { childName, parentName, deviceId } = useSelector((state: RootState) => state.auth);

    const profileSections = [
        {
            title: 'Personal Information',
            items: [
                { icon: 'person-outline', label: 'Name', value: childName || 'Not set' },
                { icon: 'shield-outline', label: 'Protected by', value: parentName || 'Not set' },
            ],
        },
        {
            title: 'Device Information',
            items: [
                { icon: 'phone-portrait-outline', label: 'Device ID', value: deviceId ? `${deviceId.slice(0, 8)}...` : 'Not set' },
                { icon: 'information-circle-outline', label: 'App Version', value: 'v1.0.0' },
            ],
        },
    ];

    return (
        <View style={styles.container}>
            <LinearGradient colors={[colors.background.primary, colors.background.secondary]} style={styles.gradient}>
                <SafeAreaView style={styles.safeArea}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>Profile</Text>
                        <Text style={styles.headerSubtitle}>Your information</Text>
                    </View>

                    <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                        {/* Profile Avatar */}
                        <View style={styles.avatarSection}>
                            <View style={styles.avatarCircle}>
                                <Ionicons name="person" size={64} color={colors.accent.primary} />
                            </View>
                            <Text style={styles.profileName}>{childName || 'Child User'}</Text>
                            {parentName && (
                                <Text style={styles.profileSubtext}>Protected by {parentName}</Text>
                            )}
                        </View>

                        {/* Profile Sections */}
                        {profileSections.map((section, sectionIndex) => (
                            <View key={sectionIndex} style={styles.section}>
                                <Text style={styles.sectionTitle}>{section.title}</Text>
                                <View style={styles.sectionCard}>
                                    {section.items.map((item, itemIndex) => (
                                        <View
                                            key={itemIndex}
                                            style={[
                                                styles.profileItem,
                                                itemIndex !== section.items.length - 1 && styles.profileItemBorder,
                                            ]}
                                        >
                                            <View style={styles.profileItemLeft}>
                                                <Ionicons name={item.icon as any} size={24} color={colors.accent.primary} />
                                                <Text style={styles.profileItemLabel}>{item.label}</Text>
                                            </View>
                                            <Text style={styles.profileItemValue}>{item.value}</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        ))}

                        {/* Actions */}
                        <View style={styles.actionsSection}>
                            <TouchableOpacity style={styles.actionButton} activeOpacity={0.7}>
                                <Ionicons name="create-outline" size={20} color={colors.accent.primary} />
                                <Text style={styles.actionButtonText}>Edit Profile</Text>
                            </TouchableOpacity>
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
    scrollContent: { paddingBottom: spacing.xl },
    header: {
        paddingTop: spacing.md,
        paddingBottom: spacing.lg,
        paddingHorizontal: spacing.lg,
    },
    headerTitle: { ...typography.h2, color: colors.text.primary },
    headerSubtitle: { ...typography.body, color: colors.text.secondary, marginTop: spacing.xs },
    avatarSection: {
        alignItems: 'center',
        paddingVertical: spacing.xl,
        paddingHorizontal: spacing.lg,
    },
    avatarCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: colors.background.elevated,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.lg,
        borderWidth: 3,
        borderColor: colors.accent.primary,
    },
    profileName: {
        ...typography.h3,
        color: colors.text.primary,
        marginBottom: spacing.xs,
    },
    profileSubtext: {
        ...typography.body,
        color: colors.text.secondary,
        fontStyle: 'italic',
    },
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
    profileItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
    },
    profileItemBorder: {
        borderBottomWidth: 1,
        borderBottomColor: colors.border.default,
    },
    profileItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    profileItemLabel: {
        ...typography.body,
        color: colors.text.secondary,
        marginLeft: spacing.md,
    },
    profileItemValue: {
        ...typography.body,
        color: colors.text.primary,
        fontWeight: '600',
    },
    actionsSection: {
        paddingHorizontal: spacing.lg,
        marginTop: spacing.md,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.background.tertiary,
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        borderColor: colors.border.light,
        paddingVertical: spacing.md,
        gap: spacing.sm,
    },
    actionButtonText: {
        ...typography.body,
        color: colors.accent.primary,
        fontWeight: '600',
    },
});

export default ProfileScreen;
