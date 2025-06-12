import { Colors } from '@/constants/Colors';
import { MaterialIcons } from '@expo/vector-icons'; // For the shield icon
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import React from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';

// Import your screen components.
// `index.tsx` in this directory is treated as the `apps` screen by default by Expo Router if named `index`.
// Or, if you have an `apps.tsx`, Expo Router would use that for an `/apps` route.
// When using a custom navigator like `createMaterialTopTabNavigator`,
// we explicitly provide the component for each tab.
import AppsScreen from './index'; // Assuming your app/(tabs)/index.tsx is the Apps screen content

const PURE_WHITE = '#FFFFFF';
const DARK_TEXT_COLOR = Colors.light.text; // Or directly '#000000' or another dark color

// Placeholder components for other screens. Replace these with your actual screen components.
const LockedScreenPlaceholder = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: PURE_WHITE }}>
    <Text style={{color: DARK_TEXT_COLOR}}>Locked Screen Content</Text>
  </View>
);
const ScheduledScreenPlaceholder = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: PURE_WHITE }}>
    <Text style={{color: DARK_TEXT_COLOR}}>Scheduled Screen Content</Text>
  </View>
);
const ChatScreenPlaceholder = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: PURE_WHITE }}>
    <Text style={{color: DARK_TEXT_COLOR}}>Chat Screen Content</Text>
  </View>
);
const SettingsScreenPlaceholder = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: PURE_WHITE }}>
    <Text style={{color: DARK_TEXT_COLOR}}>Settings Screen Content</Text>
  </View>
);

const Tab = createMaterialTopTabNavigator();

const CustomHeader = () => {
  // const colorScheme = useColorScheme() ?? 'light'; // No longer needed for background
  return (
    <View style={[styles.headerContainer, { backgroundColor: PURE_WHITE }]}>
      <MaterialIcons name="shield" size={24} color={DARK_TEXT_COLOR} style={styles.headerIcon}/>
      <Text style={[styles.headerTitle, { color: DARK_TEXT_COLOR }]}>FOCUSGUARD</Text>
    </View>
  );
};

export default function TabLayout() {
  // const colorScheme = useColorScheme() ?? 'light'; // No longer needed for these specific colors
  const activeTintColor = Colors.light.tint; // Use light theme tint for active elements on white bg
  const inactiveTintColor = Colors.light.tabIconDefault; // Use light theme inactive for elements on white bg
  const veryLightGrayBorder = '#E0E0E0';

  return (
    <SafeAreaView style={[styles.fullScreen, { backgroundColor: PURE_WHITE }]}>
      <CustomHeader />
      <Tab.Navigator
        initialRouteName="apps" // Set the initial tab to APPS
        screenOptions={{
          tabBarActiveTintColor: activeTintColor,
          tabBarInactiveTintColor: inactiveTintColor,
          tabBarLabelStyle: { 
            fontWeight: 'bold', 
            fontSize: 12,
          },
          tabBarStyle: {
            backgroundColor: PURE_WHITE,
            elevation: 0, // Remove shadow on Android
            shadowOpacity: 0, // Remove shadow on iOS
            borderBottomWidth: 1, // Add a light border line below the tabs
            borderBottomColor: veryLightGrayBorder, // Use a light gray or theme color
          },
          tabBarIndicatorStyle: {
            backgroundColor: activeTintColor, // Underline color for active tab
            height: 3, // Thickness of the underline
          },
          tabBarScrollEnabled: true,
          tabBarItemStyle: {
            paddingHorizontal: 10, // Reduced horizontal padding between tabs
            width: 'auto', // Let the width adjust to content
          },
        }}
      >
        <Tab.Screen 
          name="apps" // This name is for the navigator's internal use
          component={AppsScreen} // The component to render for this tab
          options={{ tabBarLabel: 'APPS' }} // Text shown on the tab
        />
        <Tab.Screen 
          name="locked"
          component={LockedScreenPlaceholder}
          options={{ tabBarLabel: 'LOCKED' }}
        />
        <Tab.Screen 
          name="scheduled"
          component={ScheduledScreenPlaceholder}
          options={{ tabBarLabel: 'SCHEDULED' }}
        />
        <Tab.Screen 
          name="chat"
          component={ChatScreenPlaceholder}
          options={{ tabBarLabel: 'CHAT' }}
        />
        <Tab.Screen 
          name="settings"
          component={SettingsScreenPlaceholder}
          options={{ tabBarLabel: 'SETTINGS' }}
        />
      </Tab.Navigator>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12, 
    // backgroundColor is set dynamically by theme
  },
  headerIcon: {
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    // color is set dynamically by theme
  },
});
