import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/src/constants/Colors';
import InstalledAppsModule, { InstalledAppInfo } from '@/src/modules/InstalledAppsModule';
import { scheduleManager } from '@/src/services/ScheduleManager';
import { ScheduledLock } from '@/src/types/LockManagerTypes';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, Image, StyleSheet, Text, View } from 'react-native';

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

  // Format time from Date objects for display

  // Check if schedule is currently active
  const isScheduleActive = (schedule: ScheduledLock): boolean => {
    if (!schedule.isEnabled) {
      console.log(`Schedule ${schedule.id} is disabled`);
      return false;
    }

    const now = new Date();
    const currentDay = (now.getDay() + 6) % 7; // Convert to 0=Monday, 6=Sunday
    const currentTime = now.getHours() * 60 + now.getMinutes(); // Current time in minutes
    
    // Get start and end times
    const startTime = new Date(schedule.scheduleConfig.startTime);
    const endTime = new Date(schedule.scheduleConfig.endTime);
    
    const startTimeMinutes = startTime.getHours() * 60 + startTime.getMinutes();
    const endTimeMinutes = endTime.getHours() * 60 + endTime.getMinutes();
    
    console.log(`Schedule ${schedule.id} - Current time: ${now.getHours()}:${now.getMinutes()} (${currentTime} mins)`);
    console.log(`Schedule ${schedule.id} - Start time: ${startTime.getHours()}:${startTime.getMinutes()} (${startTimeMinutes} mins)`);
    console.log(`Schedule ${schedule.id} - End time: ${endTime.getHours()}:${endTime.getMinutes()} (${endTimeMinutes} mins)`);
    
    // For one-time schedules (no days selected)
    const hasSelectedDays = schedule.scheduleConfig.selectedDays.some(day => day === true);
    if (!hasSelectedDays) {
      // Get the current date (without time)
      const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      // If start date is specified, check if today is the correct date
      if (schedule.scheduleConfig.startDate) {
        const scheduleStartDate = new Date(schedule.scheduleConfig.startDate);
        const scheduleStartDay = new Date(
          scheduleStartDate.getFullYear(), 
          scheduleStartDate.getMonth(), 
          scheduleStartDate.getDate()
        );
        
        // If schedule date is not today, it's not active
        if (scheduleStartDay.getTime() !== todayDate.getTime()) {
          console.log(`Schedule ${schedule.id} - One-time schedule for a different date:`, 
            scheduleStartDay.toDateString(), 'vs today:', todayDate.toDateString());
          return false;
        }
      }
      
      // If it's a one-time schedule, check if current time is within schedule
      const isActive = currentTime >= startTimeMinutes && currentTime < endTimeMinutes;
      console.log(`Schedule ${schedule.id} - One-time schedule, active: ${isActive}`);
      return isActive;
    }
    
    // For recurring schedules, check if today is scheduled and time is within range
    if (!schedule.scheduleConfig.selectedDays[currentDay]) {
      console.log(`Schedule ${schedule.id} - Today (${currentDay}) is not scheduled`);
      return false; // Today is not a scheduled day
    }
    
    // Check if current time is within schedule
    const isActive = currentTime >= startTimeMinutes && currentTime < endTimeMinutes;
    console.log(`Schedule ${schedule.id} - Recurring schedule, active: ${isActive}`);
    return isActive;
  };

  // Function to fetch schedules
  const fetchSchedules = useCallback(async () => {
    setLoading(true);
    try {
      const fetchedSchedules = await scheduleManager.getSchedulesForUser();
      
      // Track which schedules need to be deleted from storage
      const expiredScheduleIds: string[] = [];
      
      // Filter out completely expired schedules
      const validSchedules = fetchedSchedules.filter(schedule => {
        const now = new Date();
        
        // If there's an end date and it's in the past, the schedule has expired
        if (schedule.scheduleConfig.endDate) {
          const endDate = new Date(schedule.scheduleConfig.endDate);
          if (endDate < now) {
            console.log(`Schedule ${schedule.id} has expired based on end date`);
            expiredScheduleIds.push(schedule.id);
            return false;
          }
        }

        // For one-time schedules (no days selected)
        const hasSelectedDays = schedule.scheduleConfig.selectedDays.some(day => day === true);
        if (!hasSelectedDays) {
          // For one-time schedules, check if the end time has passed
          const endTime = new Date(schedule.scheduleConfig.endTime);
          const now = new Date();
          
          // If end time has passed, the schedule has expired - THIS IS THE KEY FIX
          if (now > endTime) {
            console.log(`Schedule ${schedule.id} has expired - one-time schedule with end time passed`);
            expiredScheduleIds.push(schedule.id);
            return false;
          }
        } else {
          // For recurring schedules (days selected), check if all selected days for this week have passed
          const now = new Date();
          const currentDay = (now.getDay() + 6) % 7; // Convert to 0=Monday, 6=Sunday
          const currentHour = now.getHours();
          const currentMinute = now.getMinutes();
          
          // Check if there are any upcoming days in the current week
          let hasUpcomingDay = false;
          
          // Check days after today in the current week
          for (let i = currentDay + 1; i < 7; i++) {
            if (schedule.scheduleConfig.selectedDays[i]) {
              hasUpcomingDay = true;
              break;
            }
          }
          
          // If today is selected, check if the end time has passed
          if (!hasUpcomingDay && schedule.scheduleConfig.selectedDays[currentDay]) {
            const endTime = new Date(schedule.scheduleConfig.endTime);
            // If end time hasn't passed yet, we still have an upcoming schedule today
            if (currentHour < endTime.getHours() || 
                (currentHour === endTime.getHours() && currentMinute < endTime.getMinutes())) {
              hasUpcomingDay = true;
            }
          }
          
          // If no upcoming days in this week, check if this is a weekly recurring schedule
          // Weekly schedules should remain visible even if all days have passed for this week
          // They'll become active again next week
          if (!hasUpcomingDay) {
            // Keep the schedule if it's a weekly recurring schedule
            // We don't delete it because it will be active again next week
            console.log(`Schedule ${schedule.id} has no upcoming days this week, but keeping as it's recurring`);
          }
        }
        
        return true;
      });
      
      // Delete expired schedules from storage
      if (expiredScheduleIds.length > 0) {
        console.log(`Deleting ${expiredScheduleIds.length} expired schedules from storage`);
        for (const scheduleId of expiredScheduleIds) {
          try {
            await scheduleManager.deleteSchedule(scheduleId);
            console.log(`Deleted expired schedule ${scheduleId}`);
          } catch (error) {
            console.error(`Failed to delete expired schedule ${scheduleId}:`, error);
          }
        }
      }
      
      // Enhance schedules with app info and formatted strings
      const enhancedSchedules: EnhancedScheduledLock[] = validSchedules.map(schedule => {
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
        
        // Format the days with special handling for different cases
        let formattedDays = '';
        const selectedDays = schedule.scheduleConfig.selectedDays;
        const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const selectedDayNames = selectedDays.map((selected, index) => selected ? dayNames[index] : null).filter(Boolean);
        
        if (selectedDayNames.length === 0) {
          // Always display just "One-time" for simplicity and to avoid text overflow
          formattedDays = 'One-time';
        } else if (selectedDayNames.length === 7) {
          formattedDays = 'Every day';
        } else if (selectedDayNames.length === 5 && 
                 selectedDays[0] && selectedDays[1] && selectedDays[2] && selectedDays[3] && selectedDays[4]) {
          formattedDays = 'Weekdays';
        } else if (selectedDayNames.length === 2 && selectedDays[5] && selectedDays[6]) {
          formattedDays = 'Weekends';
        } else if (selectedDayNames.length > 3) {
          formattedDays = `Multiple days (${selectedDayNames.length})`;
        } else {
          formattedDays = selectedDayNames.join(', ');
        }
        
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