import React, { useEffect, useRef } from 'react';
import { View, Animated, ViewStyle } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { deviceInfo, spacing, typography, scale } from '../../utils/responsive';

interface SkeletonLoaderProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
  variant?: 'rectangular' | 'circular' | 'text';
}

export function SkeletonLoader({
  width = '100%',
  height = 20,
  borderRadius,
  style,
  variant = 'rectangular',
}: SkeletonLoaderProps) {
  const { colors, spacing } = useTheme();
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = () => {
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: false,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: false,
        }),
      ]).start((finished) => {
        if (finished) {
          animate();
        }
      });
    };

    animate();
  }, []);

  const getVariantStyles = (): ViewStyle => {
    switch (variant) {
      case 'circular':
        const circularSize = typeof width === 'number' ? width : height;
        return {
          width: circularSize,
          height: circularSize,
          borderRadius: circularSize / 2,
        };
      case 'text':
        return {
          width,
          height: height * 0.7,
          borderRadius: spacing.xs,
        };
      default: // rectangular
        return {
          width,
          height,
          borderRadius: borderRadius || spacing.xs,
        };
    }
  };

  const backgroundColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.border, colors.borderSecondary],
  });

  return (
    <Animated.View
      style={[
        {
          backgroundColor,
          overflow: 'hidden',
        },
        getVariantStyles(),
        style,
      ]}
    />
  );
}

// Predefined skeleton components
export function SkeletonText({ lines = 1, style }: { lines?: number; style?: ViewStyle }) {
  return (
    <View style={style}>
      {Array.from({ length: lines }, (_, index) => (
        <SkeletonLoader
          key={index}
          variant="text"
          style={{ marginBottom: index < lines - 1 ? 8 : 0 }}
          width={index === lines - 1 ? '75%' : '100%'}
        />
      ))}
    </View>
  );
}

export function SkeletonAvatar({ size = 40, style }: { size?: number; style?: ViewStyle }) {
  return (
    <SkeletonLoader
      variant="circular"
      width={size}
      height={size}
      style={style}
    />
  );
}

export function SkeletonCard({ style }: { style?: ViewStyle }) {
  const { spacing } = useTheme();
  
  return (
    <View style={[{ padding: spacing.md }, style]}>
      <View style={{ flexDirection: 'row', marginBottom: spacing.sm }}>
        <SkeletonAvatar size={32} style={{ marginRight: spacing.sm }} />
        <View style={{ flex: 1 }}>
          <SkeletonLoader height={16} width="60%" style={{ marginBottom: spacing.xs }} />
          <SkeletonLoader height={12} width="40%" />
        </View>
      </View>
      <SkeletonText lines={3} />
      <View style={{ flexDirection: 'row', marginTop: spacing.sm, justifyContent: 'space-between' }}>
        <SkeletonLoader height={24} width={60} borderRadius={12} />
        <SkeletonLoader height={24} width={80} borderRadius={12} />
      </View>
    </View>
  );
}