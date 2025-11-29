import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import * as Haptics from 'expo-haptics';
import { deviceInfo, spacing, typography, scale } from '../../utils/responsive';

export default function ServerErrorScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();

  const handleRetry = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.goBack();
  };

  const handleGoHome = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('Home' as never);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <View style={[styles.iconContainer, { backgroundColor: colors.error + '20' }]}>
          <Feather name="server" size={64} color={colors.error} />
        </View>
        <Text style={[styles.title, { color: colors.text }]}>Server Error</Text>
        <Text style={[styles.message, { color: colors.textSecondary }]}>
          Something went wrong on our end. We're working to fix it.
        </Text>
        <Text style={[styles.errorCode, { color: colors.textSecondary }]}>Error Code: 500</Text>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.button, styles.primaryButton, { backgroundColor: colors.primary }]}
            onPress={handleRetry}
          >
            <Feather name="refresh-cw" size={20} color="#fff" />
            <Text style={styles.buttonText}>Try Again</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.secondaryButton, { borderColor: colors.border }]}
            onPress={handleGoHome}
          >
            <Feather name="home" size={20} color={colors.text} />
            <Text style={[styles.secondaryButtonText, { color: colors.text }]}>Go Home</Text>
          </TouchableOpacity>
        </View>
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
    padding: 24,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 8,
  },
  errorCode: {
    fontSize: 14,
    marginBottom: 32,
  },
  actions: {
    width: '100%',
    gap: 12,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  primaryButton: {},
  secondaryButton: {
    borderWidth: 1,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});
