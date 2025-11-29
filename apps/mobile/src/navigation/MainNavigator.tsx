import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigation } from '@react-navigation/native';

// Screen imports
import { HomeScreen } from '../screens/HomeScreen';
import { ChatNavigator } from './ChatNavigator';
import { CommunitiesScreen } from '../screens/CommunitiesScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { SearchScreen } from '../screens/SearchScreen';
import { ChatRoomScreen } from '../screens/chat/ChatRoomScreen';
import { ServerScreen } from '../screens/ServerScreen';
import { CreateServerScreen } from '../screens/CreateServerScreen';
import { MessagesScreen } from '../screens/MessagesScreen';
import { CommunityDetailScreen } from '../screens/community/CommunityDetailScreen';
import { CreatePostScreen } from '../screens/community/CreatePostScreen';
import { EditProfileScreen } from '../screens/settings/EditProfileScreen';
import { NotificationScreen } from '../screens/settings/NotificationScreen';
import { VoiceChannelScreen } from '../screens/voice/VoiceChannelScreen';
import { VideoCallScreen } from '../screens/voice/VideoCallScreen';
import { ActivityFeedScreen } from '../screens/ActivityFeedScreen';
import { DiscoverScreen } from '../screens/DiscoverScreen';
import { HelpScreen } from '../screens/HelpScreen';
import { PostDetailScreen } from '../screens/PostDetailScreen';
import { NotFoundScreen } from '../screens/error/NotFoundScreen';

export type MainTabParamList = {
  Home: undefined;
  Chat: undefined;
  Communities: undefined;
  Profile: undefined;
};

export type MainStackParamList = {
  MainTabs: undefined;
  Search: undefined;
  ChatRoom: { roomId: string; roomName: string };
  Server: { serverId: string; serverName: string };
  CreateServer: undefined;
  Settings: undefined;
  Messages: undefined;
  CommunityDetail: { communityId: string; communityName: string };
  CreatePost: { communityId: string; communityName: string };
  PostDetail: { postId: string };
  EditProfile: undefined;
  Notifications: undefined;
  VoiceChannel: { channelId: string; channelName: string; serverId?: string };
  VideoCall: {
    channelId: string;
    channelName: string;
    participants: Array<{
      id: string;
      username: string;
      displayName: string;
      avatar?: string;
      isMuted: boolean;
      isDeafened: boolean;
      isSpeaking: boolean;
      audioLevel: number;
    }>;
  };
  ActivityFeed: undefined;
  Discover: undefined;
  Help: undefined;
  NotFound: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();
const Stack = createNativeStackNavigator<MainStackParamList>();

function SearchHeaderButton() {
  const navigation = useNavigation();
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      onPress={() => navigation.navigate('Search' as never)}
      style={{ marginRight: 16, padding: 4 }}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <Feather name="search" size={22} color={colors.text} />
    </TouchableOpacity>
  );
}

function MainTabs() {
  const { theme, colors } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Feather.glyphMap;

          switch (route.name) {
            case 'Home':
              iconName = 'home';
              break;
            case 'Chat':
              iconName = 'message-circle';
              break;
            case 'Communities':
              iconName = 'users';
              break;
            case 'Profile':
              iconName = 'user';
              break;
            default:
              iconName = 'circle';
          }

          return (
            <View style={{ alignItems: 'center', justifyContent: 'center' }}>
              <Feather name={iconName} size={size} color={color} />
            </View>
          );
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
        },
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.text,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        headerRight: () => <SearchHeaderButton />,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Chat" component={MessagesScreen} />
      <Tab.Screen name="Communities" component={CommunitiesScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export function MainNavigator() {
  const { colors } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.text,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="MainTabs" 
        component={MainTabs} 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="ChatRoom" 
        component={ChatRoomScreen}
        options={({ route }) => ({ title: route.params.roomName })}
      />
      <Stack.Screen 
        name="Server" 
        component={ServerScreen}
        options={({ route }) => ({ title: route.params.serverName })}
      />
      <Stack.Screen 
        name="CreateServer" 
        component={CreateServerScreen}
        options={{ title: 'Create Server' }}
      />
      <Stack.Screen 
        name="Search" 
        component={SearchScreen}
        options={{ title: 'Search' }}
      />
      <Stack.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{ title: 'Settings' }}
      />
      <Stack.Screen 
        name="Messages" 
        component={MessagesScreen}
        options={{ title: 'Messages' }}
      />
      <Stack.Screen 
        name="CommunityDetail" 
        component={CommunityDetailScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="CreatePost" 
        component={CreatePostScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="EditProfile" 
        component={EditProfileScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="Notifications" 
        component={NotificationScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="VoiceChannel" 
        component={VoiceChannelScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="VideoCall" 
        component={VideoCallScreen}
        options={{ 
          headerShown: false,
          gestureEnabled: false, // Prevent swipe back during video call
        }}
      />
    </Stack.Navigator>
  );
}