import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuthStore } from '../../stores/authStore';
import { spacing, typography, scale } from '../../utils/responsive';

interface DrawerMenuProps {
  navigation: any;
  onClose: () => void;
}

export function DrawerMenu({ navigation, onClose }: DrawerMenuProps) {
  const { colors, theme, toggleTheme } = useTheme();
  const { user, logout } = useAuthStore();

  const menuItems = [
    { icon: 'home', label: 'Home', screen: 'Home' },
    { icon: 'compass', label: 'Discover', screen: 'Discover' },
    { icon: 'activity', label: 'Activity Feed', screen: 'ActivityFeed' },
    { icon: 'bookmark', label: 'Saved Posts', screen: 'SavedPosts' },
    { icon: 'bell', label: 'Notifications', screen: 'Notifications' },
    { icon: 'settings', label: 'Settings', screen: 'Settings' },
    { icon: 'help-circle', label: 'Help & Support', screen: 'Help' },
  ];

  const handleNavigate = (screen: string) => {
    onClose();
    navigation.navigate(screen);
  };

  const handleLogout = async () => {
    await logout();
    onClose();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* User Profile Section */}
      <View style={[styles.profileSection, { borderBottomColor: colors.border }]}>
        <View style={[styles.avatar, { backgroundColor: colors.primary + '20' }]}>
          <Text style={[styles.avatarText, { color: colors.primary }]}>
            {user?.displayName?.[0]?.toUpperCase() || 'U'}
          </Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={[styles.displayName, { color: colors.text }]}>
            {user?.displayName || 'User'}
          </Text>
          <Text style={[styles.username, { color: colors.textSecondary }]}>
            @{user?.username || 'username'}
          </Text>
        </View>

        <TouchableOpacity
          onPress={onClose}
          style={styles.closeButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Feather name="x" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Menu Items */}
      <ScrollView style={styles.menuList}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => handleNavigate(item.screen)}
            style={[styles.menuItem, { borderBottomColor: colors.border }]}
          >
            <Feather name={item.icon as any} size={22} color={colors.text} />
            <Text style={[styles.menuLabel, { color: colors.text }]}>
              {item.label}
            </Text>
            <Feather name="chevron-right" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        ))}

        {/* Theme Toggle */}
        <TouchableOpacity
          onPress={toggleTheme}
          style={[styles.menuItem, { borderBottomColor: colors.border }]}
        >
          <Feather
            name={theme === 'dark' ? 'sun' : 'moon'}
            size={22}
            color={colors.text}
          />
          <Text style={[styles.menuLabel, { color: colors.text }]}>
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </Text>
          <Feather name="chevron-right" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        <TouchableOpacity
          onPress={handleLogout}
          style={[styles.logoutButton, { backgroundColor: colors.card }]}
        >
          <Feather name="log-out" size={20} color="#FF4458" />
          <Text style={[styles.logoutText, { color: '#FF4458' }]}>
            Log Out
          </Text>
        </TouchableOpacity>

        <Text style={[styles.version, { color: colors.textSecondary }]}>
          CRYB v1.0.0
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
  },
  avatar: {
    width: scale(56),
    height: scale(56),
    borderRadius: scale(28),
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: typography.h5,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  displayName: {
    fontSize: typography.body1,
    fontWeight: '600',
  },
  username: {
    fontSize: typography.body2,
    marginTop: spacing.xs / 2,
  },
  closeButton: {
    padding: spacing.xs,
  },
  menuList: {
    flex: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  menuLabel: {
    flex: 1,
    marginLeft: spacing.lg,
    fontSize: typography.body1,
  },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    borderRadius: scale(12),
    marginBottom: spacing.md,
  },
  logoutText: {
    marginLeft: spacing.sm,
    fontSize: typography.body1,
    fontWeight: '600',
  },
  version: {
    fontSize: typography.caption,
    textAlign: 'center',
  },
});
