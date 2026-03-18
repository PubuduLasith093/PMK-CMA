import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Animated,
  Platform,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { WelcomeScreenNavigationProp } from '../navigation/types';
import deviceService from '../services/api/deviceService';
import { setDeviceRegistered } from '../store/slices/authSlice';
import { colors, spacing, borderRadius, shadows, typography } from '../theme/colors';

const { width, height } = Dimensions.get('window');

const WelcomeScreen: React.FC = () => {
  const navigation = useNavigation<WelcomeScreenNavigationProp>();
  const dispatch = useDispatch();
  const [isChecking, setIsChecking] = useState(false);

  // Animation values
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(50))[0];
  const scaleAnim = useState(new Animated.Value(0.9))[0];
  const arrowAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Start entrance animations immediately
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Animated arrow loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(arrowAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(arrowAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Pulse animation for logo (subtle breathing effect)
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Glow pulse animation (for the glow effect)
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Subtle rotation animation
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 20000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const handleGetStarted = async () => {
    // Haptic feedback
    if (Platform.OS === 'ios') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setIsChecking(true);

    try {
      // Check if device is already registered
      const credentials = await deviceService.getDeviceCredentials();

      if (credentials) {
        console.log('Local credentials found, validating with backend...');
        const validation = await deviceService.validateDeviceWithBackend();

        if (validation.success && validation.isValid) {
          // Valid credentials, set in Redux and navigate to Home
          dispatch(
            setDeviceRegistered({
              deviceId: credentials.deviceId,
              childId: credentials.childId,
              userId: credentials.userId,
              token: credentials.token,
              childName: credentials.childName,
              parentName: credentials.parentName || 'Your Parent',
            })
          );
          console.log('Device credentials validated, replacing navigation to Main');
          navigation.replace('Main');
        } else if (validation.success && !validation.isValid) {
          // Invalid credentials, clear and go to registration
          console.log('Device validation failed:', validation.message);
          await deviceService.clearDeviceCredentials();
          console.log('Credentials cleared - device needs re-registration');
          navigation.navigate('Registration');
        } else {
          // Network error - give user choice instead of auto-redirecting
          console.log('Validation request failed (network/backend error)');

          // Stop loading state before showing alert
          setIsChecking(false);

          Alert.alert(
            'Connection Error',
            'Unable to connect to the server. Your device was registered previously, but we cannot verify the connection right now.\n\nWhat would you like to do?',
            [
              {
                text: 'Retry',
                onPress: () => handleGetStarted(), // Retry validation
                style: 'default',
              },
              {
                text: 'Continue Offline',
                onPress: () => {
                  console.log('User chose to proceed in offline mode with cached credentials');
                  dispatch(
                    setDeviceRegistered({
                      deviceId: credentials.deviceId,
                      childId: credentials.childId,
                      userId: credentials.userId,
                      token: credentials.token,
                      childName: credentials.childName,
                      parentName: credentials.parentName || 'Your Parent',
                    })
                  );
                  navigation.replace('Main');
                },
                style: 'default',
              },
              {
                text: 'Re-register',
                onPress: async () => {
                  console.log('User chose to re-register device');
                  await deviceService.clearDeviceCredentials();
                  navigation.navigate('Registration');
                },
                style: 'destructive',
              },
            ],
            { cancelable: false }
          );

          return; // Exit early to prevent finally block from setting isChecking
        }
      } else {
        // No credentials found, go to registration
        console.log('No device credentials found, navigating to Registration');
        navigation.navigate('Registration');
      }
    } catch (error) {
      console.error('Error checking registration:', error);
      navigation.navigate('Registration');
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <LinearGradient
      colors={[colors.background.primary, colors.background.secondary]}
      style={styles.container}
    >
      <View style={styles.content}>
        {/* Logo with Shield Icon - Multiple Animated Layers */}
        <Animated.View style={[styles.logoContainer, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
          {/* Outer pulsing glow ring */}
          <Animated.View
            style={[
              styles.logoGlowOuter,
              {
                opacity: glowAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.15, 0.3],
                }),
                transform: [
                  {
                    scale: glowAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1.3, 1.5],
                    }),
                  },
                ],
              },
            ]}
          />

          {/* Middle glow layer */}
          <Animated.View
            style={[
              styles.logoGlowMiddle,
              {
                opacity: glowAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.2, 0.4],
                }),
                transform: [
                  {
                    scale: glowAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1.15, 1.25],
                    }),
                  },
                ],
              },
            ]}
          />

          {/* Main logo circle with pulse and subtle rotation */}
          <Animated.View
            style={{
              transform: [
                { scale: pulseAnim },
                {
                  rotate: rotateAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '360deg'],
                  }),
                },
              ],
            }}
          >
            <LinearGradient
              colors={colors.gradient.primary}
              style={styles.logoCircle}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              {/* Shield icon with counter-rotation to keep it upright */}
              <Animated.View
                style={{
                  transform: [
                    {
                      rotate: rotateAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', '-360deg'],
                      }),
                    },
                  ],
                }}
              >
                <Ionicons name="shield-checkmark" size={56} color="#FFFFFF" />
              </Animated.View>
            </LinearGradient>
          </Animated.View>

          {/* Inner subtle glow */}
          <Animated.View
            style={[
              styles.logoGlow,
              {
                opacity: glowAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.1, 0.2],
                }),
              },
            ]}
          />
        </Animated.View>

        {/* App Title */}
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <Text style={styles.title}>PMK Child Monitor</Text>
          <Text style={styles.tagline}>Your Safety, Our Priority</Text>
          <Text style={styles.description}>
            Stay connected with your family and protected 24/7
          </Text>
        </Animated.View>
      </View>

      {/* Bottom Section */}
      <Animated.View
        style={[
          styles.bottomContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <TouchableOpacity
          style={styles.button}
          onPress={handleGetStarted}
          activeOpacity={0.8}
          disabled={isChecking}
        >
          <LinearGradient
            colors={colors.gradient.primary}
            style={styles.buttonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            {isChecking ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <View style={styles.buttonContent}>
                <Text style={styles.buttonText}>Get Started</Text>
                <Animated.View style={{
                  transform: [{
                    translateX: arrowAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 8],
                    })
                  }]
                }}>
                  <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
                </Animated.View>
              </View>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <Text style={styles.footerText}>
          Protected by PMK Parent Dashboard
        </Text>
      </Animated.View>
    </LinearGradient>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
  },
  logoContainer: {
    marginBottom: spacing.xxl,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.xl,
  },
  logoGlow: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.accent.primary,
    opacity: 0.15,
    transform: [{ scale: 1.3 }],
  },
  logoGlowOuter: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.accent.primary,
    opacity: 0.15,
  },
  logoGlowMiddle: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.accent.primary,
    opacity: 0.2,
  },
  title: {
    ...typography.h1,
    fontSize: 28,
    color: colors.text.primary,
    marginBottom: spacing.sm,
    textAlign: 'center',
    fontWeight: '900',
  },
  tagline: {
    ...typography.h4,
    fontSize: 18,
    color: colors.accent.primary,
    textAlign: 'center',
    marginBottom: spacing.md,
    fontWeight: '600',
  },
  description: {
    ...typography.body,
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    maxWidth: width * 0.75,
    lineHeight: 20,
  },
  bottomContainer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: Platform.OS === 'ios' ? spacing.xxl + spacing.lg : spacing.xl,
    gap: spacing.md,
  },
  button: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.lg,
  },
  buttonGradient: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  buttonText: {
    ...typography.h4,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  footerText: {
    ...typography.small,
    color: colors.text.tertiary,
    textAlign: 'center',
  },
});

export default WelcomeScreen;
