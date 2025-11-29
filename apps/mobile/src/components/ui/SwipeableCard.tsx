import React, { useRef, useState } from 'react';
import {
  View,
  Animated,
  PanResponder,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { scale } from '../../utils/responsive';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = 120;
const SWIPE_OUT_DURATION = 200;

interface SwipeableCardProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onLongPress?: () => void;
  leftAction?: {
    icon: string;
    color: string;
    label?: string;
  };
  rightAction?: {
    icon: string;
    color: string;
    label?: string;
  };
  disabled?: boolean;
  style?: any;
}

export function SwipeableCard({
  children,
  onSwipeLeft,
  onSwipeRight,
  onLongPress,
  leftAction,
  rightAction,
  disabled = false,
  style,
}: SwipeableCardProps) {
  const position = useRef(new Animated.ValueXY()).current;
  const [swiping, setSwiping] = useState(false);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !disabled,
      onMoveShouldSetPanResponder: (_, gesture) => {
        // Only respond to horizontal swipes
        return !disabled && Math.abs(gesture.dx) > Math.abs(gesture.dy);
      },
      onPanResponderGrant: () => {
        setSwiping(true);
        position.setOffset({
          x: (position.x as any)._value,
          y: 0,
        });
        position.setValue({ x: 0, y: 0 });

        // Start long press timer
        const timer = setTimeout(() => {
          if (onLongPress) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onLongPress();
          }
        }, 500);
        setLongPressTimer(timer);
      },
      onPanResponderMove: (_, gesture) => {
        // Cancel long press if moved
        if (longPressTimer && Math.abs(gesture.dx) > 10) {
          clearTimeout(longPressTimer);
          setLongPressTimer(null);
        }

        // Provide haptic feedback at threshold
        if (Math.abs(gesture.dx) > SWIPE_THRESHOLD / 2) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }

        position.setValue({ x: gesture.dx, y: 0 });
      },
      onPanResponderRelease: (_, gesture) => {
        // Clear long press timer
        if (longPressTimer) {
          clearTimeout(longPressTimer);
          setLongPressTimer(null);
        }

        position.flattenOffset();
        setSwiping(false);

        const { dx, vx } = gesture;

        // Check if swipe was far/fast enough
        if (dx > SWIPE_THRESHOLD || vx > 0.5) {
          // Swipe right
          forceSwipe('right');
        } else if (dx < -SWIPE_THRESHOLD || vx < -0.5) {
          // Swipe left
          forceSwipe('left');
        } else {
          // Return to original position
          resetPosition();
        }
      },
    })
  ).current;

  const forceSwipe = (direction: 'left' | 'right') => {
    const x = direction === 'right' ? SCREEN_WIDTH : -SCREEN_WIDTH;

    Animated.timing(position, {
      toValue: { x, y: 0 },
      duration: SWIPE_OUT_DURATION,
      useNativeDriver: true,
    }).start(() => {
      // Execute callback
      if (direction === 'right' && onSwipeRight) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onSwipeRight();
      } else if (direction === 'left' && onSwipeLeft) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onSwipeLeft();
      }

      // Reset position
      position.setValue({ x: 0, y: 0 });
    });
  };

  const resetPosition = () => {
    Animated.spring(position, {
      toValue: { x: 0, y: 0 },
      useNativeDriver: true,
      friction: 5,
    }).start();
  };

  const getCardStyle = () => {
    const rotate = position.x.interpolate({
      inputRange: [-SCREEN_WIDTH * 1.5, 0, SCREEN_WIDTH * 1.5],
      outputRange: ['-10deg', '0deg', '10deg'],
    });

    return {
      ...position.getLayout(),
      transform: [{ rotate }],
    };
  };

  const getLeftActionOpacity = () => {
    return position.x.interpolate({
      inputRange: [0, SWIPE_THRESHOLD],
      outputRange: [0, 1],
      extrapolate: 'clamp',
    });
  };

  const getRightActionOpacity = () => {
    return position.x.interpolate({
      inputRange: [-SWIPE_THRESHOLD, 0],
      outputRange: [1, 0],
      extrapolate: 'clamp',
    });
  };

  return (
    <View style={[styles.container, style]}>
      {/* Left Action (shown when swiping right) */}
      {rightAction && (
        <Animated.View
          style={[
            styles.actionContainer,
            styles.leftAction,
            { backgroundColor: rightAction.color, opacity: getLeftActionOpacity() },
          ]}
        >
          <Feather name={rightAction.icon as any} size={24} color="#fff" />
        </Animated.View>
      )}

      {/* Right Action (shown when swiping left) */}
      {leftAction && (
        <Animated.View
          style={[
            styles.actionContainer,
            styles.rightAction,
            { backgroundColor: leftAction.color, opacity: getRightActionOpacity() },
          ]}
        >
          <Feather name={leftAction.icon as any} size={24} color="#fff" />
        </Animated.View>
      )}

      {/* Card */}
      <Animated.View
        {...panResponder.panHandlers}
        style={[styles.card, getCardStyle()]}
      >
        {children}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  card: {
    width: '100%',
  },
  actionContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    width: scale(80),
    zIndex: -1,
  },
  leftAction: {
    left: 0,
    borderTopLeftRadius: scale(12),
    borderBottomLeftRadius: scale(12),
  },
  rightAction: {
    right: 0,
    borderTopRightRadius: scale(12),
    borderBottomRightRadius: scale(12),
  },
});
