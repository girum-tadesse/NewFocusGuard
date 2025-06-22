import MotivationService, { Quote } from '@/src/services/MotivationService';
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
  quote,
}) => {
  const [currentQuote, setCurrentQuote] = useState<Quote | null>(null);
  const [showProductivityStats, setShowProductivityStats] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const loadQuoteAndSettings = async () => {
      try {
        const motivationService = MotivationService.getInstance();
        
        // Load user's preference for showing productivity stats
        const showStats = await motivationService.getShowProductivityStats();
        setShowProductivityStats(showStats);
        
        // Get a random quote based on the user's preferred category
        const randomQuote = await motivationService.getRandomQuote();
        setCurrentQuote(randomQuote);
      } catch (error) {
        console.error('Error loading quote and settings:', error);
        // If there's an error, use the provided quote or a default one
        if (quote) {
          setCurrentQuote({
            id: 'fallback',
            text: quote,
            category: 'Default',
            isCustom: false
          });
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    loadQuoteAndSettings();
  }, []);

  // Placeholder productivity stats
  const productivityStats = {
    appsLocked: 5,
    timesSaved: 120, // minutes
    focusScore: 85
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <MaterialIcons name="lock" size={80} color="#fff" />
        </View>
        
        <Text style={styles.title}>{appName} is locked</Text>
        
        {!isLoading && currentQuote && (
          <View style={styles.quoteContainer}>
            <Text style={styles.quoteText}>"{currentQuote.text}"</Text>
            {currentQuote.author && (
              <Text style={styles.quoteAuthor}>- {currentQuote.author}</Text>
            )}
            <Text style={styles.quoteCategory}>{currentQuote.category}</Text>
          </View>
        )}
        
        {timeRemaining && (
          <View style={styles.timeContainer}>
            <MaterialIcons name="timer" size={24} color="#fff" />
            <Text style={styles.timeRemaining}>
              Time remaining: {timeRemaining}
            </Text>
          </View>
        )}
        
        {showProductivityStats && (
          <View style={styles.statsContainer}>
            <Text style={styles.statsTitle}>Your Focus Progress</Text>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{productivityStats.appsLocked}</Text>
                <Text style={styles.statLabel}>Apps Locked</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{productivityStats.timesSaved}m</Text>
                <Text style={styles.statLabel}>Time Saved</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{productivityStats.focusScore}%</Text>
                <Text style={styles.statLabel}>Focus Score</Text>
              </View>
            </View>
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
  quoteAuthor: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'right',
    marginTop: 10,
    opacity: 0.9,
  },
  quoteCategory: {
    fontSize: 14,
    color: '#fff',
    textAlign: 'left',
    marginTop: 15,
    opacity: 0.7,
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
  statsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 30,
    width: '100%',
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  statLabel: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.8,
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