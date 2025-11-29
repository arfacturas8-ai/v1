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
  TouchableOpacity,
  Image,
  FlatList,
} from 'react-native';
import { PanGestureHandlerGestureEvent, State } from 'react-native-gesture-handler';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import { Button, Card, Checkbox } from '../../components/ui';
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
  features?: string[];
  component?: 'default' | 'interests' | 'communities' | 'features';
}

interface Interest {
  id: string;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  description: string;
  gradient: string[];
}

interface Community {
  id: string;
  name: string;
  displayName: string;
  description: string;
  memberCount: number;
  imageUrl: string;
  category: string;
}

const interests: Interest[] = [
  {
    id: 'gaming',
    name: 'Gaming',
    icon: 'game-controller',
    description: 'Video games, esports, streaming',
    gradient: ['#FF6B6B', '#4ECDC4']
  },
  {
    id: 'technology',
    name: 'Technology',
    icon: 'laptop',
    description: 'Programming, AI, innovation',
    gradient: ['#667eea', '#764ba2']
  },
  {
    id: 'crypto',
    name: 'Crypto & DeFi',
    icon: 'logo-bitcoin',
    description: 'Blockchain, NFTs, trading',
    gradient: ['#f093fb', '#f5576c']
  },
  {
    id: 'creative',
    name: 'Creative Arts',
    icon: 'color-palette',
    description: 'Art, music, design, writing',
    gradient: ['#4facfe', '#00f2fe']
  },
  {
    id: 'business',
    name: 'Business',
    icon: 'trending-up',
    description: 'Entrepreneurship, investing, career',
    gradient: ['#43e97b', '#38f9d7']
  },
  {
    id: 'lifestyle',
    name: 'Lifestyle',
    icon: 'heart',
    description: 'Health, fitness, travel, food',
    gradient: ['#fa709a', '#fee140']
  }
];

const recommendedCommunities: Community[] = [
  {
    id: 'community-general',
    name: 'general',
    displayName: 'General Discussion',
    description: 'Welcome space for all topics and introductions',
    memberCount: 1250,
    imageUrl: 'https://images.unsplash.com/photo-1556075798-4825dfaaf498?w=400&h=400&fit=crop',
    category: 'general'
  },
  {
    id: 'community-gaming',
    name: 'gaming',
    displayName: 'Gaming Central',
    description: 'Discuss games, find partners, share clips',
    memberCount: 890,
    imageUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400&h=400&fit=crop',
    category: 'gaming'
  },
  {
    id: 'community-technology',
    name: 'technology',
    displayName: 'Tech Talk',
    description: 'Programming, AI, and innovation discussions',
    memberCount: 675,
    imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=400&fit=crop',
    category: 'technology'
  },
  {
    id: 'community-crypto',
    name: 'crypto',
    displayName: 'Crypto & DeFi',
    description: 'Cryptocurrency and blockchain discussions',
    memberCount: 534,
    imageUrl: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400&h=400&fit=crop',
    category: 'crypto'
  },
  {
    id: 'community-creative',
    name: 'creative',
    displayName: 'Creative Corner',
    description: 'Share art, music, and creative projects',
    memberCount: 423,
    imageUrl: 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400&h=400&fit=crop',
    category: 'creative'
  }
];

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
    ],
    component: 'default'
  },
  {
    id: 2,
    title: 'What interests you?',
    description: 'Select your interests to help us recommend the best communities for you',
    icon: 'heart',
    gradient: ['#f093fb', '#f5576c'],
    component: 'interests'
  },
  {
    id: 3,
    title: 'Join Communities',
    description: 'Discover and join communities that match your interests',
    icon: 'people',
    gradient: ['#4facfe', '#00f2fe'],
    component: 'communities'
  },
  {
    id: 4,
    title: 'Explore Features',
    description: 'Learn about the powerful features that make CRYB special',
    icon: 'rocket',
    gradient: ['#43e97b', '#38f9d7'],
    component: 'features'
  }
];

