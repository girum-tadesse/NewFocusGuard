import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFonts } from 'expo-font';
import { Slot, SplashScreen, usePathname, useRouter } from 'expo-router';
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
  const pathname = usePathname(); // Get current pathname
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
        // Onboarding is done, but user is not logged in.
        // Ensure we are on an auth-related screen or navigate to the main auth screen if not.
        // Example: if current path isn't /auth, /login, or /signup, redirect to /auth
        // This depends on how your auth routes are structured. For now, we assume user will manually navigate to signin/signup.
      } else {
        // Onboarding is done, user is logged in.
        // Explicitly navigate to the main part of the app if currently on an auth screen or onboarding.
        const authRoutes = ['/auth', '/login', '/signup'];
        const isOnAuthRoute = authRoutes.includes(pathname);
        const isOnOnboardingRoute = pathname === '/onboarding';

        if (isOnAuthRoute || isOnOnboardingRoute) {
          router.replace('/(tabs)/'); // Or your main app route
        }
      }
    }
  }, [fontsLoaded, onboardingCompleted, authIsLoading, user, router, pathname]);

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
