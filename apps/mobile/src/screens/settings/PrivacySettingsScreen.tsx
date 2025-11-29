import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import * as Haptics from 'expo-haptics';
import { deviceInfo, spacing, typography, scale } from '../../utils/responsive';

export default function PrivacySettingsScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();

  const [settings, setSettings] = useState({
    privateAccount: false,
    showOnlineStatus: true,
    showReadReceipts: true,
    allowTagging: true,
    allowMentions: true,
    showActivityStatus: true,
    allowDirectMessages: 'everyone',
    allowCommunityInvites: 'friends',
    shareData: false,
    personalizedAds: true,
  });

  const handleToggle = async (key: string, value: boolean) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const renderToggleRow = (
    label: string,
    description: string,
    key: string,
    icon: string
  ) => (
    <View style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
        <Feather name={icon as any} size={20} color={colors.primary} />
      </View>
      <View style={styles.rowContent}>
        <Text style={[styles.rowLabel, { color: colors.text }]}>{label}</Text>
        <Text style={[styles.rowDescription, { color: colors.textSecondary }]}>
          {description}
        </Text>
      </View>
      <Switch
        value={settings[key as keyof typeof settings] as boolean}
        onValueChange={(value) => handleToggle(key, value)}
        trackColor={{ false: colors.border, true: colors.primary }}
        thumbColor="#fff"
      />
    </View>
  );

  const renderOptionRow = (
    label: string,
    description: string,
    value: string,
    icon: string,
    onPress: () => void
  ) => (
    <TouchableOpacity
      style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={onPress}
    >
      <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
        <Feather name={icon as any} size={20} color={colors.primary} />
      </View>
      <View style={styles.rowContent}>
        <Text style={[styles.rowLabel, { color: colors.text }]}>{label}</Text>
        <Text style={[styles.rowDescription, { color: colors.textSecondary }]}>
          {description}
        </Text>
        <Text style={[styles.rowValue, { color: colors.primary }]}>{value}</Text>
      </View>
      <Feather name="chevron-right" size={20} color={colors.textSecondary} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Privacy</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            ACCOUNT PRIVACY
          </Text>
          {renderToggleRow(
            'Private Account',
            'Only approved followers can see your posts',
            'privateAccount',
            'lock'
          )}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            ACTIVITY STATUS
          </Text>
          {renderToggleRow(
            'Show Online Status',
            'Let others see when you are online',
            'showOnlineStatus',
            'circle'
          )}
          {renderToggleRow(
            'Read Receipts',
            'Let others see when you have read their messages',
            'showReadReceipts',
            'check-circle'
          )}
          {renderToggleRow(
            'Activity Status',
            'Show when you are active in communities',
            'showActivityStatus',
            'activity'
          )}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            INTERACTIONS
          </Text>
          {renderToggleRow(
            'Allow Tagging',
            'Let others tag you in posts',
            'allowTagging',
            'at-sign'
          )}
          {renderToggleRow(
            'Allow Mentions',
            'Let others mention you in comments',
            'allowMentions',
            'at-sign'
          )}
          {renderOptionRow(
            'Direct Messages',
            'Who can send you direct messages',
            settings.allowDirectMessages === 'everyone'
              ? 'Everyone'
              : settings.allowDirectMessages === 'friends'
              ? 'Friends Only'
              : 'No One',
            'message-circle',
            () => {
              // TODO: Show selection modal
            }
          )}
          {renderOptionRow(
            'Community Invites',
            'Who can invite you to communities',
            settings.allowCommunityInvites === 'everyone'
              ? 'Everyone'
              : settings.allowCommunityInvites === 'friends'
              ? 'Friends Only'
              : 'No One',
            'users',
            () => {
              // TODO: Show selection modal
            }
          )}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            DATA & PERSONALIZATION
          </Text>
          {renderToggleRow(
            'Share Usage Data',
            'Help improve CRYB by sharing anonymous usage data',
            'shareData',
            'database'
          )}
          {renderToggleRow(
            'Personalized Ads',
            'Show ads tailored to your interests',
            'personalizedAds',
            'target'
          )}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            PRIVACY CONTROLS
          </Text>
          <TouchableOpacity
            style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => navigation.navigate('BlockedUsers' as never)}
          >
            <View style={[styles.iconContainer, { backgroundColor: '#F44336' + '20' }]}>
              <Feather name="slash" size={20} color="#F44336" />
            </View>
            <View style={styles.rowContent}>
              <Text style={[styles.rowLabel, { color: colors.text }]}>Blocked Users</Text>
              <Text style={[styles.rowDescription, { color: colors.textSecondary }]}>
                Manage blocked accounts
              </Text>
            </View>
            <Feather name="chevron-right" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => navigation.navigate('MutedUsers' as never)}
          >
            <View style={[styles.iconContainer, { backgroundColor: '#FF9800' + '20' }]}>
              <Feather name="volume-x" size={20} color="#FF9800" />
            </View>
            <View style={styles.rowContent}>
              <Text style={[styles.rowLabel, { color: colors.text }]}>Muted Users</Text>
              <Text style={[styles.rowDescription, { color: colors.textSecondary }]}>
                Manage muted accounts
              </Text>
            </View>
            <Feather name="chevron-right" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  title: {
    fontSize: typography.h6,
    fontWeight: 'bold',
  },
  section: {
    marginTop: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.caption,
    fontWeight: '600',
    marginBottom: spacing.sm,
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: deviceInfo.isTablet ? 14 : 12,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  rowContent: {
    flex: 1,
  },
  rowLabel: {
    fontSize: typography.body1,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  rowDescription: {
    fontSize: typography.body2,
    lineHeight: 18,
  },
  rowValue: {
    fontSize: typography.body2,
    fontWeight: '600',
    marginTop: spacing.xs,
  },
});
