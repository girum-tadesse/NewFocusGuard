import { useFonts } from 'expo-font';
import { Slot, SplashScreen, usePathname, useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import 'react-native-reanimated';
import { AuthProvider, useAuth } from '../src/contexts/AuthContext';

const ONBOARDING_KEY = 'hasCompletedOnboarding';

// Prevent the splash screen from auto-hiding before we are ready.
SplashScreen.preventAutoHideAsync();

function InitialLayout() {
  const [fontsLoaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  const router = useRouter();
  const pathname = usePathname();
  // Get auth state AND onboardingCompleted from context
  const { isLoading: authIsLoading, user, onboardingCompleted } = useAuth(); 

  useEffect(() => {
    // No longer need to check AsyncStorage directly here for onboarding
    if (fontsLoaded && !authIsLoading) { // onboardingCompleted is now part of authIsLoading logic implicitly, or handled by AuthProvider
      SplashScreen.hideAsync();
      
      if (onboardingCompleted === false) {
        // Only redirect to onboarding if not already there
        if (pathname !== '/onboarding') {
          router.replace('/onboarding');
        }
      } else if (!user) {
        // Onboarding is done, user not logged in.
        // If on a protected route (e.g., tabs), redirect to auth. 
        // Allow /auth, /signup, /onboarding (though onboarding should be handled by above)
        const allowedPaths = ['/auth', '/signup', '/onboarding'];
        if (!allowedPaths.includes(pathname) && !pathname.startsWith('/(tabs)')) {
             // If we are not on an allowed path and not already trying to go to tabs (which would be a bug if no user)
             // Let's refine this logic. If onboarding is done and no user, we should be on /auth or /signup.
             // If the user is trying to access anything else, redirect to /auth.
        }
        // If current path isn't /auth or /signup, and it's not onboarding (already handled)
        // It's safer to let users stay on /auth or /signup if they are already there.
        // If they are on, e.g. / (tabs) then redirect.
        if (pathname.startsWith('/(tabs)')) { // if trying to access main app without user
            router.replace('/auth');
        }

      } else {
        // Onboarding is done, user is logged in.
        const authRoutes = ['/auth', '/signup'];
        const isOnAuthRoute = authRoutes.includes(pathname);
        const isOnOnboardingRoute = pathname === '/onboarding';

        if (isOnAuthRoute || isOnOnboardingRoute) {
          router.replace('/(tabs)/');
        }
      }
    }
  }, [fontsLoaded, authIsLoading, user, onboardingCompleted, router, pathname]);

  if (!fontsLoaded || authIsLoading) { // onboardingCompleted is now part of the context's loading state consideration
    return null; 
  }

  return <Slot />;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <InitialLayout />
    </AuthProvider>
  );
}
