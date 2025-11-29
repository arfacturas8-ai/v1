import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import { deviceInfo, spacing, typography, scale } from '../../utils/responsive';

interface Stat {
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
  icon: string;
  color: string;
}

export default function AdminDashboardScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = useState(false);

  const stats: Stat[] = [
    {
      label: 'Total Users',
      value: '12,543',
      change: '+12.5%',
      trend: 'up',
      icon: 'users',
      color: '#4CAF50',
    },
    {
      label: 'Active Today',
      value: '2,845',
      change: '+5.3%',
      trend: 'up',
      icon: 'activity',
      color: '#2196F3',
    },
    {
      label: 'Total Posts',
      value: '45,234',
      change: '+8.2%',
      trend: 'up',
      icon: 'file-text',
      color: '#FF9800',
    },
    {
      label: 'Reports',
      value: '23',
      change: '-15.4%',
      trend: 'down',
      icon: 'alert-circle',
      color: '#F44336',
    },
  ];

  const adminActions = [
    { id: 'users', label: 'User Management', icon: 'users', screen: 'UserManagement' },
    { id: 'content', label: 'Content Moderation', icon: 'shield', screen: 'ContentModeration' },
    { id: 'reports', label: 'Reports', icon: 'flag', screen: 'Reports' },
    { id: 'analytics', label: 'Analytics', icon: 'bar-chart-2', screen: 'Analytics' },
    { id: 'communities', label: 'Communities', icon: 'grid', screen: 'CommunityManagement' },
    { id: 'settings', label: 'System Settings', icon: 'settings', screen: 'SystemSettings' },
  ];

  const recentActivity = [
    { id: '1', type: 'user', text: 'New user registered: @johndoe', time: '5 min ago' },
    { id: '2', type: 'report', text: 'Content reported in /r/tech', time: '12 min ago' },
    { id: '3', type: 'post', text: 'Post removed for violating guidelines', time: '23 min ago' },
    { id: '4', type: 'user', text: 'User banned: @spammer123', time: '45 min ago' },
  ];

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const renderStatCard = (stat: Stat) => (
    <LinearGradient
      key={stat.label}
      colors={[stat.color, stat.color + 'CC']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.statCard}
    >
      <Feather name={stat.icon as any} size={24} color="#fff" />
      <Text style={styles.statValue}>{stat.value}</Text>
      <Text style={styles.statLabel}>{stat.label}</Text>
      <View style={styles.statChange}>
        <Feather
          name={stat.trend === 'up' ? 'trending-up' : 'trending-down'}
          size={14}
          color="#fff"
        />
        <Text style={styles.statChangeText}>{stat.change}</Text>
      </View>
    </LinearGradient>
  );

  const renderActionButton = (action: typeof adminActions[0]) => (
    <TouchableOpacity
      key={action.id}
      style={[styles.actionButton, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() => navigation.navigate(action.screen as never)}
    >
      <Feather name={action.icon as any} size={24} color={colors.primary} />
      <Text style={[styles.actionLabel, { color: colors.text }]}>{action.label}</Text>
      <Feather name="chevron-right" size={20} color={colors.textSecondary} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>Admin</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Dashboard</Text>
        </View>
        <TouchableOpacity
          style={[styles.iconButton, { backgroundColor: colors.card }]}
          onPress={() => navigation.navigate('AdminSettings' as never)}
        >
          <Feather name="settings" size={20} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* Stats */}
        <View style={styles.statsGrid}>
          {stats.map(renderStatCard)}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
          <View style={styles.actionsContainer}>
            {adminActions.map(renderActionButton)}
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Activity</Text>
          <View style={[styles.activityCard, { backgroundColor: colors.card }]}>
            {recentActivity.map((activity, index) => (
              <View key={activity.id}>
                <View style={styles.activityRow}>
                  <View style={styles.activityLeft}>
                    <View
                      style={[
                        styles.activityDot,
                        {
                          backgroundColor:
                            activity.type === 'user'
                              ? '#4CAF50'
                              : activity.type === 'report'
                              ? '#F44336'
                              : colors.primary,
                        },
                      ]}
                    />
                    <View style={styles.activityText}>
                      <Text style={[styles.activityMessage, { color: colors.text }]}>
                        {activity.text}
                      </Text>
                      <Text style={[styles.activityTime, { color: colors.textSecondary }]}>
                        {activity.time}
                      </Text>
                    </View>
                  </View>
                </View>
                {index < recentActivity.length - 1 && (
                  <View style={[styles.separator, { backgroundColor: colors.border }]} />
                )}
              </View>
            ))}
          </View>
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
    fontSize: typography.h3,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: typography.body2,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: spacing.sm,
  },
  statCard: {
    width: '47%',
    margin: '1.5%',
    padding: spacing.lg,
    borderRadius: 16,
    minHeight: 140,
  },
  statValue: {
    fontSize: typography.h3,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: spacing.sm,
  },
  statLabel: {
    fontSize: typography.caption,
    color: '#fff',
    opacity: 0.9,
    marginTop: spacing.xs,
  },
  statChange: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  statChangeText: {
    fontSize: typography.caption,
    color: '#fff',
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xxl,
  },
  sectionTitle: {
    fontSize: typography.h5,
    fontWeight: 'bold',
    marginBottom: spacing.md,
  },
  actionsContainer: {
    gap: spacing.sm,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: deviceInfo.isTablet ? 14 : 12,
    borderWidth: 1,
    gap: spacing.md,
  },
  actionLabel: {
    flex: 1,
    fontSize: typography.body1,
    fontWeight: '600',
  },
  activityCard: {
    borderRadius: deviceInfo.isTablet ? 14 : 12,
    overflow: 'hidden',
  },
  activityRow: {
    padding: spacing.lg,
  },
  activityLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  activityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
  },
  activityText: {
    flex: 1,
  },
  activityMessage: {
    fontSize: typography.body2,
    lineHeight: 20,
    marginBottom: spacing.xs,
  },
  activityTime: {
    fontSize: typography.caption,
  },
  separator: {
    height: 1,
    marginHorizontal: spacing.lg,
  },
});
