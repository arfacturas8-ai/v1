import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import NetInfo from '@react-native-community/netinfo';
import * as Haptics from 'expo-haptics';
import { deviceInfo, spacing, typography, scale } from '../../utils/responsive';

export default function OfflineScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const [checking, setChecking] = useState(false);
  const pulseAnim = new Animated.Value(1);

  useEffect(() => {
    // Pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const checkConnection = async () => {
    setChecking(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const state = await NetInfo.fetch();
      if (state.isConnected) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        navigation.goBack();
      } else {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch (error) {
      console.error('Error checking connection:', error);
    } finally {
      setChecking(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <Animated.View
          style={[
            styles.iconContainer,
            { backgroundColor: colors.warning + '20', transform: [{ scale: pulseAnim }] },
          ]}
        >
          <Feather name="wifi-off" size={64} color={colors.warning} />
        </Animated.View>
        <Text style={[styles.title, { color: colors.text }]}>No Internet Connection</Text>
        <Text style={[styles.message, { color: colors.textSecondary }]}>
          Please check your internet connection and try again.
        </Text>

        <View style={styles.tips}>
          <Text style={[styles.tipsTitle, { color: colors.text }]}>Tips:</Text>
          <View style={styles.tipRow}>
            <Feather name="check" size={16} color={colors.textSecondary} />
            <Text style={[styles.tipText, { color: colors.textSecondary }]}>
              Check if Wi-Fi or mobile data is enabled
            </Text>
          </View>
          <View style={styles.tipRow}>
            <Feather name="check" size={16} color={colors.textSecondary} />
            <Text style={[styles.tipText, { color: colors.textSecondary }]}>
              Try turning Airplane mode on and off
            </Text>
          </View>
          <View style={styles.tipRow}>
            <Feather name="check" size={16} color={colors.textSecondary} />
            <Text style={[styles.tipText, { color: colors.textSecondary }]}>
              Restart your router if using Wi-Fi
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={checkConnection}
          disabled={checking}
        >
          <Feather name="refresh-cw" size={20} color="#fff" />
          <Text style={styles.buttonText}>{checking ? 'Checking...' : 'Try Again'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxl,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  title: {
    fontSize: typography.h3,
    fontWeight: 'bold',
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  message: {
    fontSize: typography.body1,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.xxxl,
  },
  tips: {
    width: '100%',
    marginBottom: spacing.xxxl,
  },
  tipsTitle: {
    fontSize: typography.body1,
    fontWeight: 'bold',
    marginBottom: spacing.md,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  tipText: {
    flex: 1,
    fontSize: typography.body2,
    lineHeight: 20,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    borderRadius: deviceInfo.isTablet ? 14 : 12,
    gap: spacing.sm,
    width: '100%',
  },
  buttonText: {
    fontSize: typography.body1,
    fontWeight: 'bold',
    color: '#fff',
  },
});
