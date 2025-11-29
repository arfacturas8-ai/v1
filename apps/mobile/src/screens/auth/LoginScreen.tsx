/**
 * LOGIN SCREEN
 * Enhanced authentication with biometric support and real API integration
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Dimensions,
  Animated,
  ScrollView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import * as LocalAuthentication from 'expo-local-authentication';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import { useTheme } from '../../contexts/ThemeContext';
import { Button, Input, Card } from '../../components/ui';
import apiService from '../../services/RealApiService';
import { useAuthStore } from '../../stores/authStore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { deviceInfo, spacing, typography, scale } from '../../utils/responsive';

const { width, height } = Dimensions.get('window');

interface LoginFormData {
  email: string;
  password: string;
}

interface LoginFormErrors {
  email?: string;
  password?: string;
  general?: string;
}

type LoginScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

const LoginScreen: React.FC = () => {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const { colors, spacing, typography } = useTheme();
  const { setUser, setToken } = useAuthStore();
  
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
  });
  const [formErrors, setFormErrors] = useState<LoginFormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authAttempts, setAuthAttempts] = useState(0);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;
  
  useEffect(() => {
    // Check biometric availability
    checkBiometricAvailability();
    
    // Load saved email
    loadSavedCredentials();
    
    // Animate in
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);
  
  const checkBiometricAvailability = async () => {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      setBiometricAvailable(compatible && enrolled);
    } catch (error) {
      console.log('Biometric check failed:', error);
    }
  };
  
  const loadSavedCredentials = async () => {
    try {
      const savedEmail = await AsyncStorage.getItem('lastLoginEmail');
      if (savedEmail) {
        setFormData(prev => ({ ...prev, email: savedEmail }));
      }
    } catch (error) {
      console.log('Failed to load saved credentials:', error);
    }
  };

  // Clear errors after some time
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);
  
  // Reset attempts after successful form validation
  useEffect(() => {
    if (isFormValid && authAttempts > 0) {
      const timer = setTimeout(() => setAuthAttempts(0), 30000);
      return () => clearTimeout(timer);
    }
  }, [isFormValid, authAttempts]);

  const validateForm = useCallback((): boolean => {
    const errors: LoginFormErrors = {};

    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData]);

  const handleInputChange = useCallback((field: keyof LoginFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear field-specific error
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: undefined }));
    }
    
    // Clear general error
    if (error) {
      setError(null);
    }
  }, [formErrors, error]);

  const handleLogin = useCallback(async () => {
    try {
      if (!validateForm()) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
      }

      setIsLoading(true);
      setError(null);
      
      const result = await apiService.login(formData.email.trim(), formData.password);
      
      if (result.success && result.user && result.token) {
        // Save credentials for next time
        await AsyncStorage.setItem('lastLoginEmail', formData.email.trim());
        
        // Update auth store
        setUser(result.user);
        setToken(result.token);
        
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        // Navigation handled by RootNavigator
      } else {
        setAuthAttempts(prev => prev + 1);
        setError(result.message || 'Login failed. Please check your credentials.');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Network error. Please check your connection and try again.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
    }
  }, [formData, validateForm, setUser, setToken]);

  const handleBiometricLogin = useCallback(async () => {
    try {
      if (!biometricAvailable) {
        Alert.alert(
          'Biometric Not Available',
          'Biometric authentication is not set up on this device.',
          [{ text: 'OK' }]
        );
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Sign in to CRYB',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      });
      
      if (result.success) {
        // Try to get saved credentials
        const savedCredentials = await AsyncStorage.getItem('savedCredentials');
        if (savedCredentials) {
          const { email, password } = JSON.parse(savedCredentials);
          const loginResult = await apiService.login(email, password);
          
          if (loginResult.success && loginResult.user && loginResult.token) {
            setUser(loginResult.user);
            setToken(loginResult.token);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
        } else {
          Alert.alert(
            'No Saved Credentials',
            'Please log in with your password first to enable biometric login.',
            [{ text: 'OK' }]
          );
        }
      }
    } catch (error) {
      console.error('Biometric login error:', error);
      Alert.alert(
        'Biometric Login Failed',
        'Please try again or use your password.',
        [{ text: 'OK' }]
      );
    }
  }, [biometricAvailable, setUser, setToken]);

  const handleForgotPassword = useCallback(() => {
    navigation.navigate('ForgotPassword');
  }, [navigation]);

  const isFormValid = formData.email.trim() && formData.password && !isLoading;
  const showAttemptsWarning = authAttempts >= 2;
  const isLocked = authAttempts >= 5;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="auto" />
      <LinearGradient
        colors={[
          colors.background,
          colors.primary + '10',
          colors.background,
        ]}
        style={styles.gradient}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoid}
        >
          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Header with Logo */}
            <Animated.View 
              style={[
                styles.header,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                }
              ]}
            >
              <Animated.View 
                style={[
                  styles.logoContainer,
                  {
                    backgroundColor: colors.primary,
                    transform: [{ scale: logoScale }],
                  }
                ]}
              >
                <Text style={[styles.logoText, { color: colors.textInverse }]}>C</Text>
              </Animated.View>
              <Text style={[styles.title, { color: colors.text }]}>Welcome Back</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                Sign in to your CRYB account
              </Text>
            </Animated.View>

            {/* Main Card */}
            <Animated.View
              style={[
                styles.cardContainer,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                }
              ]}
            >
              <Card variant="elevated" padding="lg">
                {/* Error Display */}
                {error && (
                  <View style={[styles.errorContainer, { backgroundColor: colors.error + '15', borderColor: colors.error + '30' }]}>
                    <Ionicons name="warning" size={20} color={colors.error} />
                    <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
                  </View>
                )}

                {/* Attempts Warning */}
                {showAttemptsWarning && !isLocked && (
                  <View style={[styles.warningContainer, { backgroundColor: colors.warning + '15', borderColor: colors.warning + '30' }]}>
                    <Ionicons name="shield-checkmark" size={20} color={colors.warning} />
                    <Text style={[styles.warningText, { color: colors.warning }]}>
                      {5 - authAttempts} attempt{5 - authAttempts !== 1 ? 's' : ''} remaining
                    </Text>
                  </View>
                )}

                {/* Lockout Display */}
                {isLocked && (
                  <View style={[styles.lockoutContainer, { backgroundColor: colors.error + '20', borderColor: colors.error + '50' }]}>
                    <Ionicons name="lock-closed" size={20} color={colors.error} />
                    <Text style={[styles.lockoutText, { color: colors.error }]}>
                      Account temporarily locked. Please try again later.
                    </Text>
                  </View>
                )}

                {/* Form */}
                <View style={styles.form}>
                  <Input
                    label="Email"
                    value={formData.email}
                    onChangeText={(value) => handleInputChange('email', value)}
                    leftIcon="mail"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    error={formErrors.email}
                    containerStyle={{ marginBottom: spacing.md }}
                    editable={!isLoading && !isLocked}
                  />

                  <Input
                    label="Password"
                    value={formData.password}
                    onChangeText={(value) => handleInputChange('password', value)}
                    leftIcon="lock-closed"
                    rightIcon={showPassword ? 'eye-off' : 'eye'}
                    onRightIconPress={() => setShowPassword(!showPassword)}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    error={formErrors.password}
                    containerStyle={{ marginBottom: spacing.sm }}
                    editable={!isLoading && !isLocked}
                  />

                  {/* Forgot Password */}
                  <Button
                    title="Forgot Password?"
                    onPress={handleForgotPassword}
                    variant="ghost"
                    size="sm"
                    style={styles.forgotPasswordButton}
                    textStyle={{ color: colors.primary }}
                    disabled={isLoading}
                  />
                </View>

                {/* Actions */}
                <View style={styles.actions}>
                  {/* Login Button */}
                  <Button
                    title="Sign In"
                    onPress={handleLogin}
                    variant="primary"
                    size="lg"
                    fullWidth
                    loading={isLoading}
                    disabled={!isFormValid || isLocked}
                    style={{ marginBottom: spacing.md }}
                  />

                  {/* Biometric Login */}
                  {biometricAvailable && (
                    <Button
                      title="Use Biometric"
                      onPress={handleBiometricLogin}
                      variant="outline"
                      size="lg"
                      fullWidth
                      icon={<Ionicons name="finger-print" size={20} color={colors.primary} />}
                      disabled={isLoading || isLocked}
                    />
                  )}
                </View>
              </Card>
            </Animated.View>

            {/* Register Link */}
            <Animated.View
              style={[
                styles.footer,
                {
                  opacity: fadeAnim,
                }
              ]}
            >
              <Text style={[styles.footerText, { color: colors.textSecondary }]}>
                Don't have an account?
              </Text>
              <Button
                title="Sign Up"
                onPress={() => navigation.navigate('Register')}
                variant="ghost"
                size="sm"
                textStyle={{ color: colors.primary }}
                disabled={isLoading}
              />
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.xxxl,
    paddingBottom: spacing.xxxl,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xxxl,
  },
  logoContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  logoText: {
    fontSize: typography.h3,
    fontWeight: '800',
  },
  title: {
    fontSize: typography.h3,
    fontWeight: '700',
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: typography.body1,
    textAlign: 'center',
    lineHeight: 24,
  },
  cardContainer: {
    marginBottom: spacing.xxl,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.lg,
    borderWidth: 1,
  },
  errorText: {
    fontSize: typography.body2,
    marginLeft: spacing.sm,
    flex: 1,
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.lg,
    borderWidth: 1,
  },
  warningText: {
    fontSize: typography.body2,
    marginLeft: spacing.sm,
    flex: 1,
  },
  lockoutContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.lg,
    borderWidth: 1,
  },
  lockoutText: {
    fontSize: typography.body2,
    fontWeight: '600',
    marginLeft: spacing.sm,
    flex: 1,
  },
  form: {
    marginBottom: spacing.xxl,
  },
  forgotPasswordButton: {
    alignSelf: 'flex-end',
  },
  actions: {
    marginBottom: spacing.xxl,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: spacing.xl,
  },
  footerText: {
    fontSize: typography.body2,
    marginRight: spacing.sm,
  },
});

export { LoginScreen };