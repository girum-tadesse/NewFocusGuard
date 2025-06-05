import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface App {
  id: string;
  name: string;
  icon?: string;
}

interface AppCardProps {
  app: App;
  isLocked: boolean;
  isSelected?: boolean;
  onSelect?: (app: App) => void;
}

export const AppCard: React.FC<AppCardProps> = ({
  app,
  isLocked,
  isSelected = false,
  onSelect,
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.container,
        isLocked && styles.lockedContainer,
        isSelected && styles.selectedContainer,
      ]}
      onPress={() => onSelect?.(app)}
      activeOpacity={0.7}
    >
      <View style={styles.appInfo}>
        {app.icon ? (
          <Image
            source={{ uri: `data:image/png;base64,${app.icon}` }}
            style={styles.icon}
          />
        ) : (
          <MaterialIcons name="android" size={40} color="#666" />
        )}
        <Text style={styles.name} numberOfLines={1}>{app.name}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    margin: 4,
    padding: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    alignItems: 'center',
    justifyContent: 'space-between',
    minWidth: 80,
    maxWidth: 120,
  },
  lockedContainer: {
    backgroundColor: '#FFF8F8',
    borderColor: '#FFE8E8',
    borderWidth: 1,
  },
  selectedContainer: {
    borderColor: '#FF7757',
    borderWidth: 2,
    backgroundColor: '#FFF8F8',
  },
  appInfo: {
    alignItems: 'center',
    width: '100%',
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    marginBottom: 4,
  },
  name: {
    fontSize: 12,
    color: '#333',
    textAlign: 'center',
    marginTop: 4,
  },
}); 