import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import InsightCard from '../../src/components/insights/InsightCard';
import InsightsService, { InsightCard as InsightCardType } from '../../src/services/InsightsService';

// Time period options for filtering insights
type TimePeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';

export default function AnalyticsScreen() {
  const [insights, setInsights] = useState<InsightCardType[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasData, setHasData] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('weekly');
  
  const loadInsights = async () => {
    try {
      setLoading(true);
      const insightsService = InsightsService.getInstance();
      await insightsService.initialize();
      
      const cards = await insightsService.getInsightCards(selectedPeriod);
      setInsights(cards);
      
      // Check if we have any meaningful data
      const appUsage = await insightsService.getAppUsage();
      const dailyUsage = await insightsService.getDailyUsage();
      setHasData(appUsage.length > 0 || dailyUsage.length > 0);
    } catch (error) {
      console.error('Failed to load insights:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  useEffect(() => {
    loadInsights();
  }, [selectedPeriod]); // Reload when time period changes
  
  const handleRefresh = () => {
    setRefreshing(true);
    loadInsights();
  };
  
  // Reset data (for development purposes only)
  const handleResetData = async () => {
    try {
      setLoading(true);
      const insightsService = InsightsService.getInstance();
      await insightsService.resetData();
      await loadInsights();
    } catch (error) {
      console.error('Failed to reset data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Generate demo data (for development purposes only)
  const handleGenerateDemoData = async () => {
    try {
      setLoading(true);
      const insightsService = InsightsService.getInstance();
      
      // Generate some sample app usage data
      const apps = [
        { packageName: 'com.instagram.android', appName: 'Instagram', timeMs: 45 * 60 * 1000 },
        { packageName: 'com.facebook.katana', appName: 'Facebook', timeMs: 30 * 60 * 1000 },
        { packageName: 'com.twitter.android', appName: 'Twitter', timeMs: 20 * 60 * 1000 },
        { packageName: 'com.whatsapp', appName: 'WhatsApp', timeMs: 15 * 60 * 1000 },
        { packageName: 'com.google.android.youtube', appName: 'YouTube', timeMs: 60 * 60 * 1000 }
      ];
      
      // Record app usage for the past 30 days to have data for all time periods
      const today = new Date();
      for (let i = 0; i < 30; i++) {
        const date = new Date();
        date.setDate(today.getDate() - i);
        
        // Record different app usage for each day
        for (const app of apps) {
          // Vary the usage time by ±30%
          const variance = 0.7 + Math.random() * 0.6; // 0.7 to 1.3
          const timeMs = Math.round(app.timeMs * variance);
          
          await insightsService.recordAppUsage(app.packageName, app.appName, timeMs);
        }
        
        // Record some lock events
        const lockedApps = apps.slice(0, 3); // Lock the first 3 apps
        for (const app of lockedApps) {
          const startTime = date.getTime() - (2 * 60 * 60 * 1000); // 2 hours ago
          const endTime = startTime + (30 * 60 * 1000); // 30 minutes later
          const wasSuccessful = Math.random() > 0.3; // 70% success rate
          
          await insightsService.recordLockEvent(
            app.appName,
            app.packageName,
            startTime,
            endTime,
            wasSuccessful
          );
        }
      }
      
      await loadInsights();
    } catch (error) {
      console.error('Failed to generate demo data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const renderTimePeriodFilter = () => {
    const periods: { label: string; value: TimePeriod }[] = [
      { label: 'Day', value: 'daily' },
      { label: 'Week', value: 'weekly' },
      { label: 'Month', value: 'monthly' },
      { label: 'Year', value: 'yearly' }
    ];
    
    return (
      <View style={styles.filterContainer}>
        {periods.map(period => (
          <TouchableOpacity
            key={period.value}
            style={[
              styles.filterButton,
              selectedPeriod === period.value && styles.filterButtonActive
            ]}
            onPress={() => setSelectedPeriod(period.value)}
          >
            <Text 
              style={[
                styles.filterButtonText,
                selectedPeriod === period.value && styles.filterButtonTextActive
              ]}
            >
              {period.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };
  
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00C853" />
        <Text style={styles.loadingText}>Loading insights...</Text>
      </View>
    );
  }
  
  if (!hasData) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Your Insights</Text>
          <View style={styles.headerButtons}>
            <TouchableOpacity 
              style={[styles.headerButton, styles.demoButton]} 
              onPress={handleGenerateDemoData}
            >
              <Ionicons name="flask" size={18} color="#666" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.headerButton} 
              onPress={handleResetData}
            >
              <Ionicons name="refresh" size={18} color="#666" />
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.emptyContainer}>
          <Ionicons name="analytics-outline" size={80} color="#ccc" />
          <Text style={styles.emptyTitle}>No Data Yet</Text>
          <Text style={styles.emptyText}>
            Start using apps on your device to see insights about your usage patterns.
          </Text>
          <TouchableOpacity 
            style={styles.refreshButton} 
            onPress={handleRefresh}
          >
            <Text style={styles.refreshButtonText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Insights</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity 
            style={[styles.headerButton, styles.demoButton]} 
            onPress={handleGenerateDemoData}
          >
            <Ionicons name="flask" size={18} color="#666" />
          </TouchableOpacity>
        <TouchableOpacity 
            style={styles.headerButton} 
          onPress={handleResetData}
        >
          <Ionicons name="refresh" size={18} color="#666" />
        </TouchableOpacity>
      </View>
      </View>
      
      {renderTimePeriodFilter()}
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#00C853']}
          />
        }
      >
        {insights.map((insight) => (
          <InsightCard key={insight.id} insight={insight} />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  headerButtons: {
    flexDirection: 'row',
  },
  headerButton: {
    padding: 8,
    marginLeft: 8,
  },
  demoButton: {
    marginRight: 4,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderRadius: 8,
    margin: 16,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    justifyContent: 'space-between',
  },
  filterButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  filterButtonActive: {
    backgroundColor: '#00C853',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  scrollContent: {
    paddingVertical: 8,
    paddingBottom: 24,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  refreshButton: {
    backgroundColor: '#00C853',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  refreshButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
}); 