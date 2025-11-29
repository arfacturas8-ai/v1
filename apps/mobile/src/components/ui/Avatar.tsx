import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { useTheme } from '../../contexts/ThemeContext';
import { deviceInfo, spacing, typography, scale } from '../../utils/responsive';

interface AvatarProps {
  uri?: string;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showOnlineStatus?: boolean;
  isOnline?: boolean;
  style?: ViewStyle;
}

export function Avatar({
  uri,
  name = 'U',
  size = 'md',
  showOnlineStatus = false,
  isOnline = false,
  style,
}: AvatarProps) {
  const { colors, spacing, typography } = useTheme();

  const getSizeConfig = () => {
    switch (size) {
      case 'xs':
        return { containerSize: 24, fontSize: typography.fontSizes.xs, statusSize: 8 };
      case 'sm':
        return { containerSize: 32, fontSize: typography.fontSizes.sm, statusSize: 10 };
      case 'md':
        return { containerSize: 40, fontSize: typography.fontSizes.md, statusSize: 12 };
      case 'lg':
        return { containerSize: 56, fontSize: typography.fontSizes.lg, statusSize: 16 };
      case 'xl':
        return { containerSize: 80, fontSize: typography.fontSizes.xl, statusSize: 20 };
      default:
        return { containerSize: 40, fontSize: typography.fontSizes.md, statusSize: 12 };
    }
  };

  const { containerSize, fontSize, statusSize } = getSizeConfig();

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase())
      .join('')
      .substring(0, 2);
  };

  const avatarStyle: ViewStyle = {
    width: containerSize,
    height: containerSize,
    borderRadius: containerSize / 2,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  };

  return (
    <View style={[avatarStyle, style]}>
      {uri ? (
        <Image
          source={{ uri }}
          style={StyleSheet.absoluteFillObject}
          contentFit="cover"
          transition={200}
        />
      ) : (
        <Text
          style={{
            color: colors.textInverse,
            fontSize,
            fontWeight: typography.fontWeights.semibold,
          }}
        >
          {getInitials(name)}
        </Text>
      )}
      
      {showOnlineStatus && (
        <View
          style={[
            styles.statusIndicator,
            {
              width: statusSize,
              height: statusSize,
              borderRadius: statusSize / 2,
              backgroundColor: isOnline ? colors.online : colors.offline,
              borderColor: colors.surface,
              borderWidth: 2,
              position: 'absolute',
              bottom: -1,
              right: -1,
            },
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  statusIndicator: {
    position: 'absolute',
  },
});