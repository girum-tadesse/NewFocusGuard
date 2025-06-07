import React, { useEffect, useState } from 'react';
import { Button, ScrollView, StyleSheet, Text, View } from 'react-native';
import { OverlayService } from '../services/OverlayService';
import { checkOverlayPermission, requestOverlayPermission } from '../utils/OverlayPermission';

export const TestOverlayScreen = () => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const overlayService = OverlayService.getInstance();

  const checkPermission = async () => {
    const status = await checkOverlayPermission();
    setHasPermission(status);
  };

  useEffect(() => {
    checkPermission();
  }, []);

  const handleRequestPermission = async () => {
    await requestOverlayPermission();
    // Note: We don't immediately check the permission here because the user needs to
    // grant it in Settings first. They'll need to return to the app manually.
  };

  const showTestOverlay = () => {
    overlayService.showLockOverlay(
      'Instagram',
      '2 hours 15 minutes',
      () => console.log('Emergency unlock pressed'),
      3,
      'Stay focused on what truly matters.'
    );
  };

  const showTestOverlayWithoutTime = () => {
    overlayService.showLockOverlay(
      'TikTok',
      undefined,
      () => console.log('Emergency unlock pressed'),
      1
    );
  };

  const showTestOverlayWithoutEmergency = () => {
    overlayService.showLockOverlay(
      'Facebook',
      '30 minutes',
      undefined,
      0,
      'The key to success is focusing on goals, not obstacles.'
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Overlay Permission Test</Text>
        <Text style={styles.status}>
          Status: {hasPermission === null ? 'Checking...' : hasPermission ? 'Granted' : 'Not Granted'}
        </Text>
        
        {hasPermission === false && (
          <Button
            title="Request Overlay Permission"
            onPress={handleRequestPermission}
          />
        )}

        <Button
          title="Check Permission Again"
          onPress={checkPermission}
        />
      </View>

      {hasPermission && (
        <View style={styles.card}>
          <Text style={styles.title}>Test Overlay Variations</Text>
          
          <View style={styles.buttonContainer}>
            <Button
              title="Show Complete Overlay"
              onPress={showTestOverlay}
            />
          </View>
          
          <View style={styles.buttonContainer}>
            <Button
              title="Show Overlay Without Time"
              onPress={showTestOverlayWithoutTime}
            />
          </View>
          
          <View style={styles.buttonContainer}>
            <Button
              title="Show Overlay Without Emergency"
              onPress={showTestOverlayWithoutEmergency}
            />
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  status: {
    fontSize: 16,
    marginBottom: 20,
    color: '#555',
  },
  buttonContainer: {
    marginVertical: 10,
  },
}); 