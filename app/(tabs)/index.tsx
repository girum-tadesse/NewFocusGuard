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

  // Helper function for Usage Stats part
  const checkAndRequestUsageStats = async () => {
    console.log("[Permissions] Entering checkAndRequestUsageStats - User will always be prompted to check settings.");
    try {
      // We still log the current status for debugging, but the prompt will always show.
      const hasUsagePermission = await AppMonitoringModule.hasUsageStatsPermission();
      console.log("[Permissions] Current usage stats permission status (for logging):", hasUsagePermission);

      Alert.alert(
        "Step 2: Check Usage Access Permission",
        "FocusGuard also needs usage access to monitor and lock apps. Please tap 'Go to Settings' to check or grant this permission.",
        [
          {
            text: "Go to Settings",
            onPress: async () => {
              console.log("[Permissions] User pressed 'Go to Settings' for Usage Access.");
              await AppMonitoringModule.requestUsageStatsPermission(); // Opens settings
              // Optional: Re-check and inform, but primary goal is to take them to settings.
              const usageGrantedAfterSettings = await AppMonitoringModule.hasUsageStatsPermission();
              console.log("[Permissions] Usage stats permission status after settings visit (for logging):", usageGrantedAfterSettings);
              if (!usageGrantedAfterSettings) {
                Alert.alert("Usage Access Still Needed", "If you didn't grant Usage Access, some features might not work correctly.");
              }
            }
          },
          {
            text: "Skip for Now",
            style: "cancel",
            onPress: () => {
              console.log("[Permissions] User skipped Usage Access settings check.");
              Alert.alert("Usage Access Skipped", "If Usage Access is not enabled, app monitoring and locking may not function.");
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error in checkAndRequestUsageStats:', error);
      Alert.alert("Error", "Could not process Usage Access permission check.");
    }
  };

  const checkAndRequestPermissions = async () => {
    console.log("[Permissions] Starting permission setup flow");
    try {
      // Show initial welcome message
      Alert.alert(
        "Welcome to FocusGuard!",
        "To help you stay focused, we need two permissions. We'll guide you through setting these up step by step.",
        [
          {
            text: "Let's Start",
            onPress: async () => {
              try {
                // 1. Handle Overlay Permission FIRST
                console.log("[Permissions] Starting overlay permission flow");
                await new Promise<void>((resolve) => {
                  Alert.alert(
                    "Step 1 of 2: Display Over Other Apps",
                    "First, we need permission to show the lock screen when you try to open a locked app.\n\nOn the next screen, find FocusGuard in the list and turn on 'Allow display over other apps'.",
                    [
                      {
                        text: "Open Settings",
                        onPress: async () => {
                          try {
                            console.log("[Permissions] User proceeding to overlay settings");
                            await requestOverlayPermission();
                            const overlayGranted = await checkOverlayPermission();
                            console.log("[Permissions] Overlay permission status:", overlayGranted);
                            
                            if (!overlayGranted) {
                              Alert.alert(
                                "Permission Not Detected",
                                "The 'Display over other apps' permission appears to be off. Some features may not work correctly.",
                                [{ text: "Continue to Next Step", onPress: () => resolve() }]
                              );
                            } else {
                              Alert.alert(
                                "Permission Granted",
                                "Display over other apps permission is set up successfully.",
                                [{ text: "Continue to Next Step", onPress: () => resolve() }]
                              );
                            }
                          } catch (error) {
                            console.error("[Permissions] Error in overlay setup:", error);
                            resolve(); // Continue to next step even if there's an error
                          }
                        }
                      }
                    ],
                    { cancelable: false }
                  );
                });

                // 2. Handle Usage Stats Permission
                console.log("[Permissions] Starting usage stats permission flow");
                await new Promise<void>((resolve) => {
                  Alert.alert(
                    "Step 2 of 2: Usage Access",
                    "Next, we need permission to detect when you open a locked app.\n\nOn the next screen, find FocusGuard in the list and turn on 'Permit usage access'.",
                    [
                      {
                        text: "Open Settings",
                        onPress: async () => {
                          try {
                            console.log("[Permissions] User proceeding to usage access settings");
                            await AppMonitoringModule.requestUsageStatsPermission();
                            const usageGranted = await AppMonitoringModule.hasUsageStatsPermission();
                            console.log("[Permissions] Usage access permission status:", usageGranted);
                            
                            if (!usageGranted) {
                              Alert.alert(
                                "Permission Not Detected",
                                "The Usage Access permission appears to be off. Some features may not work correctly.",
                                [{ text: "Finish Setup", onPress: () => resolve() }]
                              );
                            } else {
                              Alert.alert(
                                "Setup Complete!",
                                "Great! FocusGuard is now ready to help you stay focused.",
                                [{ text: "Start Using FocusGuard", onPress: () => resolve() }]
                              );
                            }
                          } catch (error) {
                            console.error("[Permissions] Error in usage stats setup:", error);
                            resolve(); // Continue even if there's an error
                          }
                        }
                      }
                    ],
                    { cancelable: false }
                  );
                });
              } catch (error) {
                console.error("[Permissions] Error in permission flow:", error);
                // Show error but don't prevent the app from being used
                Alert.alert(
                  "Permission Setup Issue",
                  "There was an issue during permission setup. You can try setting permissions again from the app settings.",
                  [{ text: "OK" }]
                );
              }
            }
          }
        ],
        { cancelable: false }
      );
    } catch (error) {
      console.error('[Permissions] Error in permission setup:', error);
      Alert.alert(
        "Setup Error",
        "There was an error during the permission setup. Please try again later."
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
          <MaterialIcons name="search" size={24} color="#888" style={styles.searchIcon} />
          <TextInput
            style={styles.searchBar}
            placeholder="Search apps..."
            placeholderTextColor="#888"
            value={searchQuery}
            onChangeText={setSearchQuery}
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

        <View style={styles.buttonsContainer}>
          <TouchableOpacity style={styles.lockNowButton} onPress={handleOpenLockNowModal}>
            <ThemedText style={styles.buttonText}>LOCK NOW</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity style={styles.scheduleButton} onPress={handleOpenScheduleModal}>
            <ThemedText style={styles.buttonText}>SCHEDULE</ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>

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
    borderRadius: 25, 
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0', 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchBar: {
    flex: 1,
    fontSize: 16,
    color: '#333',
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
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    backgroundColor: PURE_WHITE,
  },
  lockNowButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#FF7757',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  scheduleButton: {
    backgroundColor: '#FFFFFF', 
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#FF7757', 
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
