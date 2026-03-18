import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  Platform,
  Animated,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useSelector } from 'react-redux';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { RootState } from '../store';
import locationService from '../services/location/locationService';
import metricsService from '../services/metrics/metricsService';
import socketService from '../services/socket/socketService';
import { colors, spacing, borderRadius, shadows, typography } from '../theme/colors';

const { width } = Dimensions.get('window');

const HomeScreen: React.FC = () => {
  const { deviceId, childId, childName, parentName } = useSelector((state: RootState) => state.auth);
  const { current: currentLocation, isTracking } = useSelector((state: RootState) => state.location);
  const { current: metrics } = useSelector((state: RootState) => state.metrics);
  const { connectionStatus } = useSelector((state: RootState) => state.device);

  const [refreshing, setRefreshing] = useState(false);
  const [connectionErrorShown, setConnectionErrorShown] = useState(false);
  const fadeAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    initializeServices();

    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    return () => {
      socketService.disconnect();
    };
  }, [deviceId]);

  // Monitor socket connection status and show user-facing error if disconnected
  useEffect(() => {
    // Only show alert once per session when connection fails
    if (connectionStatus === 'disconnected' && !connectionErrorShown && deviceId) {
      setConnectionErrorShown(true);

      // Delay alert slightly to avoid showing during initial connection attempt
      const timer = setTimeout(() => {
        Alert.alert(
          'Connection Issue',
          'Unable to connect to the monitoring server. Some features may be limited in offline mode.\n\nLocation tracking and real-time monitoring require an active connection.',
          [
            {
              text: 'Retry Connection',
              onPress: async () => {
                setConnectionErrorShown(false); // Allow showing alert again if retry fails
                try {
                  await socketService.connect();
                  console.log('User initiated socket reconnection');
                } catch (error) {
                  console.error('Retry connection failed:', error);
                }
              },
              style: 'default',
            },
            {
              text: 'Continue Offline',
              onPress: () => {
                console.log('User chose to continue in offline mode');
              },
              style: 'cancel',
            },
          ],
          { cancelable: true }
        );
      }, 3000); // 3 second delay to allow initial connection attempt

      return () => clearTimeout(timer);
    }

    // Reset flag when connection is restored
    if (connectionStatus === 'connected' && connectionErrorShown) {
      setConnectionErrorShown(false);
    }
  }, [connectionStatus, connectionErrorShown, deviceId]);

  const initializeServices = async () => {
    if (!deviceId) {
      console.warn('No device ID found, cannot initialize services');
      return;
    }

    try {
      console.log('Initializing services for device:', deviceId);

      // Update location once
      try {
        await locationService.updateLocationOnce(deviceId);
      } catch (locationError) {
        console.error('Error updating location on home screen load:', locationError);
      }

      // Update metrics once
      try {
        await metricsService.collectMetrics();
      } catch (metricsError) {
        console.error('Error collecting metrics on home screen load:', metricsError);
      }

      // Connect to Socket.IO
      await socketService.connect();

      console.log('All services initialized successfully');
    } catch (error) {
      console.error('Error initializing services:', error);
    }
  };

  const onRefresh = async () => {
    if (Platform.OS === 'ios') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    setRefreshing(true);
    try {
      if (deviceId) {
        await Promise.all([
          locationService.updateLocationOnce(deviceId).catch(err =>
            console.error('Error refreshing location:', err)
          ),
          metricsService.collectMetrics().catch(err =>
            console.error('Error refreshing metrics:', err)
          ),
        ]);
      }
    } catch (error) {
      console.error('Error refreshing:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const getConnectionStatusInfo = () => {
    switch (connectionStatus) {
      case 'connected':
        return { color: colors.status.online, text: 'Connected' };
      case 'connecting':
        return { color: colors.status.warning, text: 'Connecting' };
      default:
        return { color: colors.status.offline, text: 'Offline' };
    }
  };

  const statusInfo = getConnectionStatusInfo();

  return (
    <View style={styles.container}>
      <LinearGradient colors={[colors.background.primary, colors.background.secondary]} style={styles.gradient}>
        <SafeAreaView style={styles.safeArea}>
          <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <Text style={styles.headerTitle}>PMK Child</Text>
                <Text style={styles.headerSubtitle}>
                  {childName || 'Device Dashboard'}
                </Text>
                {parentName && (
                  <Text style={styles.parentText}>Protected by {parentName}</Text>
                )}
              </View>
              <View style={[styles.statusBadge, { backgroundColor: colors.background.elevated }]}>
                <View style={[styles.statusDot, { backgroundColor: statusInfo.color }]} />
                <Text style={styles.statusText}>{statusInfo.text}</Text>
              </View>
            </View>

            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor={colors.accent.primary}
                  colors={[colors.accent.primary]}
                />
              }
            >
              {/* Hero Section */}
              <View style={styles.heroSection}>
                <LinearGradient
                  colors={['#6366F1', '#8B5CF6', '#A855F7']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.heroGradient}
                >
                  <View style={styles.heroContent}>
                    <View style={styles.heroIconContainer}>
                      <Ionicons name="shield-checkmark" size={40} color="#FFFFFF" />
                    </View>
                    <Text style={styles.heroTitle}>You're Protected</Text>
                    <Text style={styles.heroSubtitle}>
                      {parentName || 'Your parent'} is keeping you safe with real-time monitoring
                    </Text>
                    <View style={styles.heroStats}>
                      <View style={styles.heroStatItem}>
                        <Ionicons name="location" size={18} color="#FFFFFF" />
                        <Text style={styles.heroStatText}>
                          {isTracking ? 'Tracking Active' : 'Location Off'}
                        </Text>
                      </View>
                      <View style={styles.heroStatDivider} />
                      <View style={styles.heroStatItem}>
                        <Ionicons name="wifi" size={18} color="#FFFFFF" />
                        <Text style={styles.heroStatText}>
                          {connectionStatus === 'connected' ? 'Online' : 'Offline'}
                        </Text>
                      </View>
                      <View style={styles.heroStatDivider} />
                      <View style={styles.heroStatItem}>
                        <Ionicons name="shield" size={18} color="#FFFFFF" />
                        <Text style={styles.heroStatText}>Protected</Text>
                      </View>
                    </View>
                  </View>
                  {/* Decorative circles */}
                  <View style={styles.heroCircle1} />
                  <View style={styles.heroCircle2} />
                </LinearGradient>
              </View>

              {/* Quick Stats */}
              <View style={styles.quickStats}>
                <StatCard
                  icon={<Ionicons name="location" size={24} color={colors.accent.primary} />}
                  label="Location"
                  value={currentLocation ? 'Active' : 'Inactive'}
                  color={currentLocation ? colors.status.online : colors.status.offline}
                />
                <StatCard
                  icon={<Ionicons name="battery-charging" size={24} color={colors.accent.primary} />}
                  label="Battery"
                  value={metrics?.battery ? `${metrics.battery.level}%` : '--'}
                  color={metrics?.battery && metrics.battery.level > 20 ? colors.status.online : colors.status.warning}
                />
                <StatCard
                  icon={<Ionicons name="wifi" size={24} color={colors.accent.primary} />}
                  label="Network"
                  value={metrics?.network?.signalStrength ? `${metrics.network.signalStrength}%` : '--'}
                  color={colors.accent.primary}
                />
              </View>

              {/* Location Card */}
              {currentLocation && (
                <Card
                  title="Current Location"
                  icon={<Ionicons name="location" size={20} color={colors.accent.primary} />}
                >
                  <InfoRow label="Latitude" value={currentLocation.latitude.toFixed(6)} />
                  <InfoRow label="Longitude" value={currentLocation.longitude.toFixed(6)} />
                  <InfoRow label="Accuracy" value={`${currentLocation.accuracy.toFixed(0)}m`} />
                  <InfoRow
                    label="Updated"
                    value={new Date(currentLocation.timestamp).toLocaleTimeString()}
                  />
                </Card>
              )}

              {/* Battery Card */}
              {metrics?.battery && (
                <Card
                  title="Battery Status"
                  icon={<Ionicons name="battery-charging" size={20} color={colors.accent.primary} />}
                >
                  <View style={styles.batteryContainer}>
                    <View style={styles.batteryBarContainer}>
                      <LinearGradient
                        colors={
                          metrics.battery.level > 50
                            ? ['#52C41A', '#73D13D']
                            : metrics.battery.level > 20
                            ? ['#FAAD14', '#FFC53D']
                            : ['#FF4D4F', '#FF7875']
                        }
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={[styles.batteryFill, { width: `${metrics.battery.level}%` }]}
                      />
                    </View>
                    <Text style={styles.batteryPercent}>{metrics.battery.level}%</Text>
                  </View>
                  <InfoRow
                    label="Status"
                    value={metrics.battery.isCharging ? 'Charging' : 'Not Charging'}
                    icon={metrics.battery.isCharging ? <Ionicons name="flash" size={16} color={colors.accent.success} /> : null}
                  />
                  <InfoRow label="State" value={metrics.battery.status} />
                </Card>
              )}

              {/* Network Card */}
              {metrics?.network && (
                <Card
                  title="Network"
                  icon={<Ionicons name="wifi" size={20} color={colors.accent.primary} />}
                >
                  <InfoRow
                    label="Connection"
                    value={metrics.network.isConnected ? 'Connected' : 'Disconnected'}
                    valueColor={metrics.network.isConnected ? colors.status.online : colors.status.error}
                  />
                  <InfoRow label="Type" value={metrics.network.type} />
                  <InfoRow label="Signal" value={`${metrics.network.signalStrength}%`} />
                </Card>
              )}

              {/* Storage Card */}
              {metrics?.storage && (
                <Card
                  title="Storage"
                  icon={<MaterialCommunityIcons name="harddisk" size={20} color={colors.accent.primary} />}
                >
                  <InfoRow label="Total" value={metrics.storage.totalFormatted} />
                  <InfoRow label="Used" value={metrics.storage.usedFormatted} />
                  <InfoRow label="Available" value={metrics.storage.availableFormatted} />
                  <View style={styles.storageBarContainer}>
                    <View
                      style={[
                        styles.storageBar,
                        { width: `${metrics.storage.usagePercent}%` },
                      ]}
                    />
                  </View>
                </Card>
              )}

              {/* CPU & Memory */}
              {(metrics?.cpu || metrics?.memory) && (
                <Card
                  title="Performance"
                  icon={<Ionicons name="speedometer" size={20} color={colors.accent.primary} />}
                >
                  {metrics?.cpu && (
                    <InfoRow label="CPU Usage" value={`${metrics.cpu.usagePercent}%`} />
                  )}
                  {metrics?.memory && (
                    <>
                      <InfoRow label="Memory Usage" value={`${metrics.memory.usagePercent}%`} />
                      <InfoRow label="Memory Used" value={metrics.memory.usedFormatted} />
                      <InfoRow label="Memory Total" value={metrics.memory.totalFormatted} />
                    </>
                  )}
                </Card>
              )}

              {/* Modern Footer */}
              <View style={styles.modernFooter}>
                <LinearGradient
                  colors={['transparent', colors.background.elevated]}
                  style={styles.footerGradient}
                >
                  <View style={styles.footerContent}>
                    {/* Last Updated Section */}
                    {metrics?.lastUpdate && (
                      <View style={styles.footerRow}>
                        <Ionicons name="time-outline" size={16} color={colors.accent.primary} />
                        <Text style={styles.footerLabel}>Last Updated</Text>
                        <Text style={styles.footerValue}>
                          {new Date(metrics.lastUpdate).toLocaleTimeString()}
                        </Text>
                      </View>
                    )}

                    {/* Device ID Section */}
                    {deviceId && (
                      <View style={styles.footerRow}>
                        <Ionicons name="phone-portrait-outline" size={16} color={colors.accent.primary} />
                        <Text style={styles.footerLabel}>Device ID</Text>
                        <Text style={styles.footerValue} numberOfLines={1} ellipsizeMode="middle">
                          {deviceId.slice(0, 8)}...
                        </Text>
                      </View>
                    )}

                    {/* Protection Status */}
                    <View style={styles.footerRow}>
                      <Ionicons name="shield-checkmark" size={16} color={colors.accent.success} />
                      <Text style={styles.footerLabel}>Protection</Text>
                      <Text style={[styles.footerValue, { color: colors.accent.success }]}>
                        Active
                      </Text>
                    </View>

                    {/* Branding */}
                    <View style={styles.footerBranding}>
                      <View style={styles.brandingDivider} />
                      <Text style={styles.brandingText}>PMK Child Monitor</Text>
                      <Text style={styles.brandingVersion}>v1.0.0</Text>
                    </View>
                  </View>
                </LinearGradient>
              </View>

              <View style={{ height: Platform.OS === 'ios' ? 20 : 20 }} />
            </ScrollView>
          </Animated.View>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
};

// Sub Components
interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, color }) => (
  <View style={styles.statCard}>
    <View style={styles.statIconContainer}>{icon}</View>
    <Text style={styles.statLabel}>{label}</Text>
    <Text style={[styles.statValue, { color }]}>{value}</Text>
  </View>
);

