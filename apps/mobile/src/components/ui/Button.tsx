import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  View,
  StyleSheet,
  TextStyle,
  ViewStyle,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import * as Haptics from 'expo-haptics';
import { deviceInfo, spacing, typography, scale } from '../../utils/responsive';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  haptic?: boolean;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  icon,
  style,
  textStyle,
  haptic = true,
}: ButtonProps) {
  const { colors, spacing, typography, shadows } = useTheme();

  const handlePress = () => {
    if (haptic && !disabled && !loading) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  };

  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: spacing.sm,
      borderWidth: 1,
    };

    // Size styles
    switch (size) {
      case 'sm':
        baseStyle.paddingHorizontal = spacing.md;
        baseStyle.paddingVertical = spacing.sm;
        baseStyle.minHeight = 36;
        break;
      case 'lg':
        baseStyle.paddingHorizontal = spacing.xl;
        baseStyle.paddingVertical = spacing.md;
        baseStyle.minHeight = 56;
        break;
      default: // md
        baseStyle.paddingHorizontal = spacing.lg;
        baseStyle.paddingVertical = spacing.sm + 2;
        baseStyle.minHeight = 44;
    }

    // Variant styles
    switch (variant) {
      case 'primary':
        baseStyle.backgroundColor = colors.primary;
        baseStyle.borderColor = colors.primary;
        break;
      case 'secondary':
        baseStyle.backgroundColor = colors.surface;
        baseStyle.borderColor = colors.border;
        break;
      case 'outline':
        baseStyle.backgroundColor = 'transparent';
        baseStyle.borderColor = colors.primary;
        break;
      case 'ghost':
        baseStyle.backgroundColor = 'transparent';
        baseStyle.borderColor = 'transparent';
        break;
      case 'destructive':
        baseStyle.backgroundColor = colors.error;
        baseStyle.borderColor = colors.error;
        break;
    }

    // Disabled state
    if (disabled || loading) {
      baseStyle.opacity = 0.6;
    }

    // Full width
    if (fullWidth) {
      baseStyle.width = '100%';
    }

    // Shadow for elevated variants
    if (variant === 'primary' || variant === 'destructive') {
      Object.assign(baseStyle, shadows.sm);
    }

    return baseStyle;
  };

  const getTextStyle = (): TextStyle => {
    const baseTextStyle: TextStyle = {
      fontSize: size === 'sm' ? typography.fontSizes.sm : typography.fontSizes.md,
      fontWeight: typography.fontWeights.semibold,
      textAlign: 'center',
    };

    switch (variant) {
      case 'primary':
      case 'destructive':
        baseTextStyle.color = colors.textInverse;
        break;
      case 'secondary':
        baseTextStyle.color = colors.text;
        break;
      case 'outline':
        baseTextStyle.color = colors.primary;
        break;
      case 'ghost':
        baseTextStyle.color = colors.textSecondary;
        break;
    }

    return baseTextStyle;
  };

  return (
    <TouchableOpacity
      style={[getButtonStyle(), style]}
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading && (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' || variant === 'destructive' ? colors.textInverse : colors.primary}
          style={{ marginRight: icon || title ? spacing.sm : 0 }}
        />
      )}
      {icon && !loading && (
        <View style={{ marginRight: title ? spacing.sm : 0 }}>
          {icon}
        </View>
      )}
      {title && (
        <Text style={[getTextStyle(), textStyle]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}