import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-elements';

export default function OnboardingScreen() {
  return (
    <View style={styles.container}>
      <Text h3 style={styles.title}>Welcome to FocusGuard</Text>
      <Text style={styles.subtitle}>Take control of your digital life</Text>
      <Button
        title="Get Started"
        onPress={() => router.push('/auth')}
        containerStyle={styles.buttonContainer}
        buttonStyle={styles.button}
        raised
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    color: '#1a73e8',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#5f6368',
    textAlign: 'center',
    marginBottom: 40,
  },
  buttonContainer: {
    width: '80%',
    borderRadius: 30,
  },
  button: {
    backgroundColor: '#1a73e8',
    paddingVertical: 12,
    borderRadius: 30,
  },
}); 