import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import AppMonitoringService from '../services/AppMonitoringService';

interface LockedApp {
  packageName: string;
  name: string;
  lockUntil?: number; // timestamp when the lock expires
  scheduledTimes?: {
    start: string; // HH:mm format
    end: string; // HH:mm format
    days: number[]; // 0-6 for Sunday-Saturday
  }[];
}

export const useAppLocking = () => {
  const [lockedApps, setLockedApps] = useState<LockedApp[]>([]);
  const monitoringService = AppMonitoringService.getInstance();

  // Load locked apps from storage
  useEffect(() => {
    loadLockedApps();
    setupMonitoring();
    
    return () => {
      // Intentionally not calling monitoringService.cleanup() here.
      // The service should persist in the background to handle scheduled locks
      // even when the component that initiated it unmounts.
      // The native Android lifecycle methods (onTaskRemoved, onDestroy) will handle
      // service restarts if needed.
    };
  }, []);

  const setupMonitoring = async () => {
    // The native startMonitoring method will internally check and prompt for
    // permissions if they are not already granted.
    monitoringService.startMonitoring();
  };

  const loadLockedApps = async () => {
    try {
      const storedApps = await AsyncStorage.getItem('lockedApps');
      if (storedApps) {
        const apps = JSON.parse(storedApps) as LockedApp[];
        setLockedApps(apps);
        // Sync with monitoring service
        apps.forEach(app => {
          if (app.lockUntil && app.lockUntil > Date.now()) {
            const remainingMinutes = Math.ceil((app.lockUntil - Date.now()) / 60000);
            monitoringService.lockApp(app.packageName, remainingMinutes);
          } else if (!app.lockUntil) {
            monitoringService.lockApp(app.packageName);
          }
        });
      }
    } catch (error) {
      console.error('Error loading locked apps:', error);
    }
  };

  const saveLockedApps = async (apps: LockedApp[]) => {
    try {
      await AsyncStorage.setItem('lockedApps', JSON.stringify(apps));
    } catch (error) {
      console.error('Error saving locked apps:', error);
    }
  };

  const lockApp = useCallback(async (
    packageName: string,
    name: string,
    duration?: number,
    schedule?: {
      start: string;
      end: string;
      days: number[];
    }[]
  ) => {
    const newLockedApp: LockedApp = {
      packageName,
      name,
      lockUntil: duration ? Date.now() + duration * 60000 : undefined,
      scheduledTimes: schedule,
    };

    const updatedApps = [...lockedApps, newLockedApp];
    setLockedApps(updatedApps);
    await saveLockedApps(updatedApps);

    // Start monitoring the app
    if (duration) {
      monitoringService.lockApp(packageName, duration);
    } else {
      monitoringService.lockApp(packageName);
    }
  }, [lockedApps]);

  const unlockApp = useCallback(async (packageName: string) => {
    const updatedApps = lockedApps.filter(app => app.packageName !== packageName);
    setLockedApps(updatedApps);
    await saveLockedApps(updatedApps);

    // Stop monitoring the app
    monitoringService.unlockApp(packageName);
  }, [lockedApps]);

  const isAppLocked = useCallback((packageName: string) => {
    const app = lockedApps.find(a => a.packageName === packageName);
    if (!app) return false;

    // Check if the app is locked by time duration
    if (app.lockUntil) {
      return app.lockUntil > Date.now();
    }

    // Check if the app is locked by schedule
    if (app.scheduledTimes) {
      const now = new Date();
      const currentDay = now.getDay();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

      return app.scheduledTimes.some(schedule => {
        if (!schedule.days.includes(currentDay)) return false;
        return currentTime >= schedule.start && currentTime <= schedule.end;
      });
    }

    return true; // App is locked indefinitely if no time constraints
  }, [lockedApps]);

  return {
    lockedApps,
    lockApp,
    unlockApp,
    isAppLocked,
  };
}; 