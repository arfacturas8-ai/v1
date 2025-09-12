/**
 * LOGIN SCREEN
 * Crash-safe authentication with biometric support
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../stores/authStore';
import { CrashDetector } from '../../utils/CrashDetector';
import { ErrorBoundary, useErrorHandler } from '../../components/ErrorBoundary';

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

const LoginScreen: React.FC = () => {
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
  });
  const [formErrors, setFormErrors] = useState<LoginFormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  const {
    login,
    loginWithBiometric,
    isLoading,
    error,
    clearError,
    biometricAvailable,
    lockoutTime,
    authAttempts,
    resetAuthAttempts,
  } = useAuthStore();

  const handleError = useErrorHandler();

  // Handle lockout countdown
  const [lockoutTimeRemaining, setLockoutTimeRemaining] = useState(0);

  useEffect(() => {
    if (lockoutTime) {
      const updateCountdown = () => {
        const remaining = Math.max(0, Math.ceil((lockoutTime - Date.now()) / 1000));
        setLockoutTimeRemaining(remaining);
        
        if (remaining === 0) {
          resetAuthAttempts();
        }
      };

      updateCountdown();
      const interval = setInterval(updateCountdown, 1000);
      
      return () => clearInterval(interval);
    }
  }, [lockoutTime, resetAuthAttempts]);

  // Clear errors when form changes
  useEffect(() => {
    if (error) {
      const timer = setTimeout(clearError, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

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
    try {
      setFormData(prev => ({ ...prev, [field]: value }));
      
      // Clear field-specific error
      if (formErrors[field]) {
        setFormErrors(prev => ({ ...prev, [field]: undefined }));
      }
    } catch (error) {
      handleError(error instanceof Error ? error : new Error(String(error)));
    }
  }, [formErrors, handleError]);

  const handleLogin = useCallback(async () => {
    try {
      if (lockoutTimeRemaining > 0) {
        Alert.alert(
          'Account Locked',
          `Too many failed attempts. Please wait ${lockoutTimeRemaining} seconds.`
        );
        return;
      }

      if (!validateForm()) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
      }

      clearError();
      
      const success = await login(formData.email.trim(), formData.password);
      
      if (success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        // Navigation handled by RootNavigator
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        
        if (authAttempts >= 2) {
          Alert.alert(
            'Login Failed',
            'Multiple failed attempts detected. Please check your credentials carefully.',
            [{ text: 'OK' }]
          );
        }
      }
    } catch (error) {
      console.error('[LoginScreen] Login error:', error);
      handleError(error instanceof Error ? error : new Error(String(error)));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, [formData, validateForm, login, clearError, authAttempts, lockoutTimeRemaining, handleError]);

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

      clearError();
      
      const success = await loginWithBiometric();
      
      if (success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch (error) {
      console.error('[LoginScreen] Biometric login error:', error);
      handleError(error instanceof Error ? error : new Error(String(error)));
      
      Alert.alert(
        'Biometric Login Failed',
        'Please try again or use your password.',
        [{ text: 'OK' }]
      );
    }
  }, [biometricAvailable, loginWithBiometric, clearError, handleError]);

  const handleForgotPassword = useCallback(() => {
    try {
      Alert.alert(
        'Reset Password',
        'Password reset functionality will be available soon.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      handleError(error instanceof Error ? error : new Error(String(error)));
    }
  }, [handleError]);

  const isFormValid = formData.email.trim() && formData.password && !isLoading;
  const showLockoutWarning = authAttempts >= 2 && !lockoutTime;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <LinearGradient
        colors={['#000000', '#1a1a1a', '#000000']}
        style={styles.gradient}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoid}
        >
          <View style={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Welcome Back</Text>
              <Text style={styles.subtitle}>Sign in to your CRYB account</Text>
            </View>

            {/* Error Display */}
            {error && (
              <View style={styles.errorContainer}>
                <Ionicons name="warning" size={20} color="#ff6b6b" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Lockout Warning */}
            {showLockoutWarning && (
              <View style={styles.warningContainer}>
                <Ionicons name="shield-checkmark" size={20} color="#ffa726" />
                <Text style={styles.warningText}>
                  {3 - authAttempts} attempt{3 - authAttempts !== 1 ? 's' : ''} remaining
                </Text>
              </View>
            )}

            {/* Lockout Display */}
            {lockoutTimeRemaining > 0 && (
              <View style={styles.lockoutContainer}>
                <Ionicons name="time" size={20} color="#ff6b6b" />
                <Text style={styles.lockoutText}>
                  Account locked for {lockoutTimeRemaining} seconds
                </Text>
              </View>
            )}

            {/* Form */}
            <View style={styles.form}>
              {/* Email Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Email</Text>
                <View style={[styles.inputWrapper, formErrors.email && styles.inputError]}>
                  <Ionicons name="mail" size={20} color="#666" />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter your email"
                    placeholderTextColor="#666"
                    value={formData.email}
                    onChangeText={(value) => handleInputChange('email', value)}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!isLoading && lockoutTimeRemaining === 0}
                  />
                </View>
                {formErrors.email && (
                  <Text style={styles.fieldError}>{formErrors.email}</Text>
                )}
              </View>

              {/* Password Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Password</Text>
                <View style={[styles.inputWrapper, formErrors.password && styles.inputError]}>
                  <Ionicons name="lock-closed" size={20} color="#666" />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter your password"
                    placeholderTextColor="#666"
                    value={formData.password}
                    onChangeText={(value) => handleInputChange('password', value)}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!isLoading && lockoutTimeRemaining === 0}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.showPasswordButton}
                    disabled={isLoading}
                  >
                    <Ionicons
                      name={showPassword ? 'eye-off' : 'eye'}
                      size={20}
                      color="#666"
                    />
                  </TouchableOpacity>
                </View>
                {formErrors.password && (
                  <Text style={styles.fieldError}>{formErrors.password}</Text>
                )}
              </View>

              {/* Forgot Password */}
              <TouchableOpacity
                onPress={handleForgotPassword}
                style={styles.forgotPasswordButton}
                disabled={isLoading}
              >
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>

            {/* Actions */}
            <View style={styles.actions}>
              {/* Login Button */}
              <TouchableOpacity
                style={[
                  styles.loginButton,
                  (!isFormValid || lockoutTimeRemaining > 0) && styles.loginButtonDisabled
                ]}
                onPress={handleLogin}
                disabled={!isFormValid || lockoutTimeRemaining > 0}
              >
                {isLoading ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Text style={styles.loginButtonText}>Sign In</Text>
                )}
              </TouchableOpacity>

              {/* Biometric Login */}
              {biometricAvailable && (
                <TouchableOpacity
                  style={styles.biometricButton}
                  onPress={handleBiometricLogin}
                  disabled={isLoading || lockoutTimeRemaining > 0}
                >
                  <Ionicons name="finger-print" size={24} color="#4a9eff" />
                  <Text style={styles.biometricButtonText}>Use Biometric</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Register Link */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>Don't have an account?</Text>
              <TouchableOpacity disabled={isLoading}>
                <Text style={styles.registerLink}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  gradient: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#cccccc',
    textAlign: 'center',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.3)',
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 167, 38, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 167, 38, 0.3)',
  },
  warningText: {
    color: '#ffa726',
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  lockoutContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.5)',
  },
  lockoutText: {
    color: '#ff6b6b',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  form: {
    marginBottom: 40,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#333333',
  },
  inputError: {
    borderColor: '#ff6b6b',
    backgroundColor: 'rgba(255, 107, 107, 0.05)',
  },
  textInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 16,
    marginLeft: 12,
  },
  showPasswordButton: {
    padding: 4,
  },
  fieldError: {
    color: '#ff6b6b',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginTop: 8,
  },
  forgotPasswordText: {
    color: '#4a9eff',
    fontSize: 14,
    fontWeight: '500',
  },
  actions: {
    gap: 16,
    marginBottom: 40,
  },
  loginButton: {
    backgroundColor: '#4a9eff',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginButtonDisabled: {
    backgroundColor: '#333333',
    opacity: 0.5,
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  biometricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#4a9eff',
    gap: 8,
  },
  biometricButtonText: {
    color: '#4a9eff',
    fontSize: 16,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  footerText: {
    color: '#cccccc',
    fontSize: 14,
  },
  registerLink: {
    color: '#4a9eff',
    fontSize: 14,
    fontWeight: '600',
  },
});

// Wrap with error boundary
export default function SafeLoginScreen() {
  return (
    <ErrorBoundary>
      <LoginScreen />
    </ErrorBoundary>
  );
}