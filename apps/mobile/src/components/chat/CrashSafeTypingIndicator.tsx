/**
 * CRASH-SAFE TYPING INDICATOR
 * Shows typing users with error handling
 */

import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useErrorHandler } from '../ErrorBoundary';

interface CrashSafeTypingIndicatorProps {
  users: string[];
}

export const CrashSafeTypingIndicator: React.FC<CrashSafeTypingIndicatorProps> = ({
  users,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const handleError = useErrorHandler();

  useEffect(() => {
    try {
      if (users.length > 0) {
        // Animate in
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start();
      } else {
        // Animate out
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 0.8,
            duration: 150,
            useNativeDriver: true,
          }),
        ]).start();
      }
    } catch (error) {
      handleError(error instanceof Error ? error : new Error(String(error)));
    }
  }, [users.length, fadeAnim, scaleAnim, handleError]);

  if (users.length === 0) {
    return null;
  }

  const getTypingText = () => {
    try {
      if (users.length === 1) {
        return `${users[0]} is typing...`;
      } else if (users.length === 2) {
        return `${users[0]} and ${users[1]} are typing...`;
      } else if (users.length === 3) {
        return `${users[0]}, ${users[1]}, and ${users[2]} are typing...`;
      } else {
        return `${users[0]}, ${users[1]}, and ${users.length - 2} others are typing...`;
      }
    } catch (error) {
      handleError(error instanceof Error ? error : new Error(String(error)));
      return 'Someone is typing...';
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <View style={styles.content}>
        <View style={styles.dotsContainer}>
          <TypingDots />
        </View>
        <Text style={styles.text}>{getTypingText()}</Text>
      </View>
    </Animated.View>
  );
};

// Animated typing dots component
const TypingDots: React.FC = () => {
  const dot1Anim = useRef(new Animated.Value(0.3)).current;
  const dot2Anim = useRef(new Animated.Value(0.3)).current;
  const dot3Anim = useRef(new Animated.Value(0.3)).current;
  const handleError = useErrorHandler();

  useEffect(() => {
    try {
      const animateDot = (anim: Animated.Value, delay: number) => {
        return Animated.loop(
          Animated.sequence([
            Animated.delay(delay),
            Animated.timing(anim, {
              toValue: 1,
              duration: 400,
              useNativeDriver: true,
            }),
            Animated.timing(anim, {
              toValue: 0.3,
              duration: 400,
              useNativeDriver: true,
            }),
          ])
        );
      };

      const dot1Animation = animateDot(dot1Anim, 0);
      const dot2Animation = animateDot(dot2Anim, 133);
      const dot3Animation = animateDot(dot3Anim, 266);

      dot1Animation.start();
      dot2Animation.start();
      dot3Animation.start();

      return () => {
        dot1Animation.stop();
        dot2Animation.stop();
        dot3Animation.stop();
      };
    } catch (error) {
      handleError(error instanceof Error ? error : new Error(String(error)));
    }
  }, [dot1Anim, dot2Anim, dot3Anim, handleError]);

  return (
    <View style={styles.dots}>
      <Animated.View style={[styles.dot, { opacity: dot1Anim }]} />
      <Animated.View style={[styles.dot, { opacity: dot2Anim }]} />
      <Animated.View style={[styles.dot, { opacity: dot3Anim }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  dotsContainer: {
    width: 24,
    height: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#4a9eff',
  },
  text: {
    color: '#cccccc',
    fontSize: 13,
    fontStyle: 'italic',
  },
});