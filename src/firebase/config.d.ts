// app/firebase/config.d.ts

// Import types from the 'firebase' package (modular Web SDK)
import { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import { FirebaseApp } from 'firebase/app';
import { Auth } from 'firebase/auth'; // User can be used for getCurrentUser and signUp/signIn results
import { Firestore } from 'firebase/firestore';

// Type for the resolved value of firebaseInitPromise
interface FirebaseInstances {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
}

// Types for the helper functions/objects
interface AuthResult {
  success: boolean;
  user?: FirebaseAuthTypes.User;
  error?: string;
}

export interface FirebaseAuthHelpers {
  signUp: (email: string, password: string) => Promise<AuthResult>;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signOut: () => Promise<{ success: boolean; error?: string }>;
  getCurrentUser: () => FirebaseAuthTypes.User | null;
  onAuthStateChanged: (listener: (user: FirebaseAuthTypes.User | null) => void) => () => void; // Listener and unsubscribe function
}
export const firebaseAuth: FirebaseAuthHelpers;

interface FirestoreResult {
    success: boolean;
    data?: FirebaseFirestoreTypes.DocumentData;
    error?: string;
}

export interface FirestoreDBHelpers {
  getUserProfile: (userId: string) => Promise<FirestoreResult>;
  updateUserProfile: (userId: string, data: any) => Promise<{ success: boolean; error?: string }>;
}
export const firestoreDB: FirestoreDBHelpers; 