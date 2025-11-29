import React, { useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { Swipeable, GestureHandlerRootView } from 'react-native-gesture-handler';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import * as Haptics from 'expo-haptics';
import { deviceInfo, spacing, typography, scale } from '../../utils/responsive';

export interface SwipeAction {
  label: string;
  icon: string;
  color: string;
  onPress: () => void;
}

interface SwipeableRowProps {
  children: React.ReactNode;
  leftActions?: SwipeAction[];
  rightActions?: SwipeAction[];
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
}

export default function SwipeableRow({
  children,
  leftActions = [],
  rightActions = [],
  onSwipeLeft,
  onSwipeRight,
}: SwipeableRowProps) {
  const { colors } = useTheme();
  const swipeableRef = useRef<Swipeable>(null);

  const renderLeftActions = (
    progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>
  ) => {
    if (leftActions.length === 0) return null;

    return (
      <View style={styles.actionsContainer}>
        {leftActions.map((action, index) => {
          const trans = progress.interpolate({
            inputRange: [0, 1],
            outputRange: [-80 * (index + 1), 0],
          });

          return (
            <Animated.View
              key={action.label}
              style={[
                styles.actionButton,
                { backgroundColor: action.color, transform: [{ translateX: trans }] },
              ]}
            >
              <TouchableOpacity
                style={styles.actionTouchable}
                onPress={async () => {
                  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  action.onPress();
                  swipeableRef.current?.close();
                }}
              >
                <Feather name={action.icon as any} size={24} color="#fff" />
                <Text style={styles.actionLabel}>{action.label}</Text>
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </View>
    );
  };

  const renderRightActions = (
    progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>
  ) => {
    if (rightActions.length === 0) return null;

    return (
      <View style={styles.actionsContainer}>
        {rightActions.map((action, index) => {
          const trans = progress.interpolate({
            inputRange: [0, 1],
            outputRange: [80 * (index + 1), 0],
          });

          return (
            <Animated.View
              key={action.label}
              style={[
                styles.actionButton,
                { backgroundColor: action.color, transform: [{ translateX: trans }] },
              ]}
            >
              <TouchableOpacity
                style={styles.actionTouchable}
                onPress={async () => {
                  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  action.onPress();
                  swipeableRef.current?.close();
                }}
              >
                <Feather name={action.icon as any} size={24} color="#fff" />
                <Text style={styles.actionLabel}>{action.label}</Text>
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </View>
    );
  };

  const handleSwipeableOpen = async (direction: 'left' | 'right') => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (direction === 'left' && onSwipeLeft) {
      onSwipeLeft();
    } else if (direction === 'right' && onSwipeRight) {
      onSwipeRight();
    }
  };

  return (
    <GestureHandlerRootView>
      <Swipeable
        ref={swipeableRef}
        renderLeftActions={renderLeftActions}
        renderRightActions={renderRightActions}
        onSwipeableOpen={handleSwipeableOpen}
        friction={2}
        leftThreshold={30}
        rightThreshold={30}
        overshootLeft={false}
        overshootRight={false}
      >
        {children}
      </Swipeable>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  actionButton: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
  },
  actionTouchable: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  actionLabel: {
    color: '#fff',
    fontSize: typography.caption,
    fontWeight: '600',
    marginTop: spacing.xs,
  },
});
