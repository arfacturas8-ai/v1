import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  SafeAreaView,
  Animated,
  PanGestureHandler,
  ScrollView,
} from 'react-native';
import { PanGestureHandlerGestureEvent, State } from 'react-native-gesture-handler';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import { Button } from '../../components/ui';
import * as Haptics from 'expo-haptics';
import { deviceInfo, spacing, typography, scale } from '../../utils/responsive';

const { width, height } = Dimensions.get('window');

type OnboardingScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Onboarding'>;

interface OnboardingSlide {
  id: number;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  gradient: string[];
  features: string[];
}

const slides: OnboardingSlide[] = [
  {
    id: 1,
    title: 'Welcome to CRYB',
    description: 'The next-generation community platform that combines the best of Discord and Reddit',
    icon: 'planet',
    gradient: ['#667eea', '#764ba2'],
    features: [
      'Real-time messaging and voice calls',
      'Community-driven discussions',
      'Upvoting and democratic content curation',
      'Web3 integration and crypto features'
    ]
  },
  {
    id: 2,
    title: 'Build Communities',
    description: 'Create and join communities around your interests and passions',
    icon: 'people',
    gradient: ['#f093fb', '#f5576c'],
    features: [
      'Create your own communities',
      'Join existing communities',
      'Moderate and manage content',
      'Custom roles and permissions'
    ]
  },
  {
    id: 3,
    title: 'Real-time Communication',
    description: 'Chat, share, and connect with people in real-time across the globe',
    icon: 'chatbubbles',
    gradient: ['#4facfe', '#00f2fe'],
    features: [
      'Instant messaging',
      'Voice and video calls',
      'Screen sharing',
      'File and media sharing'
    ]
  },
  {
    id: 4,
    title: 'Democratic Content',
    description: 'Vote on content and let the community decide what rises to the top',
    icon: 'arrow-up',
    gradient: ['#43e97b', '#38f9d7'],
    features: [
      'Upvote great content',
      'Downvote irrelevant posts',
      'Trending algorithms',
      'Community-curated feeds'
    ]
  }
];

