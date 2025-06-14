import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, Platform, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
// We'll use a simple grid icon for now, you might want to replace this later
import { MaterialIcons } from '@expo/vector-icons';
// Only import getInstalledApps, we will define the type locally
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
    checkAndRequestPermissions();
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

  const checkAndRequestPermissions = async () => {
    console.log("[Permissions] Starting permission setup flow");
  
    try {
      // First, check if permissions are already granted.
      const overlayGranted = await checkOverlayPermission();
      // Note: hasUsageStatsPermission is now async, so we await it.
      const usageGranted = await AppMonitoringModule.hasUsageStatsPermission();
  
      if (overlayGranted && usageGranted) {
        console.log("[Permissions] All permissions are already granted.");
        return; // All permissions are in place, no need to ask.
      }
  
      // Use a promise to wait for the user to interact with the initial alert.
      const userAgreed = await new Promise(resolve => {
      Alert.alert(
        "Welcome to FocusGuard!",
          "To help you stay focused, we need two permissions. We'll guide you through setting them up step by step.",
        [
            { text: "Let's Start", onPress: () => resolve(true) },
            { text: "Maybe Later", style: "cancel", onPress: () => resolve(false) },
          ],
          { cancelable: false }
        );
      });
  
      if (!userAgreed) {
        console.log("[Permissions] User declined the permission setup flow.");
        Alert.alert(
          "Permissions Required",
          "Please note that FocusGuard requires these permissions to function correctly. You can grant them later from the settings."
        );
        return;
      }
  
      // --- Step 1: Overlay Permission ---
      if (!overlayGranted) {
        console.log("[Permissions] Requesting Overlay permission.");
        // Use a promise to wait for the user to proceed after the explanation.
        await new Promise<void>(resolve => {
                  Alert.alert(
                    "Step 1 of 2: Display Over Other Apps",
            "This permission is needed to show the lock screen over other applications when a timer is up.",
                    [
                      {
                        text: "Open Settings",
                        onPress: async () => {
                            await requestOverlayPermission();
                  // We resolve here to move to the next step. We can't know if the user
                  // granted it, but we've guided them. We'll check again if needed.
                  resolve();
                },
              },
                    ],
                    { cancelable: false }
          );
        });
      }
  
      // --- Brief transition for better UX ---
      await new Promise<void>(resolve => {
        Alert.alert(
          "Great!",
          "Now for the final permission.",
          [{ text: "Continue", onPress: () => resolve() }]
                  );
                });

      // --- Step 2: Usage Stats Permission ---
      // Re-check usage stats in case it was granted in a previous session
      const usageGrantedAfterOverlay = await AppMonitoringModule.hasUsageStatsPermission();
      if (!usageGrantedAfterOverlay) {
        console.log("[Permissions] Requesting Usage Stats permission.");
        await new Promise<void>(resolve => {
                  Alert.alert(
                    "Step 2 of 2: Usage Access",
            "This permission allows FocusGuard to see which app is currently running to know when to lock it.",
                    [
                      {
                        text: "Open Settings",
                        onPress: async () => {
                            await AppMonitoringModule.requestUsageStatsPermission();
                  // As before, we resolve to signal completion of this step.
                  resolve();
                },
              },
                    ],
                    { cancelable: false }
                  );
                });
      }
  
      // --- Final Confirmation ---
                Alert.alert(
        "Setup Complete!",
        "Thank you! FocusGuard is now ready to help you stay focused. You can always manage permissions in your phone's settings.",
        [{ text: "Got it!" }]
                );
  
    } catch (error) {
      console.error('[Permissions] Error during permission setup flow:', error);
      Alert.alert(
        "Setup Error",
        "An unexpected error occurred during permission setup. Please try again or contact support if the problem persists."
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
        Alert.alert(
          "Permissions Required",
          "You must grant Usage Access and Display Over Other Apps permissions to use the lock feature.",
          [
            {
              text: "Grant Usage Access",
              onPress: async () => {
                await AppMonitoringModule.requestUsageStatsPermission();
              }
            },
            {
              text: "Grant Overlay Permission",
              onPress: async () => {
                await requestOverlayPermission();
              }
            },
            { text: "Cancel", style: "cancel" }
          ],
          { cancelable: false }
        );
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

  const handleOpenScheduleModal = () => {
    if (selectedAppsUI.size === 0) {
      Alert.alert("No Apps Selected", "Please select at least one app to schedule.");
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

  const handleOpenLockNowModal = () => {
    if (selectedAppsUI.size === 0) {
      Alert.alert("No Apps Selected", "Please select at least one app to lock.");
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
            contentContainerStyle={styles.appListContent}
            numColumns={4}
            columnWrapperStyle={styles.row}
            ListEmptyComponent={
              <Text style={styles.emptyListText}>
                {searchQuery ? 'No apps match your search.' : (Platform.OS === 'android' ? 'No apps found on device.' : 'App list not available on this platform.')}
              </Text>
            }
          />
        )}
      </ThemedView>

      <View style={styles.floatingContainer}>
        <TouchableOpacity style={styles.floatingButton} onPress={handleOpenScheduleModal}>
          <MaterialIcons name="schedule" size={16} color="#FFFFFF" />
          <ThemedText style={styles.floatingButtonText}>SCHEDULE</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity style={styles.floatingButton} onPress={handleOpenLockNowModal}>
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
    paddingHorizontal: 16,
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
    fontSize: 13,
    color: '#333',
    marginLeft: 8,
    padding: 0,
    backgroundColor: 'transparent',
  },
  appList: {
    flex: 1,
  },
  appListContent: {
    paddingHorizontal: 8,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF7757',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  floatingButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 5,
  },
});
