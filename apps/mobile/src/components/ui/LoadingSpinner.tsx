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

  // Loading UI removed - return null instead of visible spinner
  return null;
}