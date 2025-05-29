import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import React, { useEffect, useState } from 'react';
import { FlatList, Image, Platform, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
// We'll use a simple grid icon for now, you might want to replace this later
import { MaterialIcons } from '@expo/vector-icons';
// Only import getInstalledApps, we will define the type locally
import AppIconModule from '@/src/types/AppIconModule';
import { getInstalledApps } from 'react-native-get-app-list';

// Define the type based on actual library output confirmed from logs
interface InstalledAppFromLibrary {
  appName: string;
  packageName: string;
  versionName?: string;
  // No versionCode or icon is provided by this library
}

// Define a type for our app data structure, using packageName as id
interface DisplayAppInfo {
  id: string; // Will be packageName
  name: string;
  icon?: string; // Base64 encoded icon
}

const PURE_WHITE = '#FFFFFF'; // Define pure white

export default function AppsScreen() {
  const [searchText, setSearchText] = useState('');
  const [selectedApps, setSelectedApps] = useState<Set<string>>(new Set());
  const [installedApps, setInstalledApps] = useState<DisplayAppInfo[]>([]); // State for actual apps
  const [isLoadingApps, setIsLoadingApps] = useState(true); // Loading state

  useEffect(() => {
    const fetchApps = async () => {
      if (Platform.OS === 'android') { // Ensure it only runs on Android
        try {
          setIsLoadingApps(true);
          console.log('Fetching installed apps...');
          const apps: InstalledAppFromLibrary[] = await getInstalledApps();
          console.log('Fetched apps:', apps.length, apps.length > 0 ? apps[0] : 'No apps found to log');
          
          // Create array to store apps with icons
          const appsWithIcons: DisplayAppInfo[] = [];
          
          // Fetch icons for each app
          for (const app of apps) {
            if (app.appName && app.packageName) {
              try {
                const iconResult = await AppIconModule.getAppIcon(app.packageName);
                appsWithIcons.push({
                  id: app.packageName,
                  name: app.appName,
                  icon: iconResult.icon
                });
              } catch (iconError) {
                console.warn(`Failed to fetch icon for ${app.packageName}:`, iconError);
                // Still add the app, but without an icon
                appsWithIcons.push({
                  id: app.packageName,
                  name: app.appName
                });
              }
            }
          }
          
          setInstalledApps(appsWithIcons);
        } catch (error) {
          console.error('Error fetching installed apps:', error);
          // Optionally, set an error state here to display to the user
        } finally {
          setIsLoadingApps(false);
        }
      } else {
        console.log('Not on Android, skipping app fetch.');
        // Optionally set some mock data for non-Android or an empty list
        setInstalledApps([]);
        setIsLoadingApps(false);
      }
    };

    fetchApps();
  }, []); // Empty dependency array ensures this runs once on mount

  const toggleAppSelection = (appId: string) => {
    setSelectedApps(prevSelected => {
      const newSelected = new Set(prevSelected);
      if (newSelected.has(appId)) {
        newSelected.delete(appId);
      } else {
        newSelected.add(appId);
      }
      return newSelected;
    });
  };

  // renderAppItem now expects DisplayAppInfo
  const renderAppItem = ({ item }: { item: DisplayAppInfo }) => (
    <TouchableOpacity
      style={[styles.appItem, selectedApps.has(item.id) && styles.appItemSelected]}
      onPress={() => toggleAppSelection(item.id)}
    >
      {item.icon ? (
        <Image
          source={{ uri: `data:image/png;base64,${item.icon}` }}
          style={styles.appIcon}
        />
      ) : (
        <MaterialIcons 
          name="apps" 
          size={30} 
          color={selectedApps.has(item.id) ? '#FF7757' : "#888"} 
          style={styles.appIconPlaceholder} 
        />
      )}
      <Text style={[styles.appName, selectedApps.has(item.id) && styles.appNameSelected]} numberOfLines={1}>{item.name}</Text>
    </TouchableOpacity>
  );

  // Filter apps based on search text
  const filteredApps = installedApps.filter(app =>
    app.name.toLowerCase().includes(searchText.toLowerCase())
  );

  // Display loading indicator or empty list message
  const ListContent = () => {
    if (isLoadingApps) {
      return <Text style={styles.emptyListText}>Loading apps...</Text>;
    }
    if (filteredApps.length === 0 && !isLoadingApps) {
      return <Text style={styles.emptyListText}>{searchText ? 'No apps match your search.' : 'No apps found.'}</Text>;
    }
    return null; // Handled by FlatList's ListEmptyComponent if data is empty after loading
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ThemedView style={styles.container}>
        <View style={styles.searchBarContainer}>
          <MaterialIcons name="search" size={24} color="#888" style={styles.searchIcon} />
          <TextInput
            style={styles.searchBar}
            placeholder="Search apps..."
            placeholderTextColor="#888"
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>

        {/* Conditional rendering for loading or list */}
        {isLoadingApps && <Text style={styles.emptyListText}>Loading apps...</Text>}
        {!isLoadingApps && (
          <FlatList
            data={filteredApps}
            renderItem={renderAppItem}
            keyExtractor={item => item.id} // id is now packageName
            numColumns={4} // Adjust number of columns as needed
            style={styles.appList}
            contentContainerStyle={styles.appListContent}
            ListEmptyComponent={
              <Text style={styles.emptyListText}>
                {searchText ? 'No apps match your search.' : (Platform.OS === 'android' ? 'No apps found on device.' : 'App list not available on this platform.')}
              </Text>
            }
          />
        )}

        <View style={styles.buttonsContainer}>
          <TouchableOpacity style={styles.scheduleButton} onPress={() => console.log('Schedule pressed', Array.from(selectedApps))}>
            <ThemedText style={styles.buttonText}>SCHEDULE</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity style={styles.lockNowButton} onPress={() => console.log('Lock Now pressed', Array.from(selectedApps))}>
            <ThemedText style={styles.buttonText}>LOCK NOW</ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: PURE_WHITE,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 10, 
    backgroundColor: PURE_WHITE,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF', 
    borderRadius: 25, 
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0', 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchBar: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  appList: {
    flex: 1,
  },
  appListContent: {
    alignItems: 'center', 
  },
  appItem: {
    backgroundColor: PURE_WHITE, 
    borderRadius: 10,
    padding: 10,
    margin: 6, 
    alignItems: 'center',
    justifyContent: 'center',
    width: 75, 
    height: 75, 
    borderWidth: 1,
    borderColor: '#EAEAEA', 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  appItemSelected: {
    borderColor: '#FF7757', 
    backgroundColor: '#FFF0E6',
  },
  appIcon: {
    width: 30,
    height: 30,
    marginBottom: 5,
    resizeMode: 'contain',
  },
  appIconPlaceholder: {
    marginBottom: 5,
  },
  appName: {
    fontSize: 12,
    textAlign: 'center',
    color: '#333',
  },
  appNameSelected: {
    color: '#FF7757',
    fontWeight: 'bold',
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    backgroundColor: PURE_WHITE,
  },
  scheduleButton: {
    backgroundColor: '#FFFFFF', 
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#FF7757', 
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockNowButton: {
    backgroundColor: '#FF7757', 
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  emptyListText: {
    marginTop: 50,
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    flex: 1, // Ensure it can take up space if FlatList is empty
    justifyContent: 'center',
    alignItems: 'center'
  }
});
