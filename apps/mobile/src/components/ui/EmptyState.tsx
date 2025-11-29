import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { Button } from './Button';
import { deviceInfo, spacing, typography, scale } from '../../utils/responsive';

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  style?: ViewStyle;
  illustration?: React.ReactNode;
}

/**
 * EmptyState Component
 *
 * A reusable component for displaying empty states throughout the app.
 * Includes icon, title, description, and optional action buttons.
 *
 * @example
 * ```tsx
 * <EmptyState
 *   icon="document-text-outline"
 *   title="No posts yet"
 *   description="Be the first to create a post in this community!"
 *   actionLabel="Create Post"
 *   onAction={() => navigate('CreatePost')}
 * />
 * ```
 */
export function EmptyState({
  icon = 'information-circle-outline',
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  style,
  illustration,
}: EmptyStateProps) {
  const { colors, spacing, typography } = useTheme();

  return (
    <View style={[styles.container, style]}>
      {illustration ? (
        illustration
      ) : (
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: colors.surface },
          ]}
        >
          <Ionicons
            name={icon}
            size={64}
            color={colors.textSecondary}
          />
        </View>
      )}

      <Text
        style={[
          styles.title,
          {
            color: colors.text,
            fontSize: typography.fontSizes.xl,
            fontWeight: typography.fontWeights.semibold as TextStyle['fontWeight'],
            marginTop: spacing.lg,
          },
        ]}
      >
        {title}
      </Text>

      {description && (
        <Text
          style={[
            styles.description,
            {
              color: colors.textSecondary,
              fontSize: typography.fontSizes.md,
              marginTop: spacing.sm,
              marginBottom: spacing.lg,
            },
          ]}
        >
          {description}
        </Text>
      )}

      {actionLabel && onAction && (
        <View style={styles.actions}>
          <Button
            title={actionLabel}
            onPress={onAction}
            size="medium"
            style={{ marginTop: spacing.md }}
          />

          {secondaryActionLabel && onSecondaryAction && (
            <Button
              title={secondaryActionLabel}
              onPress={onSecondaryAction}
              variant="outline"
              size="medium"
              style={{ marginTop: spacing.sm }}
            />
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxxl,
    paddingVertical: 48,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    textAlign: 'center',
  },
  description: {
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 320,
  },
  actions: {
    width: '100%',
    maxWidth: 280,
  },
});
