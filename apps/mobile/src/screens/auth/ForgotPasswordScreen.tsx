import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
  Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../contexts/ThemeContext';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import { Button, Input, Card } from '../../components/ui';
import apiService from '../../services/RealApiService';
import { deviceInfo, spacing, typography, scale } from '../../utils/responsive';

type ForgotPasswordScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'ForgotPassword'>;

export function ForgotPasswordScreen() {
  const navigation = useNavigation<ForgotPasswordScreenNavigationProp>();
  const { colors, spacing, typography } = useTheme();

  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;
  
  useEffect(() => {
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

  const validateEmail = useCallback((email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  }, []);

  const handleResetPassword = useCallback(async () => {
    try {
      if (!email.trim()) {
        setError('Please enter your email address');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
      }

      if (!validateEmail(email)) {
        setError('Please enter a valid email address');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
      }

      setIsLoading(true);
      setError(null);
      
      const result = await apiService.forgotPassword(email.trim());
      
      if (result.success) {
        setEmailSent(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        setError(result.message || 'Failed to send reset email. Please try again.');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      setError('Network error. Please check your connection and try again.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
    }
  }, [email, validateEmail]);

  const handleBackToLogin = useCallback(() => {
    navigation.navigate('Login');
  }, [navigation]);
  
  const handleEmailChange = useCallback((value: string) => {
    setEmail(value);
    if (error) {
      setError(null);
    }
  }, [error]);

  if (emailSent) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <LinearGradient
          colors={[
            colors.background,
            colors.success + '10',
            colors.background,
          ]}
          style={styles.gradient}
        >
          <View style={styles.successContainer}>
            <Animated.View style={{ transform: [{ scale: logoScale }] }}>
              <View style={[styles.successIcon, { backgroundColor: colors.success }]}>
                <Ionicons name="mail" size={40} color={colors.textInverse} />
              </View>
            </Animated.View>
            
            <Text style={[styles.successTitle, { color: colors.text }]}>
              Email Sent!
            </Text>
            <Text style={[styles.successMessage, { color: colors.textSecondary }]}>
              We've sent password reset instructions to {email}
            </Text>
            
            <View style={styles.buttonContainer}>
              <Button
                title="Back to Login"
                onPress={handleBackToLogin}
                variant="primary"
                size="lg"
                fullWidth
                style={{ marginBottom: spacing.sm }}
              />
              
              <Button
                title="Send Again"
                onPress={() => setEmailSent(false)}
                variant="outline"
                size="lg"
                fullWidth
              />
            </View>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
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
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}
              >
                <Ionicons name="chevron-back" size={24} color={colors.text} />
              </TouchableOpacity>
              
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
              
              <Text style={[styles.title, { color: colors.text }]}>Forgot Password</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                Enter your email address and we'll send you instructions to reset your password
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

                {/* Email Input */}
                <Input
                  label="Email Address"
                  value={email}
                  onChangeText={handleEmailChange}
                  leftIcon="mail"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  placeholder="Enter your email address"
                  containerStyle={{ marginBottom: spacing.lg }}
                  editable={!isLoading}
                />

                {/* Send Reset Email Button */}
                <Button
                  title="Send Reset Email"
                  onPress={handleResetPassword}
                  variant="primary"
                  size="lg"
                  fullWidth
                  loading={isLoading}
                  disabled={!email.trim()}
                  style={{ marginBottom: spacing.md }}
                />

                {/* Help Text */}
                <View style={styles.helpContainer}>
                  <Ionicons name="information-circle" size={16} color={colors.info} />
                  <Text style={[styles.helpText, { color: colors.textSecondary }]}>
                    If you don't receive an email within a few minutes, check your spam folder or try again with a different email address.
                  </Text>
                </View>
              </Card>
            </Animated.View>

            {/* Alternative Actions */}
            <Animated.View
              style={[
                styles.footer,
                {
                  opacity: fadeAnim,
                }
              ]}
            >
              <View style={styles.alternativeActions}>
                <Text style={[styles.footerText, { color: colors.textSecondary }]}>
                  Remember your password?
                </Text>
                <Button
                  title="Back to Login"
                  onPress={handleBackToLogin}
                  variant="ghost"
                  size="sm"
                  textStyle={{ color: colors.primary }}
                  disabled={isLoading}
                />
              </View>
              
              <View style={styles.supportContainer}>
                <Text style={[styles.supportText, { color: colors.textTertiary }]}>
                  Still having trouble? Contact{' '}
                  <Text style={{ color: colors.primary }}>support@cryb.ai</Text>
                </Text>
              </View>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
}

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
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: 8,
    padding: 8,
    zIndex: 10,
  },
  logoContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  logoText: {
    fontSize: 28,
    fontWeight: '800',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 16,
  },
  cardContainer: {
    marginBottom: 24,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
  },
  errorText: {
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  helpContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 4,
  },
  helpText: {
    fontSize: 12,
    lineHeight: 18,
    marginLeft: 8,
    flex: 1,
  },
  footer: {
    paddingTop: 20,
  },
  alternativeActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  footerText: {
    fontSize: 14,
    marginRight: 8,
  },
  supportContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  supportText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  // Success screen styles
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  successIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 16,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
  },
  successMessage: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  buttonContainer: {
    width: '100%',
    paddingTop: 32,
    gap: 12,
  },
});