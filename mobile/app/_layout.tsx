import { useFonts } from 'expo-font';
import { DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { StatusBar } from 'react-native';
import 'react-native-reanimated';

import '../global.css';
import { AuthProvider } from '../context/AuthContext';
import { ToastProvider } from '../components/Toast';

export {
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  anchor: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  return (
    <>
      <StatusBar barStyle='dark-content' backgroundColor='#F8F9FA' />
      <ThemeProvider value={DefaultTheme}>
        <AuthProvider>
          <ToastProvider>
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: '#F8F9FA' },
              }}
            >
              <Stack.Screen name='(tabs)' options={{ headerShown: false }} />
              <Stack.Screen name='modal' options={{ presentation: 'modal' }} />
            </Stack>
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </>
  );
}
