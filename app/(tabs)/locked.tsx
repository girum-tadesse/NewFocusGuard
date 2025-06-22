import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/src/constants/Colors';
import InstalledAppsModule, { InstalledAppInfo } from '@/src/modules/InstalledAppsModule';
import AppMonitoringService from '@/src/services/AppMonitoringService';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, Image, StyleSheet, Text, View } from 'react-native';

interface LockedAppInfo {
  packageName: string;
  appName: string;
  icon: string;
  unlockTime: number | undefined;
  remainingTime: string;
}

export default function LockedScreen() {
  const [lockedApps, setLockedApps] = useState<LockedAppInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [installedApps, setInstalledApps] = useState<InstalledAppInfo[]>([]);

  // Fetch installed apps once when component mounts
  useEffect(() => {
    const getInstalledApps = async () => {
      try {
        const apps = await InstalledAppsModule.getInstalledApps();
        setInstalledApps(apps);
      } catch (error) {
        console.error('Failed to get installed apps:', error);
      }
    };
    
    getInstalledApps();
  }, []);

  // Function to fetch locked apps
  const fetchLockedApps = useCallback(async () => {
    setLoading(true);
    try {
      const appMonitoringService = AppMonitoringService.getInstance();
      const lockedAppsMap = appMonitoringService.getLockedApps();
      
      if (!lockedAppsMap || lockedAppsMap.size === 0) {
        setLockedApps([]);
        setLoading(false);
        return;
      }

      // Convert the map entries to an array of LockedAppInfo objects
      const lockedAppsArray: LockedAppInfo[] = [];
      
      for (const [packageName, unlockTime] of lockedAppsMap) {
        try {
          // Find app info from our installed apps list
          const appInfo = installedApps.find(app => app.packageName === packageName);
          
          // Use found app info or fallback to basic info
          const appName = appInfo?.appName || packageName.split('.').pop() || packageName;
          const icon = appInfo?.icon || '';
          
          // Calculate remaining time
          let remainingTime = 'Indefinite';
          if (unlockTime) {
            const now = Date.now();
            if (unlockTime > now) {
              const remainingMs = unlockTime - now;
              const remainingMinutes = Math.ceil(remainingMs / (60 * 1000));
              const hours = Math.floor(remainingMinutes / 60);
              const minutes = remainingMinutes % 60;
              
              if (hours > 0) {
                remainingTime = `${hours}h ${minutes}m`;
              } else {
                remainingTime = `${minutes}m`;
              }
            } else {
              // Lock has expired, remove it
              await appMonitoringService.unlockApp(packageName);
              continue; // Skip adding to the list
            }
          }
          
          lockedAppsArray.push({
            packageName,
            appName,
            icon,
            unlockTime,
            remainingTime
          });
        } catch (error) {
          console.error(`Error processing locked app ${packageName}:`, error);
        }
      }
      
      setLockedApps(lockedAppsArray);
    } catch (error) {
      console.error('Failed to fetch locked apps:', error);
    } finally {
      setLoading(false);
    }
  }, [installedApps]);

  // Refresh the list when the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchLockedApps();
      
      // Set up interval to update remaining times
      const intervalId = setInterval(() => {
        fetchLockedApps();
      }, 60000); // Update every minute
      
      return () => clearInterval(intervalId);
    }, [fetchLockedApps])
  );

  // Render a locked app item
  const renderLockedApp = ({ item }: { item: LockedAppInfo }) => (
    <View style={styles.appItem}>
      {item.icon ? (
        <Image 
          source={{ uri: `data:image/png;base64,${item.icon}` }} 
          style={styles.appIcon} 
        />
      ) : (
        <View style={styles.appIconPlaceholder}>
          <Text style={styles.appIconText}>{item.appName.charAt(0).toUpperCase()}</Text>
        </View>
      )}
      <View style={styles.appInfo}>
        <Text style={styles.appName}>{item.appName}</Text>
        <View style={styles.timeContainer}>
          <Text style={styles.timeLabel}>Unlocks in: </Text>
          <Text style={styles.timeValue}>{item.remainingTime}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title" style={styles.headerTitle}>Locked Apps</ThemedText>
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ThemedText>Loading locked apps...</ThemedText>
        </View>
      ) : lockedApps.length > 0 ? (
        <FlatList
          data={lockedApps}
          renderItem={renderLockedApp}
          keyExtractor={item => item.packageName}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <ThemedText style={styles.emptyText}>No apps are currently locked.</ThemedText>
          <ThemedText style={styles.emptySubtext}>
            When you lock an app, it will appear here with its remaining lock time.
          </ThemedText>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F8',
  },
  header: {
    paddingTop: 20,
    paddingBottom: 10,
    paddingHorizontal: 20,
    backgroundColor: Colors.light.tint,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 22,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
  },
  appItem: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  appIcon: {
    width: 50,
    height: 50,
    borderRadius: 10,
    marginRight: 16,
  },
  appIconPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 10,
    backgroundColor: Colors.light.tint,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  appIconText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  appInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  appName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeLabel: {
    fontSize: 14,
    color: '#666666',
  },
  timeValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.tint,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 10,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
  },
}); 