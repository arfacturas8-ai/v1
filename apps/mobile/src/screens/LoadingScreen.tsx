import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Animated,
  Dimensions,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';
import { LoadingSpinner } from '../components/ui';
import { deviceInfo, spacing, typography, scale } from '../utils/responsive';

const { width, height } = Dimensions.get('window');

interface LoadingScreenProps {
  text?: string;
  showProgress?: boolean;
  progress?: number;
}

export function SplashScreen() {
  return <LoadingScreen />;
}

export function LoadingScreen({ 
  text = 'Loading CRYB...', 
  showProgress = false,
  progress = 0 
}: LoadingScreenProps) {
  const { colors, spacing, typography } = useTheme();
  const logoScale = useRef(new Animated.Value(0.5)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const progressValue = useRef(new Animated.Value(0)).current;
  const pulseAnimation = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Logo entrance animation
    Animated.sequence([
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(logoScale, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    // Continuous pulse animation for logo
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );

    const pulseTimeout = setTimeout(() => {
      pulseLoop.start();
    }, 1400);

    return () => {
      clearTimeout(pulseTimeout);
      pulseLoop.stop();
    };
  }, []);

  useEffect(() => {
    if (showProgress) {
      Animated.timing(progressValue, {
        toValue: progress,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  }, [progress, showProgress]);

  return (
    <LinearGradient
      colors={[
        colors.background,
        colors.primary + '10',
        colors.background,
      ]}
      locations={[0, 0.5, 1]}
      style={styles.container}
    >
      {/* Animated background elements */}
      <View style={styles.backgroundElements}>
        {[...Array(6)].map((_, i) => (
          <Animated.View
            key={i}
            style={[
              styles.backgroundCircle,
              {
                backgroundColor: colors.primary + '05',
                transform: [
                  {
                    scale: pulseAnimation.interpolate({
                      inputRange: [1, 1.1],
                      outputRange: [0.8 + i * 0.1, 1.2 + i * 0.1],
                    }),
                  },
                ],
                opacity: pulseAnimation.interpolate({
                  inputRange: [1, 1.1],
                  outputRange: [0.3, 0.1],
                }),
              },
            ]}
          />
        ))}
      </View>

      {/* Logo */}
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: logoOpacity,
            transform: [
              { scale: Animated.multiply(logoScale, pulseAnimation) },
            ],
          },
        ]}
      >
        <View style={[styles.logo, { backgroundColor: colors.primary }]}>
          <Text style={[styles.logoText, { color: colors.textInverse }]}>
            C
          </Text>
        </View>
        <Text style={[styles.brandText, { color: colors.primary }]}>
          CRYB
        </Text>
      </Animated.View>

      {/* Loading text and spinner removed */}
      <Animated.View
        style={[
          styles.loadingContainer,
          { opacity: textOpacity },
        ]}
      >
        {/* Removed loading spinner and text */}
      </Animated.View>

      {/* Progress bar */}
      {showProgress && (
        <Animated.View
          style={[
            styles.progressContainer,
            { opacity: textOpacity },
          ]}
        >
          <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
            <Animated.View
              style={[
                styles.progressFill,
                {
                  backgroundColor: colors.primary,
                  width: progressValue.interpolate({
                    inputRange: [0, 100],
                    outputRange: ['0%', '100%'],
                  }),
                },
              ]}
            />
          </View>
          <Animated.Text
            style={[
              styles.progressText,
              { color: colors.textTertiary },
            ]}
          >
            {Math.round(progress)}%
          </Animated.Text>
        </Animated.View>
      )}

      {/* Version or tagline */}
      <Animated.View
        style={[
          styles.footer,
          { opacity: textOpacity },
        ]}
      >
        <Text style={[styles.tagline, { color: colors.textTertiary }]}>
          Next-gen community platform
        </Text>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  backgroundElements: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backgroundCircle: {
    position: 'absolute',
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: (width * 0.8) / 2,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  logoText: {
    fontSize: typography.h1,
    fontWeight: '800',
    textAlign: 'center',
  },
  brandText: {
    fontSize: typography.h3,
    fontWeight: '700',
    letterSpacing: 2,
  },
  loadingContainer: {
    alignItems: 'center',
    position: 'absolute',
    bottom: height * 0.25,
  },
  loadingText: {
    fontSize: typography.body1,
    textAlign: 'center',
  },
  progressContainer: {
    position: 'absolute',
    bottom: height * 0.15,
    width: width * 0.7,
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: typography.caption,
    fontWeight: '500',
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    alignItems: 'center',
  },
  tagline: {
    fontSize: typography.body2,
    textAlign: 'center',
  },
});