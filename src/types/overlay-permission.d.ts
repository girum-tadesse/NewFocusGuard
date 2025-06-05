interface OverlayPermissionInterface {
  checkPermission(callback: (hasPermission: boolean) => void): void;
  requestPermission(): void;
  showOverlay(): void;
  hideOverlay(): void;
}

declare module '@overlay-permission' {
  const OverlayPermission: OverlayPermissionInterface;
  export default OverlayPermission;
} 