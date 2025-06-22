import { Colors } from '@/src/constants/Colors';
import React, { useState } from 'react';
import {
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

interface AddQuoteModalProps {
  isVisible: boolean;
  onClose: () => void;
  onAdd: (text: string, author?: string) => void;
  category: string;
}

export const AddQuoteModal: React.FC<AddQuoteModalProps> = ({
  isVisible,
  onClose,
  onAdd,
  category
}) => {
  const [quoteText, setQuoteText] = useState('');
  const [author, setAuthor] = useState('');

  const handleAdd = () => {
    if (quoteText.trim()) {
      onAdd(quoteText.trim(), author.trim() || undefined);
      setQuoteText('');
      setAuthor('');
      onClose();
    }
  };

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.title}>Add Custom Quote</Text>
          <Text style={styles.subtitle}>Category: {category}</Text>

          <Text style={styles.label}>Quote</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your motivational quote"
            value={quoteText}
            onChangeText={setQuoteText}
            multiline
            numberOfLines={3}
          />

          <Text style={styles.label}>Author (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="Author name (optional)"
            value={author}
            onChangeText={setAuthor}
          />

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
                          <TouchableOpacity 
                style={styles.addButton} 
                onPress={handleAdd}
                disabled={!quoteText.trim()}
              >
                <Text style={[
                  styles.addButtonText, 
                  !quoteText.trim() && styles.disabledButtonText,
                  { color: '#FFFFFF' } // Force white color
                ]}>
                  Add Quote
                </Text>
              </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 20,
    width: '90%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  cancelButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
    marginRight: 10,
    alignItems: 'center',
  },
  addButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: Colors.light.tint,
    marginLeft: 10,
    alignItems: 'center',
  },
  disabledButtonText: {
    opacity: 0.5,
    color: '#FFFFFF', // Ensure text stays white even when disabled
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
  addButtonText: {
    color: '#FFFFFF', // White text
    fontSize: 16,
    fontWeight: '500',
  },
}); 