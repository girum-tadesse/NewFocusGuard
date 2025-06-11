import { AppRegistry } from 'react-native';
import AppBlockedTask from './src/services/AppBlockedTask'; // Path to your headless task

// Register the headless task
AppRegistry.registerHeadlessTask('AppBlocked', () => AppBlockedTask);

// Note: Do NOT call AppRegistry.registerComponent('main', () => App) here 
// if you are using Expo Router, as it handles app registration.
// This file is solely for the headless task registration. 