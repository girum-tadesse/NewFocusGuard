import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useRef, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import PagerView from 'react-native-pager-view';

const ONBOARDING_KEY = 'hasCompletedOnboarding';
const TOTAL_PAGES = 4; // Define total number of pages

interface OnboardingPageProps {
  title: string;
  description: string;
  children?: React.ReactNode;
}

const OnboardingPage: React.FC<OnboardingPageProps> = ({ title, description, children }) => (
  <ScrollView contentContainerStyle={styles.pageScrollContainer}>
    <View style={styles.page}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      {children}
    </View>
  </ScrollView>
);

// Define the event type for onPageSelected more simply
interface PagerViewOnPageSelectedEventData {
  nativeEvent: {
    position: number;
  };
}

export default function OnboardingScreen() {
  const router = useRouter();
  const pagerViewRef = useRef<PagerView>(null);
  const [currentPage, setCurrentPage] = useState(0);

  const handleOnboardingComplete = async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
      router.replace('/auth'); 
    } catch (error) {
      console.error('Failed to save onboarding status', error);
      router.replace('/auth');
    }
  };

  const goToNextPage = () => {
    if (currentPage < TOTAL_PAGES - 1) {
      pagerViewRef.current?.setPage(currentPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 0) {
      pagerViewRef.current?.setPage(currentPage - 1);
    }
  };
  
  const onPageSelected = (event: PagerViewOnPageSelectedEventData) => {
    setCurrentPage(event.nativeEvent.position);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      <PagerView 
        ref={pagerViewRef}
        style={styles.pagerView} 
        initialPage={0}
        onPageSelected={onPageSelected} // Use onPageSelected to track current page
      >
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
          />
        </View>
      </PagerView>

      {/* Navigation Buttons Area */}
      <View style={styles.navigationButtonContainer}>
        {currentPage > 0 && (
          <TouchableOpacity style={[styles.navButton, styles.prevButton]} onPress={goToPreviousPage}>
            <Text style={styles.navButtonText}>Previous</Text>
          </TouchableOpacity>
        )}
        {currentPage < TOTAL_PAGES - 1 ? (
          <TouchableOpacity style={[styles.navButton, styles.nextButton]} onPress={goToNextPage}>
            <Text style={styles.navButtonText}>Next</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[styles.navButton, styles.getStartedButton]} onPress={handleOnboardingComplete}>
            <Text style={styles.navButtonText}>Get Started</Text>
          </TouchableOpacity>
        )}
      </View>
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
    flexGrow: 1,
    justifyContent: 'center',
  },
  page: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
    marginHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 25,
    textAlign: 'center',
    color: '#2c3e50',
  },
  description: {
    fontSize: 17,
    textAlign: 'center',
    marginBottom: 30,
    color: '#34495e',
    lineHeight: 26,
  },
  // Button styles are now for the external navigation buttons
  navigationButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: '#f8f9fa' // A light background for the button bar
  },
  navButton: {
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 120, // Ensure buttons have a decent tap area
  },
  navButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  prevButton: {
    backgroundColor: '#6c757d', // A neutral grey for previous
  },
  nextButton: {
    backgroundColor: '#007bff', // Standard blue for next
  },
  getStartedButton: {
    backgroundColor: '#28a745', // Green for Get Started
  },
  // Removed old button and buttonText styles that were part of OnboardingPage component
}); 