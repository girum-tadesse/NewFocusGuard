import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/src/constants/Colors';
import InstalledAppsModule, { InstalledAppInfo } from '@/src/modules/InstalledAppsModule';
import { scheduleManager } from '@/src/services/ScheduleManager';
import { ScheduledLock } from '@/src/types/LockManagerTypes';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, Image, StyleSheet, Switch, Text, View } from 'react-native';

interface EnhancedScheduledLock extends ScheduledLock {
  apps: {
    packageName: string;
    appName: string;
    icon: string;
  }[];
  formattedTime: string;
  formattedDays: string;
  isActive: boolean;
}

export default function ScheduledScreen() {
  const [schedules, setSchedules] = useState<EnhancedScheduledLock[]>([]);
  const [installedApps, setInstalledApps] = useState<InstalledAppInfo[]>([]);
  const [loading, setLoading] = useState(true);

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

  // Format time from Date objects
  const formatTime = (date: Date): string => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;
    const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
    return `${formattedHours}:${formattedMinutes} ${ampm}`;
  };

  // Format days from boolean array
  const formatDays = (days: boolean[]): string => {
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const selectedDays = days.map((selected, index) => selected ? dayNames[index] : null).filter(Boolean);
    
    if (selectedDays.length === 0) {
      return 'One-time';
    } else if (selectedDays.length === 7) {
      return 'Every day';
    } else if (selectedDays.length === 5 && 
               days[0] && days[1] && days[2] && days[3] && days[4]) {
      return 'Weekdays';
    } else if (selectedDays.length === 2 && days[5] && days[6]) {
      return 'Weekends';
    } else {
      return selectedDays.join(', ');
    }
  };

  // Check if schedule is currently active
  const isScheduleActive = (schedule: ScheduledLock): boolean => {
    if (!schedule.isEnabled) return false;

    const now = new Date();
    const currentDay = (now.getDay() + 6) % 7; // Convert to 0=Monday, 6=Sunday
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    // Check if today is a scheduled day
    if (!schedule.scheduleConfig.selectedDays[currentDay]) {
      return false;
    }
    
    // Parse start and end times
    const startTime = new Date(schedule.scheduleConfig.startTime);
    const endTime = new Date(schedule.scheduleConfig.endTime);
    
    const startHour = startTime.getHours();
    const startMinute = startTime.getMinutes();
    const endHour = endTime.getHours();
    const endMinute = endTime.getMinutes();
    
    // Check if current time is within schedule
    if (currentHour > startHour || (currentHour === startHour && currentMinute >= startMinute)) {
      if (currentHour < endHour || (currentHour === endHour && currentMinute < endMinute)) {
        return true;
      }
    }
    
    return false;
  };

  // Function to fetch schedules
  const fetchSchedules = useCallback(async () => {
    setLoading(true);
    try {
      const fetchedSchedules = await scheduleManager.getSchedulesForUser();
      
      // Enhance schedules with app info and formatted strings
      const enhancedSchedules: EnhancedScheduledLock[] = fetchedSchedules.map(schedule => {
        // Get app details for each package name
        const appsInfo = schedule.appPackageNames.map(packageName => {
          const appInfo = installedApps.find(app => app.packageName === packageName);
          return {
            packageName,
            appName: appInfo?.appName || packageName.split('.').pop() || packageName,
            icon: appInfo?.icon || ''
          };
        });
        
        // Format time and days
        const startTime = new Date(schedule.scheduleConfig.startTime);
        const endTime = new Date(schedule.scheduleConfig.endTime);
        const formattedTime = `${formatTime(startTime)} - ${formatTime(endTime)}`;
        const formattedDays = formatDays(schedule.scheduleConfig.selectedDays);
        
        // Check if schedule is currently active
        const isActive = isScheduleActive(schedule);
        
        return {
          ...schedule,
          apps: appsInfo,
          formattedTime,
          formattedDays,
          isActive
        };
      });
      
      setSchedules(enhancedSchedules);
    } catch (error) {
      console.error('Failed to fetch schedules:', error);
    } finally {
      setLoading(false);
    }
  }, [installedApps]);

  // Toggle schedule enabled status
  const toggleSchedule = async (scheduleId: string, isEnabled: boolean) => {
    try {
      await scheduleManager.toggleSchedule(scheduleId, isEnabled);
      // Refresh schedules after toggle
      fetchSchedules();
    } catch (error) {
      console.error('Failed to toggle schedule:', error);
    }
  };

  // Refresh schedules when the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchSchedules();
      
      // Set up interval to update active status
      const intervalId = setInterval(() => {
        fetchSchedules();
      }, 60000); // Update every minute
      
      return () => clearInterval(intervalId);
    }, [fetchSchedules])
  );

  // Render app icons for a schedule
  const renderAppIcons = (apps: EnhancedScheduledLock['apps']) => {
    // Show up to 3 app icons, with a +X indicator if there are more
    const displayApps = apps.slice(0, 3);
    const remainingCount = apps.length - 3;
    
    return (
      <View style={styles.appIconsContainer}>
        {displayApps.map((app, index) => (
          <View key={index} style={styles.appIconWrapper}>
            {app.icon ? (
              <Image 
                source={{ uri: `data:image/png;base64,${app.icon}` }} 
                style={styles.appIcon} 
              />
            ) : (
              <View style={styles.appIconPlaceholder}>
                <Text style={styles.appIconText}>{app.appName.charAt(0).toUpperCase()}</Text>
              </View>
            )}
          </View>
        ))}
        {remainingCount > 0 && (
          <View style={styles.moreAppsIndicator}>
            <Text style={styles.moreAppsText}>+{remainingCount}</Text>
          </View>
        )}
      </View>
    );
  };

  // Render a scheduled item
  const renderScheduleItem = ({ item }: { item: EnhancedScheduledLock }) => (
    <View style={styles.scheduleItem}>
      <View style={styles.scheduleHeader}>
        <View style={styles.scheduleStatus}>
          <View style={[styles.statusDot, { backgroundColor: item.isActive ? '#4CAF50' : '#9E9E9E' }]} />
          <Text style={styles.statusText}>
            {item.isActive ? 'Active' : 'Inactive'}
          </Text>
        </View>
        <Switch
          value={item.isEnabled}
          onValueChange={(value) => toggleSchedule(item.id, value)}
          trackColor={{ false: '#D1D1D1', true: Colors.light.tint + '80' }}
          thumbColor={item.isEnabled ? Colors.light.tint : '#F4F3F4'}
        />
      </View>
      
      <View style={styles.scheduleContent}>
        {renderAppIcons(item.apps)}
        
        <View style={styles.scheduleDetails}>
          <Text style={styles.appNames}>
            {item.apps.map(app => app.appName).join(', ')}
          </Text>
          
          <View style={styles.scheduleTimeContainer}>
            <Text style={styles.scheduleTime}>{item.formattedTime}</Text>
            <Text style={styles.scheduleDays}>{item.formattedDays}</Text>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title" style={styles.headerTitle}>Scheduled Locks</ThemedText>
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ThemedText>Loading scheduled locks...</ThemedText>
        </View>
      ) : schedules.length > 0 ? (
        <FlatList
          data={schedules}
          renderItem={renderScheduleItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <ThemedText style={styles.emptyText}>No scheduled locks</ThemedText>
          <ThemedText style={styles.emptySubtext}>
            When you schedule an app to be locked, it will appear here with its schedule details.
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
  scheduleItem: {
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
  scheduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  scheduleStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 14,
    color: '#666666',
  },
  scheduleContent: {
    flexDirection: 'row',
  },
  appIconsContainer: {
    flexDirection: 'row',
    marginRight: 12,
  },
  appIconWrapper: {
    marginRight: -8, // Overlap icons slightly
  },
  appIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  appIconPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: Colors.light.tint,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  appIconText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  moreAppsIndicator: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  moreAppsText: {
    color: '#666666',
    fontSize: 14,
    fontWeight: 'bold',
  },
  scheduleDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  appNames: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 6,
  },
  scheduleTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scheduleTime: {
    fontSize: 14,
    color: '#666666',
    marginRight: 8,
  },
  scheduleDays: {
    fontSize: 14,
    color: '#666666',
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
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