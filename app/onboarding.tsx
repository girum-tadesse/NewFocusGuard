import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useRef, useState } from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import PagerView from 'react-native-pager-view';

const ONBOARDING_KEY = 'hasCompletedOnboarding';
const TOTAL_PAGES = 3; // Updated to 3 pages

interface OnboardingPageProps {
  imagePlaceholder?: boolean; // To indicate if an image placeholder should be shown
  title: string;
  description: string;
  children?: React.ReactNode;
}

const OnboardingPage: React.FC<OnboardingPageProps> = ({ imagePlaceholder, title, description, children }) => (
  <View style={styles.page}>
    {imagePlaceholder && (
      <View style={styles.imagePlaceholder}>
        <Text style={styles.imagePlaceholderText}>[Image Placeholder]</Text>
      </View>
    )}
    <Text style={styles.title}>{title}</Text>
    <Text style={styles.description}>{description}</Text>
    {children}
  </View>
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

  const onPageSelected = (event: PagerViewOnPageSelectedEventData) => {
    setCurrentPage(event.nativeEvent.position);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <PagerView 
        ref={pagerViewRef}
        style={styles.pagerView} 
        initialPage={0}
        onPageSelected={onPageSelected}
      >
        <View key="1">
          <OnboardingPage
            imagePlaceholder
            title="Instant App Control"
            description="Lock away distractions with a single tap. Create your ideal focus environment anytime, anywhere."
          />
        </View>
        <View key="2">
          <OnboardingPage
            imagePlaceholder
            title="Plan Your Productive Hours"
            description="Schedule app locks in advance. Align your digital habits with your daily goals and routines seamlessly."
          />
        </View>
        <View key="3">
          <OnboardingPage
            imagePlaceholder
            title="AI-Powered Guidance"
            description="Coming soon: An intelligent assistant to help you optimize focus, understand your patterns, and stay motivated."
          />
        </View>
      </PagerView>

      {/* Page Indicators */}
      <View style={styles.indicatorContainer}>
        {Array.from({ length: TOTAL_PAGES }).map((_, index) => (
          <View
            key={index}
            style={[styles.indicator, currentPage === index ? styles.activeIndicator : {}]}
          />
        ))}
      </View>

      {/* Navigation Button Area - Single Button */}
      <View style={styles.navigationButtonContainer}>
        <TouchableOpacity 
          style={styles.mainButton} 
          onPress={handleOnboardingComplete}
        >
          <Text style={styles.mainButtonText}>
            Get Started
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF', // White background like example
  },
  pagerView: {
    flex: 1,
  },
  page: {
    flex: 1,
    justifyContent: 'center', // Content will be centered, image at top, text below
    alignItems: 'center',
    paddingHorizontal: 40, // More horizontal padding for text content
  },
  imagePlaceholder: {
    width: '100%',
    height: 250, // Adjust as needed
    backgroundColor: '#E0E0E0', // Light grey placeholder
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20, // Rounded corners for placeholder
    marginBottom: 40, // Space between image and title
  },
  imagePlaceholderText: {
    color: '#9E9E9E',
    fontSize: 16,
  },
  title: {
    fontSize: 32, // Updated from 26
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
    color: '#333333', // Darker text color
    fontFamily: 'Helvetica', // Added Helvetica
  },
  description: {
    fontSize: 16, // Slightly larger description
    textAlign: 'center',
    color: '#999999', // Adjusted to a medium-light gray
    lineHeight: 24,
    marginBottom: 30, // Space before indicators/button
    fontFamily: 'Helvetica', // Added Helvetica
  },
  indicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20, // Space around indicators
  },
  indicator: {
    height: 10,
    width: 10,
    borderRadius: 5,
    backgroundColor: '#D1D1D1', // Inactive dot color
    marginHorizontal: 5,
  },
  activeIndicator: {
    backgroundColor: '#FF7900', // Updated Active dot color
    width: 12, // Slightly wider active dot
    height: 12,
    borderRadius: 6,
  },
  navigationButtonContainer: {
    paddingHorizontal: 40,
    paddingVertical: 20, // Padding for the button container
    alignItems: 'center', // Center the button
  },
  mainButton: {
    backgroundColor: '#FF7900', // Updated Orange button color
    paddingVertical: 12, 
    paddingHorizontal: 40, // Increased from 25 for a bit more width
    borderRadius: 30, 
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3, 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  mainButtonText: {
    color: '#FFFFFF', 
    fontSize: 16, // Decreased from 18
    fontFamily: 'Helvetica', 
  },
}); 