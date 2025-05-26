import { router } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Icon, Input, Text } from 'react-native-elements';
import { useAuth } from '../src/contexts/AuthContext';

export default function AuthScreen() {
  const { signIn, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const result = await signIn(email, password);
      if (!result.success) {
        setError(result.error || 'Failed to sign in');
      }
    } catch (err) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setIsGoogleLoading(true);
    try {
      const result = await signInWithGoogle();
      if (!result.success) {
        setError(result.error || 'Google Sign-In failed. Please try again.');
      }
    } catch (err) {
      setError(err.message || 'An unexpected Google Sign-In error occurred');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text h3 style={styles.title}>Welcome to FocusGuard</Text>
        <Text style={styles.subtitle}>Sign in to start your focus journey</Text>
      </View>

      <View style={styles.form}>
        {error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : null}
        
        <Input
          placeholder="Email"
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            setError('');
          }}
          autoCapitalize="none"
          keyboardType="email-address"
          leftIcon={{ type: 'material', name: 'email', color: '#1a73e8' }}
          disabled={isLoading || isGoogleLoading}
        />
        <Input
          placeholder="Password"
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            setError('');
          }}
          secureTextEntry
          leftIcon={{ type: 'material', name: 'lock', color: '#1a73e8' }}
          disabled={isLoading || isGoogleLoading}
        />
        <Button
          title="Sign In"
          onPress={handleLogin}
          containerStyle={styles.buttonContainer}
          buttonStyle={styles.button}
          raised
          loading={isLoading}
          disabled={isLoading || isGoogleLoading}
        />

        <View style={styles.dividerContainer}>
          <View style={styles.divider} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.divider} />
        </View>

        <Button
          title="Sign in with Google"
          onPress={handleGoogleSignIn}
          icon={<Icon name="google" type="font-awesome" size={20} color="white" style={{ marginRight: 10 }}/>}
          containerStyle={[styles.buttonContainer, { marginTop: 10 }]}
          buttonStyle={styles.googleButton}
          raised
          loading={isGoogleLoading}
          disabled={isLoading || isGoogleLoading}
        />

      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Don't have an account?</Text>
        <Button
          title="Create Account"
          type="clear"
          titleStyle={{ color: '#1a73e8' }}
          onPress={() => router.push('/signup')}
          disabled={isLoading || isGoogleLoading}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f9fc',
    padding: 20,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    color: '#2c3e50',
    marginBottom: 8,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    color: '#5f6368',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  form: {
    marginBottom: 20,
    backgroundColor: '#fff',
    padding: 25,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonContainer: {
    marginTop: 15,
    borderRadius: 8,
  },
  button: {
    backgroundColor: '#1a73e8',
    paddingVertical: 14,
    borderRadius: 8,
  },
  googleButton: {
    backgroundColor: '#db4437',
    paddingVertical: 14,
    borderRadius: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30,
  },
  footerText: {
    color: '#5f6368',
    marginRight: 5,
    fontSize: 15,
  },
  errorText: {
    color: '#d93025',
    textAlign: 'center',
    marginBottom: 15,
    fontSize: 14,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 25,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#dfe1e5',
  },
  dividerText: {
    marginHorizontal: 10,
    color: '#5f6368',
    fontSize: 14,
    fontWeight: '600',
  },
}); 