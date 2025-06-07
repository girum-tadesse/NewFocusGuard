import { AppRegistry, NativeEventEmitter, NativeModules } from 'react-native';
import { LockOverlay } from '../components/LockOverlay';
import { ensureOverlayPermission } from '../utils/OverlayPermission';

const { OverlayModule } = NativeModules;

export class OverlayService {
  private static instance: OverlayService;
  private isOverlayVisible: boolean = false;
  private eventEmitter: NativeEventEmitter | null = null;

  private constructor() {
    // Set up event listener for emergency unlock
    if (OverlayModule) {
      this.eventEmitter = new NativeEventEmitter(OverlayModule);
      this.eventEmitter.addListener('onEmergencyUnlock', () => {
        this.isOverlayVisible = false;
      });
    }
  }

  static getInstance(): OverlayService {
    if (!OverlayService.instance) {
      OverlayService.instance = new OverlayService();
    }
    return OverlayService.instance;
  }

  async showLockOverlay(
    appName: string, 
    timeRemaining?: string, 
    onEmergencyUnlock?: () => void,
    emergencyUnlockChances?: number,
    quote?: string
  ) {
    if (this.isOverlayVisible) {
      return;
    }

    const hasPermission = await ensureOverlayPermission();
    if (!hasPermission) {
      console.error('Overlay permission not granted');
      return;
    }

    this.isOverlayVisible = true;
    
    // Register the overlay component for React Native
    AppRegistry.registerComponent('LockOverlay', () => () => 
      LockOverlay({ 
        appName, 
        timeRemaining, 
        emergencyUnlockChances,
        quote,
        onEmergencyUnlock: () => {
          if (onEmergencyUnlock) {
            onEmergencyUnlock();
          }
          
          // Call native module to handle emergency unlock
          if (OverlayModule && OverlayModule.onEmergencyUnlock) {
            OverlayModule.onEmergencyUnlock();
          } else {
            this.hideLockOverlay();
          }
        }
      })
    );

    // Show the overlay using the native module
    if (OverlayModule && OverlayModule.showOverlay) {
      OverlayModule.showOverlay(
        appName,
        timeRemaining || '',
        emergencyUnlockChances || 0,
        quote || ''
      );
    } else {
      console.warn('Native OverlayModule not available');
    }
  }

  hideLockOverlay() {
    if (!this.isOverlayVisible) {
      return;
    }

    this.isOverlayVisible = false;
    
    // Hide the overlay using the native module
    if (OverlayModule && OverlayModule.hideOverlay) {
      OverlayModule.hideOverlay();
    } else {
      console.warn('Native OverlayModule not available');
    }
  }
} 