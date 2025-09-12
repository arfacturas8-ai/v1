import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useAuthStore } from '../stores/authStore';
import { MainStackParamList } from '../navigation/MainNavigator';

type SettingsScreenNavigationProp = NativeStackNavigationProp<MainStackParamList, 'Settings'>;

interface SettingItem {
  id: string;
  title: string;
  description?: string;
  type: 'toggle' | 'action' | 'navigation';
  value?: boolean;
  iconName: string;
  onPress?: () => void;
}

export function SettingsScreen() {
  const navigation = useNavigation<SettingsScreenNavigationProp>();
  const { colors, theme, setTheme } = useTheme();
  const { user, logout } = useAuthStore();

  const [notifications, setNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);

  const handleThemeChange = useCallback(() => {
    const themeOptions = [
      { title: 'Light', value: 'light' },
      { title: 'Dark', value: 'dark' },
      { title: 'Auto', value: 'auto' },
    ];

    Alert.alert(
      'Select Theme',
      'Choose your preferred theme',
      [
        ...themeOptions.map(option => ({
          text: option.title,
          onPress: () => setTheme(option.value as any),
          style: theme === option.value ? 'destructive' : 'default' as any,
        })),
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  }, [theme, setTheme]);

  const handleDataAndPrivacy = useCallback(() => {
    Alert.alert(
      'Data & Privacy',
      'Data and privacy settings will be available in the next update.',
      [{ text: 'OK' }]
    );
  }, []);

  const handleSecurity = useCallback(() => {
    Alert.alert(
      'Security Settings',
      'Security settings including 2FA will be available soon.',
      [{ text: 'OK' }]
    );
  }, []);

  const handleSupport = useCallback(() => {
    Alert.alert(
      'Help & Support',
      'For support, please email us at support@cryb.app',
      [{ text: 'OK' }]
    );
  }, []);

  const handleAbout = useCallback(() => {
    Alert.alert(
      'About CRYB',
      'CRYB v1.0.0\nNext-generation hybrid community platform\n\n© 2024 CRYB Platform',
      [{ text: 'OK' }]
    );
  }, []);

  const handleLogout = useCallback(() => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: () => logout(),
        },
      ]
    );
  }, [logout]);

  const accountSettings: SettingItem[] = [
    {
      id: 'profile',
      title: 'Edit Profile',
      description: 'Update your profile information',
      type: 'navigation',
      iconName: 'person-outline',
      onPress: () => Alert.alert('Coming Soon', 'Profile editing will be available soon.'),
    },
    {
      id: 'security',
      title: 'Security',
      description: 'Password, 2FA, and account security',
      type: 'navigation',
      iconName: 'shield-outline',
      onPress: handleSecurity,
    },
    {
      id: 'privacy',
      title: 'Data & Privacy',
      description: 'Manage your data and privacy settings',
      type: 'navigation',
      iconName: 'lock-closed-outline',
      onPress: handleDataAndPrivacy,
    },
  ];

  const notificationSettings: SettingItem[] = [
    {
      id: 'notifications',
      title: 'Notifications',
      description: 'Enable or disable all notifications',
      type: 'toggle',
      value: notifications,
      iconName: 'notifications-outline',
      onPress: () => setNotifications(!notifications),
    },
    {
      id: 'push',
      title: 'Push Notifications',
      description: 'Receive push notifications on your device',
      type: 'toggle',
      value: pushNotifications,
      iconName: 'phone-portrait-outline',
      onPress: () => setPushNotifications(!pushNotifications),
    },
    {
      id: 'sound',
      title: 'Sound',
      description: 'Play sounds for notifications',
      type: 'toggle',
      value: soundEnabled,
      iconName: 'volume-high-outline',
      onPress: () => setSoundEnabled(!soundEnabled),
    },
    {
      id: 'vibration',
      title: 'Vibration',
      description: 'Vibrate for notifications',
      type: 'toggle',
      value: vibrationEnabled,
      iconName: 'phone-portrait-outline',
      onPress: () => setVibrationEnabled(!vibrationEnabled),
    },
  ];

  const appSettings: SettingItem[] = [
    {
      id: 'theme',
      title: 'Theme',
      description: `Current: ${theme.charAt(0).toUpperCase() + theme.slice(1)}`,
      type: 'action',
      iconName: 'color-palette-outline',
      onPress: handleThemeChange,
    },
  ];

  const supportSettings: SettingItem[] = [
    {
      id: 'help',
      title: 'Help & Support',
      description: 'Get help and contact support',
      type: 'navigation',
      iconName: 'help-circle-outline',
      onPress: handleSupport,
    },
    {
      id: 'about',
      title: 'About',
      description: 'App version and information',
      type: 'navigation',
      iconName: 'information-circle-outline',
      onPress: handleAbout,
    },
  ];

  const renderSettingSection = (title: string, items: SettingItem[]) => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        {title}
      </Text>
      <View style={[styles.sectionContent, { backgroundColor: colors.card }]}>
        {items.map((item, index) => (
          <View key={item.id}>
            <TouchableOpacity
              style={styles.settingItem}
              onPress={item.onPress}
              disabled={item.type === 'toggle'}
            >
              <View style={styles.settingItemLeft}>
                <Ionicons 
                  name={item.iconName as any} 
                  size={20} 
                  color={colors.text} 
                />
                <View style={styles.settingItemText}>
                  <Text style={[styles.settingItemTitle, { color: colors.text }]}>
                    {item.title}
                  </Text>
                  {item.description && (
                    <Text style={[styles.settingItemDescription, { color: colors.textSecondary }]}>
                      {item.description}
                    </Text>
                  )}
                </View>
              </View>

              <View style={styles.settingItemRight}>
                {item.type === 'toggle' && (
                  <Switch
                    value={item.value}
                    onValueChange={item.onPress}
                    trackColor={{ false: colors.border, true: colors.primary }}
                    thumbColor={item.value ? '#ffffff' : colors.textSecondary}
                  />
                )}
                {item.type === 'navigation' && (
                  <Ionicons 
                    name="chevron-forward" 
                    size={20} 
                    color={colors.textSecondary} 
                  />
                )}
                {item.type === 'action' && (
                  <Ionicons 
                    name="chevron-forward" 
                    size={20} 
                    color={colors.textSecondary} 
                  />
                )}
              </View>
            </TouchableOpacity>
            
            {index < items.length - 1 && (
              <View style={[styles.separator, { backgroundColor: colors.border }]} />
            )}
          </View>
        ))}
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* User Info */}
        <View style={[styles.userSection, { backgroundColor: colors.card }]}>
          <View style={[styles.userAvatar, { backgroundColor: colors.primary }]}>
            <Text style={styles.userAvatarText}>
              {user?.username?.charAt(0).toUpperCase() || 'U'}
            </Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={[styles.username, { color: colors.text }]}>
              {user?.username || 'User'}
            </Text>
            <Text style={[styles.userEmail, { color: colors.textSecondary }]}>
              {user?.email || 'user@example.com'}
            </Text>
          </View>
        </View>

        {renderSettingSection('Account', accountSettings)}
        {renderSettingSection('Notifications', notificationSettings)}
        {renderSettingSection('App Settings', appSettings)}
        {renderSettingSection('Support', supportSettings)}

        {/* Logout Button */}
        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.logoutButton, { backgroundColor: colors.error }]}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={20} color="#ffffff" />
            <Text style={styles.logoutButtonText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 20,
    padding: 20,
    borderRadius: 12,
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatarText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  userInfo: {
    marginLeft: 16,
    flex: 1,
  },
  username: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    marginHorizontal: 20,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionContent: {
    marginHorizontal: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingItemText: {
    marginLeft: 16,
    flex: 1,
  },
  settingItemTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  settingItemDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  settingItemRight: {
    marginLeft: 16,
  },
  separator: {
    height: 1,
    marginLeft: 52,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  logoutButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});