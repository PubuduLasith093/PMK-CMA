import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
  Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { RegistrationScreenNavigationProp } from '../navigation/types';
import { setDeviceRegistered } from '../store/slices/authSlice';
import deviceService, { AccessKeyValidationResponse } from '../services/api/deviceService';
import { colors, spacing, borderRadius, shadows, typography } from '../theme/colors';

const RegistrationScreen: React.FC = () => {
  const navigation = useNavigation<RegistrationScreenNavigationProp>();
  const dispatch = useDispatch();

  const [accessKey, setAccessKey] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [validationData, setValidationData] = useState<AccessKeyValidationResponse | null>(null);
  const [isValidated, setIsValidated] = useState(false);

  const handleValidateAccessKey = async () => {
    if (!accessKey.trim()) {
      Alert.alert('Required', 'Please enter your access key');
      return;
    }

    if (Platform.OS === 'ios') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    setIsValidating(true);

    try {
      const response = await deviceService.validateAccessKey(accessKey.trim());
      setValidationData(response);

      if (response.success && response.isValid) {
        setIsValidated(true);
        if (Platform.OS === 'ios') {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        Alert.alert(
          '✓ Valid Access Key',
          `Child: ${response.data?.childName}\nParent: ${response.data?.parentName}`,
          [{ text: 'Continue', style: 'default' }]
        );
      } else {
        if (Platform.OS === 'ios') {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
        Alert.alert('Invalid Key', response.message);
        setIsValidated(false);
      }
    } catch (error: any) {
      console.error('Access key validation error:', error);
      Alert.alert('Error', error.message || 'Failed to validate access key');
      setIsValidated(false);
    } finally {
      setIsValidating(false);
    }
  };

  const handleActivateDevice = async () => {
    if (!isValidated || !validationData?.isValid) {
      Alert.alert('Error', 'Please validate the access key first');
      return;
    }

    if (Platform.OS === 'ios') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setIsActivating(true);

    try {
      const response = await deviceService.registerDevice(accessKey.trim());

      if (response.success) {
        dispatch(
          setDeviceRegistered({
            deviceId: response.deviceId,
            childId: response.childId,
            userId: response.userId,
            token: response.token,
            childName: response.childName,
            parentName: response.parentName,
          })
        );

        if (Platform.OS === 'ios') {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }

        // Replace navigation stack with Main - user cannot swipe back to Registration
        console.log('Device activated successfully, replacing navigation to Main');
        navigation.replace('Main');
      } else {
        Alert.alert('Activation Failed', response.message);
      }
    } catch (error: any) {
      console.error('Device activation error:', error);
      Alert.alert('Error', error.message || 'Failed to activate device');
    } finally {
      setIsActivating(false);
    }
  };

  return (
    <LinearGradient colors={[colors.background.primary, colors.background.secondary]} style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {/* Header */}
          <View style={styles.header}>
            <LinearGradient
              colors={colors.gradient.primary}
              style={styles.logoCircle}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="key" size={36} color="#FFFFFF" />
            </LinearGradient>
            <Text style={styles.title}>Device Registration</Text>
            <Text style={styles.subtitle}>Enter your access key to get started</Text>
          </View>

          {/* Input Card */}
          <View style={styles.card}>
            <Text style={styles.label}>Access Key</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="XXXX-XXXX"
                placeholderTextColor={colors.text.tertiary}
                value={accessKey}
                onChangeText={setAccessKey}
                autoCapitalize="characters"
                autoCorrect={false}
                editable={!isValidated}
              />
            </View>

            {isValidated && validationData?.data && (
              <View style={styles.validationCard}>
                <View style={styles.validationHeader}>
                  <Ionicons name="checkmark-circle" size={24} color={colors.accent.success} />
                  <Text style={styles.validationTitle}>Key Validated</Text>
                </View>
                <View style={styles.validationRow}>
                  <Ionicons name="person" size={16} color={colors.accent.primary} />
                  <Text style={styles.validationLabel}>Child:</Text>
                  <Text style={styles.validationValue}>{validationData.data.childName}</Text>
                </View>
                <View style={styles.validationRow}>
                  <Ionicons name="shield-checkmark" size={16} color={colors.accent.primary} />
                  <Text style={styles.validationLabel}>Parent:</Text>
                  <Text style={styles.validationValue}>{validationData.data.parentName}</Text>
                </View>
              </View>
            )}

            {/* Validate Button */}
            {!isValidated && (
              <TouchableOpacity
                style={styles.button}
                onPress={handleValidateAccessKey}
                disabled={isValidating}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={colors.gradient.primary}
                  style={styles.buttonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {isValidating ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.buttonText}>Validate Key</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            )}

            {/* Activate Button */}
            {isValidated && (
              <TouchableOpacity
                style={styles.button}
                onPress={handleActivateDevice}
                disabled={isActivating}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[colors.accent.success, '#6FD943']}
                  style={styles.buttonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {isActivating ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.buttonText}>Activate Device</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>

          {/* Instructions */}
          <View style={styles.instructions}>
            <Text style={styles.instructionTitle}>How to Register:</Text>
            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Ionicons name="desktop" size={14} color={colors.accent.primary} />
              </View>
              <Text style={styles.stepText}>Get access key from parent dashboard</Text>
            </View>
            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Ionicons name="key-outline" size={14} color={colors.accent.primary} />
              </View>
              <Text style={styles.stepText}>Enter key and validate</Text>
            </View>
            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Ionicons name="checkmark-done" size={14} color={colors.accent.primary} />
              </View>
              <Text style={styles.stepText}>Activate device and start monitoring</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: spacing.xl, paddingVertical: spacing.xxl },
  header: { alignItems: 'center', marginBottom: spacing.xxl },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.accent.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
    ...shadows.lg,
  },
  logoText: { fontSize: 32, fontWeight: '900', color: '#FFFFFF' },
  title: { ...typography.h2, color: colors.text.primary, marginBottom: spacing.sm },
  subtitle: { ...typography.body, color: colors.text.secondary, textAlign: 'center' },
  card: {
    backgroundColor: colors.background.tertiary,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  label: { ...typography.caption, color: colors.text.secondary, marginBottom: spacing.sm, fontWeight: '600' },
  inputContainer: {
    backgroundColor: colors.background.elevated,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.light,
    marginBottom: spacing.md,
  },
  input: {
    ...typography.h4,
    color: colors.text.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    textAlign: 'center',
    letterSpacing: 2,
  },
  validationCard: {
    backgroundColor: colors.background.elevated,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.accent.success,
  },
  validationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    gap: spacing.sm,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  validationTitle: { ...typography.h4, color: colors.accent.success, fontWeight: '700' },
  validationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingVertical: spacing.xs,
  },
  validationLabel: {
    ...typography.body,
    color: colors.text.secondary,
    fontWeight: '500',
    width: 80,
    marginLeft: spacing.sm,
  },
  validationValue: {
    ...typography.body,
    color: colors.text.primary,
    fontWeight: '700',
    flex: 1,
    marginLeft: spacing.sm,
  },
  button: { borderRadius: borderRadius.md, overflow: 'hidden', ...shadows.md },
  buttonGradient: { paddingVertical: spacing.md, alignItems: 'center', justifyContent: 'center' },
  buttonText: { ...typography.h4, color: '#FFFFFF', fontWeight: '700' },
  instructions: { marginTop: spacing.lg },
  instructionTitle: { ...typography.h4, color: colors.text.primary, marginBottom: spacing.md },
  step: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.background.elevated,
    borderWidth: 1,
    borderColor: colors.border.light,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  stepText: { ...typography.body, color: colors.text.secondary, flex: 1 },
});

export default RegistrationScreen;
