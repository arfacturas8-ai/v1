import * as ImagePicker from 'expo-image-picker';
import * as Camera from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import { Alert, Platform } from 'react-native';

export interface MediaResult {
  uri: string;
  type: 'image' | 'video';
  width?: number;
  height?: number;
  duration?: number;
  size?: number;
}

export class CameraService {
  private static instance: CameraService;

  private constructor() {}

  static getInstance(): CameraService {
    if (!CameraService.instance) {
      CameraService.instance = new CameraService();
    }
    return CameraService.instance;
  }

  async requestCameraPermissions(): Promise<boolean> {
    try {
      const { status } = await Camera.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Camera Permission Required',
          'Please enable camera access in your device settings to take photos and videos.',
          [{ text: 'OK' }]
        );
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error requesting camera permission:', error);
      return false;
    }
  }

  async requestMediaLibraryPermissions(): Promise<boolean> {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Media Library Permission Required',
          'Please enable photo library access in your device settings to select photos and videos.',
          [{ text: 'OK' }]
        );
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error requesting media library permission:', error);
      return false;
    }
  }

  async takePicture(): Promise<MediaResult | null> {
    try {
      const hasPermission = await this.requestCameraPermissions();
      if (!hasPermission) {
        return null;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (result.canceled) {
        return null;
      }

      const asset = result.assets[0];
      return {
        uri: asset.uri,
        type: 'image',
        width: asset.width,
        height: asset.height,
      };
    } catch (error) {
      console.error('Error taking picture:', error);
      Alert.alert('Error', 'Failed to take picture. Please try again.');
      return null;
    }
  }

  async recordVideo(): Promise<MediaResult | null> {
    try {
      const hasPermission = await this.requestCameraPermissions();
      if (!hasPermission) {
        return null;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        quality: 0.8,
        videoMaxDuration: 60, // 60 seconds max
      });

      if (result.canceled) {
        return null;
      }

      const asset = result.assets[0];
      return {
        uri: asset.uri,
        type: 'video',
        width: asset.width,
        height: asset.height,
        duration: asset.duration,
      };
    } catch (error) {
      console.error('Error recording video:', error);
      Alert.alert('Error', 'Failed to record video. Please try again.');
      return null;
    }
  }

  async pickImageFromLibrary(allowsMultiple: boolean = false): Promise<MediaResult[] | null> {
    try {
      const hasPermission = await this.requestMediaLibraryPermissions();
      if (!hasPermission) {
        return null;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: !allowsMultiple,
        allowsMultipleSelection: allowsMultiple,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (result.canceled) {
        return null;
      }

      return result.assets.map((asset) => ({
        uri: asset.uri,
        type: 'image' as const,
        width: asset.width,
        height: asset.height,
      }));
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
      return null;
    }
  }

  async pickVideoFromLibrary(): Promise<MediaResult | null> {
    try {
      const hasPermission = await this.requestMediaLibraryPermissions();
      if (!hasPermission) {
        return null;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        quality: 0.8,
      });

      if (result.canceled) {
        return null;
      }

      const asset = result.assets[0];
      return {
        uri: asset.uri,
        type: 'video',
        width: asset.width,
        height: asset.height,
        duration: asset.duration,
      };
    } catch (error) {
      console.error('Error picking video:', error);
      Alert.alert('Error', 'Failed to pick video. Please try again.');
      return null;
    }
  }

  async compressImage(uri: string, quality: number = 0.7): Promise<string> {
    try {
      const manipResult = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 1024 } }], // Resize to max width of 1024
        { compress: quality, format: ImageManipulator.SaveFormat.JPEG }
      );
      return manipResult.uri;
    } catch (error) {
      console.error('Error compressing image:', error);
      return uri;
    }
  }

  async cropImage(
    uri: string,
    cropData: { originX: number; originY: number; width: number; height: number }
  ): Promise<string> {
    try {
      const manipResult = await ImageManipulator.manipulateAsync(
        uri,
        [{ crop: cropData }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      );
      return manipResult.uri;
    } catch (error) {
      console.error('Error cropping image:', error);
      return uri;
    }
  }

  async resizeImage(uri: string, width: number, height?: number): Promise<string> {
    try {
      const manipResult = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width, height } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      );
      return manipResult.uri;
    } catch (error) {
      console.error('Error resizing image:', error);
      return uri;
    }
  }

  showMediaOptions(): Promise<'camera' | 'library' | null> {
    return new Promise((resolve) => {
      Alert.alert(
        'Select Media',
        'Choose a source for your media',
        [
          {
            text: 'Camera',
            onPress: () => resolve('camera'),
          },
          {
            text: 'Photo Library',
            onPress: () => resolve('library'),
          },
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => resolve(null),
          },
        ],
        { cancelable: true, onDismiss: () => resolve(null) }
      );
    });
  }

  async selectMedia(
    type: 'image' | 'video' = 'image',
    allowMultiple: boolean = false
  ): Promise<MediaResult[] | null> {
    const source = await this.showMediaOptions();
    if (!source) {
      return null;
    }

    if (source === 'camera') {
      if (type === 'image') {
        const result = await this.takePicture();
        return result ? [result] : null;
      } else {
        const result = await this.recordVideo();
        return result ? [result] : null;
      }
    } else {
      if (type === 'image') {
        return await this.pickImageFromLibrary(allowMultiple);
      } else {
        const result = await this.pickVideoFromLibrary();
        return result ? [result] : null;
      }
    }
  }
}

export default CameraService.getInstance();
