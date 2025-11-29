import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { spacing, typography, scale } from '../../utils/responsive';

export function NotFoundScreen({ navigation }: any) {
  const { colors } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Feather name="frown" size={64} color={colors.textSecondary} />
      <Text style={[styles.title, { color: colors.text }]}>404</Text>
      <Text style={[styles.message, { color: colors.textSecondary }]}>
        Page not found
      </Text>
      <Text style={[styles.description, { color: colors.textSecondary }]}>
        The page you're looking for doesn't exist or has been moved.
      </Text>
      <TouchableOpacity
        onPress={() => navigation.navigate('Home')}
        style={[styles.button, { backgroundColor: colors.primary }]}
      >
        <Text style={styles.buttonText}>Go Home</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  title: {
    fontSize: typography.h1,
    fontWeight: 'bold',
    marginTop: spacing.lg,
  },
  message: {
    fontSize: typography.h5,
    marginTop: spacing.sm,
  },
  description: {
    fontSize: typography.body1,
    textAlign: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
  button: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: scale(8),
  },
  buttonText: {
    color: '#fff',
    fontSize: typography.body1,
    fontWeight: '600',
  },
});
