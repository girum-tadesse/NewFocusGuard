import { Colors } from '@/constants/Colors';
import { Ionicons, MaterialIcons } from '@expo/vector-icons'; // For the shield icon and other icons
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import React from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';

// Import your screen components.
// `index.tsx` in this directory is treated as the `apps` screen by default by Expo Router if named `index`.
// Or, if you have an `apps.tsx`, Expo Router would use that for an `/apps` route.
// When using a custom navigator like `createMaterialTopTabNavigator`,
// we explicitly provide the component for each tab.
import AnalyticsScreen from './analytics'; // Import the Analytics screen
import ChatScreen from './chat'; // Import the new chat screen
import AppsScreen from './index'; // Assuming your app/(tabs)/index.tsx is the Apps screen content
import LockedScreen from './locked'; // Import the actual LockedScreen component
import ScheduledScreen from './scheduled'; // Import the actual ScheduledScreen component (renamed from placeholder)
import SettingsScreen from './settings'; // Import the actual SettingsScreen component (renamed from placeholder)

const PURE_WHITE = '#FFFFFF';
// const DARK_TEXT_COLOR = Colors.light.text; // No longer needed as text will be white on blue

// Placeholder components for other screens. Replace these with your actual screen components.
// const LockedScreenPlaceholder = () => (
//   <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: PURE_WHITE }}>
//     <Text style={{color: DARK_TEXT_COLOR}}>Locked Screen Content</Text>
//   </View>
// );
// const ScheduledScreenPlaceholder = () => (
//   <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: PURE_WHITE }}>
//     <Text style={{color: DARK_TEXT_COLOR}}>Scheduled Screen Content</Text>
//   </View>
// );
// const ChatScreenPlaceholder = () => (
//   <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: PURE_WHITE }}>
//     <Text style={{color: DARK_TEXT_COLOR}}>Chat Screen Content</Text>
//   </View>
// );
// const SettingsScreenPlaceholder = () => (
//   <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: PURE_WHITE }}>
//     <Text style={{color: DARK_TEXT_COLOR}}>Settings Screen Content</Text>
//   </View>
// );

const Tab = createMaterialTopTabNavigator();

const CustomHeader = () => {
  // const colorScheme = useColorScheme() ?? 'light'; // No longer needed for background
  return (
    <View style={[styles.headerContainer, { backgroundColor: Colors.light.tint }]}> // Changed background color to tint
      <MaterialIcons name="shield" size={24} color={PURE_WHITE} style={styles.headerIcon}/> // Changed icon color to white
      <Text style={[styles.headerTitle, { color: PURE_WHITE }]}>Focus Guard</Text> // Changed text to "Focus Guard"
    </View>
  );
};

export default function TabLayout() {
  // const colorScheme = useColorScheme() ?? 'light'; // No longer needed for these specific colors
  const activeTintColor = PURE_WHITE; // Active text/icon color is white
  const inactiveTintColor = '#E0E0E0'; // Inactive text/icon color is light gray
  const veryLightGrayBorder = '#E0E0E0'; // This might still be used for other borders, keep for now.

  return (
    <SafeAreaView style={[styles.fullScreen, { backgroundColor: Colors.light.tint }]}> // Changed background to tint
      <CustomHeader />
      <Tab.Navigator
        initialRouteName="apps" // Set the initial tab to APPS
        screenOptions={{
          tabBarActiveTintColor: activeTintColor,
          tabBarInactiveTintColor: inactiveTintColor,
          tabBarLabelStyle: { 
            fontWeight: 'normal', 
            fontSize: 11,
            textTransform: 'none', // Remove all caps
          },
          tabBarStyle: {
            backgroundColor: Colors.light.tint, // Changed background to tint
            elevation: 0, // Remove shadow on Android
            shadowOpacity: 0, // Remove shadow on iOS
            borderBottomWidth: 1, // Add a light border line below the tabs
            borderBottomColor: Colors.light.tint, // Make border color blend with background
          },
          tabBarIndicatorStyle: {
            backgroundColor: PURE_WHITE, // Underline color for active tab is white
            height: 3, // Thickness of the underline
          },
          tabBarScrollEnabled: true,
          tabBarItemStyle: {
            paddingHorizontal: 10, // Reduced horizontal padding between tabs
            width: 'auto', // Let the width adjust to content
          },
          tabBarShowIcon: true, // Ensure icons are displayed
          // Removed tabStyle as it's not directly needed and can cause issues with tabBarItemStyle
        }}
      >
        <Tab.Screen 
          name="apps" // This name is for the navigator's internal use
          component={AppsScreen} // The component to render for this tab
          options={{ 
            tabBarLabel: 'Apps',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name="apps-outline" size={focused ? 22 : 20} color={color} /> // Slightly larger when focused
            ),
          }} // Text shown on the tab
        />
        <Tab.Screen 
          name="locked"
          component={LockedScreen} // Use actual component
          options={{
            tabBarLabel: 'Locked',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name="lock-closed-outline" size={focused ? 22 : 20} color={color} /> // Slightly larger when focused
            ),
          }}
        />
        <Tab.Screen 
          name="scheduled"
          component={ScheduledScreen} // Use actual component
          options={{
            tabBarLabel: 'Scheduled',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name="alarm-outline" size={focused ? 22 : 20} color={color} /> // Slightly larger when focused
            ),
          }}
        />
        <Tab.Screen 
          name="chat"
          component={ChatScreen}
          options={{
            tabBarLabel: 'Chat',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name="chatbubbles-outline" size={focused ? 22 : 20} color={color} /> // Slightly larger when focused
            ),
          }}
        />
        <Tab.Screen 
          name="analytics"
          component={AnalyticsScreen}
          options={{
            tabBarLabel: 'Analytics',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name="bar-chart-outline" size={focused ? 22 : 20} color={color} /> // Slightly larger when focused
            ),
          }}
        />
        <Tab.Screen 
          name="settings"
          component={SettingsScreen} // Use actual component
          options={{
            tabBarLabel: 'Settings',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name="settings-outline" size={focused ? 22 : 20} color={color} /> // Slightly larger when focused
            ),
          }}
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
    marginBottom: 30,
    // backgroundColor is set dynamically by theme
  },
  headerIcon: {
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 2, // Added to slightly lower the text
    // color is set dynamically by theme
  },
});
