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
  const [quoteSource, setQuoteSource] = useState<'default' | 'custom' | 'both'>('both');
  const [isAddQuoteModalVisible, setIsAddQuoteModalVisible] = useState(false);
  
  // Load motivation settings on component mount
  useEffect(() => {
    const loadMotivationSettings = async () => {
      try {
        const motivationService = MotivationService.getInstance();
        const settings = await motivationService.getSettings();
        
        setQuoteCategory(settings.quoteCategory);
        setShowProductivityStats(settings.showProductivityStats);
        setQuoteSource(settings.quoteSource);
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
  
  const handleSelectQuoteSource = () => {
      Alert.alert(
      "Select Quote Source",
      "Choose where to display quotes from",
      [
        {
          text: "Default Quotes Only",
          onPress: async () => {
            setQuoteSource("default");
            await MotivationService.getInstance().setQuoteSource("default");
          }
        },
        {
          text: "Custom Quotes Only",
          onPress: async () => {
            setQuoteSource("custom");
            await MotivationService.getInstance().setQuoteSource("custom");
          }
        },
        {
          text: "Both Default & Custom",
          onPress: async () => {
            setQuoteSource("both");
            await MotivationService.getInstance().setQuoteSource("both");
          }
        },
        {
          text: "Cancel",
          style: "cancel"
        }
      ]
    );
  };
  
  const handleManageCustomQuotes = () => {
    // Navigate to the ManageQuotesScreen
    router.push('/manageQuotes');
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
            onPress={handleSelectQuoteSource}
          >
            <Ionicons name="filter-outline" size={24} color={Colors.light.tint} />
            <Text style={styles.optionText}>Quote Source</Text>
            <Text style={styles.optionValue}>
              {quoteSource === 'default' ? 'Default Only' : 
               quoteSource === 'custom' ? 'Custom Only' : 'Both'}
            </Text>
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
        
        <View style={styles.optionsContainer}>
          <View style={styles.optionItem}>
            <Ionicons name="notifications-outline" size={24} color={Colors.light.tint} />
            <Text style={styles.optionText}>Push Notifications</Text>
            <Switch
              trackColor={{ false: "#E0E0E0", true: `${Colors.light.tint}80` }}
              thumbColor={true ? Colors.light.tint : "#F4F4F4"}
              value={true}
              onValueChange={() => Alert.alert("Coming Soon", "Notification settings will be available in a future update.")}
            />
          </View>
          
          <TouchableOpacity 
            style={styles.optionItem}
            onPress={() => Alert.alert("Coming Soon", "Theme settings will be available in a future update.")}
          >
            <Ionicons name="color-palette-outline" size={24} color={Colors.light.tint} />
            <Text style={styles.optionText}>Theme</Text>
            <Text style={styles.optionValue}>Light</Text>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.optionItem}
            onPress={() => Alert.alert("Data Usage", "FocusGuard stores app usage data locally on your device to provide you with insights about your app habits. This data is not shared with third parties.")}
          >
            <Ionicons name="analytics-outline" size={24} color={Colors.light.tint} />
            <Text style={styles.optionText}>Data Usage</Text>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Lock Settings</Text>
        
        <View style={styles.optionsContainer}>
          <View style={styles.optionItem}>
            <Ionicons name="shield-checkmark-outline" size={24} color={Colors.light.tint} />
            <Text style={styles.optionText}>Strict Mode</Text>
            <Switch
              trackColor={{ false: "#E0E0E0", true: `${Colors.light.tint}80` }}
              thumbColor={false ? Colors.light.tint : "#F4F4F4"}
              value={false}
              onValueChange={() => Alert.alert("Strict Mode", "When enabled, FocusGuard will prevent you from disabling app locks before they expire. This helps maintain your focus and discipline.\n\nThis feature will be available in a future update.")}
            />
          </View>
          
          <TouchableOpacity 
            style={styles.optionItem}
            onPress={() => Alert.alert("Default Lock Duration", "Choose a default lock duration for quick locks. This will be used when you don't specify a custom duration.\n\nThis feature will be available in a future update.")}
          >
            <Ionicons name="time-outline" size={24} color={Colors.light.tint} />
            <Text style={styles.optionText}>Default Lock Duration</Text>
            <Text style={styles.optionValue}>30 min</Text>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.optionItem}
            onPress={() => Alert.alert("Screen Lock Overlay", "Choose the type of overlay to show when an app is locked. Options include full block, motivational quotes, or productivity stats.\n\nThis feature will be available in a future update.")}
          >
            <Ionicons name="layers-outline" size={24} color={Colors.light.tint} />
            <Text style={styles.optionText}>Lock Screen Style</Text>
            <Text style={styles.optionValue}>Default</Text>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Support & Feedback</Text>
        
        <View style={styles.optionsContainer}>
          <TouchableOpacity 
            style={styles.optionItem}
            onPress={() => Alert.alert("Help Center", "Access our help center for tutorials, guides, and answers to frequently asked questions.\n\nThis feature will be available in a future update.")}
          >
            <Ionicons name="help-circle-outline" size={24} color={Colors.light.tint} />
            <Text style={styles.optionText}>Help Center</Text>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.optionItem}
            onPress={() => Alert.alert("Send Feedback", "We value your input! Share your thoughts, suggestions, or report issues to help us improve FocusGuard.\n\nThis feature will be available in a future update.")}
          >
            <Ionicons name="chatbox-outline" size={24} color={Colors.light.tint} />
            <Text style={styles.optionText}>Send Feedback</Text>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.optionItem}
            onPress={() => Alert.alert("Rate the App", "Enjoying FocusGuard? Please consider rating it on the app store to help others discover it.\n\nThis feature will be available in a future update.")}
          >
            <Ionicons name="star-outline" size={24} color={Colors.light.tint} />
            <Text style={styles.optionText}>Rate the App</Text>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        
        <View style={styles.aboutContainer}>
          <View style={styles.appIconContainer}>
            <Image 
              source={require('../../assets/images/icon.png')} 
              style={styles.appIcon} 
            />
          </View>
          
          <Text style={styles.appName}>FocusGuard</Text>
          <Text style={styles.versionText}>Version 1.0.0</Text>
          
          <View style={styles.optionsContainer}>
            <TouchableOpacity 
              style={styles.optionItem}
              onPress={() => Alert.alert("Privacy Policy", "FocusGuard respects your privacy. We do not collect or share your personal data with third parties. All app usage data is stored locally on your device.\n\nA complete privacy policy will be available in a future update.")}
            >
              <Ionicons name="lock-closed-outline" size={24} color={Colors.light.tint} />
              <Text style={styles.optionText}>Privacy Policy</Text>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.optionItem}
              onPress={() => Alert.alert("Terms of Service", "By using FocusGuard, you agree to our terms of service. These terms outline your rights and responsibilities as a user.\n\nComplete terms of service will be available in a future update.")}
            >
              <Ionicons name="document-text-outline" size={24} color={Colors.light.tint} />
              <Text style={styles.optionText}>Terms of Service</Text>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.optionItem}
              onPress={() => Alert.alert("Acknowledgements", "FocusGuard is built with love using React Native, Expo, and other open source technologies.\n\nA complete list of acknowledgements will be available in a future update.")}
            >
              <Ionicons name="heart-outline" size={24} color={Colors.light.tint} />
              <Text style={styles.optionText}>Acknowledgements</Text>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </TouchableOpacity>
          </View>
        </View>
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
    marginBottom: 10,
  },
  aboutContainer: {
    alignItems: 'center',
  },
  appIconContainer: {
    marginVertical: 15,
  },
  appIcon: {
    width: 80,
    height: 80,
    borderRadius: 20,
  },
  appName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
}); 