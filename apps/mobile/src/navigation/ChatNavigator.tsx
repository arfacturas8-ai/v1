import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ChatListScreen } from '../screens/chat/ChatListScreen';
import { DirectMessagesScreen } from '../screens/chat/DirectMessagesScreen';
import { ServerListScreen } from '../screens/chat/ServerListScreen';
import { useTheme } from '../contexts/ThemeContext';

export type ChatStackParamList = {
  ChatList: undefined;
  DirectMessages: undefined;
  ServerList: undefined;
};

const Stack = createNativeStackNavigator<ChatStackParamList>();

export function ChatNavigator() {
  const { colors } = useTheme();

  return (
    <Stack.Navigator
      initialRouteName="ChatList"
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
        name="ChatList" 
        component={ChatListScreen}
        options={{ title: 'Messages' }}
      />
      <Stack.Screen 
        name="DirectMessages" 
        component={DirectMessagesScreen}
        options={{ title: 'Direct Messages' }}
      />
      <Stack.Screen 
        name="ServerList" 
        component={ServerListScreen}
        options={{ title: 'Servers' }}
      />
    </Stack.Navigator>
  );
}