import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuthStore } from '../../stores/authStore';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import { Button, Input, Card, Switch } from '../../components/ui';
import apiService from '../../services/RealApiService';
import { deviceInfo, spacing, typography, scale } from '../../utils/responsive';

type ProfileSetupScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'ProfileSetup'>;

interface ProfileData {
  displayName: string;
  bio: string;
  avatarUrl?: string;
  interests: string[];
  preferences: {
    allowNotifications: boolean;
    allowLocationServices: boolean;
    preferredTheme: 'light' | 'dark' | 'auto';
    allowAnalytics: boolean;
    allowMarketing: boolean;
  };
}

interface Interest {
  id: string;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

const availableInterests: Interest[] = [
  { id: 'gaming', name: 'Gaming', icon: 'game-controller', color: '#FF6B6B' },
  { id: 'technology', name: 'Technology', icon: 'laptop', color: '#667eea' },
  { id: 'crypto', name: 'Crypto & DeFi', icon: 'logo-bitcoin', color: '#f093fb' },
  { id: 'creative', name: 'Creative Arts', icon: 'color-palette', color: '#4facfe' },
  { id: 'business', name: 'Business', icon: 'trending-up', color: '#43e97b' },
  { id: 'lifestyle', name: 'Lifestyle', icon: 'heart', color: '#fa709a' },
  { id: 'education', name: 'Education', icon: 'school', color: '#764ba2' },
  { id: 'science', name: 'Science', icon: 'flask', color: '#00f2fe' },
];

export function ProfileSetupScreen() {
  const navigation = useNavigation<ProfileSetupScreenNavigationProp>();
  const { colors, spacing, typography } = useTheme();
  const { user, setUser } = useAuthStore();

  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData>({
    displayName: user?.displayName || '',
    bio: '',
    interests: [],
    preferences: {
      allowNotifications: true,
      allowLocationServices: false,
      preferredTheme: 'auto',
      allowAnalytics: true,
      allowMarketing: false,
    }
  });

  const steps = [
    {
      id: 'basic',
      title: 'Basic Information',
      description: 'Tell us a bit about yourself',
      icon: 'person' as keyof typeof Ionicons.glyphMap,
    },
    {
      id: 'interests',
      title: 'Your Interests',
      description: 'What topics interest you most?',
      icon: 'heart' as keyof typeof Ionicons.glyphMap,
    },
    {
      id: 'preferences',
      title: 'Privacy & Preferences',
      description: 'Customize your experience',
      icon: 'settings' as keyof typeof Ionicons.glyphMap,
    }
  ];

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        setProfileData(prev => ({ ...prev, avatarUrl: imageUri }));
        Haptics.selectionAsync();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const takePhoto = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        setProfileData(prev => ({ ...prev, avatarUrl: imageUri }));
        Haptics.selectionAsync();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const showImagePicker = () => {
    Alert.alert(
      'Profile Picture',
      'Choose how you want to add your profile picture',
      [
        { text: 'Camera', onPress: takePhoto },
        { text: 'Photo Library', onPress: pickImage },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const toggleInterest = (interestId: string) => {
    setProfileData(prev => ({
      ...prev,
      interests: prev.interests.includes(interestId)
        ? prev.interests.filter(id => id !== interestId)
        : [...prev.interests, interestId]
    }));
    Haptics.selectionAsync();
  };

  const updatePreference = (key: keyof ProfileData['preferences'], value: any) => {
    setProfileData(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [key]: value
      }
    }));
    Haptics.selectionAsync();
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
      Haptics.selectionAsync();
    }
  };

