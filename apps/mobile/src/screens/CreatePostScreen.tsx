import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  ActionSheetIOS,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { useTheme } from '../contexts/ThemeContext';
import { useAuthStore } from '../stores/authStore';
import { MainStackParamList } from '../navigation/MainNavigator';
import apiService from '../services/RealApiService';
import { deviceInfo, spacing, typography, scale } from '../utils/responsive';

type CreatePostScreenNavigationProp = NativeStackNavigationProp<MainStackParamList, 'CreatePost'>;
type CreatePostScreenRouteProp = RouteProp<MainStackParamList, 'CreatePost'>;

interface Community {
  id: string;
  name: string;
  displayName: string;
  icon?: string;
  memberCount: number;
  isJoined: boolean;
}

interface PostDraft {
  title: string;
  content: string;
  communityId: string;
  type: 'text' | 'image' | 'link' | 'poll';
  images: string[];
  linkUrl?: string;
  linkTitle?: string;
  linkDescription?: string;
  pollOptions: string[];
  tags: string[];
  isNsfw: boolean;
  isSpoiler: boolean;
  isScheduled: boolean;
  scheduledDate?: Date;
}

const mockCommunities: Community[] = [
  {
    id: 'crypto',
    name: 'crypto',
    displayName: 'Cryptocurrency',
    icon: '₿',
    memberCount: 15420,
    isJoined: true,
  },
  {
    id: 'gaming',
    name: 'gaming',
    displayName: 'Gaming',
    icon: '🎮',
    memberCount: 28930,
    isJoined: true,
  },
  {
    id: 'tech',
    name: 'technology',
    displayName: 'Technology',
    icon: '💻',
    memberCount: 45720,
    isJoined: false,
  },
];

