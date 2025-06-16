import { StyleSheet, Text, View } from 'react-native';

export default function SettingsScreenPlaceholder() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Settings Screen Coming Soon</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  text: {
    fontSize: 16,
    color: '#666666',
  },
}); 