import { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { ReactNode } from 'react';

export interface AuthContextType {
  user: FirebaseAuthTypes.User | null;
  userProfile: any | null;
  isLoading: boolean;
  onboardingCompleted: boolean | null;
  signIn(email: string, password: string): Promise<{ success: boolean; error?: string }>;
  signUp(email: string, password: string): Promise<{ success: boolean; error?: string }>;
  signOut(): Promise<{ success: boolean; error?: string }>;
  markOnboardingComplete(): Promise<void>;
}

export interface AuthProviderProps {
  children: ReactNode;
}

declare const AuthProvider: React.FC<AuthProviderProps>;
declare function useAuth(): AuthContextType;

export { AuthProvider, useAuth };
