import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  ActionSheetIOS,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { useNavigation } from '@react-navigation/native';
import apiService from '../../services/RealApiService';
import { deviceInfo, spacing, typography, scale } from '../../utils/responsive';

interface Community {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  avatar?: string;
  banner?: string;
  isPrivate: boolean;
  createdAt: string;
  isMember?: boolean;
  isAdmin?: boolean;
}

interface PostCreationFormProps {
  communities: Community[];
  selectedCommunityId?: string;
  onSuccess?: (postId: string) => void;
}

type PostType = 'text' | 'image' | 'video' | 'link' | 'poll';

interface PollOption {
  id: string;
  text: string;
}

const POST_TYPES = [
  { key: 'text', label: 'Text', icon: 'document-text-outline' },
  { key: 'image', label: 'Image', icon: 'image-outline' },
  { key: 'video', label: 'Video', icon: 'videocam-outline' },
  { key: 'link', label: 'Link', icon: 'link-outline' },
  { key: 'poll', label: 'Poll', icon: 'bar-chart-outline' },
];

const { width: screenWidth } = Dimensions.get('window');

export default function PostCreationForm({
  communities,
  selectedCommunityId,
  onSuccess,
}: PostCreationFormProps) {
  const navigation = useNavigation();
  const [postType, setPostType] = useState<PostType>('text');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [communityId, setCommunityId] = useState(selectedCommunityId || '');
  const [url, setUrl] = useState('');
  const [flair, setFlair] = useState('');
  const [isNSFW, setIsNSFW] = useState(false);
  const [isOriginalContent, setIsOriginalContent] = useState(false);
  const [spoiler, setSpoiler] = useState(false);
  const [mediaUri, setMediaUri] = useState<string | null>(null);
  const [pollOptions, setPollOptions] = useState<PollOption[]>([
    { id: '1', text: '' },
    { id: '2', text: '' },
  ]);
  const [pollDuration, setPollDuration] = useState(7); // days
  const [submitting, setSubmitting] = useState(false);
  const [showCommunityPicker, setShowCommunityPicker] = useState(false);
  
  const titleInputRef = useRef<TextInput>(null);
  const contentInputRef = useRef<TextInput>(null);

  // Handle community selection
  const handleCommunitySelect = useCallback((community: Community) => {
    setCommunityId(community.id);
    setShowCommunityPicker(false);
  }, []);

  // Handle media selection
  const selectMedia = useCallback(async (type: 'image' | 'video') => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: type === 'image' ? ImagePicker.MediaTypeOptions.Images : ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        aspect: type === 'image' ? [16, 9] : undefined,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setMediaUri(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to select media. Please try again.');
    }
  }, []);

  // Handle camera capture
  const captureMedia = useCallback(async (type: 'image' | 'video') => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: type === 'image' ? ImagePicker.MediaTypeOptions.Images : ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        aspect: type === 'image' ? [16, 9] : undefined,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setMediaUri(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to capture media. Please try again.');
    }
  }, []);

  // Show media picker action sheet
  const showMediaPicker = useCallback((type: 'image' | 'video') => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Take Photo', 'Choose from Library'],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            captureMedia(type);
          } else if (buttonIndex === 2) {
            selectMedia(type);
          }
        }
      );
    } else {
      Alert.alert(
        'Select Media',
        `Choose how you want to add ${type}`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Take Photo', onPress: () => captureMedia(type) },
          { text: 'Choose from Library', onPress: () => selectMedia(type) },
        ]
      );
    }
  }, [captureMedia, selectMedia]);

  // Handle poll option changes
  const updatePollOption = useCallback((id: string, text: string) => {
    setPollOptions(prev => prev.map(option => 
      option.id === id ? { ...option, text } : option
    ));
  }, []);

  const addPollOption = useCallback(() => {
    if (pollOptions.length >= 6) return;
    const newId = (pollOptions.length + 1).toString();
    setPollOptions(prev => [...prev, { id: newId, text: '' }]);
  }, [pollOptions]);

  const removePollOption = useCallback((id: string) => {
    if (pollOptions.length <= 2) return;
    setPollOptions(prev => prev.filter(option => option.id !== id));
  }, [pollOptions]);

  // Validate form
  const validateForm = useCallback(() => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title for your post.');
      titleInputRef.current?.focus();
      return false;
    }

    if (title.length > 300) {
      Alert.alert('Error', 'Title must be less than 300 characters.');
      titleInputRef.current?.focus();
      return false;
    }

    if (!communityId) {
      Alert.alert('Error', 'Please select a community.');
      return false;
    }

    switch (postType) {
      case 'text':
        if (!content.trim()) {
          Alert.alert('Error', 'Please enter some content for your text post.');
          contentInputRef.current?.focus();
          return false;
        }
        break;
        
      case 'image':
      case 'video':
        if (!mediaUri) {
          Alert.alert('Error', `Please select a ${postType} for your post.`);
          return false;
        }
        break;
        
      case 'link':
        if (!url.trim()) {
          Alert.alert('Error', 'Please enter a URL for your link post.');
          return false;
        }
        try {
          new URL(url);
        } catch {
          Alert.alert('Error', 'Please enter a valid URL.');
          return false;
        }
        break;
        
      case 'poll':
        const validOptions = pollOptions.filter(opt => opt.text.trim());
        if (validOptions.length < 2) {
          Alert.alert('Error', 'Please provide at least 2 poll options.');
          return false;
        }
        break;
    }

    return true;
  }, [title, communityId, postType, content, mediaUri, url, pollOptions]);

  // Submit post
  const handleSubmit = useCallback(async () => {
    if (!validateForm() || submitting) return;

    setSubmitting(true);
    try {
      let mediaFiles: string[] = [];
      
      // Upload media if present
      if (mediaUri && (postType === 'image' || postType === 'video')) {
        const uploadedUrl = await apiService.uploadMedia(
          mediaUri, 
          postType as 'image' | 'video',
          'post'
        );
        mediaFiles = [uploadedUrl];
      }

      // Create post data
      const postData = {
        title: title.trim(),
        content: content.trim(),
        communityId,
        type: postType,
        url: postType === 'link' ? url : undefined,
        flair: flair.trim() || undefined,
        isNSFW,
        isOriginalContent,
        spoiler,
        mediaFiles: mediaFiles.length > 0 ? mediaFiles : undefined,
        pollOptions: postType === 'poll' ? pollOptions.filter(opt => opt.text.trim()).map(opt => opt.text.trim()) : undefined,
        pollDuration: postType === 'poll' ? pollDuration : undefined,
      };

      const result = await apiService.createPost(
        postData.title,
        postData.content,
        postData.communityId,
        postData.mediaFiles
      );

      // Validate response contains post ID
      const postId = result.post?.id || result.id || result.data?.id || result.data?.post?.id;

      if (!postId) {
        throw new Error('Post created but ID not returned from server');
      }

      if (result.success || result.post) {
        Alert.alert(
          'Success!',
          'Your post has been created successfully.',
          [
            {
              text: 'OK',
              onPress: () => {
                if (onSuccess) {
                  onSuccess(postId);
                } else {
                  navigation.goBack();
                }
              },
            },
          ]
        );
      } else {
        throw new Error(result.error || 'Failed to create post');
      }
    } catch (error) {
      console.error('Failed to create post:', error);
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to create post. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  }, [validateForm, submitting, mediaUri, postType, title, content, communityId, url, flair, isNSFW, isOriginalContent, spoiler, pollOptions, pollDuration, onSuccess, navigation]);

  // Render community picker
  const renderCommunityPicker = () => {
    const selectedCommunity = communities.find(c => c.id === communityId);
    
    return (
      <TouchableOpacity
        style={[styles.communitySelector, !communityId && styles.communityRequired]}
        onPress={() => setShowCommunityPicker(true)}
      >
        <View style={styles.communityInfo}>
          {selectedCommunity?.avatar && (
            <Image
              source={{ uri: selectedCommunity.avatar }}
              style={styles.communityAvatar}
            />
          )}
          <View style={styles.communityDetails}>
            <Text style={styles.communityName}>
              {selectedCommunity ? `r/${selectedCommunity.name}` : 'Choose a community'}
            </Text>
            {selectedCommunity && (
              <Text style={styles.communityMembers}>
                {selectedCommunity.memberCount.toLocaleString()} members
              </Text>
            )}
          </View>
        </View>
        <Ionicons name="chevron-down" size={20} color="#666" />
      </TouchableOpacity>
    );
  };

  // Render post type tabs
  const renderPostTypeTabs = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.postTypeTabs}
      contentContainerStyle={styles.postTypeTabsContent}
    >
      {POST_TYPES.map(type => (
        <TouchableOpacity
          key={type.key}
          style={[
            styles.postTypeTab,
            postType === type.key && styles.postTypeTabActive,
          ]}
          onPress={() => {
            setPostType(type.key as PostType);
            setMediaUri(null);
            setUrl('');
          }}
        >
          <Ionicons
            name={type.icon as any}
            size={20}
            color={postType === type.key ? '#007AFF' : '#666'}
          />
          <Text
            style={[
              styles.postTypeTabText,
              postType === type.key && styles.postTypeTabTextActive,
            ]}
          >
            {type.label}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  // Render content based on post type
  const renderPostContent = () => {
    switch (postType) {
      case 'text':
        return (
          <View style={styles.contentSection}>
            <Text style={styles.sectionLabel}>Text (optional)</Text>
            <TextInput
              ref={contentInputRef}
              style={styles.contentInput}
              value={content}
              onChangeText={setContent}
              placeholder="Share your thoughts..."
              multiline
              textAlignVertical="top"
              maxLength={10000}
            />
            <Text style={styles.characterCount}>
              {content.length}/10,000
            </Text>
          </View>
        );

      case 'image':
        return (
          <View style={styles.contentSection}>
            <Text style={styles.sectionLabel}>Image *</Text>
            {mediaUri ? (
              <View style={styles.mediaContainer}>
                <Image source={{ uri: mediaUri }} style={styles.selectedImage} />
                <TouchableOpacity
                  style={styles.removeMediaButton}
                  onPress={() => setMediaUri(null)}
                >
                  <Ionicons name="close" size={20} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.changeMediaButton}
                  onPress={() => showMediaPicker('image')}
                >
                  <Text style={styles.changeMediaText}>Change Image</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.mediaSelector}
                onPress={() => showMediaPicker('image')}
              >
                <Ionicons name="image-outline" size={48} color="#007AFF" />
                <Text style={styles.mediaSelectorText}>Select Image</Text>
                <Text style={styles.mediaSelectorSubtext}>
                  Tap to choose from gallery or camera
                </Text>
              </TouchableOpacity>
            )}
          </View>
        );

      case 'video':
        return (
          <View style={styles.contentSection}>
            <Text style={styles.sectionLabel}>Video *</Text>
            {mediaUri ? (
              <View style={styles.mediaContainer}>
                <View style={styles.videoPreview}>
                  <Ionicons name="play-circle" size={64} color="#007AFF" />
                  <Text style={styles.videoText}>Video Selected</Text>
                </View>
                <TouchableOpacity
                  style={styles.removeMediaButton}
                  onPress={() => setMediaUri(null)}
                >
                  <Ionicons name="close" size={20} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.changeMediaButton}
                  onPress={() => showMediaPicker('video')}
                >
                  <Text style={styles.changeMediaText}>Change Video</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.mediaSelector}
                onPress={() => showMediaPicker('video')}
              >
                <Ionicons name="videocam-outline" size={48} color="#007AFF" />
                <Text style={styles.mediaSelectorText}>Select Video</Text>
                <Text style={styles.mediaSelectorSubtext}>
                  Tap to choose from gallery or camera
                </Text>
              </TouchableOpacity>
            )}
          </View>
        );

      case 'link':
        return (
          <View style={styles.contentSection}>
            <Text style={styles.sectionLabel}>URL *</Text>
            <TextInput
              style={styles.linkInput}
              value={url}
              onChangeText={setUrl}
              placeholder="https://example.com"
              keyboardType="url"
              autoCapitalize="none"
            />
          </View>
        );

      case 'poll':
        return (
          <View style={styles.contentSection}>
            <Text style={styles.sectionLabel}>Poll Options *</Text>
            {pollOptions.map((option, index) => (
              <View key={option.id} style={styles.pollOptionContainer}>
                <Text style={styles.pollOptionNumber}>{index + 1}.</Text>
                <TextInput
                  style={styles.pollOptionInput}
                  value={option.text}
                  onChangeText={(text) => updatePollOption(option.id, text)}
                  placeholder={`Option ${index + 1}`}
                  maxLength={180}
                />
                {pollOptions.length > 2 && (
                  <TouchableOpacity
                    style={styles.removePollOption}
                    onPress={() => removePollOption(option.id)}
                  >
                    <Ionicons name="remove-circle" size={24} color="#FF3B30" />
                  </TouchableOpacity>
                )}
              </View>
            ))}
            
            {pollOptions.length < 6 && (
              <TouchableOpacity
                style={styles.addPollOption}
                onPress={addPollOption}
              >
                <Ionicons name="add-circle-outline" size={20} color="#007AFF" />
                <Text style={styles.addPollOptionText}>Add Option</Text>
              </TouchableOpacity>
            )}
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>Create Post</Text>
          
          <TouchableOpacity
            style={[
              styles.postButton,
              (!title.trim() || !communityId || submitting) && styles.postButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={!title.trim() || !communityId || submitting}
          >
            <Text style={styles.postButtonText}>
              {submitting ? 'Posting...' : 'Post'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Community Selector */}
        {renderCommunityPicker()}

        {/* Post Type Tabs */}
        {renderPostTypeTabs()}

        {/* Title Input */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Title *</Text>
          <TextInput
            ref={titleInputRef}
            style={styles.titleInput}
            value={title}
            onChangeText={setTitle}
            placeholder="An interesting title"
            maxLength={300}
            autoFocus
          />
          <Text style={styles.characterCount}>
            {title.length}/300
          </Text>
        </View>

        {/* Post Content */}
        {renderPostContent()}

        {/* Post Options */}
        <View style={styles.optionsSection}>
          <Text style={styles.sectionTitle}>Options</Text>
          
          <View style={styles.option}>
            <Text style={styles.optionLabel}>Flair</Text>
            <TextInput
              style={styles.flairInput}
              value={flair}
              onChangeText={setFlair}
              placeholder="Optional"
              maxLength={50}
            />
          </View>

          <TouchableOpacity
            style={styles.toggleOption}
            onPress={() => setIsNSFW(!isNSFW)}
          >
            <View style={styles.toggleLabel}>
              <Text style={styles.optionLabel}>NSFW</Text>
              <Text style={styles.optionDescription}>Not Safe For Work</Text>
            </View>
            <View style={[styles.toggle, isNSFW && styles.toggleActive]}>
              {isNSFW && <View style={styles.toggleIndicator} />}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.toggleOption}
            onPress={() => setSpoiler(!spoiler)}
          >
            <View style={styles.toggleLabel}>
              <Text style={styles.optionLabel}>Spoiler</Text>
              <Text style={styles.optionDescription}>Hide content behind spoiler tag</Text>
            </View>
            <View style={[styles.toggle, spoiler && styles.toggleActive]}>
              {spoiler && <View style={styles.toggleIndicator} />}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.toggleOption}
            onPress={() => setIsOriginalContent(!isOriginalContent)}
          >
            <View style={styles.toggleLabel}>
              <Text style={styles.optionLabel}>Original Content</Text>
              <Text style={styles.optionDescription}>This is my own work</Text>
            </View>
            <View style={[styles.toggle, isOriginalContent && styles.toggleActive]}>
              {isOriginalContent && <View style={styles.toggleIndicator} />}
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Community Picker Modal */}
      {showCommunityPicker && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choose Community</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowCommunityPicker(false)}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalContent}>
              {communities.map(community => (
                <TouchableOpacity
                  key={community.id}
                  style={[
                    styles.communityOption,
                    community.id === communityId && styles.communityOptionSelected,
                  ]}
                  onPress={() => handleCommunitySelect(community)}
                >
                  {community.avatar && (
                    <Image
                      source={{ uri: community.avatar }}
                      style={styles.communityOptionAvatar}
                    />
                  )}
                  <View style={styles.communityOptionDetails}>
                    <Text style={styles.communityOptionName}>
                      r/{community.name}
                    </Text>
                    <Text style={styles.communityOptionMembers}>
                      {community.memberCount.toLocaleString()} members
                    </Text>
                  </View>
                  {community.id === communityId && (
                    <Ionicons name="checkmark" size={20} color="#007AFF" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  cancelButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  cancelButtonText: {
    fontSize: typography.body1,
    color: '#007AFF',
  },
  headerTitle: {
    fontSize: typography.h6,
    fontWeight: '600',
    color: '#333',
  },
  postButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 20,
  },
  postButtonDisabled: {
    backgroundColor: '#ccc',
  },
  postButtonText: {
    fontSize: typography.body1,
    fontWeight: '600',
    color: '#fff',
  },
  communitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: '#fff',
    marginVertical: spacing.sm,
    marginHorizontal: spacing.lg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  communityRequired: {
    borderColor: '#FF3B30',
  },
  communityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  communityAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: spacing.md,
  },
  communityDetails: {
    flex: 1,
  },
  communityName: {
    fontSize: typography.body1,
    fontWeight: '600',
    color: '#333',
  },
  communityMembers: {
    fontSize: typography.body2,
    color: '#666',
  },
  postTypeTabs: {
    backgroundColor: '#fff',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    borderRadius: 8,
  },
  postTypeTabsContent: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  postTypeTab: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    marginRight: spacing.sm,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  postTypeTabActive: {
    backgroundColor: '#e3f2fd',
  },
  postTypeTabText: {
    fontSize: typography.caption,
    fontWeight: '500',
    color: '#666',
    marginTop: spacing.xs,
  },
  postTypeTabTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    borderRadius: 8,
    padding: spacing.lg,
  },
  sectionLabel: {
    fontSize: typography.body2,
    fontWeight: '600',
    color: '#333',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.h6,
    fontWeight: '600',
    color: '#333',
    marginBottom: spacing.lg,
  },
  titleInput: {
    fontSize: typography.body1,
    color: '#333',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    minHeight: 44,
  },
  characterCount: {
    fontSize: typography.caption,
    color: '#666',
    textAlign: 'right',
    marginTop: spacing.xs,
  },
  contentSection: {
    backgroundColor: '#fff',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    borderRadius: 8,
    padding: spacing.lg,
  },
  contentInput: {
    fontSize: typography.body1,
    color: '#333',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  linkInput: {
    fontSize: typography.body1,
    color: '#333',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    minHeight: 44,
  },
  mediaSelector: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    borderWidth: 2,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
    borderRadius: 8,
    backgroundColor: '#f8f9ff',
  },
  mediaSelectorText: {
    fontSize: typography.body1,
    fontWeight: '600',
    color: '#007AFF',
    marginTop: spacing.md,
  },
  mediaSelectorSubtext: {
    fontSize: typography.body2,
    color: '#666',
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  mediaContainer: {
    position: 'relative',
  },
  selectedImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  videoPreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoText: {
    fontSize: typography.body1,
    fontWeight: '500',
    color: '#007AFF',
    marginTop: spacing.sm,
  },
  removeMediaButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 16,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  changeMediaButton: {
    marginTop: spacing.md,
    alignSelf: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: '#007AFF',
    borderRadius: 20,
  },
  changeMediaText: {
    fontSize: typography.body2,
    fontWeight: '600',
    color: '#fff',
  },
  pollOptionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  pollOptionNumber: {
    fontSize: typography.body1,
    fontWeight: '500',
    color: '#666',
    width: 24,
  },
  pollOptionInput: {
    flex: 1,
    fontSize: typography.body1,
    color: '#333',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginHorizontal: spacing.sm,
  },
  removePollOption: {
    padding: spacing.xs,
  },
  addPollOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
    borderRadius: 8,
    backgroundColor: '#f8f9ff',
  },
  addPollOptionText: {
    fontSize: typography.body1,
    fontWeight: '500',
    color: '#007AFF',
    marginLeft: spacing.sm,
  },
  optionsSection: {
    backgroundColor: '#fff',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    borderRadius: 8,
    padding: spacing.lg,
  },
  option: {
    marginBottom: spacing.lg,
  },
  optionLabel: {
    fontSize: typography.body1,
    fontWeight: '500',
    color: '#333',
    marginBottom: spacing.xs,
  },
  optionDescription: {
    fontSize: typography.body2,
    color: '#666',
  },
  flairInput: {
    fontSize: typography.body1,
    color: '#333',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginTop: spacing.sm,
  },
  toggleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  toggleLabel: {
    flex: 1,
  },
  toggle: {
    width: 44,
    height: 24,
    borderRadius: deviceInfo.isTablet ? 14 : 12,
    backgroundColor: '#e0e0e0',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  toggleActive: {
    backgroundColor: '#007AFF',
  },
  toggleIndicator: {
    width: 20,
    height: 20,
    borderRadius: deviceInfo.isTablet ? 12 : 10,
    backgroundColor: '#fff',
    position: 'absolute',
    right: 2,
  },
  bottomPadding: {
    height: 50,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: deviceInfo.isTablet ? 14 : 12,
    marginHorizontal: spacing.xl,
    maxHeight: '80%',
    width: screenWidth - 40,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: typography.h6,
    fontWeight: '600',
    color: '#333',
  },
  modalCloseButton: {
    padding: spacing.xs,
  },
  modalContent: {
    maxHeight: 400,
  },
  communityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  communityOptionSelected: {
    backgroundColor: '#f0f8ff',
  },
  communityOptionAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: spacing.md,
  },
  communityOptionDetails: {
    flex: 1,
  },
  communityOptionName: {
    fontSize: typography.body1,
    fontWeight: '600',
    color: '#333',
  },
  communityOptionMembers: {
    fontSize: typography.body2,
    color: '#666',
  },
});