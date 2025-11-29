import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { Button } from './Button';
import { deviceInfo, spacing, typography, scale } from '../../utils/responsive';

interface ErrorStateProps {
  error: Error | string;
  title?: string;
  onRetry?: () => void;
  retryLabel?: string;
  showErrorDetails?: boolean;
  errorCode?: string;
  supportLink?: string;
  style?: ViewStyle;
}

/**
 * ErrorState Component
 *
 * A reusable component for displaying error states with retry functionality.
 * Provides friendly error messages and actionable recovery options.
 *
 * @example
 * ```tsx
 * <ErrorState
 *   error={error}
 *   title="Failed to load posts"
 *   onRetry={() => fetchPosts()}
 *   retryLabel="Try Again"
 *   showErrorDetails={__DEV__}
 * />
 * ```
 */
export function ErrorState({
  error,
  title = 'Something went wrong',
  onRetry,
  retryLabel = 'Try Again',
  showErrorDetails = false,
  errorCode,
  supportLink,
  style,
}: ErrorStateProps) {
  const { colors, spacing, typography } = useTheme();

  const errorMessage = typeof error === 'string' ? error : error.message;
  const friendlyMessage = getFriendlyErrorMessage(errorMessage);

  return (
    <View style={[styles.container, style]}>
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: `${colors.error}15` },
        ]}
      >
        <Ionicons
          name="alert-circle"
          size={64}
          color={colors.error}
        />
      </View>

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

      <Text
        style={[
          styles.message,
          {
            color: colors.textSecondary,
            fontSize: typography.fontSizes.md,
            marginTop: spacing.sm,
          },
        ]}
      >
        {friendlyMessage}
      </Text>

      {showErrorDetails && (
        <View
          style={[
            styles.errorDetails,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              marginTop: spacing.md,
            },
          ]}
        >
          <Text
            style={[
              styles.errorDetailsText,
              {
                color: colors.textTertiary,
                fontSize: typography.fontSizes.sm,
              },
            ]}
          >
            {errorMessage}
          </Text>
        </View>
      )}

      {errorCode && (
        <Text
          style={[
            styles.errorCode,
            {
              color: colors.textTertiary,
              fontSize: typography.fontSizes.xs,
              marginTop: spacing.xs,
            },
          ]}
        >
          Error Code: {errorCode}
        </Text>
      )}

      <View style={[styles.actions, { marginTop: spacing.lg }]}>
        {onRetry && (
          <Button
            title={retryLabel}
            onPress={onRetry}
            size="medium"
            leftIcon={<Ionicons name="refresh" size={20} color={colors.background} />}
          />
        )}

        {supportLink && (
          <Button
            title="Contact Support"
            onPress={() => {
              // In real app, open support link
              console.log('Opening support:', supportLink);
            }}
            variant="outline"
            size="medium"
            style={{ marginTop: spacing.sm }}
          />
        )}
      </View>

      <Text
        style={[
          styles.helpText,
          {
            color: colors.textTertiary,
            fontSize: typography.fontSizes.sm,
            marginTop: spacing.md,
          },
        ]}
      >
        If this problem persists, please contact support.
      </Text>
    </View>
  );
}

/**
 * Maps technical error messages to user-friendly messages
 */
function getFriendlyErrorMessage(errorMessage: string): string {
  const lowercaseError = errorMessage.toLowerCase();

  if (lowercaseError.includes('network') || lowercaseError.includes('fetch')) {
    return 'Unable to connect to the server. Please check your internet connection and try again.';
  }

  if (lowercaseError.includes('timeout')) {
    return 'The request took too long to complete. Please try again.';
  }

  if (lowercaseError.includes('unauthorized') || lowercaseError.includes('401')) {
    return 'Your session has expired. Please log in again.';
  }

  if (lowercaseError.includes('forbidden') || lowercaseError.includes('403')) {
    return 'You do not have permission to access this resource.';
  }

  if (lowercaseError.includes('not found') || lowercaseError.includes('404')) {
    return 'The requested resource could not be found.';
  }

  if (lowercaseError.includes('server') || lowercaseError.includes('500')) {
    return 'A server error occurred. Our team has been notified and is working on a fix.';
  }

  // Default friendly message
  return 'An unexpected error occurred. Please try again.';
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
  message: {
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 320,
  },
  errorDetails: {
    width: '100%',
    maxWidth: 320,
    padding: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
  },
  errorDetailsText: {
    fontFamily: 'monospace',
    lineHeight: 18,
  },
  errorCode: {
    textAlign: 'center',
  },
  actions: {
    width: '100%',
    maxWidth: 280,
  },
  helpText: {
    textAlign: 'center',
    maxWidth: 280,
  },
});
