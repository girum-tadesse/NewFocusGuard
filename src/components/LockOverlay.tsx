import { MaterialIcons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface LockOverlayProps {
  appName: string;
  timeRemaining?: string;
  onEmergencyUnlock?: () => void;
  emergencyUnlockChances?: number;
  quote?: string;
}

export const LockOverlay: React.FC<LockOverlayProps> = ({
  appName,
  timeRemaining,
  onEmergencyUnlock,
  emergencyUnlockChances = 3,
  quote = "Focus on what matters most today.",
}) => {
  // Default quotes to show if none provided
  const defaultQuotes = [
    "Focus on what matters most today.",
    "Small steps lead to big achievements.",
    "Stay present, stay focused.",
    "Your future self will thank you.",
    "Discipline is choosing between what you want now and what you want most."
  ];
  
  const [currentQuote, setCurrentQuote] = useState(quote);
  
  useEffect(() => {
    if (quote === defaultQuotes[0]) {
      // If using the default quote, randomly select one
      const randomQuote = defaultQuotes[Math.floor(Math.random() * defaultQuotes.length)];
      setCurrentQuote(randomQuote);
    }
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <MaterialIcons name="lock" size={80} color="#fff" />
        </View>
        
        <Text style={styles.title}>{appName} is locked</Text>
        
        <View style={styles.quoteContainer}>
          <Text style={styles.quoteText}>"{currentQuote}"</Text>
        </View>
        
        {timeRemaining && (
          <View style={styles.timeContainer}>
            <MaterialIcons name="timer" size={24} color="#fff" />
            <Text style={styles.timeRemaining}>
              Time remaining: {timeRemaining}
            </Text>
          </View>
        )}
        
        <View style={styles.unlockChancesContainer}>
          <Text style={styles.unlockChancesText}>
            Emergency unlock chances remaining this week: {emergencyUnlockChances}
          </Text>
        </View>
        
        {onEmergencyUnlock && (
          <TouchableOpacity
            style={styles.emergencyButton}
            onPress={onEmergencyUnlock}
          >
            <Text style={styles.emergencyButtonText}>Emergency Unlock</Text>
          </TouchableOpacity>
        )}
      </View>
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
    backgroundColor: '#FF8C00', // Deep orange background
  },
  content: {
    alignItems: 'center',
    padding: 30,
    width: '100%',
    maxWidth: 500,
  },
  iconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 60,
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 30,
    textAlign: 'center',
  },
  quoteContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 30,
    width: '100%',
  },
  quoteText: {
    fontSize: 20,
    fontStyle: 'italic',
    color: '#fff',
    textAlign: 'center',
    lineHeight: 28,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  timeRemaining: {
    fontSize: 18,
    color: '#fff',
    marginLeft: 10,
    fontWeight: '500',
  },
  unlockChancesContainer: {
    marginBottom: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 10,
    padding: 15,
    width: '100%',
  },
  unlockChancesText: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
  },
  emergencyButton: {
    paddingHorizontal: 30,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderRadius: 30,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  emergencyButtonText: {
    color: '#FF8C00',
    fontSize: 18,
    fontWeight: 'bold',
  },
}); 