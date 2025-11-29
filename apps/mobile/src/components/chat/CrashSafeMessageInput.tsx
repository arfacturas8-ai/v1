/**
 * CRASH-SAFE MESSAGE INPUT
 * Message input component with comprehensive error handling
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
  KeyboardAvoidingView,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as Haptics from 'expo-haptics';
import { CrashDetector } from '../../utils/CrashDetector';
import { useErrorHandler } from '../ErrorBoundary';
import { deviceInfo, spacing, typography, scale } from '../../utils/responsive';

const { width } = Dimensions.get('window');

interface CrashSafeMessageInputProps {
  channelId: string;
  onSendMessage: (content: string, attachments?: File[]) => Promise<boolean>;
  onTypingStart: () => void;
  onTypingStop: () => void;
  disabled?: boolean;
  placeholder?: string;
  maxLength?: number;
}

const MAX_MESSAGE_LENGTH = 2000;
const MAX_ATTACHMENTS = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const CrashSafeMessageInput: React.FC<CrashSafeMessageInputProps> = ({
  channelId,
  onSendMessage,
  onTypingStart,
  onTypingStop,
  disabled = false,
  placeholder = 'Type a message...',
  maxLength = MAX_MESSAGE_LENGTH,
}) => {
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  
  const textInputRef = useRef<TextInput>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const animatedHeight = useRef(new Animated.Value(0)).current;
  
  const handleError = useErrorHandler();

  // Handle typing indicators
  useEffect(() => {
    if (message.trim() && !isTyping) {
      setIsTyping(true);
      onTypingStart();
    } else if (!message.trim() && isTyping) {
      setIsTyping(false);
      onTypingStop();
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout
    if (message.trim()) {
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        onTypingStop();
      }, 3000); // Stop typing after 3 seconds of inactivity
    }

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [message, isTyping, onTypingStart, onTypingStop]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isTyping) {
        onTypingStop();
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [isTyping, onTypingStop]);

  // Handle message change
  const handleMessageChange = useCallback((text: string) => {
    try {
      if (text.length <= maxLength) {
        setMessage(text);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
    } catch (error) {
      handleError(error instanceof Error ? error : new Error(String(error)));
    }
  }, [maxLength, handleError]);

  // Handle send message
  const handleSend = useCallback(async () => {
    try {
      const content = message.trim();
      
      if (!content && !attachments.length) {
        return;
      }

      if (isSending) {
        return;
      }

      setIsSending(true);
      
      const success = await onSendMessage(content, attachments);
      
      if (success) {
        setMessage('');
        setAttachments([]);
        textInputRef.current?.focus();
        
        // Animate attachment area closed
        if (attachments.length > 0) {
          Animated.timing(animatedHeight, {
            toValue: 0,
            duration: 200,
            useNativeDriver: false,
          }).start();
        }
      }
    } catch (error) {
      handleError(error instanceof Error ? error : new Error(String(error)));
      Alert.alert('Error', 'Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
    }
  }, [message, attachments, isSending, onSendMessage, animatedHeight, handleError]);

  // Handle attachment selection
  const handleAttachmentPress = useCallback(async () => {
    try {
      if (attachments.length >= MAX_ATTACHMENTS) {
        Alert.alert('Limit Reached', `You can only attach up to ${MAX_ATTACHMENTS} files.`);
        return;
      }

      setShowAttachmentMenu(true);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      handleError(error instanceof Error ? error : new Error(String(error)));
    }
  }, [attachments.length, handleError]);

  // Handle image picker
  const handleImagePicker = useCallback(async () => {
    try {
      setShowAttachmentMenu(false);
      
      // Request permissions
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert(
          'Permission Required',
          'Please grant access to your photo library to attach images.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
        allowsMultipleSelection: true,
      });

      if (!result.canceled && result.assets) {
        const newAttachments: File[] = [];
        
        for (const asset of result.assets) {
          if (asset.fileSize && asset.fileSize > MAX_FILE_SIZE) {
            Alert.alert(
              'File Too Large',
              `${asset.fileName || 'Image'} is too large. Maximum size is 10MB.`
            );
            continue;
          }
          
          // Convert asset to File-like object
          const file = {
            name: asset.fileName || `image_${Date.now()}.jpg`,
            type: asset.type || 'image/jpeg',
            uri: asset.uri,
            size: asset.fileSize || 0,
          } as File;
          
          newAttachments.push(file);
        }
        
        if (newAttachments.length > 0) {
          const totalAttachments = attachments.length + newAttachments.length;
          
          if (totalAttachments > MAX_ATTACHMENTS) {
            Alert.alert(
              'Too Many Files',
              `You can only attach up to ${MAX_ATTACHMENTS} files. Only the first ${MAX_ATTACHMENTS - attachments.length} will be added.`
            );
            
            setAttachments(prev => [
              ...prev,
              ...newAttachments.slice(0, MAX_ATTACHMENTS - prev.length)
            ]);
          } else {
            setAttachments(prev => [...prev, ...newAttachments]);
          }
          
          // Animate attachment area open
          Animated.timing(animatedHeight, {
            toValue: 80,
            duration: 200,
            useNativeDriver: false,
          }).start();
        }
      }
    } catch (error) {
      handleError(error instanceof Error ? error : new Error(String(error)));
      Alert.alert('Error', 'Failed to select images. Please try again.');
    }
  }, [attachments, animatedHeight, handleError]);

  // Handle camera
  const handleCamera = useCallback(async () => {
    try {
      setShowAttachmentMenu(false);
      
      // Request permissions
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert(
          'Permission Required',
          'Please grant camera access to take photos.'
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        
        if (asset.fileSize && asset.fileSize > MAX_FILE_SIZE) {
          Alert.alert('File Too Large', 'Photo is too large. Maximum size is 10MB.');
          return;
        }
        
        if (attachments.length >= MAX_ATTACHMENTS) {
          Alert.alert('Limit Reached', `You can only attach up to ${MAX_ATTACHMENTS} files.`);
          return;
        }
        
        const file = {
          name: asset.fileName || `photo_${Date.now()}.jpg`,
          type: asset.type || 'image/jpeg',
          uri: asset.uri,
          size: asset.fileSize || 0,
        } as File;
        
        setAttachments(prev => [...prev, file]);
        
        // Animate attachment area open
        Animated.timing(animatedHeight, {
          toValue: 80,
          duration: 200,
          useNativeDriver: false,
        }).start();
      }
    } catch (error) {
      handleError(error instanceof Error ? error : new Error(String(error)));
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  }, [attachments, animatedHeight, handleError]);

  // Handle document picker
  const handleDocumentPicker = useCallback(async () => {
    try {
      setShowAttachmentMenu(false);
      
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        multiple: true,
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets) {
        const newAttachments: File[] = [];
        
        for (const asset of result.assets) {
          if (asset.size > MAX_FILE_SIZE) {
            Alert.alert(
              'File Too Large',
              `${asset.name} is too large. Maximum size is 10MB.`
            );
            continue;
          }
          
          const file = {
            name: asset.name,
            type: asset.mimeType || 'application/octet-stream',
            uri: asset.uri,
            size: asset.size,
          } as File;
          
          newAttachments.push(file);
        }
        
        if (newAttachments.length > 0) {
          const totalAttachments = attachments.length + newAttachments.length;
          
          if (totalAttachments > MAX_ATTACHMENTS) {
            Alert.alert(
              'Too Many Files',
              `You can only attach up to ${MAX_ATTACHMENTS} files. Only the first ${MAX_ATTACHMENTS - attachments.length} will be added.`
            );
            
            setAttachments(prev => [
              ...prev,
              ...newAttachments.slice(0, MAX_ATTACHMENTS - prev.length)
            ]);
          } else {
            setAttachments(prev => [...prev, ...newAttachments]);
          }
          
          // Animate attachment area open
          Animated.timing(animatedHeight, {
            toValue: 80,
            duration: 200,
            useNativeDriver: false,
          }).start();
        }
      }
    } catch (error) {
      handleError(error instanceof Error ? error : new Error(String(error)));
      Alert.alert('Error', 'Failed to select files. Please try again.');
    }
  }, [attachments, animatedHeight, handleError]);

  // Remove attachment
  const removeAttachment = useCallback((index: number) => {
    try {
      const newAttachments = attachments.filter((_, i) => i !== index);
      setAttachments(newAttachments);
      
      if (newAttachments.length === 0) {
        Animated.timing(animatedHeight, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
        }).start();
      }
    } catch (error) {
      handleError(error instanceof Error ? error : new Error(String(error)));
    }
  }, [attachments, animatedHeight, handleError]);

  const canSend = (message.trim() || attachments.length > 0) && !disabled && !isSending;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      {/* Attachment Preview */}
      <Animated.View style={[styles.attachmentPreview, { height: animatedHeight }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.attachmentsList}
        >
          {attachments.map((attachment, index) => (
            <View key={index} style={styles.attachmentItem}>
              <View style={styles.attachmentInfo}>
                <Ionicons
                  name={attachment.type?.startsWith('image/') ? 'image' : 'document'}
                  size={20}
                  color="#4a9eff"
                />
                <Text style={styles.attachmentName} numberOfLines={1}>
                  {attachment.name}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.removeAttachment}
                onPress={() => removeAttachment(index)}
              >
                <Ionicons name="close-circle" size={16} color="#ff6b6b" />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      </Animated.View>

      {/* Input Area */}
      <View style={styles.inputContainer}>
        <TouchableOpacity
          style={[styles.attachButton, disabled && styles.attachButtonDisabled]}
          onPress={handleAttachmentPress}
          disabled={disabled}
        >
          <Ionicons name="add" size={24} color={disabled ? "#666" : "#4a9eff"} />
        </TouchableOpacity>

        <View style={styles.textInputContainer}>
          <TextInput
            ref={textInputRef}
            style={styles.textInput}
            value={message}
            onChangeText={handleMessageChange}
            placeholder={disabled ? 'Connecting...' : placeholder}
            placeholderTextColor="#666"
            multiline
            maxLength={maxLength}
            editable={!disabled}
            returnKeyType="send"
            onSubmitEditing={canSend ? handleSend : undefined}
          />
          
          {message.length > maxLength * 0.8 && (
            <Text style={styles.characterCounter}>
              {message.length}/{maxLength}
            </Text>
          )}
        </View>

        <TouchableOpacity
          style={[styles.sendButton, !canSend && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!canSend}
        >
          {isSending ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Ionicons name="send" size={20} color={canSend ? "#ffffff" : "#666"} />
          )}
        </TouchableOpacity>
      </View>

      {/* Attachment Menu */}
      {showAttachmentMenu && (
        <View style={styles.attachmentMenu}>
          <TouchableOpacity
            style={styles.attachmentMenuItem}
            onPress={handleCamera}
          >
            <Ionicons name="camera" size={24} color="#4a9eff" />
            <Text style={styles.attachmentMenuText}>Camera</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.attachmentMenuItem}
            onPress={handleImagePicker}
          >
            <Ionicons name="image" size={24} color="#4a9eff" />
            <Text style={styles.attachmentMenuText}>Photos</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.attachmentMenuItem}
            onPress={handleDocumentPicker}
          >
            <Ionicons name="document" size={24} color="#4a9eff" />
            <Text style={styles.attachmentMenuText}>Files</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.attachmentMenuItem}
            onPress={() => setShowAttachmentMenu(false)}
          >
            <Ionicons name="close" size={24} color="#666" />
            <Text style={[styles.attachmentMenuText, { color: '#666' }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#000000',
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  attachmentPreview: {
    backgroundColor: '#0A0A0B',
    overflow: 'hidden',
  },
  attachmentsList: {
    padding: 16,
    gap: 12,
  },
  attachmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#333',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 120,
    maxWidth: 200,
  },
  attachmentInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  attachmentName: {
    color: '#ffffff',
    fontSize: 12,
    flex: 1,
  },
  removeAttachment: {
    marginLeft: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    gap: 12,
  },
  attachButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(74, 158, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  attachButtonDisabled: {
    backgroundColor: '#333',
  },
  textInputContainer: {
    flex: 1,
    position: 'relative',
  },
  textInput: {
    backgroundColor: '#0A0A0B',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#ffffff',
    fontSize: 16,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: '#333',
  },
  characterCounter: {
    position: 'absolute',
    bottom: -20,
    right: 8,
    color: '#666',
    fontSize: 10,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4a9eff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#333',
  },
  attachmentMenu: {
    position: 'absolute',
    bottom: 80,
    left: 16,
    backgroundColor: '#0A0A0B',
    borderRadius: 12,
    padding: 8,
    flexDirection: 'row',
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  attachmentMenuItem: {
    alignItems: 'center',
    gap: 4,
    padding: 12,
  },
  attachmentMenuText: {
    color: '#4a9eff',
    fontSize: 12,
    fontWeight: '500',
  },
});