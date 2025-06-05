import { NativeModules, Platform } from 'react-native';

const { OverlayPermission } = NativeModules;

export const checkOverlayPermission = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') {
    return true; // On non-Android platforms, return true
  }

  return new Promise((resolve) => {
    OverlayPermission.checkPermission((status: boolean) => {
      resolve(status);
    });
  });
};

export const requestOverlayPermission = async (): Promise<void> => {
  if (Platform.OS !== 'android') {
    return;
  }
  
  OverlayPermission.requestPermission();
};

export const ensureOverlayPermission = async (): Promise<boolean> => {
  const hasPermission = await checkOverlayPermission();
  if (!hasPermission) {
    await requestOverlayPermission();
    // We need to check again after the user returns from settings
    return await checkOverlayPermission();
  }
  return true;
}; 