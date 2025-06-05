import React, { useEffect, useState } from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';
import { checkOverlayPermission, requestOverlayPermission } from '../utils/OverlayPermission';

export const TestOverlayScreen = () => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

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

  return (
    <View style={styles.container}>
      <Text style={styles.status}>
        Overlay Permission Status: {hasPermission === null ? 'Checking...' : hasPermission ? 'Granted' : 'Not Granted'}
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
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  status: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
}); 