import { NativeEventEmitter, NativeModules, Platform } from 'react-native';
import InsightsService from './InsightsService';

interface AppMonitoringServiceInterface {
  startMonitoring(): Promise<void>;
  stopMonitoring(): Promise<void>;
  isMonitoring(): Promise<boolean>;
  lockApp(packageName: string, duration?: number): Promise<void>;
  unlockApp(packageName: string): Promise<void>;
  getLockedApps(): Map<string, number | undefined>;
  cleanup(): void;
}

class AppMonitoringService {
  private static instance: AppMonitoringService;
  private eventEmitter: NativeEventEmitter;
  private isRunning: boolean = false;
  private listeners: Map<string, () => void> = new Map();
  private lockedApps: Map<string, number | undefined> = new Map(); // packageName -> unlock time (or undefined for indefinite)
  private appBlockedSubscription: (() => void) | null = null;
  private currentApp: { packageName: string; appName: string; startTime: number } | null = null;
  private insightsService: InsightsService | null = null;

  private constructor() {
    console.log('[AppMonitoringService] Constructor called');
    if (Platform.OS !== 'android') {
      console.error('[AppMonitoringService] Platform is not Android');
      throw new Error('AppMonitoringService is only supported on Android');
    }
    
    const { AppMonitoringModule } = NativeModules;
    if (!AppMonitoringModule) {
      console.error('[AppMonitoringService] AppMonitoringModule is not available');
      throw new Error('AppMonitoringModule is not available');
    }
    console.log('[AppMonitoringService] AppMonitoringModule found');

    // Ensure OverlayPermission module is available
    const { OverlayPermission } = NativeModules;
    if (!OverlayPermission) {
      console.error('[AppMonitoringService] OverlayPermission native module is not available.');
      // Not throwing an error here, as the service might run without overlay for other purposes
      // but log it as a critical warning if overlays are expected.
    } else {
      console.log('[AppMonitoringService] OverlayPermission native module found.');
    }

    this.eventEmitter = new NativeEventEmitter(AppMonitoringModule);
    console.log('[AppMonitoringService] NativeEventEmitter initialized');

    // Initialize insights service
    this.insightsService = InsightsService.getInstance();
    this.insightsService.initialize().catch(error => {
      console.error('[AppMonitoringService] Failed to initialize InsightsService:', error);
    });

    // Automatically subscribe to app blocked events when the service is instantiated
    this.appBlockedSubscription = this.addAppBlockedListener((event) => {
      // The primary action of showing the overlay is handled within addAppBlockedListener.
      // This callback is here if any additional JS-side logic is needed upon app block.
      console.log(`[AppMonitoringService] AppBlockedListener (internal subscription) received: ${event.packageName}`);
      
      // Record lock event in insights
      if (this.insightsService) {
        const startTime = Date.now();
        // We don't know the end time yet, so we'll use the same time
        // This will be updated when the app changes or when the lock is bypassed
        this.insightsService.recordLockEvent(
          event.packageName, // Using packageName as appName for now
          event.packageName,
          startTime,
          startTime,
          true // Assume successful by default
        ).catch(error => {
          console.error('[AppMonitoringService] Failed to record lock event:', error);
        });
      }
    });

    // Add app change listener to track app usage
    this.addAppChangeListener(this.handleAppChange.bind(this));
  }

  private handleAppChange(packageName: string): void {
    console.log(`[AppMonitoringService] App changed to: ${packageName}`);
    
    const now = Date.now();
    
    // If we have a previous app, record its usage
    if (this.currentApp && this.insightsService) {
      const duration = now - this.currentApp.startTime;
      console.log(`[AppMonitoringService] Recording usage for ${this.currentApp.packageName} (${duration}ms)`);
      
      this.insightsService.recordAppUsage(
        this.currentApp.packageName,
        this.currentApp.appName || this.currentApp.packageName,
        duration
      ).catch(error => {
        console.error('[AppMonitoringService] Failed to record app usage:', error);
      });
      
      // If the previous app was locked and we're switching away from it,
      // record a successful lock event (user respected the lock)
      if (this.lockedApps.has(this.currentApp.packageName)) {
        this.insightsService.recordLockEvent(
          this.currentApp.appName || this.currentApp.packageName,
          this.currentApp.packageName,
          this.currentApp.startTime,
          now,
          true // Lock was successful as user switched away
        ).catch(error => {
          console.error('[AppMonitoringService] Failed to record lock event:', error);
        });
      }
    }
    
    // Update current app
    this.currentApp = {
      packageName,
      appName: packageName, // We don't have the app name yet, using package name as fallback
      startTime: now
    };
    
    // If this app is locked, we'll get an onAppBlocked event later
  }