export function OnboardingScreen() {
  const navigation = useNavigation<OnboardingScreenNavigationProp>();
  const { colors, spacing, typography } = useTheme();
  
  const [currentSlide, setCurrentSlide] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnims = useRef(slides.map(() => new Animated.Value(0))).current;
  
  useEffect(() => {
    // Animate in the current slide
    Animated.timing(fadeAnims[currentSlide], {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, [currentSlide]);

  const goToNextSlide = () => {
    if (currentSlide < slides.length - 1) {
      const nextSlide = currentSlide + 1;
      setCurrentSlide(nextSlide);
      scrollViewRef.current?.scrollTo({
        x: nextSlide * width,
        animated: true,
      });
      Haptics.selectionAsync();
    }
  };

  const goToPreviousSlide = () => {
    if (currentSlide > 0) {
      const prevSlide = currentSlide - 1;
      setCurrentSlide(prevSlide);
      scrollViewRef.current?.scrollTo({
        x: prevSlide * width,
        animated: true,
      });
      Haptics.selectionAsync();
    }
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('Register');
  };

  const handleGetStarted = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('Register');
  };

  const onGestureEvent = (event: PanGestureHandlerGestureEvent) => {
    const { translationX } = event.nativeEvent;
    slideAnim.setValue(translationX);
  };

  const onHandlerStateChange = (event: PanGestureHandlerGestureEvent) => {
    if (event.nativeEvent.state === State.END) {
      const { translationX } = event.nativeEvent;
      
      if (translationX < -50 && currentSlide < slides.length - 1) {
        goToNextSlide();
      } else if (translationX > 50 && currentSlide > 0) {
        goToPreviousSlide();
      }
      
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
      }).start();
    }
  };

  const renderSlide = (slide: OnboardingSlide, index: number) => (
    <Animated.View 
      key={slide.id}
      style={[
        styles.slide,
        {
          opacity: fadeAnims[index],
          transform: [
            {
              translateX: slideAnim.interpolate({
                inputRange: [-width, 0, width],
                outputRange: [index === currentSlide ? -50 : 0, 0, index === currentSlide ? 50 : 0],
                extrapolate: 'clamp',
              })
            }
          ]
        }
      ]}
    >
      <LinearGradient
        colors={slide.gradient}
        style={styles.slideGradient}
      >
        <View style={styles.slideContent}>
          {/* Icon */}
          <Animated.View 
            style={[
              styles.iconContainer,
              { backgroundColor: colors.surface + '30' }
            ]}
          >
            <Ionicons
              name={slide.icon}
              size={60}
              color={colors.textInverse}
            />
          </Animated.View>

          {/* Title and Description */}
          <Text style={[styles.slideTitle, { color: colors.textInverse }]}>
            {slide.title}
          </Text>
          <Text style={[styles.slideDescription, { color: colors.textInverse + 'DD' }]}>
            {slide.description}
          </Text>

          {/* Features */}
          <View style={styles.featuresContainer}>
            {slide.features.map((feature, idx) => (
              <Animated.View
                key={idx}
                style={[
                  styles.featureItem,
                  {
                    backgroundColor: colors.surface + '20',
                    borderColor: colors.textInverse + '30',
                  }
                ]}
              >
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color={colors.textInverse}
                  style={{ marginRight: spacing.sm }}
                />
                <Text style={[styles.featureText, { color: colors.textInverse }]}>
                  {feature}
                </Text>
              </Animated.View>
            ))}
          </View>
        </View>
      </LinearGradient>
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <PanGestureHandler
        onGestureEvent={onGestureEvent}
        onHandlerStateChange={onHandlerStateChange}
      >
        <View style={styles.container}>
          {/* Skip Button */}
          <View style={styles.header}>
            <Button
              title="Skip"
              onPress={handleSkip}
              variant="ghost"
              size="sm"
              textStyle={{ color: colors.textSecondary }}
            />
          </View>

          {/* Slides */}
          <ScrollView
            ref={scrollViewRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            scrollEnabled={false}
            style={styles.slidesContainer}
          >
            {slides.map((slide, index) => renderSlide(slide, index))}
          </ScrollView>

          {/* Bottom Section */}
          <View style={[styles.bottomSection, { backgroundColor: colors.background }]}>
            {/* Page Indicators */}
            <View style={styles.indicatorContainer}>
              {slides.map((_, index) => (
                <Animated.View
                  key={index}
                  style={[
                    styles.indicator,
                    {
                      backgroundColor: index === currentSlide
                        ? colors.primary
                        : colors.border,
                      transform: [
                        {
                          scale: index === currentSlide ? 1.2 : 1,
                        }
                      ]
                    }
                  ]}
                />
              ))}
            </View>

            {/* Navigation Buttons */}
            <View style={styles.navigationContainer}>
              {currentSlide > 0 && (
                <Button
                  title="Previous"
                  onPress={goToPreviousSlide}
                  variant="outline"
                  size="lg"
                  style={{ flex: 1, marginRight: spacing.sm }}
                />
              )}
              
              {currentSlide < slides.length - 1 ? (
                <Button
                  title="Next"
                  onPress={goToNextSlide}
                  variant="primary"
                  size="lg"
                  style={{ flex: 1 }}
                />
              ) : (
                <Button
                  title="Get Started"
                  onPress={handleGetStarted}
                  variant="primary"
                  size="lg"
                  style={{ flex: 1 }}
                />
              )}
            </View>
          </View>
        </View>
      </PanGestureHandler>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 10,
    zIndex: 10,
  },
  slidesContainer: {
    flex: 1,
  },
  slide: {
    width,
    height: '100%',
  },
  slideGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  slideContent: {
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingBottom: 100,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  slideTitle: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 36,
  },
  slideDescription: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
  },
  featuresContainer: {
    width: '100%',
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  featureText: {
    fontSize: 14,
    flex: 1,
  },
  bottomSection: {
    paddingHorizontal: 20,
    paddingVertical: 30,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  indicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 30,
    gap: 8,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  navigationContainer: {
    flexDirection: 'row',
    gap: 12,
  },
});