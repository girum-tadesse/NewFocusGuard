import { router } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Input, Text } from 'react-native-elements';
import { useAuth } from '../src/contexts/AuthContext';

export default function SignupScreen() {
  const { signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSignup = async () => {
    if (!email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const result = await signUp(email, password);
      if (!result.success) {
        setError(result.error || 'Failed to create account');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text h3 style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Join FocusGuard and take control of your digital life</Text>
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
          disabled={isLoading}
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
          disabled={isLoading}
        />
        <Input
          placeholder="Confirm Password"
          value={confirmPassword}
          onChangeText={(text) => {
            setConfirmPassword(text);
            setError('');
          }}
          secureTextEntry
          leftIcon={{ type: 'material', name: 'lock', color: '#1a73e8' }}
          disabled={isLoading}
        />
        <Button
          title="Create Account"
          onPress={handleSignup}
          containerStyle={styles.buttonContainer}
          buttonStyle={styles.button}
          raised
          loading={isLoading}
          disabled={isLoading}
        />
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Already have an account?</Text>
        <Button
          title="Sign In"
          type="clear"
          titleStyle={{ color: '#1a73e8' }}
          onPress={() => router.back()}
          disabled={isLoading}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 40,
  },
  title: {
    color: '#1a73e8',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#5f6368',
    textAlign: 'center',
  },
  form: {
    marginBottom: 20,
  },
  buttonContainer: {
    marginTop: 20,
    borderRadius: 30,
  },
  button: {
    backgroundColor: '#1a73e8',
    paddingVertical: 12,
    borderRadius: 30,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  footerText: {
    color: '#5f6368',
    marginRight: 10,
  },
  errorText: {
    color: '#d93025',
    textAlign: 'center',
    marginBottom: 20,
  },
}); 