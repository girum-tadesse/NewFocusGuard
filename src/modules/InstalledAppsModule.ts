import { NativeModules } from 'react-native';

export interface InstalledAppInfo {
  appName: string;
  packageName: string;
  versionName: string;
  icon: string; // Base64 encoded string
}

interface InstalledAppsModuleInterface {
  getInstalledApps(): Promise<InstalledAppInfo[]>;
}

const InstalledAppsModule = NativeModules.InstalledApps as InstalledAppsModuleInterface;

export default InstalledAppsModule; 