  public static getInstance(): AppMonitoringService {
    console.log('[AppMonitoringService] getInstance called');
    if (!AppMonitoringService.instance) {
      console.log('[AppMonitoringService] Creating new instance');
      AppMonitoringService.instance = new AppMonitoringService();
    }
    return AppMonitoringService.instance;
  }

  public async startMonitoring(): Promise<void> {
    console.log(`[AppMonitoringService] startMonitoring called. Current isRunning: ${this.isRunning}`);
    if (this.isRunning) {
      console.log('[AppMonitoringService] Monitoring is already running.');
      return;
    }
    
    try {
      console.log('[AppMonitoringService] Attempting to call NativeModules.AppMonitoringModule.startMonitoring()');
      await NativeModules.AppMonitoringModule.startMonitoring();
      this.isRunning = true;
      console.log('[AppMonitoringService] Monitoring started successfully. isRunning set to true.');
    } catch (error) {
      // Don't throw error - gracefully handle and log it
      console.error('Failed to start monitoring, but continuing app execution:', error);
      // Don't rethrow the error to prevent app from crashing or freezing
      // Just consider monitoring as not running
      this.isRunning = false;
    }
  }

  public async stopMonitoring(): Promise<void> {
    console.log(`[AppMonitoringService] stopMonitoring called. Current isRunning: ${this.isRunning}`);
    if (!this.isRunning) {
      console.log('[AppMonitoringService] Monitoring is not running.');
      return;
    }
    
    try {
      console.log('[AppMonitoringService] Attempting to call NativeModules.AppMonitoringModule.stopMonitoring()');
      await NativeModules.AppMonitoringModule.stopMonitoring();
      this.isRunning = false;
      console.log('[AppMonitoringService] Monitoring stopped successfully. isRunning set to false.');
      
      // Record final app usage when monitoring stops
      if (this.currentApp && this.insightsService) {
        const now = Date.now();
        const duration = now - this.currentApp.startTime;
        
        this.insightsService.recordAppUsage(
          this.currentApp.packageName,
          this.currentApp.appName || this.currentApp.packageName,
          duration
        ).catch(error => {
          console.error('[AppMonitoringService] Failed to record final app usage:', error);
        });
        
        this.currentApp = null;
      }
    } catch (error) {
      console.error('Failed to stop monitoring:', error);
      throw error;
    }
  }

  public async isMonitoring(): Promise<boolean> {
    return this.isRunning;
  }

  public async lockApp(packageName: string, duration?: number): Promise<void> {
    console.log(`[AppMonitoringService] lockApp called for packageName: ${packageName}, duration: ${duration} minutes`);
    try {
      // Store the lock information
      if (duration) {
        const unlockTime = Date.now() + duration * 60 * 1000; // Convert minutes to milliseconds
        this.lockedApps.set(packageName, unlockTime);
        console.log(`[AppMonitoringService] App ${packageName} locked until ${new Date(unlockTime)}`);
      } else {
        this.lockedApps.set(packageName, undefined); // Indefinite lock
        console.log(`[AppMonitoringService] App ${packageName} locked indefinitely`);
      }
      console.log(`[AppMonitoringService] lockedApps map size: ${this.lockedApps.size}, current app ${packageName} added/updated. Map keys: ${JSON.stringify(Array.from(this.lockedApps.keys()))}`);

      // Start monitoring if not already running
      if (!this.isRunning) {
        console.log('[AppMonitoringService] Monitoring not running, attempting to start it via lockApp.');
        await this.startMonitoring();
      } else {
        console.log('[AppMonitoringService] Monitoring is already running.');
      }

      // ALWAYS send the lock command to the native module after ensuring monitoring is (or will be) active
      // The native module will then send an intent to the native service.
      console.log(`[AppMonitoringService] Calling NativeModules.AppMonitoringModule.lockApp for ${packageName}`);
      await NativeModules.AppMonitoringModule.lockApp(packageName, duration);

    } catch (error) {
      console.error('Failed to lock app:', error);
      throw error;
    }
  }

