import { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { FirebaseFirestoreTypes } from '@react-native-firebase/firestore'; // Added for Firestore types

// Re-export types from @react-native-firebase/auth that are used in config.js exports
export type {
  User as FirebaseUser, // Alias User as FirebaseUser for clarity
  UserCredential as FirebaseUserCredential // Alias UserCredential
} from '@react-native-firebase/auth';

// Define the structure of the user credential that signInWithGoogle resolves with
// This is based on the UserCredential from @react-native-firebase/auth
type GoogleSignInResult = FirebaseAuthTypes.UserCredential | null;

// Define the return type for signUp and signIn methods
interface AuthResult {
  success: boolean;
  user?: FirebaseAuthTypes.User; // Use direct type
  error?: string;
}

// Define the return type for signOut
interface SignOutResult {
  success: boolean;
  error?: string;
}

// Define the type for the listener in onAuthStateChanged
type AuthStateListener = (user: FirebaseAuthTypes.User | null) => void;

// Declare the type for the firebaseAuth object
export declare const firebaseAuth: {
  signUp: (email: string, password: string) => Promise<AuthResult>;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signOut: () => Promise<SignOutResult>;
  getCurrentUser: () => FirebaseAuthTypes.User | null;
  onAuthStateChanged: (listener: AuthStateListener) => () => void; // Returns an unsubscribe function
  signInWithGoogle: () => Promise<GoogleSignInResult>;
};

// Types for firestoreDB
interface FirestoreDocumentData {
  [field: string]: any;
}

interface FirestoreQueryResult {
  success: boolean;
  data?: FirebaseFirestoreTypes.DocumentData | null; // Use DocumentData
  error?: string;
}

interface FirestoreUpdateResult {
  success: boolean;
  error?: string;
}

export declare const firestoreDB: {
  getUserProfile: (userId: string) => Promise<FirestoreQueryResult>;
  updateUserProfile: (userId: string, data: FirestoreDocumentData) => Promise<FirestoreUpdateResult>;
};

// Declare types for other exported instances/functions from config.js
// These should match the actual exports from config.js
export declare const authInstance: FirebaseAuthTypes.Module;
export declare const firestoreInstance: FirebaseFirestoreTypes.Module;

// Re-exporting other named exports to match config.js
// Ensure these names and their sources are correct as per config.js
export {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  firebaseOnAuthStateChanged as onAuthStateChanged, // from config.js
  signInWithCredential,
  signInWithEmailAndPassword,
  firebaseSignOut as signOut // from config.js
} from '@react-native-firebase/auth';

