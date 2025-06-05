declare module 'rn-android-overlay-permission' {
  interface OverlayPermissionModule {
    isRequestOverlayPermissionGranted(callback: (status: boolean) => void): void;
    requestOverlayPermission(): void;
  }

  const module: OverlayPermissionModule;
  export default module;
} 