  public async unlockApp(packageName: string): Promise<void> {
    console.log(`[AppMonitoringService] unlockApp called for packageName: ${packageName}`);
    try {
      const wasLocked = this.lockedApps.has(packageName);
      this.lockedApps.delete(packageName);
      console.log(`[AppMonitoringService] App ${packageName} unlocked. Remaining locked apps map size: ${this.lockedApps.size}`);

      // If the unlocked app was the one potentially showing an overlay, hide it.
      // This is a simplification; ideally, we'd only hide if no OTHER locked app is active.
      // For now, if any app is unlocked, we'll try to hide the overlay.
      if (wasLocked && NativeModules.OverlayPermission) {
        console.log(`[AppMonitoringService] Attempting to hide overlay as ${packageName} was unlocked.`);
        NativeModules.OverlayPermission.hideOverlay();
      }

      // If no more apps are locked, stop monitoring
      if (this.lockedApps.size === 0) {
        console.log('[AppMonitoringService] No more locked apps, attempting to stop monitoring.');
        await this.stopMonitoring();
      }
    } catch (error) {
      console.error('Failed to unlock app:', error);
      throw error;
    }
  }

  // Get the current locked apps map
  public getLockedApps(): Map<string, number | undefined> {
    console.log('[AppMonitoringService] getLockedApps called');
    // Return a copy of the map to prevent direct modification
    return new Map(this.lockedApps);
  }

  public cleanup(): void {
    console.log('[AppMonitoringService] cleanup called');
    // Remove all listeners
    this.listeners.forEach(removeListener => removeListener());
    this.listeners.clear();

    // Explicitly remove the internal subscription if it exists
    if (this.appBlockedSubscription) {
      console.log('[AppMonitoringService] Removing internal appBlockedSubscription.');
      this.appBlockedSubscription();
      this.appBlockedSubscription = null;
    }

    // Stop monitoring
    this.stopMonitoring().catch(error => {
      console.error('[AppMonitoringService] Failed to stop monitoring during cleanup:', error);
    });

    // Hide overlay if it was active
    if (NativeModules.OverlayPermission) {
      console.log('[AppMonitoringService] Attempting to hide overlay during cleanup.');
      NativeModules.OverlayPermission.hideOverlay();
    }

    // Clear locked apps
    this.lockedApps.clear();
  }

  public addAppChangeListener(callback: (packageName: string) => void): () => void {
    console.log('[AppMonitoringService] addAppChangeListener called');
    const subscription = this.eventEmitter.addListener('onAppChange', (event) => {
      console.log('[AppMonitoringService] onAppChange event received:', event);
      if (event && event.packageName) {
        callback(event.packageName);
      } else {
        console.warn('[AppMonitoringService] onAppChange event received without packageName:', event);
      }
    });

    const removeListener = () => {
      subscription.remove();
    };

    this.listeners.set(callback.toString(), removeListener);
    return removeListener;
  }

  public removeAppChangeListener(callback: (packageName: string) => void): void {
    console.log('[AppMonitoringService] removeAppChangeListener called');
    const removeListener = this.listeners.get(callback.toString());
    if (removeListener) {
      removeListener();
      this.listeners.delete(callback.toString());
    }
  }

  // Listener for when a locked app is detected in the foreground
  public addAppBlockedListener(callback: (event: { packageName: string; remainingTime?: number }) => void): () => void {
    console.log('[AppMonitoringService] addAppBlockedListener called');
    const subscription = this.eventEmitter.addListener('onAppBlocked', (event) => {
      console.log('[AppMonitoringService] onAppBlocked event received:', event);
      if (event && event.packageName) {
        // Call the generic callback
        callback(event);
        // Directly try to show overlay
        if (NativeModules.OverlayPermission) {
          console.log(`[AppMonitoringService] Attempting to show overlay for blocked app: ${event.packageName}`);
          NativeModules.OverlayPermission.showOverlay();
        } else {
          console.warn('[AppMonitoringService] OverlayPermission module not available to show overlay.');
        }
      } else {
        console.warn('[AppMonitoringService] onAppBlocked event received without packageName:', event);
      }
    });

    const removeListener = () => {
      subscription.remove();
    };
    this.listeners.set('onAppBlockedListener', removeListener); // Use a unique key for this listener type
    return removeListener;
  }

  public removeAppBlockedListener(): void {
    console.log('[AppMonitoringService] removeAppBlockedListener called');
    const removeListener = this.listeners.get('onAppBlockedListener');
    if (removeListener) {
      removeListener();
      this.listeners.delete('onAppBlockedListener');
    }
  }
}

export default AppMonitoringService; 