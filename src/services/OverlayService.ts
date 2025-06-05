import { AppRegistry } from 'react-native';
import { LockOverlay } from '../components/LockOverlay';
import { ensureOverlayPermission } from '../utils/OverlayPermission';

class OverlayService {
  private static instance: OverlayService;
  private isOverlayVisible: boolean = false;

  private constructor() {}

  static getInstance(): OverlayService {
    if (!OverlayService.instance) {
      OverlayService.instance = new OverlayService();
    }
    return OverlayService.instance;
  }

  async showLockOverlay(appName: string, timeRemaining?: string, onEmergencyUnlock?: () => void) {
    if (this.isOverlayVisible) {
      return;
    }

    const hasPermission = await ensureOverlayPermission();
    if (!hasPermission) {
      console.error('Overlay permission not granted');
      return;
    }

    this.isOverlayVisible = true;
    
    // Register the overlay component
    AppRegistry.registerComponent('LockOverlay', () => () => 
      LockOverlay({ 
        appName, 
        timeRemaining, 
        onEmergencyUnlock: () => {
          if (onEmergencyUnlock) {
            onEmergencyUnlock();
          }
          this.hideLockOverlay();
        }
      })
    );

    // Show the overlay using the native module
    // Note: This will be implemented in the native module later
  }

  hideLockOverlay() {
    if (!this.isOverlayVisible) {
      return;
    }

    this.isOverlayVisible = false;
    
    // Hide the overlay using the native module
    // Note: This will be implemented in the native module later
  }
} 