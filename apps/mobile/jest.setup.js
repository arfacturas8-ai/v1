// Jest setup for React Native testing
import 'react-native-gesture-handler/jestSetup';

// Mock React Native modules
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  return {
    ...RN,
    Platform: {
      ...RN.Platform,
      OS: 'ios',
      select: jest.fn(obj => obj.ios || obj.default),
    },
    Dimensions: {
      get: jest.fn(() => ({ width: 375, height: 667 })),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    },
    NativeModules: {
      ...RN.NativeModules,
      RNCNetInfo: {
        getCurrentState: jest.fn(() => Promise.resolve({
          type: 'wifi',
          isConnected: true,
          isInternetReachable: true,
        })),
        addListener: jest.fn(),
        removeListeners: jest.fn(),
      },
      RNDeviceInfo: {
        getModel: jest.fn(() => 'iPhone'),
        getSystemVersion: jest.fn(() => '15.0'),
        getBundleId: jest.fn(() => 'app.cryb.ios'),
      },
    },
  };
});

// Mock Expo modules
jest.mock('expo-constants', () => ({
  default: {
    appOwnership: 'standalone',
  },
}));

jest.mock('expo-linking', () => ({
  createURL: jest.fn(),
  parse: jest.fn(),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

// Mock Socket.IO client
jest.mock('socket.io-client', () => ({
  io: jest.fn(() => ({
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
    connect: jest.fn(),
    disconnect: jest.fn(),
    connected: false,
  })),
}));

// Mock React Navigation
jest.mock('@react-navigation/native', () => ({
  useNavigation: jest.fn(() => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    dispatch: jest.fn(),
    setOptions: jest.fn(),
    canGoBack: jest.fn(() => true),
  })),
  useRoute: jest.fn(() => ({
    params: {},
    name: 'TestScreen',
  })),
  useFocusEffect: jest.fn(),
  useIsFocused: jest.fn(() => true),
  NavigationContainer: ({ children }) => children,
}));

// Mock React Navigation Stack
jest.mock('@react-navigation/native-stack', () => ({
  createNativeStackNavigator: jest.fn(() => ({
    Navigator: ({ children }) => children,
    Screen: ({ children }) => children,
  })),
}));

// Mock React Navigation Bottom Tabs
jest.mock('@react-navigation/bottom-tabs', () => ({
  createBottomTabNavigator: jest.fn(() => ({
    Navigator: ({ children }) => children,
    Screen: ({ children }) => children,
  })),
}));

// Mock React Native Permissions
jest.mock('react-native-permissions', () => ({
  PERMISSIONS: {
    IOS: {
      CAMERA: 'ios.permission.CAMERA',
      MICROPHONE: 'ios.permission.MICROPHONE',
      PHOTO_LIBRARY: 'ios.permission.PHOTO_LIBRARY',
    },
    ANDROID: {
      CAMERA: 'android.permission.CAMERA',
      RECORD_AUDIO: 'android.permission.RECORD_AUDIO',
      READ_EXTERNAL_STORAGE: 'android.permission.READ_EXTERNAL_STORAGE',
    },
  },
  RESULTS: {
    GRANTED: 'granted',
    DENIED: 'denied',
    NEVER_ASK_AGAIN: 'never_ask_again',
    BLOCKED: 'blocked',
  },
  request: jest.fn(() => Promise.resolve('granted')),
  check: jest.fn(() => Promise.resolve('granted')),
  openSettings: jest.fn(),
}));

// Mock React Native Keychain
jest.mock('react-native-keychain', () => ({
  setInternetCredentials: jest.fn(() => Promise.resolve()),
  getInternetCredentials: jest.fn(() => Promise.resolve({
    username: 'testuser',
    password: 'testpass',
  })),
  resetInternetCredentials: jest.fn(() => Promise.resolve()),
}));

// Mock React Native Device Info
jest.mock('react-native-device-info', () => ({
  getModel: jest.fn(() => 'iPhone'),
  getSystemVersion: jest.fn(() => '15.0'),
  getBundleId: jest.fn(() => 'app.cryb.ios'),
  getVersion: jest.fn(() => '1.0.0'),
  getBuildNumber: jest.fn(() => '1'),
  getDeviceId: jest.fn(() => 'test-device-id'),
  isEmulator: jest.fn(() => Promise.resolve(true)),
}));

// Mock WebRTC
jest.mock('react-native-webrtc', () => ({
  RTCPeerConnection: jest.fn(),
  RTCSessionDescription: jest.fn(),
  RTCIceCandidate: jest.fn(),
  getUserMedia: jest.fn(),
  mediaDevices: {
    getUserMedia: jest.fn(() => Promise.resolve({
      getTracks: jest.fn(() => []),
      getVideoTracks: jest.fn(() => []),
      getAudioTracks: jest.fn(() => []),
    })),
    enumerateDevices: jest.fn(() => Promise.resolve([])),
  },
}));

// Mock Push Notifications
jest.mock('expo-notifications', () => ({
  requestPermissionsAsync: jest.fn(() => Promise.resolve({
    status: 'granted',
  })),
  getPermissionsAsync: jest.fn(() => Promise.resolve({
    status: 'granted',
  })),
  scheduleNotificationAsync: jest.fn(),
  cancelAllScheduledNotificationsAsync: jest.fn(),
  addNotificationReceivedListener: jest.fn(),
  addNotificationResponseReceivedListener: jest.fn(),
}));

// Mock Image Picker
jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(() => Promise.resolve({
    status: 'granted',
  })),
  requestCameraPermissionsAsync: jest.fn(() => Promise.resolve({
    status: 'granted',  
  })),
  launchImageLibraryAsync: jest.fn(() => Promise.resolve({
    cancelled: false,
    assets: [{
      uri: 'test-image-uri',
      width: 100,
      height: 100,
    }],
  })),
  launchCameraAsync: jest.fn(() => Promise.resolve({
    cancelled: false,
    assets: [{
      uri: 'test-camera-uri',
      width: 100,
      height: 100,
    }],
  })),
}));

// Global test setup
global.fetch = jest.fn();
global.WebSocket = jest.fn(() => ({
  send: jest.fn(),
  close: jest.fn(),
  onopen: jest.fn(),
  onmessage: jest.fn(),
  onerror: jest.fn(),
  onclose: jest.fn(),
}));

// Mock console methods for cleaner test output
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
};