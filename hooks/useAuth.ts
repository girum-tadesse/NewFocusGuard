import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { useEffect, useState } from 'react';
import { Alert } from 'react-native';

export function useAuth() {
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Configure Google Sign In
    GoogleSignin.configure({
      webClientId: '987981614180-egfl2ugqr1btkqi4fprgtf4jsfiavu7l.apps.googleusercontent.com',
      offlineAccess: true,
    });

    // Set up auth state listener
    const unsubscribe = auth().onAuthStateChanged(async (user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signInWithGoogle = async () => {
    try {
      // Make sure Play Services are available
      await GoogleSignin.hasPlayServices();
      
      // Clean up any existing sessions
      try {
        await GoogleSignin.signOut();
        await auth().signOut();
      } catch (e) {
        // Ignore cleanup errors
      }

      // Get Google Sign In result
      const signInInfo = await GoogleSignin.signIn();
      if (signInInfo.type !== 'success') {
        // User cancelled or did not complete sign-in
        return null;
      }
      const idToken = signInInfo.data.idToken;
      if (!idToken) {
        console.error('Google Sign In successful, but idToken is missing or null.');
        Alert.alert(
          'Sign In Error',
          'Unable to retrieve necessary authentication details. Please try again.'
        );
        // Attempt to clean up Google Sign In state as a precaution
        try {
          await GoogleSignin.revokeAccess();
          await GoogleSignin.signOut();
        } catch (cleanupError) {
          console.error('Error during sign-in cleanup after missing idToken:', cleanupError);
        }
        return null; // Propagate the failure
      }

      // Create auth provider
      const googleCredential = auth.GoogleAuthProvider.credential(idToken);

      // Sign in with Firebase
      const result = await auth().signInWithCredential(googleCredential);
      return result.user;
    } catch (error: any) {
      console.error('Sign in error:', {
        name: error.name,
        message: error.message,
        code: error.code
      });
      
      // Show a user-friendly error message
      Alert.alert(
        'Sign In Error',
        'Unable to sign in at this time. Please try again in a few moments.',
        [{ text: 'OK' }]
      );
      
      // Clean up on error
      try {
        await GoogleSignin.revokeAccess();
        await GoogleSignin.signOut();
        await auth().signOut();
      } catch (e) {
        // Ignore cleanup errors
      }
      
      return null;
    }
  };

  const signOut = async () => {
    try {
      await GoogleSignin.revokeAccess();
      await GoogleSignin.signOut();
      await auth().signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return {
    user,
    loading,
    signInWithGoogle,
    signOut,
  };
} 