export function EnhancedOnboardingScreen() {
  const navigation = useNavigation<OnboardingScreenNavigationProp>();
  const { colors, spacing, typography } = useTheme();
  
  const [currentSlide, setCurrentSlide] = useState(0);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [selectedCommunities, setSelectedCommunities] = useState<string[]>([]);
  const [userPreferences, setUserPreferences] = useState({
    allowNotifications: true,
    allowLocationServices: false,
    preferredTheme: 'auto'
  });
  
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

  const handleComplete = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Save user preferences and selections for later use
    const onboardingData = {
      interests: selectedInterests,
      communities: selectedCommunities,
      preferences: userPreferences,
      completedAt: new Date().toISOString()
    };
    
    // Store in AsyncStorage or send to API
    console.log('Onboarding completed with data:', onboardingData);
    
    navigation.navigate('Register');
  };

  const toggleInterest = (interestId: string) => {
    setSelectedInterests(prev => 
      prev.includes(interestId) 
        ? prev.filter(id => id !== interestId)
        : [...prev, interestId]
    );
    Haptics.selectionAsync();
  };

  const toggleCommunity = (communityId: string) => {
    setSelectedCommunities(prev => 
      prev.includes(communityId) 
        ? prev.filter(id => id !== communityId)
        : [...prev, communityId]
    );
    Haptics.selectionAsync();
  };

  const getFilteredCommunities = () => {
    if (selectedInterests.length === 0) return recommendedCommunities;
    return recommendedCommunities.filter(community => 
      selectedInterests.includes(community.category) || community.category === 'general'
    );
  };

  const renderInterestCard = ({ item }: { item: Interest }) => (
    <TouchableOpacity
      style={[
        styles.interestCard,
        selectedInterests.includes(item.id) && styles.selectedCard
      ]}
      onPress={() => toggleInterest(item.id)}
    >
      <LinearGradient
        colors={selectedInterests.includes(item.id) ? item.gradient : ['#f8f9fa', '#e9ecef']}
        style={styles.interestGradient}
      >
        <Ionicons
          name={item.icon}
          size={32}
          color={selectedInterests.includes(item.id) ? '#fff' : colors.textSecondary}
        />
        <Text style={[
          styles.interestName,
          { color: selectedInterests.includes(item.id) ? '#fff' : colors.text }
        ]}>
          {item.name}
        </Text>
        <Text style={[
          styles.interestDescription,
          { color: selectedInterests.includes(item.id) ? '#fff' : colors.textSecondary }
        ]}>
          {item.description}
        </Text>
      </LinearGradient>
    </TouchableOpacity>
  );

  const renderCommunityCard = ({ item }: { item: Community }) => (
    <TouchableOpacity
      style={[
        styles.communityCard,
        selectedCommunities.includes(item.id) && styles.selectedCommunityCard
      ]}
      onPress={() => toggleCommunity(item.id)}
    >
      <Image source={{ uri: item.imageUrl }} style={styles.communityImage} />
      <View style={styles.communityInfo}>
        <Text style={[styles.communityName, { color: colors.text }]}>
          {item.displayName}
        </Text>
        <Text style={[styles.communityDescription, { color: colors.textSecondary }]}>
          {item.description}
        </Text>
        <Text style={[styles.communityMembers, { color: colors.textSecondary }]}>
          {item.memberCount.toLocaleString()} members
        </Text>
      </View>
      <View style={[
        styles.joinButton,
        { backgroundColor: selectedCommunities.includes(item.id) ? colors.success : colors.border }
      ]}>
        <Ionicons
          name={selectedCommunities.includes(item.id) ? 'checkmark' : 'add'}
          size={20}
          color={selectedCommunities.includes(item.id) ? '#fff' : colors.textSecondary}
        />
      </View>
    </TouchableOpacity>
  );

  const renderSlideContent = (slide: OnboardingSlide) => {
    switch (slide.component) {
      case 'interests':
        return (
          <View style={styles.interestsContainer}>
            <Text style={[styles.slideTitle, { color: colors.textInverse }]}>
              {slide.title}
            </Text>
            <Text style={[styles.slideDescription, { color: colors.textInverse + 'DD' }]}>
              {slide.description}
            </Text>
            <FlatList
              data={interests}
              renderItem={renderInterestCard}
              keyExtractor={(item) => item.id}
              numColumns={2}
              columnWrapperStyle={styles.interestRow}
              style={styles.interestsList}
              showsVerticalScrollIndicator={false}
            />
          </View>
        );

      case 'communities':
        return (
          <View style={styles.communitiesContainer}>
            <Text style={[styles.slideTitle, { color: colors.textInverse }]}>
              {slide.title}
            </Text>
            <Text style={[styles.slideDescription, { color: colors.textInverse + 'DD' }]}>
              {slide.description}
            </Text>
            <FlatList
              data={getFilteredCommunities()}
              renderItem={renderCommunityCard}
              keyExtractor={(item) => item.id}
              style={styles.communitiesList}
              showsVerticalScrollIndicator={false}
            />
          </View>
        );

      case 'features':
        return (
          <View style={styles.featuresContainer}>
            <Text style={[styles.slideTitle, { color: colors.textInverse }]}>
              {slide.title}
            </Text>
            <Text style={[styles.slideDescription, { color: colors.textInverse + 'DD' }]}>
              {slide.description}
            </Text>
            
            <View style={styles.featuresList}>
              <View style={[styles.featureItem, { backgroundColor: colors.surface + '20' }]}>
                <Ionicons name="chatbubbles" size={24} color={colors.textInverse} />
                <View style={styles.featureText}>
                  <Text style={[styles.featureTitle, { color: colors.textInverse }]}>
                    Real-time Chat
                  </Text>
                  <Text style={[styles.featureDesc, { color: colors.textInverse + 'CC' }]}>
                    Instant messaging with voice and video calls
                  </Text>
                </View>
              </View>

              <View style={[styles.featureItem, { backgroundColor: colors.surface + '20' }]}>
                <Ionicons name="arrow-up" size={24} color={colors.textInverse} />
                <View style={styles.featureText}>
                  <Text style={[styles.featureTitle, { color: colors.textInverse }]}>
                    Democratic Voting
                  </Text>
                  <Text style={[styles.featureDesc, { color: colors.textInverse + 'CC' }]}>
                    Upvote great content and let the community decide
                  </Text>
                </View>
              </View>

              <View style={[styles.featureItem, { backgroundColor: colors.surface + '20' }]}>
                <Ionicons name="logo-bitcoin" size={24} color={colors.textInverse} />
                <View style={styles.featureText}>
                  <Text style={[styles.featureTitle, { color: colors.textInverse }]}>
                    Web3 Integration
                  </Text>
                  <Text style={[styles.featureDesc, { color: colors.textInverse + 'CC' }]}>
                    NFT profiles, crypto tipping, and token gating
                  </Text>
                </View>
              </View>

              <View style={[styles.featureItem, { backgroundColor: colors.surface + '20' }]}>
                <Ionicons name="shield-checkmark" size={24} color={colors.textInverse} />
                <View style={styles.featureText}>
                  <Text style={[styles.featureTitle, { color: colors.textInverse }]}>
                    Smart Moderation
                  </Text>
                  <Text style={[styles.featureDesc, { color: colors.textInverse + 'CC' }]}>
                    AI-powered content filtering and community tools
                  </Text>
                </View>
              </View>
            </View>
          </View>
        );

      default:
        return (
          <View style={styles.slideContent}>
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

            <Text style={[styles.slideTitle, { color: colors.textInverse }]}>
              {slide.title}
            </Text>
            <Text style={[styles.slideDescription, { color: colors.textInverse + 'DD' }]}>
              {slide.description}
            </Text>

            {slide.features && (
              <View style={styles.defaultFeaturesContainer}>
                {slide.features.map((feature, idx) => (
                  <Animated.View
                    key={idx}
                    style={[
                      styles.defaultFeatureItem,
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
                    <Text style={[styles.defaultFeatureText, { color: colors.textInverse }]}>
                      {feature}
                    </Text>
                  </Animated.View>
                ))}
              </View>
            )}
          </View>
        );
    }
  };

  const renderSlide = (slide: OnboardingSlide, index: number) => (
    <Animated.View 
      key={slide.id}
      style={[
        styles.slide,
        {
          opacity: fadeAnims[index],
        }
      ]}
    >
      <LinearGradient
        colors={slide.gradient}
        style={styles.slideGradient}
      >
        {renderSlideContent(slide)}
      </LinearGradient>
    </Animated.View>
  );

  const canProceed = () => {
    switch (currentSlide) {
      case 1: // Interests slide
        return selectedInterests.length > 0;
      case 2: // Communities slide
        return true; // Optional to select communities
      default:
        return true;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
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

          {/* Progress Info */}
          {currentSlide === 1 && (
            <Text style={[styles.progressText, { color: colors.textSecondary }]}>
              {selectedInterests.length} interests selected
            </Text>
          )}
          {currentSlide === 2 && (
            <Text style={[styles.progressText, { color: colors.textSecondary }]}>
              {selectedCommunities.length} communities to join
            </Text>
          )}

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
                disabled={!canProceed()}
              />
            ) : (
              <Button
                title="Get Started"
                onPress={handleComplete}
                variant="primary"
                size="lg"
                style={{ flex: 1 }}
              />
            )}
          </View>
        </View>
      </View>
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
  
  // Interests slide styles
  interestsContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 100,
  },
  interestsList: {
    flex: 1,
    marginTop: 20,
  },
  interestRow: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  interestCard: {
    width: '48%',
    height: 120,
    borderRadius: 16,
    overflow: 'hidden',
  },
  selectedCard: {
    transform: [{ scale: 0.98 }],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  interestGradient: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  interestName: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  interestDescription: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },

  // Communities slide styles
  communitiesContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 100,
  },
  communitiesList: {
    flex: 1,
    marginTop: 20,
  },
  communityCard: {
    flexDirection: 'row',
    padding: 16,
    marginBottom: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    alignItems: 'center',
  },
  selectedCommunityCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  communityImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 16,
  },
  communityInfo: {
    flex: 1,
  },
  communityName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  communityDescription: {
    fontSize: 14,
    marginBottom: 4,
  },
  communityMembers: {
    fontSize: 12,
  },
  joinButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Features slide styles
  featuresContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 100,
  },
  featuresList: {
    marginTop: 20,
  },
  featureItem: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  featureText: {
    marginLeft: 16,
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  featureDesc: {
    fontSize: 14,
  },

  // Default slide styles
  defaultFeaturesContainer: {
    width: '100%',
    gap: 12,
  },
  defaultFeatureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  defaultFeatureText: {
    fontSize: 14,
    flex: 1,
  },

  // Bottom section styles
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
    marginBottom: 20,
    gap: 8,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  progressText: {
    textAlign: 'center',
    fontSize: 14,
    marginBottom: 20,
  },
  navigationContainer: {
    flexDirection: 'row',
    gap: 12,
  },
});