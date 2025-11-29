import React from 'react';
import { View, ViewStyle, TouchableOpacity } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { deviceInfo, spacing, typography, scale } from '../../utils/responsive';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: 'default' | 'outlined' | 'elevated' | 'filled';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  style?: ViewStyle;
  disabled?: boolean;
}

export function Card({
  children,
  onPress,
  variant = 'default',
  padding = 'md',
  style,
  disabled = false,
}: CardProps) {
  const { colors, spacing, shadows } = useTheme();

  const getCardStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: spacing.sm,
      overflow: 'hidden',
    };

    // Padding
    switch (padding) {
      case 'none':
        break;
      case 'sm':
        baseStyle.padding = spacing.sm;
        break;
      case 'lg':
        baseStyle.padding = spacing.lg;
        break;
      default: // md
        baseStyle.padding = spacing.md;
    }

    // Variant styles
    switch (variant) {
      case 'outlined':
        baseStyle.backgroundColor = colors.surface;
        baseStyle.borderWidth = 1;
        baseStyle.borderColor = colors.border;
        break;
      case 'elevated':
        baseStyle.backgroundColor = colors.surface;
        Object.assign(baseStyle, shadows.md);
        break;
      case 'filled':
        baseStyle.backgroundColor = colors.surfaceSecondary;
        break;
      default: // default
        baseStyle.backgroundColor = colors.surface;
        Object.assign(baseStyle, shadows.sm);
    }

    if (disabled) {
      baseStyle.opacity = 0.6;
    }

    return baseStyle;
  };

  if (onPress) {
    return (
      <TouchableOpacity
        style={[getCardStyle(), style]}
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.9}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View style={[getCardStyle(), style]}>
      {children}
    </View>
  );
}