  const previousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      Haptics.selectionAsync();
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0: // Basic info
        return profileData.displayName.trim().length >= 2;
      case 1: // Interests
        return profileData.interests.length >= 1;
      case 2: // Preferences
        return true;
      default:
        return false;
    }
  };

  const saveProfile = async () => {
    setLoading(true);
    try {
      // Save profile data via API
      const response = await apiService.post('/onboarding/complete-step', {
        stepId: 'profile',
        data: profileData
      });

      if (response.success) {
        // Update local user data
        if (user) {
          setUser({
            ...user,
            displayName: profileData.displayName,
            bio: profileData.bio,
            avatarUrl: profileData.avatarUrl
          });
        }

        // Save preferences
        await apiService.post('/onboarding/complete-step', {
          stepId: 'preferences',
          data: { preferences: profileData.preferences }
        });

        // Save interests
        await apiService.post('/onboarding/complete-step', {
          stepId: 'interests',
          data: { selectedInterests: profileData.interests }
        });

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        
        // Navigate to main app or community selection
        navigation.navigate('CommunitySelection', {
          interests: profileData.interests
        });
      } else {
        Alert.alert('Error', 'Failed to save profile. Please try again.');
      }
    } catch (error) {
      console.error('Profile setup error:', error);
      Alert.alert('Error', 'Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderBasicInfo = () => (
    <View style={styles.stepContent}>
      <TouchableOpacity style={styles.avatarContainer} onPress={showImagePicker}>
        {profileData.avatarUrl ? (
          <Image source={{ uri: profileData.avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatarPlaceholder, { backgroundColor: colors.border }]}>
            <Ionicons name="camera" size={32} color={colors.textSecondary} />
          </View>
        )}
        <View style={[styles.avatarBadge, { backgroundColor: colors.primary }]}>
          <Ionicons name="add" size={16} color="white" />
        </View>
      </TouchableOpacity>
      
      <Text style={[styles.avatarHint, { color: colors.textSecondary }]}>
        Tap to add a profile picture
      </Text>

      <View style={styles.inputContainer}>
        <Text style={[styles.inputLabel, { color: colors.text }]}>Display Name *</Text>
        <Input
          value={profileData.displayName}
          onChangeText={(text) => setProfileData(prev => ({ ...prev, displayName: text }))}
          placeholder="How should others see your name?"
          maxLength={30}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={[styles.inputLabel, { color: colors.text }]}>Bio (Optional)</Text>
        <Input
          value={profileData.bio}
          onChangeText={(text) => setProfileData(prev => ({ ...prev, bio: text }))}
          placeholder="Tell others about yourself..."
          multiline
          numberOfLines={3}
          maxLength={150}
          style={styles.bioInput}
        />
        <Text style={[styles.characterCount, { color: colors.textSecondary }]}>
          {profileData.bio.length}/150
        </Text>
      </View>
    </View>
  );

  const renderInterests = () => (
    <View style={styles.stepContent}>
      <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
        Select at least one interest to get personalized content recommendations
      </Text>
      
      <View style={styles.interestsGrid}>
        {availableInterests.map((interest) => (
          <TouchableOpacity
            key={interest.id}
            style={[
              styles.interestCard,
              {
                backgroundColor: profileData.interests.includes(interest.id)
                  ? interest.color + '20'
                  : colors.surface,
                borderColor: profileData.interests.includes(interest.id)
                  ? interest.color
                  : colors.border,
              }
            ]}
            onPress={() => toggleInterest(interest.id)}
          >
            <View style={[
              styles.interestIcon,
              { backgroundColor: profileData.interests.includes(interest.id) ? interest.color : colors.border }
            ]}>
              <Ionicons
                name={interest.icon}
                size={24}
                color={profileData.interests.includes(interest.id) ? 'white' : colors.textSecondary}
              />
            </View>
            <Text style={[
              styles.interestName,
              { 
                color: profileData.interests.includes(interest.id) ? interest.color : colors.text,
                fontWeight: profileData.interests.includes(interest.id) ? '600' : '400'
              }
            ]}>
              {interest.name}
            </Text>
            {profileData.interests.includes(interest.id) && (
              <View style={[styles.selectedBadge, { backgroundColor: interest.color }]}>
                <Ionicons name="checkmark" size={12} color="white" />
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
      
      <Text style={[styles.selectionCount, { color: colors.textSecondary }]}>
        {profileData.interests.length} interest{profileData.interests.length !== 1 ? 's' : ''} selected
      </Text>
    </View>
  );

  const renderPreferences = () => (
    <View style={styles.stepContent}>
      <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
        Customize your privacy and notification settings
      </Text>

      <Card style={styles.preferencesCard}>
        <View style={styles.preferenceItem}>
          <View style={styles.preferenceInfo}>
            <Ionicons name="notifications" size={20} color={colors.primary} />
            <View style={styles.preferenceText}>
              <Text style={[styles.preferenceTitle, { color: colors.text }]}>
                Push Notifications
              </Text>
              <Text style={[styles.preferenceDescription, { color: colors.textSecondary }]}>
                Get notified about replies, mentions, and community activity
              </Text>
            </View>
          </View>
          <Switch
            value={profileData.preferences.allowNotifications}
            onValueChange={(value) => updatePreference('allowNotifications', value)}
          />
        </View>

        <View style={styles.preferenceItem}>
          <View style={styles.preferenceInfo}>
            <Ionicons name="location" size={20} color={colors.primary} />
            <View style={styles.preferenceText}>
              <Text style={[styles.preferenceTitle, { color: colors.text }]}>
                Location Services
              </Text>
              <Text style={[styles.preferenceDescription, { color: colors.textSecondary }]}>
                Help us suggest local communities and events
              </Text>
            </View>
          </View>
          <Switch
            value={profileData.preferences.allowLocationServices}
            onValueChange={(value) => updatePreference('allowLocationServices', value)}
          />
        </View>

        <View style={styles.preferenceItem}>
          <View style={styles.preferenceInfo}>
            <Ionicons name="analytics" size={20} color={colors.primary} />
            <View style={styles.preferenceText}>
              <Text style={[styles.preferenceTitle, { color: colors.text }]}>
                Analytics
              </Text>
              <Text style={[styles.preferenceDescription, { color: colors.textSecondary }]}>
                Help improve CRYB with anonymous usage data
              </Text>
            </View>
          </View>
          <Switch
            value={profileData.preferences.allowAnalytics}
            onValueChange={(value) => updatePreference('allowAnalytics', value)}
          />
        </View>

        <View style={styles.preferenceItem}>
          <View style={styles.preferenceInfo}>
            <Ionicons name="mail" size={20} color={colors.primary} />
            <View style={styles.preferenceText}>
              <Text style={[styles.preferenceTitle, { color: colors.text }]}>
                Marketing Emails
              </Text>
              <Text style={[styles.preferenceDescription, { color: colors.textSecondary }]}>
                Receive updates about new features and community highlights
              </Text>
            </View>
          </View>
          <Switch
            value={profileData.preferences.allowMarketing}
            onValueChange={(value) => updatePreference('allowMarketing', value)}
          />
        </View>
      </Card>

      <View style={styles.themeSelection}>
        <Text style={[styles.preferenceTitle, { color: colors.text, marginBottom: 12 }]}>
          Theme Preference
        </Text>
        <View style={styles.themeOptions}>
          {[
            { value: 'light', label: 'Light', icon: 'sunny' },
            { value: 'dark', label: 'Dark', icon: 'moon' },
            { value: 'auto', label: 'Auto', icon: 'phone-portrait' }
          ].map((theme) => (
            <TouchableOpacity
              key={theme.value}
              style={[
                styles.themeOption,
                {
                  backgroundColor: profileData.preferences.preferredTheme === theme.value
                    ? colors.primary + '20'
                    : colors.surface,
                  borderColor: profileData.preferences.preferredTheme === theme.value
                    ? colors.primary
                    : colors.border,
                }
              ]}
              onPress={() => updatePreference('preferredTheme', theme.value)}
            >
              <Ionicons
                name={theme.icon as keyof typeof Ionicons.glyphMap}
                size={20}
                color={profileData.preferences.preferredTheme === theme.value ? colors.primary : colors.textSecondary}
              />
              <Text style={[
                styles.themeLabel,
                { 
                  color: profileData.preferences.preferredTheme === theme.value ? colors.primary : colors.text 
                }
              ]}>
                {theme.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0:
        return renderBasicInfo();
      case 1:
        return renderInterests();
      case 2:
        return renderPreferences();
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Complete Your Profile
          </Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  backgroundColor: colors.primary,
                  width: `${((currentStep + 1) / steps.length) * 100}%`
                }
              ]}
            />
          </View>
          <Text style={[styles.progressText, { color: colors.textSecondary }]}>
            {currentStep + 1} of {steps.length}
          </Text>
        </View>

        {/* Step Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.stepHeader}>
            <View style={[styles.stepIcon, { backgroundColor: colors.primary + '20' }]}>
              <Ionicons
                name={steps[currentStep].icon}
                size={24}
                color={colors.primary}
              />
            </View>
            <Text style={[styles.stepTitle, { color: colors.text }]}>
              {steps[currentStep].title}
            </Text>
            <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
              {steps[currentStep].description}
            </Text>
          </View>

          {renderCurrentStep()}
        </ScrollView>

        {/* Navigation */}
        <View style={[styles.navigation, { backgroundColor: colors.background }]}>
          <View style={styles.navigationButtons}>
            {currentStep > 0 && (
              <Button
                title="Previous"
                onPress={previousStep}
                variant="outline"
                style={{ flex: 1, marginRight: spacing.sm }}
              />
            )}
            
            <Button
              title={currentStep === steps.length - 1 ? 'Complete' : 'Next'}
              onPress={currentStep === steps.length - 1 ? saveProfile : nextStep}
              variant="primary"
              style={{ flex: 1 }}
              disabled={!canProceed()}
              loading={loading}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  progressContainer: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xl,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    marginBottom: spacing.sm,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: typography.caption,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
  },
  stepHeader: {
    alignItems: 'center',
    marginBottom: spacing.xxxl,
  },
  stepIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  stepTitle: {
    fontSize: typography.h4,
    fontWeight: '700',
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  stepDescription: {
    fontSize: typography.body1,
    textAlign: 'center',
    lineHeight: 24,
  },
  stepContent: {
    flex: 1,
    marginBottom: spacing.xxxl,
  },
  
  // Basic Info Styles
  avatarContainer: {
    alignSelf: 'center',
    marginBottom: spacing.sm,
    position: 'relative',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  avatarHint: {
    fontSize: typography.body2,
    textAlign: 'center',
    marginBottom: spacing.xxl,
  },
  inputContainer: {
    marginBottom: spacing.xl,
  },
  inputLabel: {
    fontSize: typography.body1,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  bioInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: typography.caption,
    textAlign: 'right',
    marginTop: spacing.xs,
  },

  // Interests Styles
  interestsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginVertical: spacing.xl,
  },
  interestCard: {
    width: '48%',
    padding: spacing.lg,
    borderRadius: deviceInfo.isTablet ? 14 : 12,
    borderWidth: 2,
    marginBottom: spacing.md,
    alignItems: 'center',
    position: 'relative',
  },
  interestIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  interestName: {
    fontSize: typography.body2,
    fontWeight: '500',
    textAlign: 'center',
  },
  selectedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: deviceInfo.isTablet ? 12 : 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectionCount: {
    fontSize: typography.body2,
    textAlign: 'center',
    marginTop: spacing.lg,
  },

  // Preferences Styles
  preferencesCard: {
    padding: spacing.lg,
    marginVertical: spacing.lg,
  },
  preferenceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  preferenceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.lg,
  },
  preferenceText: {
    marginLeft: spacing.md,
    flex: 1,
  },
  preferenceTitle: {
    fontSize: typography.body1,
    fontWeight: '600',
    marginBottom: 2,
  },
  preferenceDescription: {
    fontSize: typography.body2,
    lineHeight: 20,
  },
  themeSelection: {
    marginTop: spacing.lg,
  },
  themeOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  themeOption: {
    flex: 1,
    padding: spacing.lg,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
    marginHorizontal: spacing.xs,
  },
  themeLabel: {
    fontSize: typography.body2,
    fontWeight: '500',
    marginTop: spacing.sm,
  },

  // Navigation Styles
  navigation: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  navigationButtons: {
    flexDirection: 'row',
  },
});