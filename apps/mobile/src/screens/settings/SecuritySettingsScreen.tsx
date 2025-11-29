import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { useNavigation } from '@react-navigation/native';
import BiometricAuthService from '../../services/BiometricAuthService';
import { deviceInfo, spacing, typography, scale } from '../../utils/responsive';

interface SecuritySettings {
  biometricEnabled: boolean;
  twoFactorEnabled: boolean;
  sessionTimeout: number;
  deviceVerification: boolean;
  loginAlerts: boolean;
  suspiciousActivityAlerts: boolean;
}

const SecuritySettingsScreen = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState<string>('');

  const [settings, setSettings] = useState<SecuritySettings>({
    biometricEnabled: false,
    twoFactorEnabled: false,
    sessionTimeout: 30,
    deviceVerification: true,
    loginAlerts: true,
    suspiciousActivityAlerts: true,
  });

  useEffect(() => {
    loadSecuritySettings();
    checkBiometricAvailability();
  }, []);

  const checkBiometricAvailability = async () => {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      const available = compatible && enrolled;

      setBiometricAvailable(available);

      if (available) {
        const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
        if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
          setBiometricType('Face ID');
        } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
          setBiometricType('Fingerprint');
        } else {
          setBiometricType('Biometric');
        }
      }
    } catch (error) {
      console.error('Error checking biometric availability:', error);
    }
  };

  const loadSecuritySettings = async () => {
    try {
      setLoading(true);
      // Load settings from storage or API
      // For now, using mock data
      const mockSettings: SecuritySettings = {
        biometricEnabled: await BiometricAuthService.isBiometricEnabled(),
        twoFactorEnabled: false,
        sessionTimeout: 30,
        deviceVerification: true,
        loginAlerts: true,
        suspiciousActivityAlerts: true,
      };
      setSettings(mockSettings);
    } catch (error) {
      console.error('Error loading security settings:', error);
      Alert.alert('Error', 'Failed to load security settings');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (updatedSettings: Partial<SecuritySettings>) => {
    try {
      setSaving(true);
      // Save settings to API
      // For now, just update local state
      setSettings(prev => ({ ...prev, ...updatedSettings }));

      // Show success message
      Alert.alert('Success', 'Security settings updated');
    } catch (error) {
      console.error('Error saving security settings:', error);
      Alert.alert('Error', 'Failed to save security settings');
    } finally {
      setSaving(false);
    }
  };

  const handleBiometricToggle = async (value: boolean) => {
    if (!biometricAvailable) {
      Alert.alert(
        'Not Available',
        'Biometric authentication is not available on this device or not enrolled.'
      );
      return;
    }

    if (value) {
      // Enable biometric auth
      const result = await BiometricAuthService.authenticate(
        'Enable Biometric Login',
        'Authenticate to enable biometric login'
      );

      if (result.success) {
        await BiometricAuthService.enableBiometric();
        saveSettings({ biometricEnabled: true });
      }
    } else {
      // Disable biometric auth
      Alert.alert(
        'Disable Biometric Login',
        'Are you sure you want to disable biometric login?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Disable',
            style: 'destructive',
            onPress: async () => {
              await BiometricAuthService.disableBiometric();
              saveSettings({ biometricEnabled: false });
            },
          },
        ]
      );
    }
  };

  const handleTwoFactorToggle = (value: boolean) => {
    if (value) {
      // Navigate to 2FA setup screen
      Alert.alert(
        'Setup Two-Factor Authentication',
        'You will be guided through the setup process.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Continue',
            onPress: () => {
              // Navigate to 2FA setup
              // navigation.navigate('TwoFactorSetup');
              Alert.alert('Coming Soon', 'Two-factor authentication setup will be available soon.');
            },
          },
        ]
      );
    } else {
      Alert.alert(
        'Disable Two-Factor Authentication',
        'This will make your account less secure. Are you sure?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Disable',
            style: 'destructive',
            onPress: () => saveSettings({ twoFactorEnabled: false }),
          },
        ]
      );
    }
  };

  const handleSessionTimeoutChange = () => {
    const timeoutOptions = [5, 15, 30, 60, 120];
    const timeoutLabels = ['5 minutes', '15 minutes', '30 minutes', '1 hour', '2 hours'];

    Alert.alert(
      'Session Timeout',
      'Choose how long you want to stay logged in after inactivity',
      timeoutOptions.map((timeout, index) => ({
        text: timeoutLabels[index],
        onPress: () => saveSettings({ sessionTimeout: timeout }),
      }))
    );
  };

  const handleChangePassword = () => {
    // Navigate to change password screen
    Alert.alert('Change Password', 'You will receive a password reset email.');
    // In real implementation: navigation.navigate('ChangePassword');
  };

  const handleViewActiveSessions = () => {
    // Navigate to active sessions screen
    Alert.alert('Active Sessions', 'View and manage your active login sessions.');
    // In real implementation: navigation.navigate('ActiveSessions');
  };

  const handleSecurityCheckup = () => {
    Alert.alert(
      'Security Checkup',
      'Your account security is strong!\n\n✓ Strong password\n✓ Biometric login enabled\n✓ Login alerts enabled'
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Loading security settings...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Security Checkup */}
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.checkupButton}
          onPress={handleSecurityCheckup}
        >
          <Text style={styles.checkupButtonText}>🛡️ Run Security Checkup</Text>
        </TouchableOpacity>
      </View>

      {/* Authentication */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Authentication</Text>

        {biometricAvailable && (
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>{biometricType} Login</Text>
              <Text style={styles.settingDescription}>
                Use {biometricType.toLowerCase()} to log in quickly and securely
              </Text>
            </View>
            <Switch
              value={settings.biometricEnabled}
              onValueChange={handleBiometricToggle}
              disabled={saving}
              trackColor={{ false: '#767577', true: '#4F46E5' }}
              thumbColor={settings.biometricEnabled ? '#ffffff' : '#f4f3f4'}
            />
          </View>
        )}

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Two-Factor Authentication</Text>
            <Text style={styles.settingDescription}>
              Add an extra layer of security to your account
            </Text>
          </View>
          <Switch
            value={settings.twoFactorEnabled}
            onValueChange={handleTwoFactorToggle}
            disabled={saving}
            trackColor={{ false: '#767577', true: '#4F46E5' }}
            thumbColor={settings.twoFactorEnabled ? '#ffffff' : '#f4f3f4'}
          />
        </View>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleChangePassword}
        >
          <Text style={styles.actionButtonText}>Change Password</Text>
          <Text style={styles.actionButtonIcon}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Session Management */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Session Management</Text>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleSessionTimeoutChange}
        >
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Session Timeout</Text>
            <Text style={styles.settingDescription}>
              {settings.sessionTimeout} minutes
            </Text>
          </View>
          <Text style={styles.actionButtonIcon}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleViewActiveSessions}
        >
          <Text style={styles.actionButtonText}>Active Sessions</Text>
          <Text style={styles.actionButtonIcon}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Security Alerts */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Security Alerts</Text>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Login Alerts</Text>
            <Text style={styles.settingDescription}>
              Get notified when someone logs into your account
            </Text>
          </View>
          <Switch
            value={settings.loginAlerts}
            onValueChange={(value) => saveSettings({ loginAlerts: value })}
            disabled={saving}
            trackColor={{ false: '#767577', true: '#4F46E5' }}
            thumbColor={settings.loginAlerts ? '#ffffff' : '#f4f3f4'}
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Suspicious Activity Alerts</Text>
            <Text style={styles.settingDescription}>
              Get notified of unusual account activity
            </Text>
          </View>
          <Switch
            value={settings.suspiciousActivityAlerts}
            onValueChange={(value) => saveSettings({ suspiciousActivityAlerts: value })}
            disabled={saving}
            trackColor={{ false: '#767577', true: '#4F46E5' }}
            thumbColor={settings.suspiciousActivityAlerts ? '#ffffff' : '#f4f3f4'}
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Device Verification</Text>
            <Text style={styles.settingDescription}>
              Verify new devices before logging in
            </Text>
          </View>
          <Switch
            value={settings.deviceVerification}
            onValueChange={(value) => saveSettings({ deviceVerification: value })}
            disabled={saving}
            trackColor={{ false: '#767577', true: '#4F46E5' }}
            thumbColor={settings.deviceVerification ? '#ffffff' : '#f4f3f4'}
          />
        </View>
      </View>

      {/* Advanced */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Advanced</Text>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => Alert.alert('Coming Soon', 'Security log will be available soon.')}
        >
          <Text style={styles.actionButtonText}>View Security Log</Text>
          <Text style={styles.actionButtonIcon}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => Alert.alert('Coming Soon', 'Connected devices management will be available soon.')}
        >
          <Text style={styles.actionButtonText}>Connected Devices</Text>
          <Text style={styles.actionButtonIcon}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  loadingText: {
    marginTop: spacing.lg,
    fontSize: typography.body1,
    color: '#9CA3AF',
  },
  section: {
    marginTop: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.body2,
    fontWeight: '600',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.md,
  },
  checkupButton: {
    backgroundColor: '#4F46E5',
    padding: spacing.lg,
    borderRadius: deviceInfo.isTablet ? 14 : 12,
    alignItems: 'center',
  },
  checkupButtonText: {
    fontSize: typography.body1,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    padding: spacing.lg,
    borderRadius: deviceInfo.isTablet ? 14 : 12,
    marginBottom: spacing.sm,
  },
  settingInfo: {
    flex: 1,
    marginRight: spacing.lg,
  },
  settingLabel: {
    fontSize: typography.body1,
    fontWeight: '500',
    color: '#FFFFFF',
    marginBottom: spacing.xs,
  },
  settingDescription: {
    fontSize: typography.body2,
    color: '#9CA3AF',
  },
  actionButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    padding: spacing.lg,
    borderRadius: deviceInfo.isTablet ? 14 : 12,
    marginBottom: spacing.sm,
  },
  actionButtonText: {
    fontSize: typography.body1,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  actionButtonIcon: {
    fontSize: typography.h4,
    color: '#9CA3AF',
  },
  bottomPadding: {
    height: 40,
  },
});

export default SecuritySettingsScreen;
