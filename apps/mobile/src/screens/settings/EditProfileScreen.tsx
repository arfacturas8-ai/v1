/**
 * EDIT PROFILE SCREEN
 * Comprehensive profile editing with image upload, validation, and real-time preview
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Image,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../../contexts/ThemeContext';
import { useNetworkContext } from '../../contexts/NetworkContext';
import { MainStackParamList } from '../../navigation/MainNavigator';
import { 
  Avatar, 
  Button, 
  Input, 
  Card,
  LoadingSpinner,
} from '../../components/ui';
import { apiService, User } from '../../services/ApiService';
import { useAuthStore } from '../../stores/authStore';
import { ErrorBoundary } from '../../components/ErrorBoundary';
import { deviceInfo, spacing, typography, scale } from '../../utils/responsive';

type EditProfileScreenNavigationProp = NativeStackNavigationProp<MainStackParamList>;

interface ProfileFormData {
  username: string;
  displayName: string;
  email: string;
  bio: string;
  location: string;
  website: string;
  avatarUrl?: string;
}

interface ProfileFormErrors {
  username?: string;
  displayName?: string;
  email?: string;
  bio?: string;
  website?: string;
  general?: string;
}

interface ProfileSettings {
  isPrivate: boolean;
  showEmail: boolean;
  showLocation: boolean;
  allowDirectMessages: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
}

const EditProfileScreen: React.FC = () => {
  const navigation = useNavigation<EditProfileScreenNavigationProp>();
  const { colors, spacing } = useTheme();
  const { isConnected } = useNetworkContext();
  const { user, setUser } = useAuthStore();

  const [formData, setFormData] = useState<ProfileFormData>({
    username: user?.username || '',
    displayName: user?.username || '',
    email: user?.email || '',
    bio: '',
    location: '',
    website: '',
    avatarUrl: user?.avatarUrl,
  });
  const [settings, setSettings] = useState<ProfileSettings>({
    isPrivate: false,
    showEmail: false,
    showLocation: true,
    allowDirectMessages: true,
    emailNotifications: true,
    pushNotifications: true,
  });
  const [formErrors, setFormErrors] = useState<ProfileFormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    loadUserProfile();
    
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Check for changes
  useEffect(() => {
    const originalData = {
      username: user?.username || '',
      displayName: user?.username || '',
      email: user?.email || '',
      bio: '',
      location: '',
      website: '',
      avatarUrl: user?.avatarUrl,
    };

    const hasDataChanges = Object.keys(formData).some(
      key => formData[key as keyof ProfileFormData] !== originalData[key as keyof ProfileFormData]
    );

    setHasChanges(hasDataChanges || selectedImage !== null);
  }, [formData, selectedImage, user]);

  const loadUserProfile = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Load extended profile data
      // For now, use existing user data and mock additional fields
      if (user) {
        setFormData({
          username: user.username,
          displayName: user.username,
          email: user.email,
          bio: 'Passionate about technology and community building.',
          location: 'San Francisco, CA',
          website: 'https://example.com',
          avatarUrl: user.avatarUrl,
        });

        setSettings({
          isPrivate: false,
          showEmail: false,
          showLocation: true,
          allowDirectMessages: true,
          emailNotifications: user.settings?.pushNotifications ?? true,
          pushNotifications: user.settings?.pushNotifications ?? true,
        });
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
      setError('Failed to load profile data');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const validateForm = useCallback((): boolean => {
    const errors: ProfileFormErrors = {};

    if (!formData.username.trim()) {
      errors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      errors.username = 'Username must be at least 3 characters';
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      errors.username = 'Username can only contain letters, numbers, and underscores';
    }

    if (!formData.displayName.trim()) {
      errors.displayName = 'Display name is required';
    } else if (formData.displayName.length > 50) {
      errors.displayName = 'Display name must be less than 50 characters';
    }

    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (formData.bio.length > 500) {
      errors.bio = 'Bio must be less than 500 characters';
    }

    if (formData.website && !/^https?:\/\/.+\..+/.test(formData.website)) {
      errors.website = 'Please enter a valid website URL';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData]);

  const handleInputChange = useCallback((field: keyof ProfileFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear field-specific error
    if (formErrors[field as keyof ProfileFormErrors]) {
      setFormErrors(prev => ({ ...prev, [field]: undefined }));
    }
    
    // Clear general error
    if (error) {
      setError(null);
    }
  }, [formErrors, error]);

  const handleSettingChange = useCallback((setting: keyof ProfileSettings, value: boolean) => {
    setSettings(prev => ({ ...prev, [setting]: value }));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const handleImagePicker = useCallback(() => {
    Alert.alert(
      'Update Profile Picture',
      'Choose how you would like to update your profile picture',
      [
        {
          text: 'Camera',
          onPress: () => pickImageFromCamera(),
        },
        {
          text: 'Photo Library',
          onPress: () => pickImageFromLibrary(),
        },
        {
          text: 'Remove Photo',
          style: 'destructive',
          onPress: () => removeProfilePicture(),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  }, []);

  const pickImageFromCamera = useCallback(async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Camera permission is required to take photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.[0]) {
        setSelectedImage(result.assets[0].uri);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (error) {
      console.error('Camera picker error:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  }, []);

  const pickImageFromLibrary = useCallback(async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Photo library permission is required to select images.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.[0]) {
        setSelectedImage(result.assets[0].uri);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  }, []);

  const removeProfilePicture = useCallback(() => {
    setSelectedImage(null);
    setFormData(prev => ({ ...prev, avatarUrl: undefined }));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  const uploadAvatar = useCallback(async (imageUri: string): Promise<string | null> => {
    try {
      setIsUploadingAvatar(true);
      
      // Create form data for upload
      const formData = new FormData();
      formData.append('file', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'avatar.jpg',
      } as any);

      // TODO: Implement actual file upload
      // const response = await apiService.uploadFile(formData, 'avatar');
      // return response.data?.url || null;
      
      // Mock upload for now
      await new Promise(resolve => setTimeout(resolve, 2000));
      return imageUri; // Return the local URI for now
    } catch (error) {
      console.error('Avatar upload error:', error);
      throw new Error('Failed to upload avatar');
    } finally {
      setIsUploadingAvatar(false);
    }
  }, []);

  const handleSave = useCallback(async () => {
    try {
      if (!validateForm()) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
      }

      if (!isConnected) {
        setError('No internet connection');
        return;
      }

      setIsSaving(true);
      setError(null);

      let avatarUrl = formData.avatarUrl;

      // Upload new avatar if selected
      if (selectedImage) {
        avatarUrl = await uploadAvatar(selectedImage);
      }

      // Update profile data
      const updateData = {
        ...formData,
        avatarUrl,
      };

      // TODO: Implement actual profile update API call
      // const response = await apiService.updateProfile(updateData);
      
      // Mock success for now
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Update user in auth store
      if (user) {
        const updatedUser: User = {
          ...user,
          username: updateData.username,
          email: updateData.email,
          avatarUrl: updateData.avatarUrl,
          settings: {
            ...user.settings,
            pushNotifications: settings.pushNotifications,
          },
        };
        setUser(updatedUser);
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        'Profile Updated',
        'Your profile has been successfully updated.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error('Save profile error:', error);
      setError('Failed to update profile. Please try again.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsSaving(false);
    }
  }, [validateForm, isConnected, formData, selectedImage, settings, user, setUser, navigation, uploadAvatar]);

  const handleDiscard = useCallback(() => {
    if (hasChanges) {
      Alert.alert(
        'Discard Changes?',
        'Are you sure you want to discard your changes?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Discard', 
            style: 'destructive',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } else {
      navigation.goBack();
    }
  }, [hasChanges, navigation]);

  const renderAvatarSection = useCallback(() => (
    <Card padding="lg" style={{ marginBottom: spacing.md }}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Profile Picture</Text>
      
      <View style={styles.avatarSection}>
        <TouchableOpacity
          style={styles.avatarContainer}
          onPress={handleImagePicker}
          disabled={isSaving || isUploadingAvatar}
        >
          <Avatar
            size="xl"
            source={selectedImage || formData.avatarUrl}
            name={formData.displayName}
          />
          
          <View style={[styles.avatarOverlay, { backgroundColor: colors.background + 'CC' }]}>
            <Ionicons name="camera" size={24} color={colors.text} />
          </View>
        </TouchableOpacity>
        
        <View style={styles.avatarInfo}>
          <Text style={[styles.avatarTitle, { color: colors.text }]}>
            {formData.displayName || 'Display Name'}
          </Text>
          <Text style={[styles.avatarSubtitle, { color: colors.textSecondary }]}>
            @{formData.username || 'username'}
          </Text>
          <TouchableOpacity onPress={handleImagePicker}>
            <Text style={[styles.changePhotoText, { color: colors.primary }]}>
              Change Photo
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Card>
  ), [
    spacing, colors, formData, selectedImage, isUploadingAvatar, isSaving,
    handleImagePicker,
  ]);

  const renderBasicInfoSection = useCallback(() => (
    <Card padding="lg" style={{ marginBottom: spacing.md }}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Basic Information</Text>
      
      <Input
        label="Username"
        value={formData.username}
        onChangeText={(value) => handleInputChange('username', value)}
        placeholder="Enter username"
        autoCapitalize="none"
        autoCorrect={false}
        error={formErrors.username}
        containerStyle={{ marginBottom: spacing.md }}
        editable={!isSaving}
        leftIcon="at"
      />

      <Input
        label="Display Name"
        value={formData.displayName}
        onChangeText={(value) => handleInputChange('displayName', value)}
        placeholder="Enter display name"
        error={formErrors.displayName}
        containerStyle={{ marginBottom: spacing.md }}
        editable={!isSaving}
        leftIcon="person"
      />

      <Input
        label="Email"
        value={formData.email}
        onChangeText={(value) => handleInputChange('email', value)}
        placeholder="Enter email address"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        error={formErrors.email}
        containerStyle={{ marginBottom: spacing.md }}
        editable={!isSaving}
        leftIcon="mail"
      />

      <Input
        label="Bio"
        value={formData.bio}
        onChangeText={(value) => handleInputChange('bio', value)}
        placeholder="Tell us about yourself..."
        multiline
        numberOfLines={3}
        textAlignVertical="top"
        maxLength={500}
        error={formErrors.bio}
        containerStyle={{ marginBottom: spacing.md }}
        editable={!isSaving}
        showCharacterCount
      />

      <Input
        label="Location"
        value={formData.location}
        onChangeText={(value) => handleInputChange('location', value)}
        placeholder="Where are you located?"
        containerStyle={{ marginBottom: spacing.md }}
        editable={!isSaving}
        leftIcon="location"
      />

      <Input
        label="Website"
        value={formData.website}
        onChangeText={(value) => handleInputChange('website', value)}
        placeholder="https://yourwebsite.com"
        keyboardType="url"
        autoCapitalize="none"
        autoCorrect={false}
        error={formErrors.website}
        editable={!isSaving}
        leftIcon="link"
      />
    </Card>
  ), [spacing, colors, formData, formErrors, isSaving, handleInputChange]);

  const renderPrivacySection = useCallback(() => (
    <Card padding="lg" style={{ marginBottom: spacing.md }}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Privacy Settings</Text>
      
      {[
        { key: 'isPrivate' as const, title: 'Private Profile', description: 'Only approved followers can see your posts' },
        { key: 'showEmail' as const, title: 'Show Email', description: 'Display email address on your profile' },
        { key: 'showLocation' as const, title: 'Show Location', description: 'Display location on your profile' },
        { key: 'allowDirectMessages' as const, title: 'Allow Direct Messages', description: 'Let others send you direct messages' },
      ].map((setting) => (
        <TouchableOpacity
          key={setting.key}
          style={styles.settingItem}
          onPress={() => handleSettingChange(setting.key, !settings[setting.key])}
          disabled={isSaving}
        >
          <View style={styles.settingContent}>
            <Text style={[styles.settingTitle, { color: colors.text }]}>
              {setting.title}
            </Text>
            <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
              {setting.description}
            </Text>
          </View>
          <View style={[
            styles.switch,
            { backgroundColor: settings[setting.key] ? colors.primary : colors.border },
          ]}>
            <View style={[
              styles.switchThumb,
              { backgroundColor: colors.background },
              settings[setting.key] && styles.switchThumbActive,
            ]} />
          </View>
        </TouchableOpacity>
      ))}
    </Card>
  ), [spacing, colors, settings, isSaving, handleSettingChange]);

  const renderNotificationSection = useCallback(() => (
    <Card padding="lg" style={{ marginBottom: spacing.md }}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Notifications</Text>
      
      {[
        { key: 'emailNotifications' as const, title: 'Email Notifications', description: 'Receive notifications via email' },
        { key: 'pushNotifications' as const, title: 'Push Notifications', description: 'Receive push notifications on this device' },
      ].map((setting) => (
        <TouchableOpacity
          key={setting.key}
          style={styles.settingItem}
          onPress={() => handleSettingChange(setting.key, !settings[setting.key])}
          disabled={isSaving}
        >
          <View style={styles.settingContent}>
            <Text style={[styles.settingTitle, { color: colors.text }]}>
              {setting.title}
            </Text>
            <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
              {setting.description}
            </Text>
          </View>
          <View style={[
            styles.switch,
            { backgroundColor: settings[setting.key] ? colors.primary : colors.border },
          ]}>
            <View style={[
              styles.switchThumb,
              { backgroundColor: colors.background },
              settings[setting.key] && styles.switchThumbActive,
            ]} />
          </View>
        </TouchableOpacity>
      ))}
    </Card>
  ), [spacing, colors, settings, isSaving, handleSettingChange]);

  if (isLoading) {
    return null;
  }

  return (
    <ErrorBoundary>
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style="auto" />
        
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.background }]}>
          <TouchableOpacity style={styles.headerButton} onPress={handleDiscard}>
            <Text style={[styles.headerButtonText, { color: colors.primary }]}>
              Cancel
            </Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Edit Profile
          </Text>
          <Button
            title="Save"
            onPress={handleSave}
            variant="primary"
            size="sm"
            loading={isSaving}
            disabled={!hasChanges || isSaving}
          />
        </View>

        <KeyboardAvoidingView
          style={styles.keyboardAvoid}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <Animated.View
            style={[
              styles.content,
              { 
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              }
            ]}
          >
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* Error Display */}
              {error && (
                <View style={[styles.errorContainer, { backgroundColor: colors.error + '15' }]}>
                  <Ionicons name="warning" size={20} color={colors.error} />
                  <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
                </View>
              )}

              {renderAvatarSection()}
              {renderBasicInfoSection()}
              {renderPrivacySection()}
              {renderNotificationSection()}
            </ScrollView>
          </Animated.View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ErrorBoundary>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  headerButton: {
    padding: spacing.sm,
  },
  headerButtonText: {
    fontSize: typography.body1,
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: typography.h6,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: spacing.lg,
  },
  keyboardAvoid: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.lg,
    fontSize: typography.body1,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.lg,
  },
  errorText: {
    fontSize: typography.body2,
    marginLeft: spacing.sm,
    flex: 1,
  },
  sectionTitle: {
    fontSize: typography.h6,
    fontWeight: '600',
    marginBottom: spacing.lg,
  },
  avatarSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: spacing.lg,
  },
  avatarOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInfo: {
    flex: 1,
  },
  avatarTitle: {
    fontSize: typography.h6,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  avatarSubtitle: {
    fontSize: typography.body2,
    marginBottom: spacing.sm,
  },
  changePhotoText: {
    fontSize: typography.body2,
    fontWeight: '500',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  settingContent: {
    flex: 1,
    marginRight: spacing.lg,
  },
  settingTitle: {
    fontSize: typography.body1,
    fontWeight: '500',
    marginBottom: spacing.xs,
  },
  settingDescription: {
    fontSize: typography.body2,
    lineHeight: 20,
  },
  switch: {
    width: 44,
    height: 24,
    borderRadius: deviceInfo.isTablet ? 14 : 12,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  switchThumb: {
    width: 20,
    height: 20,
    borderRadius: deviceInfo.isTablet ? 12 : 10,
  },
  switchThumbActive: {
    alignSelf: 'flex-end',
  },
});

export { EditProfileScreen };