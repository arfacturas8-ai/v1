import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuthStore } from '../../stores/authStore';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import { Button, Card, Badge, Input } from '../../components/ui';
import apiService from '../../services/RealApiService';
import { deviceInfo, spacing, typography, scale } from '../../utils/responsive';

type CommunitySelectionScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'CommunitySelection'>;

interface Community {
  id: string;
  name: string;
  displayName: string;
  description: string;
  memberCount: number;
  imageUrl?: string;
  category: string;
  postCount: number;
  isJoined?: boolean;
}

interface RouteParams {
  interests: string[];
}

export function CommunitySelectionScreen() {
  const navigation = useNavigation<CommunitySelectionScreenNavigationProp>();
  const route = useRoute();
  const { colors, spacing } = useTheme();
  const { user } = useAuthStore();

  const params = route.params as RouteParams;
  const userInterests = params?.interests || [];

  const [communities, setCommunities] = useState<Community[]>([]);
  const [selectedCommunities, setSelectedCommunities] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    loadRecommendedCommunities();
  }, []);

  const loadRecommendedCommunities = async () => {
    setLoading(true);
    try {
      // Get recommended communities based on interests
      const response = await apiService.post('/onboarding/recommend-communities', {
        interests: userInterests
      });

      if (response.success) {
        setCommunities(response.data.communities || []);
      } else {
        // Fallback to general communities
        const generalResponse = await apiService.get('/communities');
        if (generalResponse.success) {
          setCommunities(generalResponse.data.items || []);
        }
      }
    } catch (error) {
      console.error('Failed to load communities:', error);
      Alert.alert('Error', 'Failed to load communities. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleCommunity = (communityId: string) => {
    setSelectedCommunities(prev =>
      prev.includes(communityId)
        ? prev.filter(id => id !== communityId)
        : [...prev, communityId]
    );
    Haptics.selectionAsync();
  };

  const joinSelectedCommunities = async () => {
    setCompleting(true);
    try {
      // Save community selections
      const response = await apiService.post('/onboarding/complete-step', {
        stepId: 'communities',
        data: { selectedCommunities }
      });

      if (response.success) {
        // Complete the onboarding process
        const completeResponse = await apiService.post('/onboarding/complete', {
          completedSteps: ['profile', 'interests', 'communities'],
          skippedSteps: [],
          totalTimeSpent: 0 // Could track this if needed
        });

        if (completeResponse.success) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          
          // Navigate to main app
          Alert.alert(
            'Welcome to CRYB! 🎉',
            `You've joined ${selectedCommunities.length} communities. Start exploring and connecting with others!`,
            [
              {
                text: 'Get Started',
                onPress: () => {
                  // Reset navigation stack and go to main app
                  navigation.reset({
                    index: 0,
                    routes: [{ name: 'Main' as any }],
                  });
                }
              }
            ]
          );
        }
      }
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
      Alert.alert('Error', 'Failed to join communities. Please try again.');
    } finally {
      setCompleting(false);
    }
  };

  const skipCommunitySelection = () => {
    Alert.alert(
      'Skip Community Selection?',
      'You can always join communities later from the explore page.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Skip',
          onPress: async () => {
            try {
              await apiService.post('/onboarding/complete', {
                completedSteps: ['profile', 'interests'],
                skippedSteps: ['communities'],
                totalTimeSpent: 0
              });

              navigation.reset({
                index: 0,
                routes: [{ name: 'Main' as any }],
              });
            } catch (error) {
              console.error('Failed to skip onboarding:', error);
            }
          }
        }
      ]
    );
  };

  const filteredCommunities = communities.filter(community =>
    community.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    community.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderCommunityCard = ({ item: community }: { item: Community }) => {
    const isSelected = selectedCommunities.includes(community.id);
    
    return (
      <TouchableOpacity
        style={[
          styles.communityCard,
          {
            backgroundColor: colors.surface,
            borderColor: isSelected ? colors.primary : colors.border,
            borderWidth: isSelected ? 2 : 1,
          }
        ]}
        onPress={() => toggleCommunity(community.id)}
      >
        <View style={styles.communityHeader}>
          <Image
            source={{ 
              uri: community.imageUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${community.name}` 
            }}
            style={styles.communityImage}
          />
          <View style={styles.communityInfo}>
            <Text style={[styles.communityName, { color: colors.text }]}>
              {community.displayName}
            </Text>
            <Text style={[styles.communityStats, { color: colors.textSecondary }]}>
              {community.memberCount.toLocaleString()} members • {community.postCount} posts
            </Text>
          </View>
          <View style={[
            styles.joinButton,
            { 
              backgroundColor: isSelected ? colors.primary : colors.border,
            }
          ]}>
            <Ionicons
              name={isSelected ? 'checkmark' : 'add'}
              size={20}
              color={isSelected ? 'white' : colors.textSecondary}
            />
          </View>
        </View>
        
        <Text style={[styles.communityDescription, { color: colors.textSecondary }]}>
          {community.description}
        </Text>

        {/* Show if community matches user interests */}
        {userInterests.includes(community.category) && (
          <Badge
            variant="secondary"
            style={[styles.matchBadge, { backgroundColor: colors.primary + '20' }]}
          >
            <Ionicons name="heart" size={12} color={colors.primary} />
            <Text style={[styles.matchText, { color: colors.primary }]}>
              Matches your interests
            </Text>
          </Badge>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.text }]}>
            Finding communities for you...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Join Communities
        </Text>
        <TouchableOpacity onPress={skipCommunitySelection}>
          <Text style={[styles.skipButton, { color: colors.primary }]}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.intro}>
          <Text style={[styles.introTitle, { color: colors.text }]}>
            Discover Your Communities
          </Text>
          <Text style={[styles.introDescription, { color: colors.textSecondary }]}>
            Based on your interests, we've found some great communities for you to join.
            You can always join more later!
          </Text>
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <Input
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search communities..."
            leftIcon="search"
          />
        </View>

        {/* Selected Count */}
        {selectedCommunities.length > 0 && (
          <View style={[styles.selectionStatus, { backgroundColor: colors.primary + '10' }]}>
            <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
            <Text style={[styles.selectionText, { color: colors.primary }]}>
              {selectedCommunities.length} communit{selectedCommunities.length === 1 ? 'y' : 'ies'} selected
            </Text>
          </View>
        )}

        {/* Interest-based recommendations */}
        {userInterests.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Recommended for You
            </Text>
            <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
              Communities matching your interests: {userInterests.join(', ')}
            </Text>
          </View>
        )}

        {/* Communities List */}
        <FlatList
          data={filteredCommunities}
          renderItem={renderCommunityCard}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          contentContainerStyle={styles.communitiesList}
        />

        {filteredCommunities.length === 0 && searchQuery && (
          <View style={styles.noResults}>
            <Ionicons name="search" size={48} color={colors.textSecondary} />
            <Text style={[styles.noResultsText, { color: colors.textSecondary }]}>
              No communities found for "{searchQuery}"
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Bottom Actions */}
      <View style={[styles.bottomActions, { backgroundColor: colors.background }]}>
        <View style={styles.actionButtons}>
          <Button
            title="Browse All"
            onPress={() => {
              // Navigate to full community browser
              Alert.alert('Coming Soon', 'Full community browser will be available soon!');
            }}
            variant="outline"
            style={{ flex: 1, marginRight: spacing.sm }}
          />
          
          <Button
            title={selectedCommunities.length > 0 ? 'Join & Continue' : 'Continue'}
            onPress={joinSelectedCommunities}
            variant="primary"
            style={{ flex: 1 }}
            loading={completing}
          />
        </View>
        
        {selectedCommunities.length === 0 && (
          <Text style={[styles.bottomHint, { color: colors.textSecondary }]}>
            You can join communities later from the explore page
          </Text>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: typography.body1,
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  headerTitle: {
    fontSize: typography.h6,
    fontWeight: '600',
  },
  skipButton: {
    fontSize: typography.body1,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
  },
  intro: {
    marginBottom: spacing.xxl,
  },
  introTitle: {
    fontSize: typography.h4,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  introDescription: {
    fontSize: typography.body1,
    lineHeight: 24,
  },
  searchContainer: {
    marginBottom: spacing.lg,
  },
  selectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.lg,
  },
  selectionText: {
    fontSize: typography.body2,
    fontWeight: '500',
    marginLeft: spacing.sm,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.h6,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  sectionDescription: {
    fontSize: typography.body2,
    lineHeight: 20,
  },
  communitiesList: {
    paddingBottom: spacing.xl,
  },
  communityCard: {
    padding: spacing.lg,
    borderRadius: deviceInfo.isTablet ? 14 : 12,
    marginBottom: spacing.md,
  },
  communityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  communityImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: spacing.md,
  },
  communityInfo: {
    flex: 1,
  },
  communityName: {
    fontSize: typography.body1,
    fontWeight: '600',
    marginBottom: 2,
  },
  communityStats: {
    fontSize: typography.caption,
  },
  joinButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  communityDescription: {
    fontSize: typography.body2,
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  matchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: deviceInfo.isTablet ? 14 : 12,
  },
  matchText: {
    fontSize: typography.caption,
    fontWeight: '500',
    marginLeft: spacing.xs,
  },
  noResults: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
  },
  noResultsText: {
    fontSize: typography.body1,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  bottomActions: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  actionButtons: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  bottomHint: {
    fontSize: typography.caption,
    textAlign: 'center',
  },
});