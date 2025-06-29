import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { 
  Inter_400Regular, 
  Inter_500Medium, 
  Inter_600SemiBold, 
  Inter_700Bold 
} from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { setupNotificationListeners, registerForPushNotifications } from '@/lib/notifications';
import { checkOnboardingStatus, getCachedOnboardingStatus } from '@/lib/userProfile';
import { router } from 'expo-router';

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useFrameworkReady();
  const [isReady, setIsReady] = useState(false);

  const [fontsLoaded, fontError] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
  });

  useEffect(() => {
    async function prepare() {
      try {
        // Check if onboarding is completed
        let onboardingCompleted = await getCachedOnboardingStatus();
        
        // If no cached status, check from database
        if (onboardingCompleted === null) {
          onboardingCompleted = await checkOnboardingStatus();
        }

        // Navigate based on onboarding status
        if (!onboardingCompleted) {
          router.replace('/onboarding');
        } else {
          router.replace('/(tabs)');
        }

        // Setup notification listeners
        const cleanup = setupNotificationListeners();

        // Register for push notifications automatically
        registerForPushNotifications().then((deviceId) => {
          if (deviceId) {
            console.log('Device registered for notifications:', deviceId);
          }
        }).catch((error) => {
          console.error('Failed to register for notifications:', error);
        });

        setIsReady(true);

        return cleanup;
      } catch (error) {
        console.error('Error during app initialization:', error);
        // Fallback to tabs if there's an error
        router.replace('/(tabs)');
        setIsReady(true);
      }
    }

    if (fontsLoaded || fontError) {
      prepare().then(() => {
        SplashScreen.hideAsync();
      });
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  if (!isReady) {
    return null;
  }

  return (
    <ThemeProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="light" />
    </ThemeProvider>
  );
}