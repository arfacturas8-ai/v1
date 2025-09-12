import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../contexts/ThemeContext';
import { MainStackParamList } from '../navigation/MainNavigator';

type CreateServerScreenNavigationProp = NativeStackNavigationProp<MainStackParamList, 'CreateServer'>;

interface ServerFormData {
  name: string;
  description: string;
  category: string;
  isPublic: boolean;
  iconUri?: string;
  bannerUri?: string;
}

interface FormErrors {
  name?: string;
  description?: string;
  category?: string;
}

const categories = [
  'Gaming',
  'Technology',
  'Entertainment',
  'Education',
  'Art & Design',
  'Music',
  'Sports',
  'Science',
  'Business',
  'Lifestyle',
  'Other',
];

export function CreateServerScreen() {
  const navigation = useNavigation<CreateServerScreenNavigationProp>();
  const { colors } = useTheme();

  const [formData, setFormData] = useState<ServerFormData>({
    name: '',
    description: '',
    category: 'Gaming',
    isPublic: true,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Server name is required';
    } else if (formData.name.trim().length < 3) {
      newErrors.name = 'Server name must be at least 3 characters';
    } else if (formData.name.trim().length > 50) {
      newErrors.name = 'Server name must be less than 50 characters';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.trim().length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    } else if (formData.description.trim().length > 200) {
      newErrors.description = 'Description must be less than 200 characters';
    }

    if (!formData.category) {
      newErrors.category = 'Please select a category';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleInputChange = useCallback((field: keyof ServerFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear field-specific error
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  }, [errors]);

  const handleImagePicker = useCallback(async (type: 'icon' | 'banner') => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'We need access to your photo library to select an image.',
          [{ text: 'OK' }]
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: type === 'icon' ? [1, 1] : [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        if (type === 'icon') {
          handleInputChange('iconUri', result.assets[0].uri);
        } else {
          handleInputChange('bannerUri', result.assets[0].uri);
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  }, [handleInputChange]);

  const handleCreateServer = useCallback(async () => {
    try {
      if (!validateForm()) {
        return;
      }

      setIsLoading(true);

      // TODO: Implement API call to create server
      await new Promise(resolve => setTimeout(resolve, 2000));

      Alert.alert(
        'Server Created!',
        `${formData.name} has been created successfully.`,
        [
          {
            text: 'View Server',
            onPress: () => {
              navigation.replace('Server', {
                serverId: 'new-server-id',
                serverName: formData.name,
              });
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error creating server:', error);
      Alert.alert('Error', 'Failed to create server. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [formData, validateForm, navigation]);

  const handleCategorySelect = useCallback((category: string) => {
    handleInputChange('category', category);
    setShowCategoryPicker(false);
  }, [handleInputChange]);

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>
            Create Your Server
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Start building your community today
          </Text>
        </View>

        <View style={styles.form}>
          {/* Server Icon */}
          <View style={styles.imageSection}>
            <Text style={[styles.label, { color: colors.text }]}>
              Server Icon
            </Text>
            <TouchableOpacity
              style={[styles.imagePickerButton, { backgroundColor: colors.surface }]}
              onPress={() => handleImagePicker('icon')}
            >
              {formData.iconUri ? (
                <Image source={{ uri: formData.iconUri }} style={styles.serverIcon} />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Ionicons name="camera" size={32} color={colors.textSecondary} />
                  <Text style={[styles.imagePlaceholderText, { color: colors.textSecondary }]}>
                    Add Icon
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Server Banner */}
          <View style={styles.imageSection}>
            <Text style={[styles.label, { color: colors.text }]}>
              Server Banner (Optional)
            </Text>
            <TouchableOpacity
              style={[styles.bannerPickerButton, { backgroundColor: colors.surface }]}
              onPress={() => handleImagePicker('banner')}
            >
              {formData.bannerUri ? (
                <Image source={{ uri: formData.bannerUri }} style={styles.serverBanner} />
              ) : (
                <View style={styles.bannerPlaceholder}>
                  <Ionicons name="image" size={32} color={colors.textSecondary} />
                  <Text style={[styles.imagePlaceholderText, { color: colors.textSecondary }]}>
                    Add Banner
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Server Name */}
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: colors.text }]}>
              Server Name *
            </Text>
            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: colors.surface,
                  color: colors.text,
                  borderColor: errors.name ? colors.error : colors.border,
                }
              ]}
              placeholder="Enter server name"
              placeholderTextColor={colors.textSecondary}
              value={formData.name}
              onChangeText={(value) => handleInputChange('name', value)}
              maxLength={50}
            />
            {errors.name && (
              <Text style={[styles.errorText, { color: colors.error }]}>
                {errors.name}
              </Text>
            )}
            <Text style={[styles.characterCount, { color: colors.textSecondary }]}>
              {formData.name.length}/50
            </Text>
          </View>

          {/* Description */}
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: colors.text }]}>
              Description *
            </Text>
            <TextInput
              style={[
                styles.textAreaInput,
                {
                  backgroundColor: colors.surface,
                  color: colors.text,
                  borderColor: errors.description ? colors.error : colors.border,
                }
              ]}
              placeholder="Describe what your server is about"
              placeholderTextColor={colors.textSecondary}
              value={formData.description}
              onChangeText={(value) => handleInputChange('description', value)}
              multiline
              numberOfLines={4}
              maxLength={200}
            />
            {errors.description && (
              <Text style={[styles.errorText, { color: colors.error }]}>
                {errors.description}
              </Text>
            )}
            <Text style={[styles.characterCount, { color: colors.textSecondary }]}>
              {formData.description.length}/200
            </Text>
          </View>

          {/* Category */}
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: colors.text }]}>
              Category *
            </Text>
            <TouchableOpacity
              style={[
                styles.categoryButton,
                {
                  backgroundColor: colors.surface,
                  borderColor: errors.category ? colors.error : colors.border,
                }
              ]}
              onPress={() => setShowCategoryPicker(!showCategoryPicker)}
            >
              <Text style={[styles.categoryButtonText, { color: colors.text }]}>
                {formData.category}
              </Text>
              <Ionicons 
                name={showCategoryPicker ? "chevron-up" : "chevron-down"} 
                size={20} 
                color={colors.textSecondary} 
              />
            </TouchableOpacity>

            {showCategoryPicker && (
              <View style={[styles.categoryPicker, { backgroundColor: colors.surface }]}>
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.categoryOption,
                      formData.category === category && { backgroundColor: colors.primary + '20' }
                    ]}
                    onPress={() => handleCategorySelect(category)}
                  >
                    <Text style={[
                      styles.categoryOptionText,
                      {
                        color: formData.category === category ? colors.primary : colors.text,
                        fontWeight: formData.category === category ? '600' : '400',
                      }
                    ]}>
                      {category}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {errors.category && (
              <Text style={[styles.errorText, { color: colors.error }]}>
                {errors.category}
              </Text>
            )}
          </View>

          {/* Public/Private Toggle */}
          <View style={styles.toggleContainer}>
            <View style={styles.toggleInfo}>
              <Text style={[styles.label, { color: colors.text }]}>
                Server Visibility
              </Text>
              <Text style={[styles.toggleDescription, { color: colors.textSecondary }]}>
                {formData.isPublic 
                  ? 'Anyone can find and join your server'
                  : 'Only people with invite links can join'
                }
              </Text>
            </View>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                { backgroundColor: formData.isPublic ? colors.primary : colors.border }
              ]}
              onPress={() => handleInputChange('isPublic', !formData.isPublic)}
            >
              <View style={[
                styles.toggleThumb,
                { transform: [{ translateX: formData.isPublic ? 20 : 0 }] }
              ]} />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.createButton,
            { backgroundColor: colors.primary, opacity: isLoading ? 0.6 : 1 }
          ]}
          onPress={handleCreateServer}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <Text style={styles.createButtonText}>Create Server</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  form: {
    marginBottom: 32,
  },
  imageSection: {
    marginBottom: 24,
    alignItems: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  imagePickerButton: {
    width: 100,
    height: 100,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(128, 128, 128, 0.3)',
  },
  serverIcon: {
    width: 96,
    height: 96,
    borderRadius: 12,
  },
  bannerPickerButton: {
    width: '100%',
    height: 120,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(128, 128, 128, 0.3)',
  },
  serverBanner: {
    width: '100%',
    height: 116,
    borderRadius: 12,
  },
  imagePlaceholder: {
    alignItems: 'center',
  },
  bannerPlaceholder: {
    alignItems: 'center',
  },
  imagePlaceholderText: {
    fontSize: 14,
    marginTop: 8,
  },
  inputContainer: {
    marginBottom: 20,
  },
  textInput: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    fontSize: 16,
    borderWidth: 1,
  },
  textAreaInput: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    fontSize: 16,
    borderWidth: 1,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
  },
  characterCount: {
    fontSize: 12,
    textAlign: 'right',
    marginTop: 4,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  categoryButtonText: {
    fontSize: 16,
  },
  categoryPicker: {
    marginTop: 8,
    borderRadius: 12,
    maxHeight: 200,
    overflow: 'hidden',
  },
  categoryOption: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  categoryOptionText: {
    fontSize: 16,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  toggleInfo: {
    flex: 1,
    marginRight: 16,
  },
  toggleDescription: {
    fontSize: 14,
    marginTop: 4,
  },
  toggleButton: {
    width: 50,
    height: 30,
    borderRadius: 15,
    padding: 2,
    justifyContent: 'center',
  },
  toggleThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#ffffff',
  },
  createButton: {
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
});