import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

// IMPORTANT:
// 1. Ensure you have @react-native-firebase/app, @react-native-firebase/auth, 
//    and @react-native-firebase/firestore installed.
// 2. Ensure you have added google-services.json (Android) and GoogleService-Info.plist (iOS)
//    to your native project folders after running `npx expo prebuild` or during dev build setup.
// 3. Ensure "@react-native-firebase/app" and "@react-native-firebase/auth" 
//    are in your app.json plugins.

// Firebase is initialized natively by @react-native-firebase/app based on your config files.
// There isn't an explicit initializeApp promise needed here in the same way as the Web SDK.
// We can, however, check if the default app is available if needed for some logic, but
// typically, auth() and firestore() will work if the native setup is correct.

console.log('Firebase native SDKs initialized/imported.');

// Auth helper functions using @react-native-firebase/auth
export const firebaseAuth = {
  signUp: async (email, password) => {
    try {
      const userCredential = await auth().createUserWithEmailAndPassword(email, password);
      // Create user profile in Firestore
      await firestore().collection('users').doc(userCredential.user.uid).set({
        email,
        createdAt: firestore.FieldValue.serverTimestamp(),
        emergencyUnlockChances: 3,
        lastUnlockReset: firestore.FieldValue.serverTimestamp(),
      });
      return { success: true, user: userCredential.user };
    } catch (error) {
      console.error('Sign up error (RNFirebase):', error);
      return { success: false, error: error.message || error.code };
    }
  },

  signIn: async (email, password) => {
    try {
      const userCredential = await auth().signInWithEmailAndPassword(email, password);
      return { success: true, user: userCredential.user };
    } catch (error) {
      console.error('Sign in error (RNFirebase):', error);
      return { success: false, error: error.message || error.code };
    }
  },

  signOut: async () => {
    try {
      await auth().signOut();
      return { success: true };
    } catch (error) {
      console.error('Sign out error (RNFirebase):', error);
      return { success: false, error: error.message || error.code };
    }
  },

  getCurrentUser: () => {
    return auth().currentUser;
  },

  onAuthStateChanged: (listener) => {
    return auth().onAuthStateChanged(listener);
  },
};

// Firestore helper functions using @react-native-firebase/firestore
export const firestoreDB = {
  getUserProfile: async (userId) => {
    try {
      const docSnap = await firestore().collection('users').doc(userId).get();
      if (docSnap.exists) {
        return { success: true, data: docSnap.data() };
      } else {
        return { success: false, error: 'User profile not found.', data: null };
      }
    } catch (error) {
      console.error('Get user profile error (RNFirebase):', error);
      return { success: false, error: error.message || error.code };
    }
  },

  updateUserProfile: async (userId, data) => {
    try {
      await firestore().collection('users').doc(userId).update(data);
      return { success: true };
    } catch (error) {
      console.error('Update user profile error (RNFirebase):', error);
      return { success: false, error: error.message || error.code };
    }
  },
};

// You no longer need firebaseInitPromise with @react-native-firebase in this way.
// Initialization is handled natively when the app starts. 