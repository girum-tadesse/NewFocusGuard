import { useFonts } from 'expo-font';
import { Slot } from 'expo-router';
import React from 'react';
import { Text, View } from 'react-native';
import 'react-native-reanimated';
import { AuthProvider } from '../src/contexts/AuthContext';

// TODO: Potentially manage a state here (e.g., with AsyncStorage or context)
// to decide whether to show onboarding, auth, or main app.
// For now, we'll always start with onboarding.

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  if (!fontsLoaded) {
    // Can show a more specific loading indicator or splash screen here
    return <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}><Text>Loading fonts...</Text></View>;
  }

  // The AuthProvider will handle its own loading state regarding auth status
  return (
    <AuthProvider>
      <Slot />
    </AuthProvider>
  );
}
