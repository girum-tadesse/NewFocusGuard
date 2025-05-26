import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFonts } from 'expo-font';
import { Slot, SplashScreen, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import 'react-native-reanimated';
import { AuthProvider, useAuth } from '../src/contexts/AuthContext';

const ONBOARDING_KEY = 'hasCompletedOnboarding';

// Prevent the splash screen from auto-hiding before we are ready.
SplashScreen.preventAutoHideAsync();

function InitialLayout() {
  const [fontsLoaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean | null>(null);
  const router = useRouter();
  const {isLoading: authIsLoading, user } = useAuth(); // Get auth state from context

  useEffect(() => {
    async function checkOnboardingStatus() {
      try {
        const value = await AsyncStorage.getItem(ONBOARDING_KEY);
        setOnboardingCompleted(value === 'true');
      } catch (e) {
        // error reading value
        setOnboardingCompleted(false); // Assume onboarding not done if error
      }
    }
    checkOnboardingStatus();
  }, []);

  useEffect(() => {
    if (fontsLoaded && onboardingCompleted !== null && !authIsLoading) {
      SplashScreen.hideAsync(); // Hide splash screen now that we are ready
      
      if (onboardingCompleted === false) {
        router.replace('/onboarding');
      } else if (!user) {
        // Onboarding is done, but user is not logged in, go to auth
        // AuthProvider and Slot will handle showing /auth or /login from here if not authenticated
        // Or, if your auth routes are outside the main Slot, you could do router.replace('/auth');
        // For now, assuming Slot handles it based on AuthProvider state.
        // If /auth is your login screen, and it's a top-level route, this is fine.
      } else {
        // Onboarding is done, user is logged in, go to main app (e.g., tabs)
        // This will be handled by Slot if your (tabs) layout is the default for authenticated users
      }
    }
  }, [fontsLoaded, onboardingCompleted, authIsLoading, user, router]);

  if (!fontsLoaded || onboardingCompleted === null || authIsLoading) {
    // Show nothing or a minimal loading component until checks are done 
    // and SplashScreen.hideAsync() is called.
    return null; 
  }

  // If onboardingCompleted is true, AuthProvider and Slot will handle auth checks and navigation
  // If onboardingCompleted was false, we would have already redirected to /onboarding
  return <Slot />;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <InitialLayout />
    </AuthProvider>
  );
}
