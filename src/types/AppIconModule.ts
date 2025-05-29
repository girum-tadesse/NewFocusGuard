import { NativeModules } from 'react-native';

interface AppIconModuleInterface {
  getAppIcon(packageName: string): Promise<{ icon: string }>;
}

export const AppIconModule = NativeModules.AppIconModule as AppIconModuleInterface;

export default AppIconModule; 