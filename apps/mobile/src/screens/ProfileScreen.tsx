import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useAuthStore } from '../stores/authStore';
import { MainStackParamList } from '../navigation/MainNavigator';
import { deviceInfo, spacing, typography, scale } from '../utils/responsive';

type ProfileScreenNavigationProp = NativeStackNavigationProp<MainStackParamList, 'MainTabs'>;

interface UserStats {
  communities: number;
  posts: number;
  comments: number;
  likes: number;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  iconName: string;
  earned: boolean;
  earnedDate?: string;
}

const mockStats: UserStats = {
  communities: 12,
  posts: 45,
  comments: 128,
  likes: 567,
};

const mockAchievements: Achievement[] = [
  {
    id: '1',
    title: 'Early Adopter',
    description: 'One of the first 1000 users on CRYB',
    iconName: 'trophy',
    earned: true,
    earnedDate: '2024-01-15',
  },
  {
    id: '2',
    title: 'Community Builder',
    description: 'Created your first community',
    iconName: 'people',
    earned: true,
    earnedDate: '2024-02-03',
  },
  {
    id: '3',
    title: 'Active Contributor',
    description: 'Made 100+ posts and comments',
    iconName: 'chatbubbles',
    earned: true,
    earnedDate: '2024-03-12',
  },
  {
    id: '4',
    title: 'Crypto Pioneer',
    description: 'First Web3 transaction on CRYB',
    iconName: 'logo-bitcoin',
    earned: false,
  },
];

