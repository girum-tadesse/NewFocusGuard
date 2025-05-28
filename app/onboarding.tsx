import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import PagerView from 'react-native-pager-view';
import { useAuth } from '../src/contexts/AuthContext';

const TOTAL_PAGES = 3;
const { width } = Dimensions.get('window');

interface OnboardingPageProps {
  title: string;
  description: string;
  children?: React.ReactNode;
}

const OnboardingPage: React.FC<OnboardingPageProps> = ({ title, description, children }) => (
  <Animated.View style={styles.page}>
    <View style={styles.contentContainer}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description} numberOfLines={2}>{description}</Text>
      {children}
    </View>
  </Animated.View>
);

interface PagerViewOnPageSelectedEventData {
  nativeEvent: {
    position: number;
  };
}

export default function OnboardingScreen() {
  const router = useRouter();
  const { markOnboardingComplete } = useAuth();
  const pagerViewRef = useRef<PagerView>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const handleOnboardingComplete = async () => {
    console.log('[Onboarding] Get Started button pressed');
    try {
      console.log('[Onboarding] Calling markOnboardingComplete from AuthContext...');
      await markOnboardingComplete();
      console.log('[Onboarding] markOnboardingComplete finished.');
      console.log('[Onboarding] Navigating to /auth...');
      router.replace('/auth');
    } catch (error) {
      console.error('[Onboarding] Error during onboarding completion process:', error);
      console.log('[Onboarding] Navigating to /auth (from catch block after error)...');
      router.replace('/auth');
    }
  };

  const onPageSelected = (event: PagerViewOnPageSelectedEventData) => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0.5,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
    
    setCurrentPage(event.nativeEvent.position);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.mainContainer}>
        <PagerView 
          ref={pagerViewRef}
          style={styles.pagerView} 
          initialPage={0}
          onPageSelected={onPageSelected}
        >
          <View key="1">
            <OnboardingPage
              title="Instant App Control"
              description="Block distracting apps with a single tap to maintain your focus"
            />
          </View>
          <View key="2">
            <OnboardingPage
              title="Plan Your Productive Hours"
              description="Set up scheduled app locks to build lasting digital habits"
            />
          </View>
          <View key="3">
            <OnboardingPage
              title="AI-Powered Guidance"
              description="Receive smart insights to boost your daily productivity"
            />
          </View>
        </PagerView>

        <View style={styles.bottomContainer}>
          <View style={styles.indicatorContainer}>
            {Array.from({ length: TOTAL_PAGES }).map((_, index) => (
              <View
                key={index}
                style={[
                  styles.indicator,
                  currentPage === index ? styles.activeIndicator : {},
                ]}
              />
            ))}
          </View>

          <TouchableOpacity 
            style={styles.mainButton} 
            onPress={handleOnboardingComplete}
            activeOpacity={0.8}
          >
            <Text style={styles.mainButtonText}>
              Get Started
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF9F5',
  },
  mainContainer: {
    flex: 1,
    backgroundColor: '#FFF9F5',
  },
  pagerView: {
    flex: 1,
  },
  page: {
    flex: 1,
    backgroundColor: '#FFF9F5',
    paddingHorizontal: 32,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: 100,
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
    color: '#2D2D2D',
    letterSpacing: -0.5,
    fontFamily: 'System',
    paddingHorizontal: 10,
    lineHeight: 36,
  },
  description: {
    fontSize: 14,
    textAlign: 'center',
    color: '#B6B6B6',
    lineHeight: 20,
    marginBottom: 32,
    paddingHorizontal: 40,
    fontFamily: 'System',
    fontWeight: '300',
    textShadowColor: 'transparent',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 0,
  },
  bottomContainer: {
    paddingHorizontal: 32,
    paddingBottom: 32,
  },
  indicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  indicator: {
    height: 8,
    width: 8,
    borderRadius: 4,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 4,
  },
  activeIndicator: {
    backgroundColor: '#1A1A1A',
    width: 24,
  },
  mainButton: {
    backgroundColor: '#FF7757',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF7757',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    alignSelf: 'center',
  },
  mainButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: 0.2,
    fontFamily: 'System',
  },
}); 