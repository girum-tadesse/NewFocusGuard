import { Stack } from 'expo-router';
import React from 'react';

export default function ScreensLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen 
        name="index"
        options={{
          // This screen is displayed first
          animation: 'none',
        }}
      />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="auth" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
} 