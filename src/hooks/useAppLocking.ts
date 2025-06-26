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
    // We no longer automatically start monitoring when the component mounts
    // The monitoring will be started when the user attempts to lock or schedule an app
  };

  const loadLockedApps = async () => {
    try {
      const storedApps = await AsyncStorage.getItem('lockedApps');
      if (storedApps) {
        const apps = JSON.parse(storedApps) as LockedApp[];
        
        // Check for apps with unreasonably far future unlock times (likely from the old bug)
        const now = Date.now();
        const oneYearFromNow = now + 365 * 24 * 60 * 60 * 1000; // One year in milliseconds
        const fixedApps = apps.map(app => {
          if (app.lockUntil && app.lockUntil > oneYearFromNow) {
            console.log(`[useAppLocking] Found app with unreasonably long lock: ${app.packageName}. Fixing...`);
            // This is likely from the old bug where milliseconds were treated as minutes
            // Let's convert it to a reasonable duration (1 hour)
            return {
              ...app,
              lockUntil: now + 60 * 60 * 1000 // 1 hour from now
            };
          }
          return app;
        });
        
        setLockedApps(fixedApps);
        
        // Sync with monitoring service
        fixedApps.forEach(app => {
          if (app.lockUntil && app.lockUntil > Date.now()) {
            const remainingMinutes = Math.ceil((app.lockUntil - Date.now()) / 60000);
            console.log(`[useAppLocking] Loading app ${app.packageName} with ${remainingMinutes} minutes remaining`);
            monitoringService.lockApp(app.packageName, remainingMinutes);
          } else if (!app.lockUntil) {
            monitoringService.lockApp(app.packageName);
          }
        });
        
        // If we fixed any apps, save the fixed versions back to storage
        if (JSON.stringify(fixedApps) !== storedApps) {
          saveLockedApps(fixedApps);
        }
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
    // If duration is provided in milliseconds (from old code), convert it to minutes
    let durationInMinutes = duration;
    if (duration && duration > 10000) {  // If duration is very large, assume it's in milliseconds
      durationInMinutes = Math.ceil(duration / 60000);
      console.log(`[useAppLocking] Converting large duration ${duration}ms to ${durationInMinutes} minutes`);
    }
    
    const newLockedApp: LockedApp = {
      packageName,
      name,
      lockUntil: durationInMinutes ? Date.now() + durationInMinutes * 60000 : undefined,
      scheduledTimes: schedule,
    };

    const updatedApps = [...lockedApps, newLockedApp];
    setLockedApps(updatedApps);
    await saveLockedApps(updatedApps);

    // Start monitoring the app
    if (durationInMinutes) {
      monitoringService.lockApp(packageName, durationInMinutes);
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