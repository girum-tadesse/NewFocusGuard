import { firebaseAuth } from '@/src/firebase/config'; // Using path alias
import { MaterialCommunityIcons } from '@expo/vector-icons'; // For Google icon
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react'; // Import useState
import {
  ActivityIndicator, // Import ActivityIndicator
  Alert, // Import Alert
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

export default function AuthScreen() {
  const router = useRouter();
  console.log('[AuthScreen] Rendering full auth screen...');
  const [loadingGoogle, setLoadingGoogle] = useState(false);

  const handleGoogleSignIn = async () => {
    if (loadingGoogle) return;
    setLoadingGoogle(true);
    console.log('Attempting Google Sign-In via firebaseAuth.signInWithGoogle...');
    try {
      const result = await firebaseAuth.signInWithGoogle();
      
      if (result && result.user) {
        console.log('Google Sign-In successful in AuthScreen, user:', result.user.uid);
        Alert.alert("Google Sign-In Successful", "User: " + result.user.email);
      } else {
        console.log('Google Sign-In process did not complete or was cancelled in AuthScreen. Result:', result);
        Alert.alert("Google Sign-In Failed", result?.error || "The sign-in process was cancelled or failed. Please try again.");
      }
    } catch (e: any) { // Catching e as any to access potential properties like message/code
      console.error("AuthScreen: Uncaught exception during Google sign-in attempt", e);
      let errorMessage = "An unexpected error occurred.";
      if (e.message) {
        errorMessage += ` Message: ${e.message}`;
      }
      if (e.code) {
        errorMessage += ` Code: ${e.code}`;
      }
      Alert.alert("Google Sign-In Error", errorMessage + " Check the console for more details.");
    }
    setLoadingGoogle(false);
  };

  const handleEmailSignIn = () => {
    console.log('Email Sign-In pressed');
    // router.replace('/(tabs)'); // Example navigation after successful sign-in
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.content}>
        <Text style={styles.title}>Welcome Back!</Text>
        <Text style={styles.subtitle}>Sign in to continue</Text>

        <TouchableOpacity
          style={[styles.googleSignInButton, loadingGoogle && styles.googleSignInButtonLoading]}
          onPress={handleGoogleSignIn}
          disabled={loadingGoogle}
        >
          {loadingGoogle ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <MaterialCommunityIcons name="google" size={24} color="#FFFFFF" />
              <Text style={styles.googleSignInButtonText}>Sign In with Google</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.dividerContainer}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.dividerLine} />
        </View>

        <TextInput
          style={styles.input}
          placeholder="Email"
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          secureTextEntry
        />

        <TouchableOpacity style={styles.signInButton} onPress={handleEmailSignIn}>
          <Text style={styles.signInButtonText}>Sign In</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.forgotPasswordButton}>
          <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
        </TouchableOpacity>

        <View style={styles.signUpContainer}>
          <Text style={styles.signUpText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/signup')}>
            <Text style={styles.signUpLink}>Sign Up</Text>
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
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2D2D2D',
    marginBottom: 8,
    fontFamily: 'System', // Consider using a custom font if available
  },
  subtitle: {
    fontSize: 16,
    color: '#808080',
    marginBottom: 32,
    fontFamily: 'System',
  },
  input: {
    width: '100%',
    height: 50,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    fontFamily: 'System',
  },
  signInButton: {
    width: '100%',
    height: 50,
    backgroundColor: '#FF7757',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  signInButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'System',
  },
  forgotPasswordButton: {
    marginBottom: 24,
  },
  forgotPasswordText: {
    color: '#FF7757',
    fontSize: 14,
    fontFamily: 'System',
  },
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  signUpText: {
    fontSize: 14,
    color: '#808080',
    fontFamily: 'System',
  },
  signUpLink: {
    fontSize: 14,
    color: '#FF7757',
    fontWeight: 'bold',
    fontFamily: 'System',
  },
  googleSignInButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: 50,
    backgroundColor: '#4285F4', // Google's blue
    borderRadius: 10,
    marginBottom: 20, // Or as per your layout
  },
  googleSignInButtonLoading: {
    backgroundColor: '#87b1f7', // A lighter shade of Google blue when loading
  },
  googleSignInButtonText: {
    color: '#FFFFFF',
    fontSize: 17, // Adjusted to be more standard
    fontWeight: '500', // Medium weight
    marginLeft: 10,
    fontFamily: 'System',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '80%', // Or '100%' if you prefer full-width
    marginVertical: 20, // Added marginVertical for spacing
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0', // Light gray for the line
  },
  dividerText: {
    marginHorizontal: 10,
    color: '#808080', // Gray text
    fontSize: 14,
    fontFamily: 'System',
  },
});