export function ProfileScreen() {
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const { colors } = useTheme();
  const { user, logout } = useAuthStore();

  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState(mockStats);
  const [achievements, setAchievements] = useState(mockAchievements);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      // TODO: Fetch fresh data from API
      await new Promise(resolve => setTimeout(resolve, 1000));
      setStats(mockStats);
      setAchievements(mockAchievements);
    } catch (error) {
      console.error('Error refreshing profile:', error);
    } finally {
      setRefreshing(false);
    }
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

  const handleEditProfile = useCallback(() => {
    Alert.alert(
      'Edit Profile',
      'Profile editing feature coming soon!',
      [{ text: 'OK' }]
    );
  }, []);

  const handleShareProfile = useCallback(() => {
    Alert.alert(
      'Share Profile',
      'Profile sharing feature coming soon!',
      [{ text: 'OK' }]
    );
  }, []);

  const earnedAchievements = achievements.filter(a => a.earned);
  const unearned = achievements.filter(a => !a.earned);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Profile</Text>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => navigation.navigate('Settings')}
          >
            <Ionicons name="settings-outline" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Profile Info */}
        <View style={[styles.profileCard, { backgroundColor: colors.card }]}>
          <View style={styles.profileHeader}>
            <View style={[styles.avatarContainer, { backgroundColor: colors.primary }]}>
              <Text style={styles.avatarText}>
                {user?.username?.charAt(0).toUpperCase() || 'U'}
              </Text>
            </View>
            
            <View style={styles.profileInfo}>
              <Text style={[styles.username, { color: colors.text }]}>
                {user?.username || 'User'}
              </Text>
              <Text style={[styles.email, { color: colors.textSecondary }]}>
                {user?.email || 'user@example.com'}
              </Text>
              <View style={styles.joinedContainer}>
                <Ionicons name="calendar" size={14} color={colors.textSecondary} />
                <Text style={[styles.joinedText, { color: colors.textSecondary }]}>
                  Joined January 2024
                </Text>
              </View>
            </View>

            <View style={styles.profileActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleShareProfile}
              >
                <Ionicons name="share-outline" size={20} color={colors.text} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleEditProfile}
              >
                <Ionicons name="create-outline" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {stats.communities}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Communities
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {stats.posts}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Posts
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {stats.comments}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Comments
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {stats.likes}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Likes
              </Text>
            </View>
          </View>
        </View>

        {/* Achievements Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Achievements ({earnedAchievements.length}/{achievements.length})
          </Text>
          
          <View style={styles.achievementsContainer}>
            {earnedAchievements.map((achievement) => (
              <View
                key={achievement.id}
                style={[styles.achievementItem, { backgroundColor: colors.card }]}
              >
                <View style={[styles.achievementIcon, { backgroundColor: colors.primary }]}>
                  <Ionicons 
                    name={achievement.iconName as any} 
                    size={20} 
                    color="#ffffff" 
                  />
                </View>
                <View style={styles.achievementInfo}>
                  <Text style={[styles.achievementTitle, { color: colors.text }]}>
                    {achievement.title}
                  </Text>
                  <Text style={[styles.achievementDescription, { color: colors.textSecondary }]}>
                    {achievement.description}
                  </Text>
                  {achievement.earnedDate && (
                    <Text style={[styles.achievementDate, { color: colors.textSecondary }]}>
                      Earned {new Date(achievement.earnedDate).toLocaleDateString()}
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </View>

          {unearned.length > 0 && (
            <>
              <Text style={[styles.subsectionTitle, { color: colors.textSecondary }]}>
                Upcoming Achievements
              </Text>
              <View style={styles.achievementsContainer}>
                {unearned.map((achievement) => (
                  <View
                    key={achievement.id}
                    style={[styles.achievementItem, { 
                      backgroundColor: colors.card,
                      opacity: 0.6,
                    }]}
                  >
                    <View style={[styles.achievementIcon, { backgroundColor: colors.surface }]}>
                      <Ionicons 
                        name={achievement.iconName as any} 
                        size={20} 
                        color={colors.textSecondary} 
                      />
                    </View>
                    <View style={styles.achievementInfo}>
                      <Text style={[styles.achievementTitle, { color: colors.textSecondary }]}>
                        {achievement.title}
                      </Text>
                      <Text style={[styles.achievementDescription, { color: colors.textSecondary }]}>
                        {achievement.description}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Quick Actions
          </Text>
          
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={[styles.quickAction, { backgroundColor: colors.card }]}
              onPress={() => navigation.navigate('MainTabs', { screen: 'Communities' })}
            >
              <Ionicons name="people" size={24} color={colors.primary} />
              <Text style={[styles.quickActionText, { color: colors.text }]}>
                My Communities
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickAction, { backgroundColor: colors.card }]}
              onPress={() => navigation.navigate('CreateServer')}
            >
              <Ionicons name="add-circle" size={24} color={colors.primary} />
              <Text style={[styles.quickActionText, { color: colors.text }]}>
                Create Community
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          style={[styles.logoutButton, { backgroundColor: colors.error }]}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={20} color="#ffffff" />
          <Text style={styles.logoutButtonText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xxxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: {
    fontSize: deviceInfo.isTablet ? typography.h2 : typography.h3,
    fontWeight: 'bold',
  },
  settingsButton: {
    padding: spacing.sm,
  },
  profileCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xxl,
    padding: deviceInfo.isTablet ? spacing.xxl : spacing.lg,
    borderRadius: deviceInfo.isTablet ? 16 : 12,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  avatarContainer: {
    width: deviceInfo.isTablet ? scale(70) : scale(60),
    height: deviceInfo.isTablet ? scale(70) : scale(60),
    borderRadius: deviceInfo.isTablet ? scale(35) : scale(30),
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: deviceInfo.isTablet ? typography.h3 : typography.h4,
    fontWeight: 'bold',
  },
  profileInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  username: {
    fontSize: deviceInfo.isTablet ? typography.h5 : typography.h6,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  email: {
    fontSize: typography.body2,
    marginBottom: spacing.sm,
  },
  joinedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  joinedText: {
    fontSize: typography.caption,
  },
  profileActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    padding: spacing.sm,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(128, 128, 128, 0.2)',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: deviceInfo.isTablet ? typography.h5 : typography.h6,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  statLabel: {
    fontSize: typography.caption,
  },
  section: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xxl,
  },
  sectionTitle: {
    fontSize: deviceInfo.isTablet ? typography.h6 : typography.subtitle1,
    fontWeight: 'bold',
    marginBottom: spacing.md,
  },
  subsectionTitle: {
    fontSize: typography.body1,
    fontWeight: '600',
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  achievementsContainer: {
    gap: spacing.md,
  },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: deviceInfo.isTablet ? spacing.lg : spacing.md,
    borderRadius: deviceInfo.isTablet ? 14 : 12,
  },
  achievementIcon: {
    width: deviceInfo.isTablet ? scale(48) : scale(40),
    height: deviceInfo.isTablet ? scale(48) : scale(40),
    borderRadius: deviceInfo.isTablet ? scale(24) : scale(20),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: typography.body1,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  achievementDescription: {
    fontSize: typography.body2,
    marginBottom: 2,
  },
  achievementDate: {
    fontSize: typography.caption,
  },
  quickActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  quickAction: {
    flex: 1,
    alignItems: 'center',
    padding: deviceInfo.isTablet ? spacing.xxl : spacing.lg,
    borderRadius: deviceInfo.isTablet ? 14 : 12,
  },
  quickActionText: {
    fontSize: typography.body2,
    fontWeight: '600',
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: deviceInfo.isTablet ? 14 : 12,
    gap: spacing.sm,
  },
  logoutButtonText: {
    color: '#ffffff',
    fontSize: typography.body1,
    fontWeight: '600',
  },
});