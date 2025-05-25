import React, { createContext, useContext, useEffect, useState } from 'react';
// Import firebaseAuth which now includes onAuthStateChanged
import { firebaseAuth, firestoreDB } from '../firebase/config';

const AuthContext = createContext({
  user: null,
  userProfile: null,
  isLoading: true, // Will be true until Firebase and auth state are ready
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // Start as true

  useEffect(() => {
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
      setIsLoading(false); 
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const value = {
    user,
    userProfile,
    isLoading,
    signIn: firebaseAuth.signIn,
    signUp: firebaseAuth.signUp,
    signOut: firebaseAuth.signOut,
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