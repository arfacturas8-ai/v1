import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  Animated,
  ScrollView,
} from 'react-native';
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

type WelcomeScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Welcome'>;

// Define the onboarding screens that will be created
export type OnboardingStackParamList = {
  Welcome: undefined;
  Onboarding: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

export function WelcomeScreen() {
  const navigation = useNavigation<WelcomeScreenNavigationProp>();
  const { colors, spacing, typography } = useTheme();
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const featureAnims = useRef([...Array(5)].map(() => new Animated.Value(0))).current;
  
  useEffect(() => {
    // Logo animation
    Animated.spring(logoScale, {
      toValue: 1,
      tension: 100,
      friction: 8,
      useNativeDriver: true,
    }).start();
    
    // Main content animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
    
    // Feature animations with stagger
    const featureAnimations = featureAnims.map((anim, index) => 
      Animated.timing(anim, {
        toValue: 1,
        duration: 600,
        delay: 300 + (index * 150),
        useNativeDriver: true,
      })
    );
    
    Animated.stagger(100, featureAnimations).start();
  }, []);

  const handleGetStarted = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('Onboarding');
  };
  
  const handleSignIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('Login');
  };
  
  const features = [
    {
      icon: 'chatbubbles',
      title: 'Real-time Communication',
      description: 'Chat, voice calls, and video with crystal clarity'
    },
    {
      icon: 'people',
      title: 'Thriving Communities', 
      description: 'Join discussions that matter to you'
    },
    {
      icon: 'arrow-up',
      title: 'Democratic Voting',
      description: 'Upvote the best content to the top'
    },
    {
      icon: 'shield-checkmark',
      title: 'Web3 Ready',
      description: 'Crypto integration and decentralized features'
    },
    {
      icon: 'notifications',
      title: 'Smart Notifications',
      description: 'Never miss what matters most to you'
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[colors.primary, colors.primaryDark, colors.primary + 'DD']}
        locations={[0, 0.6, 1]}
        style={styles.gradient}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Logo Section */}
          <Animated.View 
            style={[
              styles.logoSection,
              {
                transform: [{ scale: logoScale }],
                opacity: fadeAnim,
              }
            ]}
          >
            <View style={[styles.logoContainer, { backgroundColor: colors.surface }]}>
              <Text style={[styles.logoText, { color: colors.primary }]}>C</Text>
            </View>
            <Animated.Text 
              style={[
                styles.brandName, 
                { 
                  color: colors.textInverse,
                  transform: [{ translateY: slideAnim }]
                }
              ]}
            >
              CRYB
            </Animated.Text>
          </Animated.View>

          {/* Main Content */}
          <Animated.View 
            style={[
              styles.content,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            <Text style={[styles.title, { color: colors.textInverse }]}>
              Welcome to the Future
            </Text>
            <Text style={[styles.subtitle, { color: colors.textInverse + 'CC' }]}>
              Where Discord meets Reddit. Build communities, share ideas, and connect in real-time.
            </Text>

            {/* Features */}
            <View style={styles.featuresContainer}>
              {features.map((feature, index) => (
                <Animated.View
                  key={index}
                  style={[
                    styles.featureCard,
                    {
                      backgroundColor: colors.surface + '20',
                      borderColor: colors.textInverse + '20',
                      opacity: featureAnims[index],
                      transform: [
                        {
                          translateX: featureAnims[index].interpolate({
                            inputRange: [0, 1],
                            outputRange: [-20, 0],
                          })
                        }
                      ]
                    }
                  ]}
                >
                  <View style={[styles.featureIconContainer, { backgroundColor: colors.surface + '30' }]}>
                    <Ionicons
                      name={feature.icon as any}
                      size={24}
                      color={colors.textInverse}
                    />
                  </View>
                  <View style={styles.featureTextContainer}>
                    <Text style={[styles.featureTitle, { color: colors.textInverse }]}>
                      {feature.title}
                    </Text>
                    <Text style={[styles.featureDescription, { color: colors.textInverse + 'AA' }]}>
                      {feature.description}
                    </Text>
                  </View>
                </Animated.View>
              ))}
            </View>
          </Animated.View>

          {/* Action Buttons */}
          <Animated.View 
            style={[
              styles.actionContainer,
              {
                opacity: fadeAnim,
              }
            ]}
          >
            <Button
              title="Get Started"
              onPress={handleGetStarted}
              variant="primary"
              size="lg"
              fullWidth
              style={[styles.primaryButton, { backgroundColor: colors.surface }]}
              textStyle={{ color: colors.primary }}
            />
            
            <Button
              title="Sign In"
              onPress={handleSignIn}
              variant="outline"
              size="lg"
              fullWidth
              style={[styles.secondaryButton, { borderColor: colors.textInverse }]}
              textStyle={{ color: colors.textInverse }}
            />
            
            <TouchableOpacity 
              style={styles.skipButton}
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={[styles.skipText, { color: colors.textInverse + '80' }]}>
                Skip for now
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },
  logoSection: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 40,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  logoText: {
    fontSize: 32,
    fontWeight: '800',
  },
  brandName: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 3,
  },
  content: {
    alignItems: 'center',
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 36,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
    paddingHorizontal: 8,
  },
  featuresContainer: {
    width: '100%',
    gap: 16,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  featureIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featureTextContainer: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  actionContainer: {
    paddingTop: 20,
    paddingBottom: 40,
    gap: 16,
  },
  primaryButton: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  secondaryButton: {
    borderWidth: 2,
  },
  skipButton: {
    alignSelf: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  skipText: {
    fontSize: 14,
    textAlign: 'center',
  },
});