export function CreatePostScreen() {
  const navigation = useNavigation<CreatePostScreenNavigationProp>();
  const route = useRoute<CreatePostScreenRouteProp>();
  const { colors } = useTheme();
  const { user } = useAuthStore();

  const [draft, setDraft] = useState<PostDraft>({
    title: '',
    content: '',
    communityId: route.params?.communityId || '',
    type: 'text',
    images: [],
    pollOptions: ['', ''],
    tags: [],
    isNsfw: false,
    isSpoiler: false,
    isScheduled: false,
  });

  const [communities, setCommunities] = useState<Community[]>(mockCommunities);
  const [selectedCommunity, setSelectedCommunity] = useState<Community | null>(
    mockCommunities.find(c => c.id === route.params?.communityId) || null
  );
  const [showCommunitySelector, setShowCommunitySelector] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const titleInputRef = useRef<TextInput>(null);
  const contentInputRef = useRef<TextInput>(null);

  const updateDraft = (updates: Partial<PostDraft>) => {
    setDraft(prev => ({ ...prev, ...updates }));
  };

  const selectCommunity = (community: Community) => {
    setSelectedCommunity(community);
    updateDraft({ communityId: community.id });
    setShowCommunitySelector(false);
  };

  const addImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera roll permissions are required to add images.');
      return;
    }

    const options = ['Camera', 'Photo Library', 'Cancel'];
    
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex: 2,
        },
        async (buttonIndex) => {
          if (buttonIndex === 0) {
            const result = await ImagePicker.launchCameraAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              quality: 0.8,
            });
            if (!result.canceled && result.assets && result.assets[0]) {
              updateDraft({ images: [...draft.images, result.assets[0].uri] });
            }
          } else if (buttonIndex === 1) {
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              quality: 0.8,
              allowsMultipleSelection: true,
            });
            if (!result.canceled) {
              const newImages = result.assets.map(asset => asset.uri);
              updateDraft({ images: [...draft.images, ...newImages] });
            }
          }
        }
      );
    } else {
      Alert.alert(
        'Add Image',
        'Choose an option',
        [
          { text: 'Camera', onPress: async () => {
            const result = await ImagePicker.launchCameraAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              quality: 0.8,
            });
            if (!result.canceled && result.assets && result.assets[0]) {
              updateDraft({ images: [...draft.images, result.assets[0].uri] });
            }
          }},
          { text: 'Gallery', onPress: async () => {
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              quality: 0.8,
              allowsMultipleSelection: true,
            });
            if (!result.canceled) {
              const newImages = result.assets.map(asset => asset.uri);
              updateDraft({ images: [...draft.images, ...newImages] });
            }
          }},
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    }
  };

  const removeImage = (index: number) => {
    updateDraft({ images: draft.images.filter((_, i) => i !== index) });
  };

  const addPollOption = () => {
    if (draft.pollOptions.length < 6) {
      updateDraft({ pollOptions: [...draft.pollOptions, ''] });
    }
  };

  const updatePollOption = (index: number, value: string) => {
    const newOptions = [...draft.pollOptions];
    newOptions[index] = value;
    updateDraft({ pollOptions: newOptions });
  };

  const removePollOption = (index: number) => {
    if (draft.pollOptions.length > 2) {
      updateDraft({ pollOptions: draft.pollOptions.filter((_, i) => i !== index) });
    }
  };

  const validatePost = (): string | null => {
    if (!draft.title.trim()) {
      return 'Title is required';
    }
    if (!selectedCommunity) {
      return 'Please select a community';
    }
    if (draft.type === 'poll') {
      const validOptions = draft.pollOptions.filter(opt => opt.trim());
      if (validOptions.length < 2) {
        return 'Poll must have at least 2 options';
      }
    }
    if (draft.type === 'link' && !draft.linkUrl) {
      return 'Link URL is required';
    }
    return null;
  };

  const submitPost = async () => {
    const validationError = validatePost();
    if (validationError) {
      Alert.alert('Validation Error', validationError);
      return;
    }

    setIsSubmitting(true);
    try {
      const postData = {
        title: draft.title.trim(),
        content: draft.content.trim(),
        communityId: draft.communityId,
        type: draft.type,
        images: draft.images,
        linkUrl: draft.linkUrl,
        pollOptions: draft.type === 'poll' ? draft.pollOptions.filter(opt => opt.trim()) : undefined,
        tags: draft.tags,
        isNsfw: draft.isNsfw,
        isSpoiler: draft.isSpoiler,
        scheduledDate: draft.isScheduled ? draft.scheduledDate : undefined,
      };

      const response = await apiService.createPost(postData);
      
      Alert.alert(
        'Success',
        'Your post has been published!',
        [
          {
            text: 'OK',
            onPress: () => {
              navigation.goBack();
              if (response?.id) {
                navigation.navigate('PostDetail', { postId: response.id });
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error creating post:', error);
      Alert.alert('Error', 'Failed to create post. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const saveDraft = async () => {
    try {
      await apiService.saveDraft(draft);
      Alert.alert('Draft saved', 'Your post has been saved as a draft.');
    } catch (error) {
      console.error('Error saving draft:', error);
    }
  };

  const isFormValid = draft.title.trim() && selectedCommunity;

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Create Post
        </Text>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={saveDraft}
          >
            <Text style={[styles.headerActionText, { color: colors.primary }]}>
              Draft
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.publishButton,
              {
                backgroundColor: isFormValid ? colors.primary : colors.border,
              },
            ]}
            onPress={submitPost}
            disabled={!isFormValid || isSubmitting}
          >
            <Text style={[styles.publishButtonText, { color: isFormValid ? 'white' : colors.textSecondary }]}>
              {isSubmitting ? 'Publishing...' : 'Post'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <TouchableOpacity
          style={[styles.communitySelector, { backgroundColor: colors.card }]}
          onPress={() => setShowCommunitySelector(!showCommunitySelector)}
        >
          <View style={styles.communitySelectorContent}>
            {selectedCommunity ? (
              <>
                <Text style={styles.communityIcon}>{selectedCommunity.icon}</Text>
                <View>
                  <Text style={[styles.communityName, { color: colors.text }]}>
                    r/{selectedCommunity.name}
                  </Text>
                  <Text style={[styles.communityMembers, { color: colors.textSecondary }]}>
                    {selectedCommunity.memberCount.toLocaleString()} members
                  </Text>
                </View>
              </>
            ) : (
              <Text style={[styles.selectCommunityText, { color: colors.textSecondary }]}>
                Choose a community
              </Text>
            )}
          </View>
          <Ionicons
            name={showCommunitySelector ? "chevron-up" : "chevron-down"}
            size={20}
            color={colors.textSecondary}
          />
        </TouchableOpacity>

        {showCommunitySelector && (
          <View style={[styles.communityList, { backgroundColor: colors.card }]}>
            {communities.map((community) => (
              <TouchableOpacity
                key={community.id}
                style={styles.communityItem}
                onPress={() => selectCommunity(community)}
              >
                <Text style={styles.communityIcon}>{community.icon}</Text>
                <View style={styles.communityInfo}>
                  <Text style={[styles.communityName, { color: colors.text }]}>
                    r/{community.name}
                  </Text>
                  <Text style={[styles.communityMembers, { color: colors.textSecondary }]}>
                    {community.memberCount.toLocaleString()} members
                  </Text>
                </View>
                {community.isJoined && (
                  <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={[styles.postTypeSelector, { backgroundColor: colors.card }]}>
          {[
            { type: 'text', icon: 'document-text', label: 'Text' },
            { type: 'image', icon: 'image', label: 'Image' },
            { type: 'link', icon: 'link', label: 'Link' },
            { type: 'poll', icon: 'bar-chart', label: 'Poll' },
          ].map(({ type, icon, label }) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.postTypeButton,
                {
                  backgroundColor: draft.type === type ? colors.primary : 'transparent',
                },
              ]}
              onPress={() => updateDraft({ type: type as PostDraft['type'] })}
            >
              <Ionicons
                name={icon as any}
                size={18}
                color={draft.type === type ? 'white' : colors.textSecondary}
              />
              <Text
                style={[
                  styles.postTypeLabel,
                  {
                    color: draft.type === type ? 'white' : colors.textSecondary,
                  },
                ]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={[styles.postForm, { backgroundColor: colors.card }]}>
          <TextInput
            ref={titleInputRef}
            style={[styles.titleInput, { color: colors.text }]}
            placeholder="An interesting title..."
            placeholderTextColor={colors.textSecondary}
            value={draft.title}
            onChangeText={(text) => updateDraft({ title: text })}
            maxLength={300}
            multiline
          />

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <TextInput
            ref={contentInputRef}
            style={[styles.contentInput, { color: colors.text }]}
            placeholder={
              draft.type === 'text'
                ? 'Text (optional)'
                : draft.type === 'link'
                ? 'Add a description...'
                : 'Add a description...'
            }
            placeholderTextColor={colors.textSecondary}
            value={draft.content}
            onChangeText={(text) => updateDraft({ content: text })}
            multiline
            textAlignVertical="top"
          />

          {draft.type === 'image' && (
            <View style={styles.imageSection}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <TouchableOpacity style={styles.addImageButton} onPress={addImage}>
                  <Ionicons name="add" size={24} color={colors.primary} />
                  <Text style={[styles.addImageText, { color: colors.primary }]}>
                    Add Image
                  </Text>
                </TouchableOpacity>

                {draft.images.map((uri, index) => (
                  <View key={index} style={styles.imageContainer}>
                    <Image source={{ uri }} style={styles.previewImage} />
                    <TouchableOpacity
                      style={styles.removeImageButton}
                      onPress={() => removeImage(index)}
                    >
                      <Ionicons name="close" size={16} color="white" />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          {draft.type === 'poll' && (
            <View style={styles.pollSection}>
              {draft.pollOptions.map((option, index) => (
                <View key={index} style={styles.pollOptionContainer}>
                  <TextInput
                    style={[styles.pollOptionInput, { color: colors.text, borderColor: colors.border }]}
                    placeholder={`Option ${index + 1}`}
                    placeholderTextColor={colors.textSecondary}
                    value={option}
                    onChangeText={(text) => updatePollOption(index, text)}
                  />
                  {draft.pollOptions.length > 2 && (
                    <TouchableOpacity
                      style={styles.removePollOption}
                      onPress={() => removePollOption(index)}
                    >
                      <Ionicons name="close" size={16} color={colors.textSecondary} />
                    </TouchableOpacity>
                  )}
                </View>
              ))}

              {draft.pollOptions.length < 6 && (
                <TouchableOpacity style={styles.addPollOption} onPress={addPollOption}>
                  <Ionicons name="add" size={16} color={colors.primary} />
                  <Text style={[styles.addPollOptionText, { color: colors.primary }]}>
                    Add Option
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        <View style={[styles.postOptions, { backgroundColor: colors.card }]}>
          <TouchableOpacity
            style={styles.optionItem}
            onPress={() => updateDraft({ isNsfw: !draft.isNsfw })}
          >
            <Ionicons
              name={draft.isNsfw ? "checkmark-circle" : "ellipse-outline"}
              size={20}
              color={draft.isNsfw ? colors.primary : colors.textSecondary}
            />
            <Text style={[styles.optionLabel, { color: colors.text }]}>
              NSFW
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.optionItem}
            onPress={() => updateDraft({ isSpoiler: !draft.isSpoiler })}
          >
            <Ionicons
              name={draft.isSpoiler ? "checkmark-circle" : "ellipse-outline"}
              size={20}
              color={draft.isSpoiler ? colors.primary : colors.textSecondary}
            />
            <Text style={[styles.optionLabel, { color: colors.text }]}>
              Spoiler
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  headerButton: {
    padding: spacing.sm,
  },
  headerTitle: {
    fontSize: typography.h6,
    fontWeight: 'bold',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerActionText: {
    fontSize: typography.body1,
    fontWeight: '600',
  },
  publishButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 20,
  },
  publishButtonText: {
    fontSize: typography.body2,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  communitySelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: deviceInfo.isTablet ? 14 : 12,
    marginBottom: spacing.lg,
  },
  communitySelectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  communityIcon: {
    fontSize: typography.h4,
  },
  communityName: {
    fontSize: typography.body1,
    fontWeight: '600',
  },
  communityMembers: {
    fontSize: typography.caption,
  },
  selectCommunityText: {
    fontSize: typography.body1,
  },
  communityList: {
    borderRadius: deviceInfo.isTablet ? 14 : 12,
    marginBottom: spacing.lg,
    paddingVertical: spacing.sm,
  },
  communityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    gap: spacing.md,
  },
  communityInfo: {
    flex: 1,
  },
  postTypeSelector: {
    flexDirection: 'row',
    padding: spacing.sm,
    borderRadius: deviceInfo.isTablet ? 14 : 12,
    marginBottom: spacing.lg,
    gap: spacing.xs,
  },
  postTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: 8,
    gap: 6,
  },
  postTypeLabel: {
    fontSize: typography.caption,
    fontWeight: '600',
  },
  postForm: {
    borderRadius: deviceInfo.isTablet ? 14 : 12,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  titleInput: {
    fontSize: typography.body1,
    fontWeight: '600',
    paddingVertical: spacing.md,
    minHeight: 50,
  },
  divider: {
    height: 1,
    marginVertical: spacing.sm,
  },
  contentInput: {
    fontSize: 15,
    paddingVertical: spacing.md,
    minHeight: 100,
  },
  imageSection: {
    marginTop: spacing.lg,
  },
  addImageButton: {
    width: 100,
    height: 100,
    borderRadius: 8,
    borderWidth: 2,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  addImageText: {
    fontSize: typography.caption,
    marginTop: spacing.xs,
  },
  imageContainer: {
    position: 'relative',
    marginRight: spacing.md,
  },
  previewImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: deviceInfo.isTablet ? 14 : 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pollSection: {
    marginTop: spacing.lg,
  },
  pollOptionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  pollOptionInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontSize: 15,
  },
  removePollOption: {
    marginLeft: spacing.md,
    padding: spacing.xs,
  },
  addPollOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  addPollOptionText: {
    fontSize: typography.body2,
    fontWeight: '600',
  },
  postOptions: {
    flexDirection: 'row',
    padding: spacing.lg,
    borderRadius: deviceInfo.isTablet ? 14 : 12,
    gap: spacing.xxl,
    marginBottom: spacing.xxxl,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  optionLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
});