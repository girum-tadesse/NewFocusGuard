import { MaterialCommunityIcons } from '@expo/vector-icons'; // For Google icon
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function AuthScreen() {
  const router = useRouter();
  console.log('[AuthScreen] Rendering full auth screen...');

  const handleGoogleSignIn = () => {
    // TODO: Implement Google Sign-In logic
    console.log('Google Sign-In pressed');
  };

  // Placeholder for actual sign-in logic
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

        <TouchableOpacity style={styles.googleSignInButton} onPress={handleGoogleSignIn}>
          <MaterialCommunityIcons name="google" size={24} color="#FFFFFF" />
          <Text style={styles.googleSignInButtonText}>Sign In with Google</Text>
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
          // onChangeText={...} value={...}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          secureTextEntry
          // onChangeText={...} value={...}
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
    backgroundColor: '#FFF9F5', // Same cream white as onboarding
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
    fontFamily: 'System',
  },
  subtitle: {
    fontSize: 16,
    color: '#808080', // Gray color for subtitle
    marginBottom: 32, // Adjusted margin
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
    backgroundColor: '#FF7757', // Same primary button color
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
    backgroundColor: '#4285F4', // Google Blue
    borderRadius: 10,
    marginBottom: 20,
  },
  googleSignInButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '500',
    marginLeft: 10,
    fontFamily: 'System',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '80%',
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  dividerText: {
    marginHorizontal: 10,
    color: '#808080',
    fontSize: 14,
    fontFamily: 'System',
  },
});