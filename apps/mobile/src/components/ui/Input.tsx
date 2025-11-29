import React, { useState } from 'react';
import {
  TextInput,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { deviceInfo, spacing, typography, scale } from '../../utils/responsive';

interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  variant?: 'default' | 'filled' | 'underlined';
  size?: 'sm' | 'md' | 'lg';
  containerStyle?: ViewStyle;
  required?: boolean;
}

export function Input({
  label,
  error,
  leftIcon,
  rightIcon,
  onRightIconPress,
  variant = 'default',
  size = 'md',
  containerStyle,
  required = false,
  ...props
}: InputProps) {
  const { colors, spacing, typography, shadows } = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  const getContainerStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: spacing.sm,
      borderWidth: variant === 'underlined' ? 0 : 1,
      borderBottomWidth: 1,
    };

    // Size styles
    switch (size) {
      case 'sm':
        baseStyle.paddingHorizontal = spacing.sm;
        baseStyle.paddingVertical = spacing.xs;
        baseStyle.minHeight = 36;
        break;
      case 'lg':
        baseStyle.paddingHorizontal = spacing.md;
        baseStyle.paddingVertical = spacing.sm;
        baseStyle.minHeight = 56;
        break;
      default: // md
        baseStyle.paddingHorizontal = spacing.sm + 2;
        baseStyle.paddingVertical = spacing.sm;
        baseStyle.minHeight = 44;
    }

    // Variant styles
    switch (variant) {
      case 'filled':
        baseStyle.backgroundColor = colors.surfaceSecondary;
        baseStyle.borderColor = 'transparent';
        break;
      case 'underlined':
        baseStyle.backgroundColor = 'transparent';
        baseStyle.borderRadius = 0;
        baseStyle.paddingHorizontal = 0;
        baseStyle.borderColor = 'transparent';
        break;
      default: // default
        baseStyle.backgroundColor = colors.surface;
        baseStyle.borderColor = colors.border;
    }

    // Focus state
    if (isFocused) {
      if (variant === 'underlined') {
        baseStyle.borderBottomColor = colors.primary;
        baseStyle.borderBottomWidth = 2;
      } else {
        baseStyle.borderColor = colors.primary;
      }
    } else {
      baseStyle.borderBottomColor = error ? colors.error : colors.border;
    }

    // Error state
    if (error) {
      baseStyle.borderColor = colors.error;
      if (variant === 'underlined') {
        baseStyle.borderBottomColor = colors.error;
      }
    }

    // Add shadow for focused state (except underlined)
    if (isFocused && variant !== 'underlined') {
      Object.assign(baseStyle, shadows.sm);
    }

    return baseStyle;
  };

  const getInputStyle = () => ({
    flex: 1,
    fontSize: size === 'sm' ? typography.fontSizes.sm : typography.fontSizes.md,
    color: colors.text,
    paddingLeft: leftIcon ? spacing.sm : 0,
    paddingRight: rightIcon ? spacing.sm : 0,
  });

  const getIconColor = () => {
    if (error) return colors.error;
    if (isFocused) return colors.primary;
    return colors.textSecondary;
  };

  return (
    <View style={containerStyle}>
      {label && (
        <Text style={styles.label(colors, typography, required)}>
          {label}
        </Text>
      )}
      
      <View style={getContainerStyle()}>
        {leftIcon && (
          <Ionicons
            name={leftIcon}
            size={20}
            color={getIconColor()}
            style={{ marginRight: spacing.sm }}
          />
        )}
        
        <TextInput
          style={getInputStyle()}
          placeholderTextColor={colors.textPlaceholder}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
        
        {rightIcon && (
          <TouchableOpacity
            onPress={onRightIconPress}
            style={{ marginLeft: spacing.sm }}
          >
            <Ionicons
              name={rightIcon}
              size={20}
              color={getIconColor()}
            />
          </TouchableOpacity>
        )}
      </View>
      
      {error && (
        <Text style={styles.errorText(colors, typography)}>
          {error}
        </Text>
      )}
    </View>
  );
}

const styles = {
  label: (colors: any, typography: any, required: boolean) => ({
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.medium,
    color: colors.text,
    marginBottom: 6,
  }),
  errorText: (colors: any, typography: any) => ({
    fontSize: typography.fontSizes.sm,
    color: colors.error,
    marginTop: 4,
  }),
};