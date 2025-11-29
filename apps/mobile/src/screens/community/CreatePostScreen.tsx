/**
 * CREATE POST SCREEN
 * Allows users to create new posts in communities with rich content support
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
  Keyboard,
  TextInput,
  Image,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { useTheme } from '../../contexts/ThemeContext';
import { useNetworkContext } from '../../contexts/NetworkContext';
import { MainStackParamList } from '../../navigation/MainNavigator';
import { 
  Button, 
  Input, 
  Card,
  LoadingSpinner,
} from '../../components/ui';
import { apiService } from '../../services/ApiService';
import { useAuthStore } from '../../stores/authStore';
import { ErrorBoundary } from '../../components/ErrorBoundary';
import { deviceInfo, spacing, typography, scale } from '../../utils/responsive';

type CreatePostScreenNavigationProp = NativeStackNavigationProp<MainStackParamList>;
type CreatePostScreenRouteProp = RouteProp<MainStackParamList, 'CreatePost'>;

interface PostFormData {
  title: string;
  content: string;
  type: 'text' | 'link' | 'image' | 'video';
  url?: string;
  nsfw: boolean;
  spoiler: boolean;
  flairId?: string;
}

interface PostFormErrors {
  title?: string;
  content?: string;
  url?: string;
  general?: string;
}

interface Community {
  id: string;
  name: string;
  displayName: string;
  iconUrl?: string;
  flairEnabled: boolean;
  postTypes: ('text' | 'link' | 'image' | 'video')[];
  flairs: {
    id: string;
    text: string;
    backgroundColor: string;
    textColor: string;
  }[];
}

interface MediaFile {
  id: string;
  uri: string;
  type: 'image' | 'video' | 'document';
  name: string;
  size: number;
  mimeType: string;
}

const CreatePostScreen: React.FC = () => {
  const navigation = useNavigation<CreatePostScreenNavigationProp>();
  const route = useRoute<CreatePostScreenRouteProp>();
  const { colors, spacing } = useTheme();
  const { isConnected } = useNetworkContext();
  const { user } = useAuthStore();

  const { communityId, communityName } = route.params;

  const [community, setCommunity] = useState<Community | null>(null);
  const [formData, setFormData] = useState<PostFormData>({
    title: '',
    content: '',
    type: 'text',
    nsfw: false,
    spoiler: false,
  });
  const [formErrors, setFormErrors] = useState<PostFormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingCommunity, setIsLoadingCommunity] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [showFlairPicker, setShowFlairPicker] = useState(false);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  // Refs
  const titleInputRef = useRef<TextInput>(null);
  const contentInputRef = useRef<TextInput>(null);
  const urlInputRef = useRef<TextInput>(null);

  useEffect(() => {
    loadCommunityData();
    setupKeyboardListeners();
    
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

    return () => {
      Keyboard.removeAllListeners('keyboardDidShow');
      Keyboard.removeAllListeners('keyboardDidHide');
    };
  }, []);

  const setupKeyboardListeners = useCallback(() => {
    const keyboardDidShow = Keyboard.addListener('keyboardDidShow', (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });

    const keyboardDidHide = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0);
    });

    return () => {
      keyboardDidShow?.remove();
      keyboardDidHide?.remove();
    };
  }, []);

  const loadCommunityData = useCallback(async () => {
    try {
      setIsLoadingCommunity(true);
      
      // Mock community data for now
      const mockCommunity: Community = {
        id: communityId,
        name: communityName.toLowerCase().replace(/\s+/g, ''),
        displayName: communityName,
        iconUrl: `https://api.dicebear.com/7.x/shapes/svg?seed=${communityName}`,
        flairEnabled: true,
        postTypes: ['text', 'link', 'image', 'video'],
        flairs: [
          {
            id: 'discussion',
            text: 'Discussion',
            backgroundColor: colors.primary,
            textColor: colors.textInverse,
          },
          {
            id: 'question',
            text: 'Question',
            backgroundColor: colors.info,
            textColor: colors.textInverse,
          },
          {
            id: 'news',
            text: 'News',
            backgroundColor: colors.success,
            textColor: colors.textInverse,
          },
          {
            id: 'meme',
            text: 'Meme',
            backgroundColor: colors.warning,
            textColor: colors.textInverse,
          },
        ],
      };

      setCommunity(mockCommunity);
    } catch (error) {
      console.error('Failed to load community data:', error);
      setError('Failed to load community data');
    } finally {
      setIsLoadingCommunity(false);
    }
  }, [communityId, communityName, colors]);

  const validateForm = useCallback((): boolean => {
    const errors: PostFormErrors = {};

    if (!formData.title.trim()) {
      errors.title = 'Title is required';
    } else if (formData.title.length > 300) {
      errors.title = 'Title must be less than 300 characters';
    }

    if (formData.type === 'text' && !formData.content.trim()) {
      errors.content = 'Content is required for text posts';
    }

    if (formData.type === 'link') {
      if (!formData.url?.trim()) {
        errors.url = 'URL is required for link posts';
      } else {
        try {
          new URL(formData.url);
        } catch {
          errors.url = 'Please enter a valid URL';
        }
      }
    }

    if (formData.type === 'image' && mediaFiles.length === 0) {
      errors.general = 'Please select at least one image';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData, mediaFiles]);

  const handleInputChange = useCallback((field: keyof PostFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear field-specific error
    if (typeof value === 'string' && formErrors[field as keyof PostFormErrors]) {
      setFormErrors(prev => ({ ...prev, [field]: undefined }));
    }
    
    // Clear general error
    if (error) {
      setError(null);
    }
  }, [formErrors, error]);

  const handleTypeChange = useCallback((type: PostFormData['type']) => {
    setFormData(prev => ({ ...prev, type }));
    setMediaFiles([]);
    setFormErrors({});
    setError(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const handleImagePicker = useCallback(async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Camera roll permission is required to select images.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: formData.type === 'video' ? ImagePicker.MediaTypeOptions.Videos : ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: formData.type === 'image',
        quality: 0.8,
        allowsEditing: formData.type === 'video',
        aspect: formData.type === 'video' ? undefined : [16, 9],
      });

      if (!result.canceled && result.assets) {
        const newFiles: MediaFile[] = result.assets.map((asset, index) => ({
          id: `file-${Date.now()}-${index}`,
          uri: asset.uri,
          type: formData.type as 'image' | 'video',
          name: asset.fileName || `${formData.type}-${Date.now()}-${index}`,
          size: asset.fileSize || 0,
          mimeType: asset.mimeType || `${formData.type}/jpeg`,
        }));

        setMediaFiles(prev => [...prev, ...newFiles]);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  }, [formData.type]);

  const handleCameraPicker = useCallback(async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Camera permission is required to take photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: formData.type === 'video' ? ImagePicker.MediaTypeOptions.Videos : ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: true,
        aspect: [16, 9],
      });

      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0];
        const newFile: MediaFile = {
          id: `camera-${Date.now()}`,
          uri: asset.uri,
          type: formData.type as 'image' | 'video',
          name: `camera-${formData.type}-${Date.now()}`,
          size: asset.fileSize || 0,
          mimeType: asset.mimeType || `${formData.type}/jpeg`,
        };

        setMediaFiles(prev => [...prev, newFile]);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (error) {
      console.error('Camera picker error:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  }, [formData.type]);

  const handleRemoveMedia = useCallback((fileId: string) => {
    setMediaFiles(prev => prev.filter(file => file.id !== fileId));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const handleFlairSelect = useCallback((flairId: string) => {
    setFormData(prev => ({ ...prev, flairId }));
    setShowFlairPicker(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const handleSubmit = useCallback(async () => {
    try {
      if (!validateForm()) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
      }

      if (!isConnected) {
        setError('No internet connection');
        return;
      }

      setIsLoading(true);
      setError(null);

      // TODO: Implement actual post creation API call
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        'Post Created!',
        'Your post has been successfully created.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error('Failed to create post:', error);
      setError('Failed to create post. Please try again.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
    }
  }, [validateForm, isConnected, navigation]);

  const handleDiscard = useCallback(() => {
    const hasContent = formData.title.trim() || formData.content.trim() || formData.url?.trim() || mediaFiles.length > 0;
    
    if (hasContent) {
      Alert.alert(
        'Discard Post?',
        'Are you sure you want to discard this post? Your changes will be lost.',
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
  }, [formData, mediaFiles, navigation]);

  const getSelectedFlair = useCallback(() => {
    return community?.flairs.find(flair => flair.id === formData.flairId);
  }, [community, formData.flairId]);

  const renderPostTypeSelector = useCallback(() => {
    if (!community) return null;

    return (
      <View style={styles.typeSelector}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Post Type</Text>
        <View style={styles.typeOptions}>
          {community.postTypes.map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.typeOption,
                { backgroundColor: colors.cardBackground },
                formData.type === type && { backgroundColor: colors.primary + '20', borderColor: colors.primary }
              ]}
              onPress={() => handleTypeChange(type)}
            >
              <Ionicons
                name={
                  type === 'text' ? 'document-text' :
                  type === 'link' ? 'link' :
                  type === 'image' ? 'image' : 'videocam'
                }
                size={20}
                color={formData.type === type ? colors.primary : colors.textSecondary}
              />
              <Text
                style={[
                  styles.typeText,
                  { color: formData.type === type ? colors.primary : colors.textSecondary }
                ]}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  }, [community, formData.type, colors, handleTypeChange]);

  const renderMediaPicker = useCallback(() => {
    if (formData.type !== 'image' && formData.type !== 'video') return null;

    return (
      <View style={styles.mediaSection}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {formData.type === 'image' ? 'Images' : 'Video'}
        </Text>
        
        <View style={styles.mediaActions}>
          <TouchableOpacity
            style={[styles.mediaButton, { backgroundColor: colors.cardBackground }]}
            onPress={handleImagePicker}
          >
            <Ionicons name="images" size={20} color={colors.text} />
            <Text style={[styles.mediaButtonText, { color: colors.text }]}>Gallery</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.mediaButton, { backgroundColor: colors.cardBackground }]}
            onPress={handleCameraPicker}
          >
            <Ionicons name="camera" size={20} color={colors.text} />
            <Text style={[styles.mediaButtonText, { color: colors.text }]}>Camera</Text>
          </TouchableOpacity>
        </View>

        {mediaFiles.length > 0 && (
          <View style={styles.mediaPreview}>
            {mediaFiles.map((file) => (
              <View key={file.id} style={styles.mediaItem}>
                <Image source={{ uri: file.uri }} style={styles.mediaImage} />
                <TouchableOpacity
                  style={[styles.removeMediaButton, { backgroundColor: colors.error }]}
                  onPress={() => handleRemoveMedia(file.id)}
                >
                  <Ionicons name="close" size={16} color={colors.textInverse} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  }, [formData.type, colors, mediaFiles, handleImagePicker, handleCameraPicker, handleRemoveMedia]);

  const renderFlairSelector = useCallback(() => {
    if (!community?.flairEnabled) return null;

    const selectedFlair = getSelectedFlair();

    return (
      <View style={styles.flairSection}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Flair (Optional)</Text>
        <TouchableOpacity
          style={[styles.flairSelector, { backgroundColor: colors.cardBackground }]}
          onPress={() => setShowFlairPicker(!showFlairPicker)}
        >
          {selectedFlair ? (
            <View
              style={[
                styles.selectedFlair,
                { backgroundColor: selectedFlair.backgroundColor }
              ]}
            >
              <Text style={{ color: selectedFlair.textColor }}>{selectedFlair.text}</Text>
            </View>
          ) : (
            <Text style={[styles.flairPlaceholder, { color: colors.textSecondary }]}>
              Select a flair
            </Text>
          )}
          <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
        </TouchableOpacity>

        {showFlairPicker && (
          <View style={[styles.flairPicker, { backgroundColor: colors.cardBackground }]}>
            <TouchableOpacity
              style={styles.flairOption}
              onPress={() => handleFlairSelect('')}
            >
              <Text style={[styles.flairOptionText, { color: colors.textSecondary }]}>
                No flair
              </Text>
            </TouchableOpacity>
            {community.flairs.map((flair) => (
              <TouchableOpacity
                key={flair.id}
                style={styles.flairOption}
                onPress={() => handleFlairSelect(flair.id)}
              >
                <View
                  style={[
                    styles.flairTag,
                    { backgroundColor: flair.backgroundColor }
                  ]}
                >
                  <Text style={{ color: flair.textColor }}>{flair.text}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    );
  }, [community, showFlairPicker, getSelectedFlair, colors, handleFlairSelect]);

  if (isLoadingCommunity) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style="auto" />
        <View style={styles.loadingContainer}>
          <LoadingSpinner size="large" />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading community...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <ErrorBoundary>
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style="auto" />
        
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.background }]}>
          <TouchableOpacity style={styles.headerButton} onPress={handleDiscard}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Create Post
          </Text>
          <Button
            title="Post"
            onPress={handleSubmit}
            variant="primary"
            size="sm"
            loading={isLoading}
            disabled={!formData.title.trim() || isLoading}
          />
        </View>

        <KeyboardAvoidingView
          style={styles.keyboardAvoid}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
          <Animated.View
            style={[
              styles.content,
              { 
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
                paddingBottom: keyboardHeight > 0 ? keyboardHeight : spacing.xl,
              }
            ]}
          >
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* Community Info */}
              <Card padding="md" style={{ marginBottom: spacing.md }}>
                <View style={styles.communityHeader}>
                  <Image
                    source={{ uri: community?.iconUrl }}
                    style={styles.communityIcon}
                  />
                  <Text style={[styles.communityName, { color: colors.text }]}>
                    r/{community?.name}
                  </Text>
                </View>
              </Card>

              {/* Error Display */}
              {(error || formErrors.general) && (
                <View style={[styles.errorContainer, { backgroundColor: colors.error + '15' }]}>
                  <Ionicons name="warning" size={20} color={colors.error} />
                  <Text style={[styles.errorText, { color: colors.error }]}>
                    {error || formErrors.general}
                  </Text>
                </View>
              )}

              {/* Post Type Selector */}
              {renderPostTypeSelector()}

              {/* Title Input */}
              <Input
                ref={titleInputRef}
                label="Title"
                value={formData.title}
                onChangeText={(value) => handleInputChange('title', value)}
                placeholder="An interesting title..."
                maxLength={300}
                multiline
                error={formErrors.title}
                containerStyle={{ marginBottom: spacing.md }}
                showCharacterCount
                editable={!isLoading}
              />

              {/* Content Input (Text Posts) */}
              {formData.type === 'text' && (
                <Input
                  ref={contentInputRef}
                  label="Content"
                  value={formData.content}
                  onChangeText={(value) => handleInputChange('content', value)}
                  placeholder="Share your thoughts..."
                  multiline
                  numberOfLines={6}
                  textAlignVertical="top"
                  error={formErrors.content}
                  containerStyle={{ marginBottom: spacing.md }}
                  editable={!isLoading}
                />
              )}

              {/* URL Input (Link Posts) */}
              {formData.type === 'link' && (
                <Input
                  ref={urlInputRef}
                  label="URL"
                  value={formData.url || ''}
                  onChangeText={(value) => handleInputChange('url', value)}
                  placeholder="https://example.com"
                  keyboardType="url"
                  autoCapitalize="none"
                  autoCorrect={false}
                  error={formErrors.url}
                  containerStyle={{ marginBottom: spacing.md }}
                  editable={!isLoading}
                />
              )}

              {/* Media Picker */}
              {renderMediaPicker()}

              {/* Flair Selector */}
              {renderFlairSelector()}

              {/* Options */}
              <View style={styles.optionsSection}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Options</Text>
                
                <TouchableOpacity
                  style={styles.optionItem}
                  onPress={() => handleInputChange('nsfw', !formData.nsfw)}
                  disabled={isLoading}
                >
                  <View style={styles.optionContent}>
                    <Ionicons 
                      name="warning" 
                      size={20} 
                      color={formData.nsfw ? colors.error : colors.textSecondary} 
                    />
                    <Text style={[styles.optionText, { color: colors.text }]}>
                      NSFW (Not Safe For Work)
                    </Text>
                  </View>
                  <View style={[
                    styles.checkbox,
                    { borderColor: colors.border },
                    formData.nsfw && { backgroundColor: colors.error }
                  ]}>
                    {formData.nsfw && (
                      <Ionicons name="checkmark" size={16} color={colors.textInverse} />
                    )}
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.optionItem}
                  onPress={() => handleInputChange('spoiler', !formData.spoiler)}
                  disabled={isLoading}
                >
                  <View style={styles.optionContent}>
                    <Ionicons 
                      name="eye-off" 
                      size={20} 
                      color={formData.spoiler ? colors.warning : colors.textSecondary} 
                    />
                    <Text style={[styles.optionText, { color: colors.text }]}>
                      Spoiler
                    </Text>
                  </View>
                  <View style={[
                    styles.checkbox,
                    { borderColor: colors.border },
                    formData.spoiler && { backgroundColor: colors.warning }
                  ]}>
                    {formData.spoiler && (
                      <Ionicons name="checkmark" size={16} color={colors.textInverse} />
                    )}
                  </View>
                </TouchableOpacity>
              </View>
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
  communityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  communityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: spacing.md,
  },
  communityName: {
    fontSize: typography.body1,
    fontWeight: '600',
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
    fontSize: typography.body1,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  typeSelector: {
    marginBottom: spacing.xxl,
  },
  typeOptions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  typeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
    gap: spacing.sm,
  },
  typeText: {
    fontSize: typography.body2,
    fontWeight: '500',
  },
  mediaSection: {
    marginBottom: spacing.xxl,
  },
  mediaActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  mediaButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    borderRadius: 8,
    gap: spacing.sm,
  },
  mediaButtonText: {
    fontSize: typography.body2,
    fontWeight: '500',
  },
  mediaPreview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  mediaItem: {
    position: 'relative',
    width: 80,
    height: 80,
  },
  mediaImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  removeMediaButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 24,
    height: 24,
    borderRadius: deviceInfo.isTablet ? 14 : 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  flairSection: {
    marginBottom: spacing.xxl,
  },
  flairSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderRadius: 8,
  },
  selectedFlair: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 4,
  },
  flairPlaceholder: {
    fontSize: typography.body2,
  },
  flairPicker: {
    marginTop: spacing.sm,
    borderRadius: 8,
    overflow: 'hidden',
  },
  flairOption: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  flairOptionText: {
    fontSize: typography.body2,
  },
  flairTag: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  optionsSection: {
    marginBottom: spacing.xxl,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.md,
  },
  optionText: {
    fontSize: typography.body2,
    fontWeight: '500',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export { CreatePostScreen };