import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { WalletConnectModal } from '@walletconnect/modal-react-native';
import * as SplashScreen from 'expo-splash-screen';
import { useAuthStore } from './src/stores/authStore';
import { useSocketStore } from './src/stores/socketStore';
import { RootNavigator } from './src/navigation/RootNavigator';
import { ThemeProvider } from './src/contexts/ThemeContext';
import { NotificationProvider } from './src/contexts/NotificationContext';

// Keep splash screen visible while loading resources
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

const projectId = process.env.EXPO_PUBLIC_WALLETCONNECT_PROJECT_ID || '';
const providerMetadata = {
  name: 'CRYB',
  description: 'Next-generation hybrid community platform',
  url: 'https://cryb.app',
  icons: ['https://cryb.app/icon.png'],
  redirect: {
    native: 'cryb://',
    universal: 'https://cryb.app',
  },
};

export default function App() {
  const [appIsReady, setAppIsReady] = React.useState(false);
  const initializeAuth = useAuthStore((state) => state.initialize);
  const connectSocket = useSocketStore((state) => state.connect);

  React.useEffect(() => {
    async function prepare() {
      try {
        // Initialize auth
        await initializeAuth();
        
        // Connect to WebSocket
        await connectSocket();
        
        // Load fonts, assets, etc.
        // await Font.loadAsync({...});
        
        // Artificially delay for splash screen
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
        await SplashScreen.hideAsync();
      }
    }

    prepare();
  }, []);

  if (!appIsReady) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <WalletConnectModal
            projectId={projectId}
            providerMetadata={providerMetadata}
          >
            <ThemeProvider>
              <NotificationProvider>
                <NavigationContainer>
                  <RootNavigator />
                  <StatusBar style="auto" />
                </NavigationContainer>
              </NotificationProvider>
            </ThemeProvider>
          </WalletConnectModal>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}