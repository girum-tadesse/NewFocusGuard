import { ThemedText } from '@/components/ThemedText';
import React from 'react';
import { StyleSheet, View } from 'react-native';

export default function LockedScreen() {
  return (
    <View style={styles.container}>
      <ThemedText type="title">Locked Screen</ThemedText>
      <ThemedText>This screen is a placeholder for when an app is locked.</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
}); 