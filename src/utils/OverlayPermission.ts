import { NativeModules, Platform } from 'react-native';

const { OverlayPermission } = NativeModules;

export const checkOverlayPermission = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') {
    return true; // On non-Android platforms, return true
  }

  return new Promise((resolve) => {
    try {
    OverlayPermission.checkPermission((status: boolean) => {
        console.log(`[OverlayPermission] Permission status: ${status}`);
      resolve(status);
    });
    } catch (error) {
      console.error('[OverlayPermission] Error checking permission:', error);
      resolve(false); // Assume permission is not granted in case of error
    }
  });
};

export const requestOverlayPermission = async (): Promise<void> => {
  if (Platform.OS !== 'android') {
    return;
  }
  
  try {
    console.log('[OverlayPermission] Requesting permission');
    await OverlayPermission.requestPermission();
    console.log('[OverlayPermission] Permission request complete');
  } catch (error) {
    console.error('[OverlayPermission] Error requesting permission:', error);
  }
};

export const ensureOverlayPermission = async (): Promise<boolean> => {
  console.log('[OverlayPermission] Ensuring permission');
  const hasPermission = await checkOverlayPermission();
  console.log(`[OverlayPermission] Initial permission check: ${hasPermission}`);
  
  if (!hasPermission) {
    console.log('[OverlayPermission] Permission not granted, requesting...');
    await requestOverlayPermission();
    // Wait a moment for the system to register the permission change
    await new Promise<void>((resolve) => {
      setTimeout(() => { resolve(); }, 500);
    });
    // Check again after the user returns from settings
    const newPermissionStatus = await checkOverlayPermission();
    console.log(`[OverlayPermission] After request, permission status: ${newPermissionStatus}`);
    return newPermissionStatus;
  }
  return true;
}; 