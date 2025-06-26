import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, Platform, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
// We'll use a simple grid icon for now, you might want to replace this later
import { MaterialIcons } from '@expo/vector-icons';
// Only import getInstalledApps, we will define the type locally
import { Colors } from '@/constants/Colors';
import { AppCard } from '@/src/components/AppCard';
import { LockDurationModal } from '@/src/components/LockDurationModal'; // Import LockDurationModal
import { ScheduleModal } from '@/src/components/ScheduleModal';
import { useAppLocking } from '@/src/hooks/useAppLocking';
import { scheduleManager } from '@/src/services/ScheduleManager';
import { ScheduleConfig, ScheduledLock } from '@/src/types/LockManagerTypes'; // Import ActiveLock and ScheduledLock
import { checkOverlayPermission, requestOverlayPermission } from '@/src/utils/OverlayPermission';
import AsyncStorage from '@react-native-async-storage/async-storage'; // Import AsyncStorage
import { NativeModules } from 'react-native';

const { InstalledApps, AppMonitoringModule } = NativeModules;

// Key for storing selected apps in AsyncStorage (temporary selection on this screen)
const SELECTED_APPS_UI_STORAGE_KEY = '@FocusGuard:selectedAppsUIState';
// Key for storing actual active locks
const ACTIVE_LOCKS_STORAGE_KEY = '@FocusGuard:activeLocks';
// Key for storing scheduled locks
const SCHEDULED_LOCKS_STORAGE_KEY = '@FocusGuard:scheduledLocks';

// Define the type based on actual library output confirmed from logs
interface InstalledAppFromLibrary {
  appName: string;
  packageName: string;
  versionName?: string;
  icon?: string;
}

// Define a type for our app data structure, using packageName as id
interface DisplayAppInfo {
  id: string; // Will be packageName
  name: string;
  icon?: string; // Base64 encoded icon
}

// This is the type ScheduleModal uses internally for its onConfirm callback
interface ModalScheduleConfig {
    startDate?: Date;
    endDate?: Date;
    startTime: Date;
    endTime: Date;
    selectedDays: boolean[];
}

const PURE_WHITE = '#FFFFFF'; // Define pure white