interface CardProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

const Card: React.FC<CardProps> = ({ title, icon, children }) => (
  <View style={styles.card}>
    <View style={styles.cardHeader}>
      <View style={styles.cardIconContainer}>{icon}</View>
      <Text style={styles.cardTitle}>{title}</Text>
    </View>
    <View style={styles.cardContent}>{children}</View>
  </View>
);

interface InfoRowProps {
  label: string;
  value: string;
  valueColor?: string;
  icon?: React.ReactNode;
}

const InfoRow: React.FC<InfoRowProps> = ({ label, value, valueColor, icon }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <View style={styles.infoValueContainer}>
      {icon && <View style={styles.infoIcon}>{icon}</View>}
      <Text style={[styles.infoValue, valueColor && { color: valueColor }]}>{value}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: { flex: 1 },
  safeArea: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: spacing.xl },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  headerLeft: { flex: 1 },
  headerTitle: { ...typography.h2, color: colors.text.primary },
  headerSubtitle: { ...typography.body, color: colors.text.secondary, marginTop: spacing.xs },
  parentText: { ...typography.caption, color: colors.text.tertiary, marginTop: spacing.xs, fontStyle: 'italic' },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { ...typography.caption, color: colors.text.primary, fontWeight: '600' },
  heroSection: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xl,
    marginTop: spacing.md,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.xl,
  },
  heroGradient: {
    padding: spacing.xl,
    position: 'relative',
    minHeight: 200,
  },
  heroContent: {
    alignItems: 'center',
    zIndex: 10,
  },
  heroIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  heroSubtitle: {
    ...typography.body,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: spacing.lg,
    maxWidth: width * 0.7,
    lineHeight: 20,
  },
  heroStats: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
    gap: spacing.md,
  },
  heroStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  heroStatText: {
    ...typography.small,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  heroStatDivider: {
    width: 1,
    height: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  heroCircle1: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    top: -30,
    right: -40,
  },
  heroCircle2: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    bottom: -20,
    left: -30,
  },
  quickStats: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.background.tertiary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  statIconContainer: { marginBottom: spacing.xs },
  statLabel: { ...typography.caption, color: colors.text.secondary, marginBottom: spacing.xs, textAlign: 'center' },
  statValue: { ...typography.body, fontWeight: '700', fontSize: 14 },
  card: {
    backgroundColor: colors.background.tertiary,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  cardIconContainer: { marginRight: spacing.sm },
  cardTitle: { ...typography.h4, color: colors.text.primary },
  cardContent: {},
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  infoLabel: { ...typography.body, color: colors.text.secondary, flex: 1 },
  infoValueContainer: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  infoIcon: {},
  infoValue: { ...typography.body, color: colors.text.primary, fontWeight: '600', textAlign: 'right' },
  batteryContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md, gap: spacing.md },
  batteryBarContainer: {
    flex: 1,
    height: 28,
    backgroundColor: colors.background.elevated,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  batteryFill: { height: '100%', borderRadius: borderRadius.md },
  batteryPercent: { ...typography.h4, color: colors.text.primary, fontWeight: '700', width: 60, textAlign: 'right' },
  storageBarContainer: {
    height: 8,
    backgroundColor: colors.background.elevated,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
    marginTop: spacing.md,
  },
  storageBar: { height: '100%', backgroundColor: colors.accent.primary, borderRadius: borderRadius.sm },
  modernFooter: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  footerGradient: {
    padding: spacing.lg,
  },
  footerContent: {
    gap: spacing.md,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  footerLabel: {
    ...typography.caption,
    color: colors.text.secondary,
    flex: 1,
    marginLeft: spacing.xs,
  },
  footerValue: {
    ...typography.caption,
    color: colors.text.primary,
    fontWeight: '600',
  },
  footerBranding: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    alignItems: 'center',
    gap: spacing.xs,
  },
  brandingDivider: {
    width: '100%',
    height: 1,
    backgroundColor: colors.border.light,
    marginBottom: spacing.md,
  },
  brandingText: {
    ...typography.body,
    color: colors.accent.primary,
    fontWeight: '700',
  },
  brandingVersion: {
    ...typography.small,
    color: colors.text.tertiary,
  },
});

export default HomeScreen;
