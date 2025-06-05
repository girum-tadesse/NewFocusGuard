import { MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface LockOverlayProps {
  appName: string;
  timeRemaining?: string;
  onEmergencyUnlock?: () => void;
}

export const LockOverlay: React.FC<LockOverlayProps> = ({
  appName,
  timeRemaining,
  onEmergencyUnlock,
}) => {
  return (
    <View style={styles.container}>
      <BlurView intensity={100} style={StyleSheet.absoluteFill} />
      <LinearGradient
        colors={['rgba(0,0,0,0.7)', 'rgba(0,0,0,0.9)']}
        style={styles.gradient}
      >
        <View style={styles.content}>
          <MaterialIcons name="lock" size={64} color="#fff" />
          <Text style={styles.title}>{appName} is locked</Text>
          {timeRemaining && (
            <Text style={styles.timeRemaining}>
              Time remaining: {timeRemaining}
            </Text>
          )}
          {onEmergencyUnlock && (
            <TouchableOpacity
              style={styles.emergencyButton}
              onPress={onEmergencyUnlock}
            >
              <Text style={styles.emergencyButtonText}>Emergency Unlock</Text>
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 20,
    textAlign: 'center',
  },
  timeRemaining: {
    fontSize: 18,
    color: '#fff',
    marginTop: 10,
    textAlign: 'center',
  },
  emergencyButton: {
    marginTop: 30,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#ff4444',
    borderRadius: 8,
  },
  emergencyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 