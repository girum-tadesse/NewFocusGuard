import { AddQuoteModal } from '@/src/components/AddQuoteModal';
import { Colors } from '@/src/constants/Colors';
import { useAuth } from '@/src/contexts/AuthContext';
import MotivationService from '@/src/services/MotivationService';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

export default function SettingsScreen() {
  const { user, userProfile, signOut } = useAuth();
  const [isPasswordModalVisible, setIsPasswordModalVisible] = useState(false);
  
  // Motivation settings state
  const [showProductivityStats, setShowProductivityStats] = useState(true);
  const [quoteCategory, setQuoteCategory] = useState('Motivation');
  const [isAddQuoteModalVisible, setIsAddQuoteModalVisible] = useState(false);
  
  // Load motivation settings on component mount
  useEffect(() => {
    const loadMotivationSettings = async () => {
      try {
        const motivationService = MotivationService.getInstance();
        const settings = await motivationService.getSettings();
        
        setQuoteCategory(settings.quoteCategory);
        setShowProductivityStats(settings.showProductivityStats);
      } catch (error) {
        console.error('Error loading motivation settings:', error);
      }
    };
    
    loadMotivationSettings();
  }, []);
  
  const handleSignOut = async () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Sign Out",
          onPress: async () => {
            const result = await signOut();
            if (result.success) {
              router.replace('/auth');
            } else {
              Alert.alert("Error", "Failed to sign out. Please try again.");
            }
          },
          style: "destructive"
        }
      ]
    );
  };

  const handleUploadMotivationalContent = () => {
    Alert.alert(
      "Upload Content",
      "Choose what type of motivational content you'd like to upload",
      [
        {
          text: "Upload Image",
          onPress: () => Alert.alert("Coming Soon", "Image upload functionality will be available soon.")
        },
        {
          text: "Add Custom Quote",
          onPress: () => setIsAddQuoteModalVisible(true)
        },
        {
          text: "Cancel",
          style: "cancel"
        }
      ]
    );
  };
  
  const handleAddQuote = async (text: string, author?: string) => {
    try {
      const motivationService = MotivationService.getInstance();
      await motivationService.addCustomQuote({
        text,
        category: quoteCategory,
        author
      });
      Alert.alert("Success", "Your custom quote has been added.");
    } catch (error) {
      Alert.alert("Error", "Failed to add custom quote. Please try again.");
    }
  };

  const handleSelectQuoteCategory = () => {
    Alert.alert(
      "Select Quote Category",
      "Choose a category for motivational quotes",
      [
        {
          text: "Motivation",
          onPress: async () => {
            setQuoteCategory("Motivation");
            await MotivationService.getInstance().setQuoteCategory("Motivation");
          }
        },
        {
          text: "Focus",
          onPress: async () => {
            setQuoteCategory("Focus");
            await MotivationService.getInstance().setQuoteCategory("Focus");
          }
        },
        {
          text: "Productivity",
          onPress: async () => {
            setQuoteCategory("Productivity");
            await MotivationService.getInstance().setQuoteCategory("Productivity");
          }
        },
        {
          text: "Mindfulness",
          onPress: async () => {
            setQuoteCategory("Mindfulness");
            await MotivationService.getInstance().setQuoteCategory("Mindfulness");
          }
        },
        {
          text: "Cancel",
          style: "cancel"
        }
      ]
    );
  };
  
  const handleToggleProductivityStats = async (value: boolean) => {
    setShowProductivityStats(value);
    try {
      await MotivationService.getInstance().setShowProductivityStats(value);
    } catch (error) {
      console.error('Error saving productivity stats preference:', error);
    }
  };
  
  const handleManageCustomQuotes = async () => {
    try {
      const motivationService = MotivationService.getInstance();
      const customQuotes = await motivationService.getCustomQuotes();
      
      if (customQuotes.length === 0) {
        Alert.alert("No Custom Quotes", "You haven't added any custom quotes yet.");
        return;
      }
      
      // For now, just show a list of quotes with option to delete
      // In a real app, you might want to navigate to a dedicated screen for this
      Alert.alert(
        "Your Custom Quotes",
        `You have ${customQuotes.length} custom quote(s). You can manage them in the upcoming version.`,
        [
          {
            text: "OK",
            style: "cancel"
          }
        ]
      );
    } catch (error) {
      Alert.alert("Error", "Failed to load custom quotes. Please try again.");
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      {/* User Account Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>User Account</Text>
        
        <View style={styles.profileContainer}>
          <View style={styles.avatarContainer}>
            {userProfile?.photoURL ? (
              <Image 
                source={{ uri: userProfile.photoURL }} 
                style={styles.avatar} 
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {userProfile?.displayName?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || '?'}
                </Text>
              </View>
            )}
          </View>
          
          <View style={styles.profileInfo}>
            <Text style={styles.displayName}>
              {userProfile?.displayName || 'User'}
            </Text>
            <Text style={styles.email}>{user?.email}</Text>
          </View>
        </View>

        <View style={styles.optionsContainer}>
          <TouchableOpacity 
            style={styles.optionItem}
            onPress={() => Alert.alert("Coming Soon", "Edit profile functionality will be available soon.")}
          >
            <Ionicons name="person-outline" size={24} color={Colors.light.tint} />
            <Text style={styles.optionText}>Edit Profile</Text>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.optionItem}
            onPress={() => Alert.alert("Coming Soon", "Change password functionality will be available soon.")}
          >
            <Ionicons name="key-outline" size={24} color={Colors.light.tint} />
            <Text style={styles.optionText}>Change Password</Text>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.optionItem, styles.logoutButton]}
            onPress={handleSignOut}
          >
            <Ionicons name="log-out-outline" size={24} color="#FF3B30" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Motivation Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Motivation</Text>
        
        <View style={styles.optionsContainer}>
          <TouchableOpacity 
            style={styles.optionItem}
            onPress={handleSelectQuoteCategory}
          >
            <Ionicons name="chatbubble-outline" size={24} color={Colors.light.tint} />
            <Text style={styles.optionText}>Quote Category</Text>
            <Text style={styles.optionValue}>{quoteCategory}</Text>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.optionItem}
            onPress={handleUploadMotivationalContent}
          >
            <Ionicons name="cloud-upload-outline" size={24} color={Colors.light.tint} />
            <Text style={styles.optionText}>Upload Motivational Content</Text>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>

          <View style={styles.optionItem}>
            <Ionicons name="stats-chart-outline" size={24} color={Colors.light.tint} />
            <Text style={styles.optionText}>Show Productivity Stats</Text>
            <Switch
              trackColor={{ false: "#E0E0E0", true: `${Colors.light.tint}80` }}
              thumbColor={showProductivityStats ? Colors.light.tint : "#F4F4F4"}
              onValueChange={handleToggleProductivityStats}
              value={showProductivityStats}
            />
          </View>

          <TouchableOpacity 
            style={styles.optionItem}
            onPress={handleManageCustomQuotes}
          >
            <Ionicons name="list-outline" size={24} color={Colors.light.tint} />
            <Text style={styles.optionText}>Manage Custom Quotes</Text>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
        </View>
      </View>

      {/* App Preferences Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>App Preferences</Text>
        <Text style={styles.placeholderText}>Coming soon</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Lock Settings</Text>
        <Text style={styles.placeholderText}>Coming soon</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Support & Feedback</Text>
        <Text style={styles.placeholderText}>Coming soon</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <Text style={styles.versionText}>FocusGuard v1.0.0</Text>
    </View>
      
      {/* Add Quote Modal */}
      <AddQuoteModal
        isVisible={isAddQuoteModalVisible}
        onClose={() => setIsAddQuoteModalVisible(false)}
        onAdd={handleAddQuote}
        category={quoteCategory}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F8',
  },
  header: {
    paddingTop: 20,
    paddingBottom: 10,
    paddingHorizontal: 20,
    backgroundColor: Colors.light.tint,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 10,
    marginHorizontal: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarContainer: {
    marginRight: 15,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  avatarPlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: Colors.light.tint,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  profileInfo: {
    flex: 1,
  },
  displayName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  email: {
    fontSize: 14,
    color: '#666',
  },
  optionsContainer: {
    marginTop: 10,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 15,
  },
  optionValue: {
    fontSize: 14,
    color: '#999',
    marginRight: 10,
  },
  logoutButton: {
    borderBottomWidth: 0,
    marginTop: 10,
  },
  logoutText: {
    flex: 1,
    fontSize: 16,
    color: '#FF3B30',
    marginLeft: 15,
  },
  placeholderText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    paddingVertical: 10,
  },
  versionText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
}); 