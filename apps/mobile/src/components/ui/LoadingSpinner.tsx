import React from 'react';
import { View, ActivityIndicator, Text, ViewStyle } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { deviceInfo, spacing, typography, scale } from '../../utils/responsive';

interface LoadingSpinnerProps {
  size?: 'small' | 'large';
  color?: string;
  text?: string;
  style?: ViewStyle;
  overlay?: boolean;
}

export function LoadingSpinner({
  size = 'large',
  color,
  text,
  style,
  overlay = false,
}: LoadingSpinnerProps) {
  const { colors, spacing, typography } = useTheme();

  const containerStyle: ViewStyle = {
    alignItems: 'center',
    justifyContent: 'center',
    ...(overlay && {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: colors.modal,
      zIndex: 1000,
    }),
  };

  return (
    <View style={[containerStyle, style]}>
      <ActivityIndicator
        size={size}
        color={color || colors.primary}
      />
      {text && (
        <Text
          style={{
            marginTop: spacing.sm,
            color: colors.textSecondary,
            fontSize: typography.fontSizes.sm,
            textAlign: 'center',
          }}
        >
          {text}
        </Text>
      )}
    </View>
  );
}