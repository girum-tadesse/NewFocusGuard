import AsyncStorage from '@react-native-async-storage/async-storage';

// Define the headless task
const AppBlockedTask = async (taskData) => {
  console.log('[AppBlockedTask] Headless task started with data:', taskData);

  if (taskData && taskData.packageName) {
    const appName = taskData.packageName;
    const timestamp = new Date().toISOString();
    console.log(`[AppBlockedTask] App blocked: ${appName} at ${timestamp}`);

    // Example: You could store this information or trigger other background JS logic
    try {
      await AsyncStorage.setItem(`@AppBlocked:${appName}:${timestamp}`, JSON.stringify(taskData));
      console.log('[AppBlockedTask] Blocked app event saved to AsyncStorage');
    } catch (e) {
      console.error('[AppBlockedTask] Failed to save to AsyncStorage', e);
    }
  } else {
    console.warn('[AppBlockedTask] Received task data without packageName.');
  }

  // Headless JS tasks should be short-lived. 
  // If you need long-running background work, consider other native Android mechanisms.
};

export default AppBlockedTask; 