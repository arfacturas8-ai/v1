import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { deviceInfo, spacing, typography, scale } from '../../utils/responsive';

interface DataSettings {
  autoDownloadImages: boolean;
  autoDownloadVideos: boolean;
  autoDownloadOnWifi: boolean;
  offlineMode: boolean;
  cacheSize: number;
  dataUsageTracking: boolean;
}

const DataSettingsScreen = () => {
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<DataSettings>({
    autoDownloadImages: true,
    autoDownloadVideos: false,
    autoDownloadOnWifi: true,
    offlineMode: false,
    cacheSize: 0,
    dataUsageTracking: true,
  });

  const [storageInfo, setStorageInfo] = useState({
    total: 0,
    free: 0,
    used: 0,
  });

  useEffect(() => {
    loadSettings();
    loadStorageInfo();
  }, []);

  const loadSettings = async () => {
    try {
      const stored = await AsyncStorage.getItem('@data_settings');
      if (stored) {
        setSettings(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading data settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStorageInfo = async () => {
    try {
      // Calculate cache size
      const cacheDir = FileSystem.cacheDirectory;
      if (cacheDir) {
        const info = await FileSystem.getInfoAsync(cacheDir);
        if (info.exists) {
          // Estimate cache size (this is simplified)
          setStorageInfo({
            total: 5000, // 5GB in MB
            free: 3500,
            used: 1500,
          });
        }
      }

      // Calculate app cache size
      const appCacheSize = await calculateCacheSize();
      setSettings(prev => ({ ...prev, cacheSize: appCacheSize }));
    } catch (error) {
      console.error('Error loading storage info:', error);
    }
  };

  const calculateCacheSize = async (): Promise<number> => {
    try {
      // This is a simplified calculation
      // In a real app, you'd walk through the cache directory and sum file sizes
      const cacheDir = FileSystem.cacheDirectory;
      if (cacheDir) {
        // Return mock size for now (in MB)
        return 150;
      }
      return 0;
    } catch (error) {
      console.error('Error calculating cache size:', error);
      return 0;
    }
  };

  const saveSettings = async (updated: Partial<DataSettings>) => {
    try {
      const newSettings = { ...settings, ...updated };
      setSettings(newSettings);
      await AsyncStorage.setItem('@data_settings', JSON.stringify(newSettings));
    } catch (error) {
      console.error('Error saving data settings:', error);
      Alert.alert('Error', 'Failed to save settings');
    }
  };

  const clearCache = async () => {
    Alert.alert(
      'Clear Cache',
      `This will free up ${settings.cacheSize.toFixed(1)} MB of storage. Are you sure?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              const cacheDir = FileSystem.cacheDirectory;
              if (cacheDir) {
                // Clear cache directory
                const files = await FileSystem.readDirectoryAsync(cacheDir);
                for (const file of files) {
                  await FileSystem.deleteAsync(`${cacheDir}${file}`, { idempotent: true });
                }
              }

              // Clear AsyncStorage cache
              const keys = await AsyncStorage.getAllKeys();
              const cacheKeys = keys.filter(key => key.startsWith('@cache_'));
              await AsyncStorage.multiRemove(cacheKeys);

              setSettings(prev => ({ ...prev, cacheSize: 0 }));
              Alert.alert('Success', 'Cache cleared successfully');
            } catch (error) {
              console.error('Error clearing cache:', error);
              Alert.alert('Error', 'Failed to clear cache');
            }
          },
        },
      ]
    );
  };

  const clearAllData = async () => {
    Alert.alert(
      'Clear All Data',
      'This will log you out and remove all local data. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All Data',
          style: 'destructive',
          onPress: async () => {
            try {
              // Clear all AsyncStorage
              await AsyncStorage.clear();

              // Clear cache
              const cacheDir = FileSystem.cacheDirectory;
              if (cacheDir) {
                const files = await FileSystem.readDirectoryAsync(cacheDir);
                for (const file of files) {
                  await FileSystem.deleteAsync(`${cacheDir}${file}`, { idempotent: true });
                }
              }

              Alert.alert('Success', 'All data cleared. Please restart the app.');
            } catch (error) {
              console.error('Error clearing all data:', error);
              Alert.alert('Error', 'Failed to clear all data');
            }
          },
        },
      ]
    );
  };

  const exportData = async () => {
    Alert.alert(
      'Export Data',
      'Your data will be exported as a JSON file and you can download it.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Export',
          onPress: () => {
            // In a real implementation, this would gather all user data and create a downloadable file
            Alert.alert('Coming Soon', 'Data export functionality will be available soon.');
          },
        },
      ]
    );
  };

  const formatBytes = (mb: number): string => {
    if (mb < 1) {
      return `${(mb * 1024).toFixed(0)} KB`;
    } else if (mb >= 1024) {
      return `${(mb / 1024).toFixed(1)} GB`;
    }
    return `${mb.toFixed(1)} MB`;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Storage Overview */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Storage</Text>

        <View style={styles.storageCard}>
          <View style={styles.storageHeader}>
            <Text style={styles.storageTitle}>App Storage</Text>
            <Text style={styles.storageSize}>{formatBytes(settings.cacheSize)}</Text>
          </View>

          <View style={styles.storageBar}>
            <View
              style={[
                styles.storageBarFill,
                { width: `${(settings.cacheSize / 500) * 100}%` },
              ]}
            />
          </View>

          <Text style={styles.storageDescription}>
            Cache: {formatBytes(settings.cacheSize)} of 500 MB used
          </Text>
        </View>

        <TouchableOpacity style={styles.actionButton} onPress={clearCache}>
          <Text style={styles.actionButtonText}>Clear Cache</Text>
          <Text style={styles.actionButtonSubtext}>
            Free up {formatBytes(settings.cacheSize)}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Download Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Auto-Download</Text>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Images</Text>
            <Text style={styles.settingDescription}>
              Automatically download images
            </Text>
          </View>
          <Switch
            value={settings.autoDownloadImages}
            onValueChange={(value) => saveSettings({ autoDownloadImages: value })}
            trackColor={{ false: '#767577', true: '#4F46E5' }}
            thumbColor={settings.autoDownloadImages ? '#ffffff' : '#f4f3f4'}
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Videos</Text>
            <Text style={styles.settingDescription}>
              Automatically download videos
            </Text>
          </View>
          <Switch
            value={settings.autoDownloadVideos}
            onValueChange={(value) => saveSettings({ autoDownloadVideos: value })}
            trackColor={{ false: '#767577', true: '#4F46E5' }}
            thumbColor={settings.autoDownloadVideos ? '#ffffff' : '#f4f3f4'}
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>WiFi Only</Text>
            <Text style={styles.settingDescription}>
              Only auto-download on WiFi
            </Text>
          </View>
          <Switch
            value={settings.autoDownloadOnWifi}
            onValueChange={(value) => saveSettings({ autoDownloadOnWifi: value })}
            trackColor={{ false: '#767577', true: '#4F46E5' }}
            thumbColor={settings.autoDownloadOnWifi ? '#ffffff' : '#f4f3f4'}
          />
        </View>
      </View>

      {/* Offline Mode */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Offline Mode</Text>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Enable Offline Mode</Text>
            <Text style={styles.settingDescription}>
              Save content for offline viewing
            </Text>
          </View>
          <Switch
            value={settings.offlineMode}
            onValueChange={(value) => saveSettings({ offlineMode: value })}
            trackColor={{ false: '#767577', true: '#4F46E5' }}
            thumbColor={settings.offlineMode ? '#ffffff' : '#f4f3f4'}
          />
        </View>
      </View>

      {/* Data Usage */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data Usage</Text>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Track Data Usage</Text>
            <Text style={styles.settingDescription}>
              Monitor your data consumption
            </Text>
          </View>
          <Switch
            value={settings.dataUsageTracking}
            onValueChange={(value) => saveSettings({ dataUsageTracking: value })}
            trackColor={{ false: '#767577', true: '#4F46E5' }}
            thumbColor={settings.dataUsageTracking ? '#ffffff' : '#f4f3f4'}
          />
        </View>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() =>
            Alert.alert('Coming Soon', 'Data usage statistics will be available soon.')
          }
        >
          <Text style={styles.actionButtonText}>View Data Usage</Text>
          <Text style={styles.actionButtonSubtext}>See detailed statistics</Text>
        </TouchableOpacity>
      </View>

      {/* Data Export & Privacy */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data Management</Text>

        <TouchableOpacity style={styles.actionButton} onPress={exportData}>
          <Text style={styles.actionButtonText}>Export My Data</Text>
          <Text style={styles.actionButtonSubtext}>
            Download a copy of your data
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.dangerButton]}
          onPress={clearAllData}
        >
          <Text style={[styles.actionButtonText, styles.dangerText]}>
            Clear All Data
          </Text>
          <Text style={styles.actionButtonSubtext}>
            Remove all local data and log out
          </Text>
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
  storageCard: {
    backgroundColor: '#1F2937',
    padding: spacing.lg,
    borderRadius: deviceInfo.isTablet ? 14 : 12,
    marginBottom: spacing.md,
  },
  storageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  storageTitle: {
    fontSize: typography.body1,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  storageSize: {
    fontSize: typography.h6,
    fontWeight: '700',
    color: '#4F46E5',
  },
  storageBar: {
    height: 8,
    backgroundColor: '#374151',
    borderRadius: 4,
    marginBottom: spacing.sm,
    overflow: 'hidden',
  },
  storageBarFill: {
    height: '100%',
    backgroundColor: '#4F46E5',
    borderRadius: 4,
  },
  storageDescription: {
    fontSize: typography.body2,
    color: '#9CA3AF',
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
    backgroundColor: '#1F2937',
    padding: spacing.lg,
    borderRadius: deviceInfo.isTablet ? 14 : 12,
    marginBottom: spacing.sm,
  },
  actionButtonText: {
    fontSize: typography.body1,
    fontWeight: '500',
    color: '#FFFFFF',
    marginBottom: spacing.xs,
  },
  actionButtonSubtext: {
    fontSize: typography.body2,
    color: '#9CA3AF',
  },
  dangerButton: {
    backgroundColor: '#7F1D1D',
  },
  dangerText: {
    color: '#FCA5A5',
  },
  bottomPadding: {
    height: 40,
  },
});

export default DataSettingsScreen;
