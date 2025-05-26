import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import PagerView from 'react-native-pager-view';

const ONBOARDING_KEY = 'hasCompletedOnboarding';

interface OnboardingPageProps {
  title: string;
  description: string;
  children?: React.ReactNode;
  isLastPage?: boolean;
  onComplete?: () => void;
}

const OnboardingPage: React.FC<OnboardingPageProps> = ({ title, description, children, isLastPage, onComplete }) => (
  <ScrollView contentContainerStyle={styles.pageScrollContainer}>
    <View style={styles.page}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      {children}
      {isLastPage && onComplete && (
        <TouchableOpacity style={styles.button} onPress={onComplete}>
          <Text style={styles.buttonText}>Get Started</Text>
        </TouchableOpacity>
      )}
    </View>
  </ScrollView>
);

export default function OnboardingScreen() {
  const router = useRouter();

  const handleOnboardingComplete = async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
      // Navigate to the auth screen. Assuming your auth route is /auth
      // If you have separate login/signup, you might go to a general auth hub or /login directly.
      router.replace('/auth'); 
    } catch (error) {
      console.error('Failed to save onboarding status', error);
      // Optionally, still navigate or show an error
      router.replace('/auth');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      <PagerView style={styles.pagerView} initialPage={0}>
        <View key="1">
          <OnboardingPage
            title="What is FocusGuard?"
            description="FocusGuard helps you reclaim your time and attention by managing access to distracting apps. Boost your productivity and well-being!"
          />
        </View>
        <View key="2">
          <OnboardingPage
            title="The Impact of Phone Addiction"
            description="Constant notifications and endless scrolling can fragment your focus, reduce deep work, and impact your mental health. It's time for a change."
          />
        </View>
        <View key="3">
          <OnboardingPage
            title="How FocusGuard Solves It"
            description="By allowing you to schedule 'focus sessions' or instantly lock apps, FocusGuard creates intentional barriers, helping you build healthier digital habits."
          />
        </View>
        <View key="4">
          <OnboardingPage
            title="How FocusGuard Works"
            description="Select apps, choose a lock duration or schedule, and let FocusGuard handle the rest. Emergency unlocks are available but limited, encouraging commitment."
            isLastPage={true}
            onComplete={handleOnboardingComplete}
          />
        </View>
      </PagerView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f4f7', 
  },
  pagerView: {
    flex: 1,
  },
  pageScrollContainer: {
    flexGrow: 1, // Ensures content can scroll if it overflows, and centers content
    justifyContent: 'center', // Centers content vertically in the scroll view
  },
  page: {
    flex: 1, // Takes up available space within the View key wrapper of PagerView
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30, // Increased padding
    marginHorizontal: 20, // Horizontal margin for the card effect
    // backgroundColor: '#fff', // Kept for card effect, ensure pagerView has a different bg if needed
    // borderRadius: 15,
    // elevation: 3,
    // shadowColor: '#000',
    // shadowOffset: { width: 0, height: 2 },
    // shadowOpacity: 0.1,
    // shadowRadius: 4,
  },
  title: {
    fontSize: 28, // Slightly larger title
    fontWeight: 'bold',
    marginBottom: 25,
    textAlign: 'center',
    color: '#2c3e50', // Darker, more professional color
  },
  description: {
    fontSize: 17, // Slightly larger description
    textAlign: 'center',
    marginBottom: 30,
    color: '#34495e', // Slightly darker grey
    lineHeight: 26, // Improved line height
  },
  button: {
    backgroundColor: '#3498db', // A modern blue
    paddingVertical: 16,
    paddingHorizontal: 45,
    borderRadius: 30,
    marginTop: 25,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
    elevation: 4,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600', // Semi-bold
  },
}); 