export default function AppsScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAppsUI, setSelectedAppsUI] = useState<Set<string>>(new Set());
  const [apps, setApps] = useState<DisplayAppInfo[]>([]);
  const [isLoadingApps, setIsLoadingApps] = useState(true);
  const [isScheduleModalVisible, setIsScheduleModalVisible] = useState(false);
  const [isLockDurationModalVisible, setIsLockDurationModalVisible] = useState(false);
  const { lockApp, unlockApp, isAppLocked } = useAppLocking();
  
  // This state will trigger the sync effect when schedules change
  const [scheduledLocks, setScheduledLocks] = useState<ScheduledLock[]>([]);

  useEffect(() => {
    // Removed the automatic permission check at startup
    loadApps();
    loadSchedules(); // Load schedules on initial component mount
  }, []);
  
  // Effect to sync schedules with the native module
  useEffect(() => {
    if (scheduledLocks.length > 0) {
      console.log('[AppsScreen] Syncing schedules with native module. Count:', scheduledLocks.length);
      console.log('[AppsScreen] Schedule details:', JSON.stringify(scheduledLocks, null, 2));
      
      const schedulesJson = JSON.stringify(scheduledLocks);
      AppMonitoringModule.setScheduledLocks(schedulesJson)
        .then(() => console.log('[AppsScreen] Successfully synced schedules with native module.'))
        .catch((e: any) => {
          console.error('[AppsScreen] Failed to sync schedules with native module:', e);
          console.error('[AppsScreen] Error details:', e.message);
        });
    } else {
      console.log('[AppsScreen] No schedules to sync with native module');
    }
  }, [scheduledLocks]);

  const loadSchedules = async () => {
    try {
      console.log('[AppsScreen] Loading schedules from storage');
      // Load schedules from storage
      const firestoreSchedules = await scheduleManager.getSchedulesForUser();
      console.log('[AppsScreen] Loaded schedules count:', firestoreSchedules.length);
      
      setScheduledLocks(firestoreSchedules);
      
      // Sync with native module
      if (firestoreSchedules.length > 0) {
        console.log('[AppsScreen] Preparing to sync schedules with native module');
        const schedulesJson = JSON.stringify(firestoreSchedules);
        await AppMonitoringModule.setScheduledLocks(schedulesJson);
        console.log('[AppsScreen] Successfully synced schedules with native module');
      } else {
        console.log('[AppsScreen] No schedules to sync');
      }
    } catch (error) {
      console.error('[AppsScreen] Failed to load or sync schedules:', error);
      Alert.alert(
        "Schedule Sync Error",
        "Failed to sync schedules. Some scheduled locks may not work properly."
      );
    }
  };

  const loadApps = async () => {
    try {
      setIsLoadingApps(true);
      const installedApps = await InstalledApps.getInstalledApps();
      const formattedApps: DisplayAppInfo[] = installedApps.map((app: InstalledAppFromLibrary) => ({
        id: app.packageName,
        name: app.appName,
        icon: app.icon
      }));
      setApps(formattedApps);
    } catch (error) {
      console.error('Error loading apps:', error);
    } finally {
      setIsLoadingApps(false);
    }
  };

  const toggleAppSelection = (app: DisplayAppInfo) => {
    setSelectedAppsUI(prevSelected => {
      const newSelected = new Set(prevSelected);
      if (newSelected.has(app.id)) {
        newSelected.delete(app.id);
      } else {
        newSelected.add(app.id);
      }
      // Save updated selection to AsyncStorage
      AsyncStorage.setItem(SELECTED_APPS_UI_STORAGE_KEY, JSON.stringify(Array.from(newSelected)))
        .catch(error => console.error('Failed to save UI selected apps to storage:', error));
      return newSelected;
    });
  };

  // Simplify the permission handling flow to ensure both permissions are requested in sequence
  const requestPermissions = async (onComplete: () => void) => {
    try {
      // First check usage stats permission
      const hasUsagePermission = await AppMonitoringModule.hasUsageStatsPermission();
      
      if (!hasUsagePermission) {
        // Show alert for usage stats permission
        Alert.alert(
          "Usage Access Permission Required",
          "FocusGuard needs to know which apps are running. Please grant the 'Usage Access' permission.",
          [
            {
              text: "Grant Permission",
              onPress: async () => {
                // Request usage stats permission
                await AppMonitoringModule.requestUsageStatsPermission();
                
                // After returning, explicitly request overlay permission
                setTimeout(() => {
                  requestOverlayPermissionExplicitly(onComplete);
                }, 500);
              }
            },
            { text: "Cancel", style: "cancel" }
          ],
          { cancelable: false }
        );
      } else {
        // Usage permission already granted, check overlay permission
        requestOverlayPermissionExplicitly(onComplete);
      }
    } catch (error) {
      console.error('Error requesting permissions:', error);
      Alert.alert(
        "Error",
        "There was an error requesting permissions. Please try again.",
        [{ text: "OK" }]
      );
    }
  };
  
  // Function to explicitly request overlay permission
  const requestOverlayPermissionExplicitly = async (onComplete: () => void) => {
    const hasOverlayPermission = await checkOverlayPermission();
    
    if (!hasOverlayPermission) {
      Alert.alert(
        "Display Over Other Apps Permission Required",
        "FocusGuard needs to show a lock screen over locked apps. Please grant the 'Display Over Other Apps' permission.",
        [
          {
            text: "Grant Permission",
            onPress: async () => {
              await requestOverlayPermission();
              
              // After returning, verify both permissions
              setTimeout(async () => {
                const finalUsagePermission = await AppMonitoringModule.hasUsageStatsPermission();
                const finalOverlayPermission = await checkOverlayPermission();
                
                if (finalUsagePermission && finalOverlayPermission) {
                  // Both permissions granted, proceed
                  onComplete();
                } else {
                  // Still missing permissions
                  Alert.alert(
                    "Permissions Required",
                    "Both permissions are needed for the app to function properly. Please try again when ready.",
                    [{ text: "OK" }]
                  );
                }
              }, 500);
            }
          },
          { text: "Cancel", style: "cancel" }
        ],
        { cancelable: false }
      );
    } else {
      // Both permissions are granted
      const finalUsagePermission = await AppMonitoringModule.hasUsageStatsPermission();
      if (finalUsagePermission) {
        onComplete();
      } else {
        // This should rarely happen - usage permission was lost somehow
        requestPermissions(onComplete);
      }
    }
  };

  const handleLockNow = async (app: DisplayAppInfo, duration?: number) => {
    try {
      // If no apps are selected, show alert
      if (selectedAppsUI.size === 0) {
        Alert.alert("No Apps Selected", "Please select at least one app to lock.");
        return;
      }

      // Check permissions before locking
      const hasUsagePermission = await AppMonitoringModule.hasUsageStatsPermission();
      const hasOverlayPermission = await checkOverlayPermission();
      
      if (!hasUsagePermission || !hasOverlayPermission) {
        // Use the new permission request flow
        requestPermissions(() => handleLockNow(app, duration));
        return;
      }

      // Lock all selected apps
      for (const appId of selectedAppsUI) {
        const appToLock = apps.find(a => a.id === appId);
        if (appToLock) {
          await lockApp(appToLock.id, appToLock.name, duration);
        }
      }

      // Clear selection after locking
      setSelectedAppsUI(new Set());
      AsyncStorage.removeItem(SELECTED_APPS_UI_STORAGE_KEY);
      setIsLockDurationModalVisible(false);
      Alert.alert("Success", "Selected apps have been locked successfully.");
    } catch (error) {
      console.error('Error locking apps:', error);
      Alert.alert("Error", "Failed to lock selected apps. Please try again.");
    }
  };

  const handleOpenScheduleModal = async () => {
    if (selectedAppsUI.size === 0) {
      Alert.alert("No Apps Selected", "Please select at least one app to schedule.");
      return;
    }
    
    // Check permissions before scheduling
    const hasUsagePermission = await AppMonitoringModule.hasUsageStatsPermission();
    const hasOverlayPermission = await checkOverlayPermission();
    
    if (!hasUsagePermission || !hasOverlayPermission) {
      // Use the new permission request flow
      requestPermissions(() => setIsScheduleModalVisible(true));
      return;
    }
    
    setIsScheduleModalVisible(true);
  };

  const handleConfirmSchedule = async (modalScheduleConfig: ScheduleConfig) => {
    console.log('[AppsScreen] Confirming new schedule');
    const selectedApps = Array.from(selectedAppsUI);
    console.log('[AppsScreen] Selected apps:', selectedApps);
    
    try {
      // Save to storage
      console.log('[AppsScreen] Saving schedule to storage');
      const scheduleId = await scheduleManager.addSchedule(selectedApps, modalScheduleConfig);
      console.log('[AppsScreen] Schedule saved with ID:', scheduleId);
      
      // Reload schedules to sync with native module
      console.log('[AppsScreen] Reloading schedules to sync');
      await loadSchedules();
      
      Alert.alert("Schedule Set", "Your schedule has been saved and synced.");
      
      // Clear UI state
      setIsScheduleModalVisible(false);
      setSelectedAppsUI(new Set());
    } catch (error) {
      console.error('[AppsScreen] Failed to save schedule:', error);
      Alert.alert(
        "Error",
        "Failed to save the schedule. Please try again."
      );
    }
  };

  const handleOpenLockNowModal = async () => {
    if (selectedAppsUI.size === 0) {
      Alert.alert("No Apps Selected", "Please select at least one app to lock.");
      return;
    }
    
    // Check permissions before showing lock duration modal
    const hasUsagePermission = await AppMonitoringModule.hasUsageStatsPermission();
    const hasOverlayPermission = await checkOverlayPermission();
    
    if (!hasUsagePermission || !hasOverlayPermission) {
      // Use the new permission request flow
      requestPermissions(() => setIsLockDurationModalVisible(true));
      return;
    }
    
    setIsLockDurationModalVisible(true);
  };

  const filteredApps = apps.filter(app =>
    app.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ThemedView style={styles.container}>
        <View style={styles.searchBarContainer}>
          <MaterialIcons name="search" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search apps..."
            placeholderTextColor="#888"
            value={searchQuery}
            onChangeText={setSearchQuery}
            underlineColorAndroid="transparent"
          />
        </View>

        {isLoadingApps && <Text style={styles.emptyListText}>Loading apps...</Text>}
        {!isLoadingApps && (
          <View style={styles.listContainer}>
            <FlatList
              data={filteredApps}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <AppCard
                  app={item}
                  isLocked={isAppLocked(item.id)}
                  isSelected={selectedAppsUI.has(item.id)}
                  onSelect={toggleAppSelection}
                />
              )}
              contentContainerStyle={styles.flatListContentContainer}
              numColumns={4}
              columnWrapperStyle={styles.row}
              ListEmptyComponent={
                <Text style={styles.emptyListText}>
                  {searchQuery ? 'No apps match your search.' : (Platform.OS === 'android' ? 'No apps found on device.' : 'App list not available on this platform.')}
                </Text>
              }
            />
          </View>
        )}
      </ThemedView>

      <View style={styles.floatingContainer}>
        <TouchableOpacity 
          style={styles.floatingButton} 
          onPress={() => handleOpenScheduleModal().catch(error => {
            console.error('Error in schedule modal permission check:', error);
            Alert.alert("Error", "Failed to open schedule modal. Please try again.");
          })}
        >
          <MaterialIcons name="schedule" size={16} color="#FFFFFF" />
          <ThemedText style={styles.floatingButtonText}>SCHEDULE</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.floatingButton} 
          onPress={() => handleOpenLockNowModal().catch(error => {
            console.error('Error in lock now modal permission check:', error);
            Alert.alert("Error", "Failed to open lock modal. Please try again.");
          })}
        >
          <MaterialIcons name="lock" size={16} color="#FFFFFF" />
          <ThemedText style={styles.floatingButtonText}>LOCK NOW</ThemedText>
        </TouchableOpacity>
      </View>

      <ScheduleModal
        isVisible={isScheduleModalVisible}
        onClose={() => setIsScheduleModalVisible(false)}
        onConfirm={handleConfirmSchedule}
      />

      <LockDurationModal
        isVisible={isLockDurationModalVisible}
        onClose={() => setIsLockDurationModalVisible(false)}
        onConfirm={handleLockNow}
        selectedAppsCount={selectedAppsUI.size}
        app={{
          id: Array.from(selectedAppsUI)[0] || '',
          name: `${selectedAppsUI.size} selected app${selectedAppsUI.size !== 1 ? 's' : ''}`,
          icon: apps.find(app => app.id === Array.from(selectedAppsUI)[0])?.icon
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: PURE_WHITE,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
    backgroundColor: PURE_WHITE,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF', 
    borderRadius: 16, 
    paddingHorizontal: 15,
    paddingVertical: 2,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0', 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    height: 50,
    fontSize: 14,
    color: Colors.light.text,
    marginLeft: 8,
    paddingHorizontal: 15,
    backgroundColor: Colors.light.background,
    borderRadius: 15,
  },
  appList: {
    paddingBottom: 200,
  },
  row: {
    flex: 1,
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  emptyListText: {
    marginTop: 50,
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  floatingContainer: {
    position: 'absolute',
    bottom: 20,
    right: 0,
    left: 0,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
  },
  floatingButton: {
    backgroundColor: Colors.light.tint,
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  floatingButtonText: {
    color: '#FFFFFF',
    marginLeft: 5,
    fontSize: 12,
    fontWeight: 'bold',
  },
  listContainer: {
    flex: 1,
  },
  flatListContentContainer: {
    paddingBottom: 70,
  },
  floatingButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
});
