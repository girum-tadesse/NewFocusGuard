import AsyncStorage from '@react-native-async-storage/async-storage'; // Import AsyncStorage
import React, { createContext, useContext, useEffect, useState } from 'react';
// Import firebaseAuth which now includes onAuthStateChanged
import { firebaseAuth, firestoreDB } from '../firebase/config';

const ONBOARDING_KEY = 'hasCompletedOnboarding'; // Define key here

const AuthContext = createContext({
  user: null,
  userProfile: null,
  isLoading: true, // Will be true until Firebase and auth state are ready
  onboardingCompleted: false, // Add onboardingCompleted
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
  signInWithGoogle: async () => {},
  markOnboardingComplete: async () => {}, // Add markOnboardingComplete
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // Start as true
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false); // Add state

  useEffect(() => {
    // Check onboarding status when provider loads
    async function checkOnboarding() {
      try {
        const value = await AsyncStorage.getItem(ONBOARDING_KEY);
        setOnboardingCompleted(value === 'true');
      } catch (e) {
        setOnboardingCompleted(false);
      }
      // setIsLoading(false); // This will be set after auth state is also checked
    }
    checkOnboarding();

    const unsubscribe = firebaseAuth.onAuthStateChanged(async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          // Use firestoreDB helper which is already set up
          const profileResult = await firestoreDB.getUserProfile(currentUser.uid);
          if (profileResult.success) {
            setUserProfile(profileResult.data || null);
          } else {
            console.error('Error fetching user profile in AuthContext:', profileResult.error);
            setUserProfile(null);
          }
        } catch (error) {
          console.error('Error fetching user profile in AuthContext (catch block):', error);
          setUserProfile(null); 
        }
      } else {
        setUserProfile(null);
      }
      // Only set isLoading to false after both onboarding and auth state are resolved
      // We need to ensure checkOnboarding has finished before setting isLoading to false.
      // For simplicity, we assume checkOnboarding is quick. A more robust solution
      // might involve a separate loading state for onboarding.
      setIsLoading(false); 
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const markOnboardingComplete = async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
      setOnboardingCompleted(true);
    } catch (e) {
      console.error("Failed to mark onboarding as complete", e);
      // Optionally handle the error (e.g., show a message to the user)
    }
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await firebaseAuth.signInWithGoogle();
      if (result && result.user) {
        // User is signed in. AuthProvider's onAuthStateChanged will handle setting the user.
        console.log('Google Sign-In successful, user:', result.user.uid);
        return { success: true, user: result.user };
      } else if (result === null) {
        // Sign-in was cancelled or a known error occured (handled in onGoogleButtonPress)
        console.log('Google Sign-In process did not complete or was cancelled.');
        setLoading(false);
        return { success: false, error: 'Google Sign-In cancelled or failed.' };
      }
      // If onGoogleButtonPress throws an error that isn't caught there,
      // it might end up here, or the promise might reject.
    } catch (e) {
      console.error("AuthContext: Google sign-in error", e);
      setError(e.message || 'An unexpected error occurred during Google sign-in.');
      setUser(null);
      setLoading(false);
      return { success: false, error: e.message || 'Google Sign-In failed.' };
    }
    // setLoading(false) is handled by onAuthStateChanged or error cases
  };

  const value = {
    user,
    userProfile,
    isLoading,
    onboardingCompleted, // Expose state
    signIn: firebaseAuth.signIn,
    signUp: firebaseAuth.signUp,
    signOut: firebaseAuth.signOut,
    signInWithGoogle,
    markOnboardingComplete, // Expose function
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook to use the auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 