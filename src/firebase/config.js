import { getApp, getApps, initializeApp } from '@react-native-firebase/app';
import {
    createUserWithEmailAndPassword, // renamed to avoid conflict if signOut is used locally
    onAuthStateChanged as firebaseOnAuthStateChanged, // renamed 
    signOut as firebaseSignOut,
    getAuth,
    GoogleAuthProvider,
    signInWithCredential,
    signInWithEmailAndPassword
} from '@react-native-firebase/auth';
import {
    doc,
    getDoc,
    getFirestore,
    serverTimestamp as rnfbServerTimestamp, // renamed
    setDoc,
    updateDoc
} from '@react-native-firebase/firestore';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

// IMPORTANT:
// 1. Ensure you have @react-native-firebase/app, @react-native-firebase/auth, 
//    and @react-native-firebase/firestore installed.
// 2. Ensure you have added google-services.json (Android) and GoogleService-Info.plist (iOS)
//    to your native project folders (usually after `npx expo prebuild` or during dev build setup).
// 3. Ensure "@react-native-firebase/app" and "@react-native-firebase/auth" 
//    are in your app.json plugins.

// Initialize Firebase App (conditionally)
let app;
if (getApps().length === 0) {
  // If you have a firebase.json or specific config, pass it here.
  // Otherwise, @R<x_bin_273>NFirebase will use google-services.json/GoogleService-Info.plist
  app = initializeApp(); // Initialize the default app
} else {
  app = getApp(); // Get the default app if already initialized
}

// Get the default app's auth and firestore instances
const authInstance = getAuth(app);
const firestoreInstance = getFirestore(app);

console.log('Firebase native SDKs (modular) initialized/imported.');

// Configure Google Sign-In
// IMPORTANT: Replace 'PASTE_YOUR_WEB_CLIENT_ID_HERE' with your actual Web Client ID from Google Cloud Console
GoogleSignin.configure({
  webClientId: '98798161418-egfl2ugqr1btkqi4fprgtf4jsfiavu7l.apps.googleusercontent.com', 
});

// Google Sign-In handler
async function onGoogleButtonPress() {
  try {
    console.log('Attempting GoogleSignin.hasPlayServices...');
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    console.log('hasPlayServices successful. Attempting GoogleSignin.signIn()...');
    
    // signInResult has the structure { type: 'success', data: { idToken, user, ... } }
    const signInResult = await GoogleSignin.signIn(); 
    console.log('GoogleSignin.signIn() raw result:', JSON.stringify(signInResult, null, 2));

    if (signInResult && signInResult.data && signInResult.data.idToken) {
      const idToken = signInResult.data.idToken;
      const returnedUser = signInResult.data.user; // User info from Google
      console.log('idToken obtained:', idToken);
      console.log('User info from Google:', JSON.stringify(returnedUser, null, 2));

      const googleCredential = GoogleAuthProvider.credential(idToken);
      const userCredential = await signInWithCredential(authInstance, googleCredential);
      console.log('Firebase signInWithCredential successful. Firebase User UID:', userCredential.user.uid);

      if (userCredential.additionalUserInfo?.isNewUser) {
        console.log('New user in Firebase, creating Firestore profile.');
        try {
          await setDoc(doc(firestoreInstance, 'users', userCredential.user.uid), {
            email: returnedUser.email || userCredential.user.email, // Prefer email from Google direct result
            displayName: returnedUser.name || userCredential.user.displayName, // Prefer name
            photoURL: returnedUser.photo || userCredential.user.photoURL, // Prefer photo
            createdAt: rnfbServerTimestamp(),
            emergencyUnlockChances: 3, 
            lastUnlockReset: rnfbServerTimestamp(), 
          });
          console.log('New Google user Firestore profile created.');
        } catch (dbError) {
          console.error('Error creating Firestore profile for new Google user:', dbError);
        }
      } else {
        console.log('Existing user in Firebase.');
      }
      return userCredential; 
    } else {
      console.error('GoogleSignin.signIn() did not return the expected structure or idToken.', signInResult);
      throw new Error('Google Sign-In failed to provide an idToken.');
    }

  } catch (error) {
    console.log('CAUGHT ERROR in onGoogleButtonPress:');
    console.log('Error Name:', error && error.name ? error.name : 'No name property');
    console.log('Error Message:', error && error.message ? error.message : 'No message property');
    console.log('Error Code:', error && error.code ? error.code : 'No code property'); // Important for library-specific errors
    console.log('Error Object Stringified for non-library errors or general inspection:', JSON.stringify(error, null, 2));
    
    if (error && error.code) {
        // You can add a switch here again if needed for specific GoogleSignIn error codes
        // e.g. if (error.code === statusCodes.SIGN_IN_CANCELLED) { ... }
    }
    return null; 
  }
}

// Auth helper functions using modular @react-native-firebase/auth
export const firebaseAuth = {
  signUp: async (email, password) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(authInstance, email, password);
      // For email/password, displayName and photoURL are not set by default
      await setDoc(doc(firestoreInstance, 'users', userCredential.user.uid), {
        email,
        displayName: '', // Or a default, or prompt user later
        photoURL: '',    // Or a default, or prompt user later
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
      const currentUser = authInstance.currentUser; // Get Firebase user before signing out
      await firebaseSignOut(authInstance);

      // Attempt to sign out from Google if a Google user was previously signed in
      const googleCurrentUser = await GoogleSignin.getCurrentUser();
      if (googleCurrentUser) {
        try {
          await GoogleSignin.revokeAccess();
          await GoogleSignin.signOut();
          console.log('User signed out from Google.');
        } catch (googleSignOutError) {
          console.error('Google Sign out error:', googleSignOutError);
          // Decide if this error should prevent the overall signOut from being successful
          // For now, we'll let it be, as Firebase signOut was successful.
        }
      }
      return { success: true };
    } catch (error) {
      console.error('Sign out error (RNFirebase Modular):', error);
      // Check if it's the specific no-current-user error, which might be okay if Google sign out failed first
      if (error.code === 'auth/no-current-user' && !(await GoogleSignin.getCurrentUser())) {
         // If Firebase says no user and Google also has no user, consider it a success.
         return { success: true };
      }
      return { success: false, error: error.message || error.code };
    }
  },

  getCurrentUser: () => {
    return authInstance.currentUser;
  },

  onAuthStateChanged: (listener) => {
    return firebaseOnAuthStateChanged(authInstance, listener);
  },

  signInWithGoogle: onGoogleButtonPress, // Add the Google sign-in method here
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

// Exporting individual auth methods and instances if needed directly
export {
    authInstance, createUserWithEmailAndPassword, firestoreInstance, GoogleAuthProvider, firebaseOnAuthStateChanged as onAuthStateChanged, signInWithCredential, signInWithEmailAndPassword, // Keep consistent export name
    firebaseSignOut as signOut
};

