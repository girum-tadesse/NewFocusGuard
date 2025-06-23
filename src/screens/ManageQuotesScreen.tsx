import { Colors } from '@/src/constants/Colors';
import MotivationService, { Quote } from '@/src/services/MotivationService';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { AddQuoteModal } from '../components/AddQuoteModal';

export default function ManageQuotesScreen() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddQuoteModalVisible, setIsAddQuoteModalVisible] = useState(false);
  const [quoteCategory, setQuoteCategory] = useState('Motivation');
  const navigation = useNavigation();
  
  useEffect(() => {
    loadQuotes();
    
    // Get the quote category preference
    const getQuoteCategory = async () => {
      try {
        const category = await MotivationService.getInstance().getQuoteCategory();
        setQuoteCategory(category);
      } catch (error) {
        console.error('Error loading quote category preference:', error);
      }
    };
    
    getQuoteCategory();
  }, []);
  
  const loadQuotes = async () => {
    setLoading(true);
    try {
      const customQuotes = await MotivationService.getInstance().getCustomQuotes();
      setQuotes(customQuotes);
    } catch (error) {
      Alert.alert('Error', 'Failed to load custom quotes. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleDeleteQuote = (quote: Quote) => {
    Alert.alert(
      'Delete Quote',
      'Are you sure you want to delete this quote?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await MotivationService.getInstance().deleteCustomQuote(quote.id);
              // Refresh quotes after deletion
              loadQuotes();
              Alert.alert('Success', 'Quote deleted successfully.');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete quote. Please try again.');
            }
          }
        }
      ]
    );
  };
  
  const handleAddQuote = async (text: string, author?: string) => {
    try {
      await MotivationService.getInstance().addCustomQuote({
        text,
        category: quoteCategory,
        author
      });
      
      // Refresh quotes after adding
      loadQuotes();
      setIsAddQuoteModalVisible(false);
      Alert.alert('Success', 'Your custom quote has been added.');
    } catch (error) {
      Alert.alert('Error', 'Failed to add custom quote. Please try again.');
    }
  };
  
  const renderQuoteItem = ({ item }: { item: Quote }) => {
    return (
      <View style={styles.quoteItem}>
        <View style={styles.quoteContent}>
          <Text style={styles.quoteText}>"{item.text}"</Text>
          
          {item.author && (
            <Text style={styles.quoteAuthor}>— {item.author}</Text>
          )}
          
          <Text style={styles.quoteCategory}>Category: {item.category}</Text>
        </View>
        
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteQuote(item)}
        >
          <Ionicons name="trash-outline" size={22} color="#FF3B30" />
        </TouchableOpacity>
      </View>
    );
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Custom Quotes</Text>
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.tint} />
        </View>
      ) : (
        <View style={styles.content}>
          {quotes.length > 0 ? (
            <FlatList
              data={quotes}
              renderItem={renderQuoteItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.quotesList}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubble-outline" size={64} color="#CCCCCC" />
              <Text style={styles.emptyText}>No custom quotes yet</Text>
              <Text style={styles.emptySubtext}>
                Add your favorite quotes to see them here
              </Text>
            </View>
          )}
          
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setIsAddQuoteModalVisible(true)}
          >
            <Ionicons name="add" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      )}
      
      <AddQuoteModal
        isVisible={isAddQuoteModalVisible}
        onClose={() => setIsAddQuoteModalVisible(false)}
        onAdd={handleAddQuote}
        category={quoteCategory}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F8',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 10,
    paddingHorizontal: 20,
    backgroundColor: Colors.light.tint,
  },
  backButton: {
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    position: 'relative',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quotesList: {
    padding: 16,
  },
  quoteItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  quoteContent: {
    flex: 1,
  },
  quoteText: {
    fontSize: 16,
    color: '#333333',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  quoteAuthor: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
    textAlign: 'right',
  },
  quoteCategory: {
    fontSize: 12,
    color: '#999999',
  },
  deleteButton: {
    padding: 8,
  },
  addButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.light.tint,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
    marginTop: 8,
  },
}); 