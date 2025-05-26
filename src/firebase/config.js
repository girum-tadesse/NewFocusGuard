import { getApp, getApps } from '@react-native-firebase/app';
import {
    createUserWithEmailAndPassword, // renamed to avoid conflict if signOut is used locally
    onAuthStateChanged as firebaseOnAuthStateChanged // renamed 
    ,




    signOut as firebaseSignOut,
    getAuth,
    signInWithEmailAndPassword
} from '@react-native-firebase/auth';
import {
    doc,
    getDoc,
    getFirestore,
    serverTimestamp as rnfbServerTimestamp // renamed
    ,




    setDoc,
    updateDoc
} from '@react-native-firebase/firestore';

// IMPORTANT:
// 1. Ensure you have @react-native-firebase/app, @react-native-firebase/auth, 
//    and @react-native-firebase/firestore installed.
// 2. Ensure you have added google-services.json (Android) and GoogleService-Info.plist (iOS)
//    to your native project folders (usually after `npx expo prebuild` or during dev build setup).
// 3. Ensure "@react-native-firebase/app" and "@react-native-firebase/auth" 
//    are in your app.json plugins.

// Initialize Firebase App (conditionally, as @r-n-f/app usually initializes by default)
// This is more for explicitly getting the app instance if needed, or for multi-app scenarios.
if (getApps().length === 0) {
  // In a bare React Native project with @react-native-firebase, 
  // initializeApp() is usually not called from JS if google-services.json/plist is setup.
  // However, if you needed to initialize a secondary app or ensure default is ready, 
  // you might do it. For default app, native setup should suffice.
  // initializeApp(); // This usually isn't needed for the default app.
}

// Get the default app's auth and firestore instances
const authInstance = getAuth(getApp()); // getApp() gets the default app
const firestoreInstance = getFirestore(getApp());

console.log('Firebase native SDKs (modular) initialized/imported.');

// Auth helper functions using modular @react-native-firebase/auth
export const firebaseAuth = {
  signUp: async (email, password) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(authInstance, email, password);
      await setDoc(doc(firestoreInstance, 'users', userCredential.user.uid), {
        email,
        createdAt: rnfbServerTimestamp(),
        emergencyUnlockChances: 3,
        lastUnlockReset: rnfbServerTimestamp(),
      });
      return { success: true, user: userCredential.user };
    } catch (error) {
      console.error('Sign up error (RNFirebase Modular):', error);
      return { success: false, error: error.message || error.code };
    }
  },

  signIn: async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(authInstance, email, password);
      return { success: true, user: userCredential.user };
    } catch (error) {
      console.error('Sign in error (RNFirebase Modular):', error);
      return { success: false, error: error.message || error.code };
    }
  },

  signOut: async () => {
    try {
      await firebaseSignOut(authInstance);
      return { success: true };
    } catch (error) {
      console.error('Sign out error (RNFirebase Modular):', error);
      return { success: false, error: error.message || error.code };
    }
  },

  getCurrentUser: () => {
    return authInstance.currentUser;
  },

  onAuthStateChanged: (listener) => {
    return firebaseOnAuthStateChanged(authInstance, listener);
  },
};

// Firestore helper functions using modular @react-native-firebase/firestore
export const firestoreDB = {
  getUserProfile: async (userId) => {
    try {
      const userDocRef = doc(firestoreInstance, 'users', userId);
      const docSnap = await getDoc(userDocRef);
      if (docSnap.exists()) {
        return { success: true, data: docSnap.data() };
      } else {
        return { success: false, error: 'User profile not found.', data: null };
      }
    } catch (error) {
      console.error('Get user profile error (RNFirebase Modular):', error);
      return { success: false, error: error.message || error.code };
    }
  },

  updateUserProfile: async (userId, data) => {
    try {
      const userDocRef = doc(firestoreInstance, 'users', userId);
      await updateDoc(userDocRef, data);
      return { success: true };
    } catch (error) {
      console.error('Update user profile error (RNFirebase Modular):', error);
      return { success: false, error: error.message || error.code };
    }
  },
};

// You no longer need firebaseInitPromise with @react-native-firebase in this way.
// Initialization is handled natively when the app starts. 