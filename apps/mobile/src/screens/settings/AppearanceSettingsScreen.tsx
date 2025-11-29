import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { deviceInfo, spacing, typography, scale } from '../../utils/responsive';

type ThemeMode = 'light' | 'dark' | 'auto';
type FontSize = 'small' | 'medium' | 'large' | 'extra-large';
type AccentColor = 'purple' | 'blue' | 'green' | 'red' | 'orange' | 'pink';

interface AppearanceSettings {
  theme: ThemeMode;
  fontSize: FontSize;
  accentColor: AccentColor;
  compactMode: boolean;
  showAvatars: boolean;
  animationsEnabled: boolean;
  reduceMotion: boolean;
}

const STORAGE_KEY = '@appearance_settings';

const AppearanceSettingsScreen = () => {
  const systemColorScheme = useColorScheme();
  const [settings, setSettings] = useState<AppearanceSettings>({
    theme: 'auto',
    fontSize: 'medium',
    accentColor: 'purple',
    compactMode: false,
    showAvatars: true,
    animationsEnabled: true,
    reduceMotion: false,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setSettings(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading appearance settings:', error);
    }
  };

  const saveSettings = async (updated: Partial<AppearanceSettings>) => {
    try {
      const newSettings = { ...settings, ...updated };
      setSettings(newSettings);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
    } catch (error) {
      console.error('Error saving appearance settings:', error);
      Alert.alert('Error', 'Failed to save settings');
    }
  };

  const themeOptions: { value: ThemeMode; label: string; description: string }[] = [
    { value: 'light', label: 'Light', description: 'Always use light theme' },
    { value: 'dark', label: 'Dark', description: 'Always use dark theme' },
    { value: 'auto', label: 'Auto', description: 'Match system settings' },
  ];

  const fontSizeOptions: { value: FontSize; label: string }[] = [
    { value: 'small', label: 'Small' },
    { value: 'medium', label: 'Medium' },
    { value: 'large', label: 'Large' },
    { value: 'extra-large', label: 'Extra Large' },
  ];

  const accentColors: { value: AccentColor; color: string; label: string }[] = [
    { value: 'purple', color: '#8B5CF6', label: 'Purple' },
    { value: 'blue', color: '#3B82F6', label: 'Blue' },
    { value: 'green', color: '#10B981', label: 'Green' },
    { value: 'red', color: '#EF4444', label: 'Red' },
    { value: 'orange', color: '#F97316', label: 'Orange' },
    { value: 'pink', color: '#EC4899', label: 'Pink' },
  ];

  return (
    <ScrollView style={styles.container}>
      {/* Theme Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Theme</Text>
        <Text style={styles.sectionDescription}>
          Current: {settings.theme === 'auto' ? `Auto (${systemColorScheme})` : settings.theme}
        </Text>

        {themeOptions.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.optionButton,
              settings.theme === option.value && styles.optionButtonSelected,
            ]}
            onPress={() => saveSettings({ theme: option.value })}
          >
            <View style={styles.optionContent}>
              <Text
                style={[
                  styles.optionLabel,
                  settings.theme === option.value && styles.optionLabelSelected,
                ]}
              >
                {option.label}
              </Text>
              <Text style={styles.optionDescription}>{option.description}</Text>
            </View>
            {settings.theme === option.value && (
              <Text style={styles.checkmark}>✓</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Font Size */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Font Size</Text>
        <Text style={styles.sectionDescription}>
          Adjust text size for better readability
        </Text>

        {fontSizeOptions.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.optionButton,
              settings.fontSize === option.value && styles.optionButtonSelected,
            ]}
            onPress={() => saveSettings({ fontSize: option.value })}
          >
            <Text
              style={[
                styles.optionLabel,
                settings.fontSize === option.value && styles.optionLabelSelected,
                { fontSize: option.value === 'small' ? 14 : option.value === 'medium' ? 16 : option.value === 'large' ? 18 : 20 },
              ]}
            >
              {option.label}
            </Text>
            {settings.fontSize === option.value && (
              <Text style={styles.checkmark}>✓</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Accent Color */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Accent Color</Text>
        <Text style={styles.sectionDescription}>
          Choose your preferred accent color
        </Text>

        <View style={styles.colorGrid}>
          {accentColors.map((color) => (
            <TouchableOpacity
              key={color.value}
              style={[
                styles.colorButton,
                settings.accentColor === color.value && styles.colorButtonSelected,
              ]}
              onPress={() => saveSettings({ accentColor: color.value })}
            >
              <View
                style={[
                  styles.colorSwatch,
                  { backgroundColor: color.color },
                ]}
              />
              <Text style={styles.colorLabel}>{color.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Display Options */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Display Options</Text>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Compact Mode</Text>
            <Text style={styles.settingDescription}>
              Show more content with reduced spacing
            </Text>
          </View>
          <Switch
            value={settings.compactMode}
            onValueChange={(value) => saveSettings({ compactMode: value })}
            trackColor={{ false: '#767577', true: '#8B5CF6' }}
            thumbColor={settings.compactMode ? '#ffffff' : '#f4f3f4'}
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Show Avatars</Text>
            <Text style={styles.settingDescription}>
              Display profile pictures in lists
            </Text>
          </View>
          <Switch
            value={settings.showAvatars}
            onValueChange={(value) => saveSettings({ showAvatars: value })}
            trackColor={{ false: '#767577', true: '#8B5CF6' }}
            thumbColor={settings.showAvatars ? '#ffffff' : '#f4f3f4'}
          />
        </View>
      </View>

      {/* Animations */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Animations</Text>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Enable Animations</Text>
            <Text style={styles.settingDescription}>
              Show smooth transitions and effects
            </Text>
          </View>
          <Switch
            value={settings.animationsEnabled}
            onValueChange={(value) => saveSettings({ animationsEnabled: value })}
            trackColor={{ false: '#767577', true: '#8B5CF6' }}
            thumbColor={settings.animationsEnabled ? '#ffffff' : '#f4f3f4'}
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Reduce Motion</Text>
            <Text style={styles.settingDescription}>
              Minimize animations for accessibility
            </Text>
          </View>
          <Switch
            value={settings.reduceMotion}
            onValueChange={(value) => saveSettings({ reduceMotion: value })}
            trackColor={{ false: '#767577', true: '#8B5CF6' }}
            thumbColor={settings.reduceMotion ? '#ffffff' : '#f4f3f4'}
          />
        </View>
      </View>

      {/* Reset */}
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.resetButton}
          onPress={() => {
            Alert.alert(
              'Reset Appearance',
              'Reset all appearance settings to default?',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Reset',
                  style: 'destructive',
                  onPress: () => {
                    const defaults: AppearanceSettings = {
                      theme: 'auto',
                      fontSize: 'medium',
                      accentColor: 'purple',
                      compactMode: false,
                      showAvatars: true,
                      animationsEnabled: true,
                      reduceMotion: false,
                    };
                    saveSettings(defaults);
                  },
                },
              ]
            );
          }}
        >
          <Text style={styles.resetButtonText}>Reset to Defaults</Text>
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
    marginBottom: spacing.xs,
  },
  sectionDescription: {
    fontSize: typography.body2,
    color: '#6B7280',
    marginBottom: spacing.md,
  },
  optionButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    padding: spacing.lg,
    borderRadius: deviceInfo.isTablet ? 14 : 12,
    marginBottom: spacing.sm,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionButtonSelected: {
    borderColor: '#8B5CF6',
    backgroundColor: '#312E81',
  },
  optionContent: {
    flex: 1,
  },
  optionLabel: {
    fontSize: typography.body1,
    fontWeight: '500',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  optionLabelSelected: {
    color: '#C7D2FE',
  },
  optionDescription: {
    fontSize: typography.body2,
    color: '#9CA3AF',
  },
  checkmark: {
    fontSize: typography.h5,
    color: '#8B5CF6',
    marginLeft: spacing.sm,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  colorButton: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    padding: spacing.md,
    borderRadius: deviceInfo.isTablet ? 14 : 12,
    marginBottom: spacing.sm,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorButtonSelected: {
    borderColor: '#8B5CF6',
  },
  colorSwatch: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: spacing.md,
  },
  colorLabel: {
    fontSize: typography.body2,
    fontWeight: '500',
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
  resetButton: {
    backgroundColor: '#EF4444',
    padding: spacing.lg,
    borderRadius: deviceInfo.isTablet ? 14 : 12,
    alignItems: 'center',
  },
  resetButtonText: {
    fontSize: typography.body1,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  bottomPadding: {
    height: 40,
  },
});

export default AppearanceSettingsScreen;
