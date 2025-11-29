import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
import { ForgotPasswordScreen } from '../screens/auth/ForgotPasswordScreen';
import { WelcomeScreen } from '../screens/auth/WelcomeScreen';
import { OnboardingScreen } from '../screens/auth/OnboardingScreen';
import { EnhancedOnboardingScreen } from '../screens/auth/EnhancedOnboardingScreen';
import { ProfileSetupScreen } from '../screens/auth/ProfileSetupScreen';
import { CommunitySelectionScreen } from '../screens/auth/CommunitySelectionScreen';

export type AuthStackParamList = {
  Welcome: undefined;
  Onboarding: undefined;
  EnhancedOnboarding: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  ProfileSetup: undefined;
  CommunitySelection: { interests: string[] };
  Main: undefined;
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Welcome"
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="EnhancedOnboarding" component={EnhancedOnboardingScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
      <Stack.Screen name="CommunitySelection" component={CommunitySelectionScreen} />
    </Stack.Navigator>
  );
}