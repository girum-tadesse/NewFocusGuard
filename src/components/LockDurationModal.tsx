import { Colors } from '@/src/constants/Colors';
import React, { useEffect, useState } from 'react';
import {
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

interface App {
  id: string;
  name: string;
  icon?: string;
}

interface LockDurationModalProps {
  isVisible: boolean;
  onClose: () => void;
  onConfirm: (app: App, duration: number) => Promise<void>;
  selectedAppsCount: number;
  app: App;
}

const PURE_WHITE = '#FFFFFF';
const PRIMARY_COLOR = Colors.light.tint;
const LIGHT_GRAY_BORDER = '#E0E0E0';
const TEXT_COLOR_DARK = '#333333';
const TEXT_COLOR_LIGHT = '#666666';
const DISABLED_COLOR = '#B0B0B0';

export const LockDurationModal: React.FC<LockDurationModalProps> = ({
  isVisible,
  onClose,
  onConfirm,
  selectedAppsCount,
  app,
}) => {
  const [customHours, setCustomHours] = useState<string>('');
  const [customMinutes, setCustomMinutes] = useState<string>('');
  const [isValid, setIsValid] = useState<boolean>(false);

  useEffect(() => {
    if (isVisible) {
      setCustomHours('');
      setCustomMinutes('');
      setIsValid(false);
    }
  }, [isVisible]);

  useEffect(() => {
    const hours = parseInt(customHours, 10) || 0;
    const minutes = parseInt(customMinutes, 10) || 0;
    setIsValid(hours > 0 || minutes > 0);
  }, [customHours, customMinutes]);

  const handleConfirm = () => {
    if (!isValid) return;

    const hours = parseInt(customHours, 10) || 0;
    const minutes = parseInt(customMinutes, 10) || 0;
    // Convert to minutes, not milliseconds, as the API expects duration in minutes
    const durationInMinutes = (hours * 60) + minutes;

    if (durationInMinutes > 0) {
      onConfirm(app, durationInMinutes);
    }
  };

  const formatNumberInput = (text: string) => text.replace(/[^0-9]/g, '');

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.modalOverlay}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.title}>
              Lock {selectedAppsCount} app{selectedAppsCount !== 1 ? 's' : ''}
            </Text>

            <Text style={styles.subtitle}>
              Enter Lock Duration
            </Text>

            <View style={styles.customInputContainer}>
              <View style={styles.inputGroup}>
                <TextInput
                  style={styles.customInput}
                  placeholder="0"
                  placeholderTextColor={DISABLED_COLOR}
                  keyboardType="numeric"
                  value={customHours}
                  onChangeText={text => setCustomHours(formatNumberInput(text))}
                  maxLength={2}
                />
                <Text style={styles.inputLabel}>Hours</Text>
              </View>

              <Text style={styles.customInputSeparator}>:</Text>

              <View style={styles.inputGroup}>
                <TextInput
                  style={styles.customInput}
                  placeholder="0"
                  placeholderTextColor={DISABLED_COLOR}
                  keyboardType="numeric"
                  value={customMinutes}
                  onChangeText={text => setCustomMinutes(formatNumberInput(text))}
                  maxLength={2}
                />
                <Text style={styles.inputLabel}>Minutes</Text>
              </View>
            </View>

            <View style={styles.actionButtonsContainer}>
              <TouchableOpacity
                style={[styles.actionButton, styles.cancelButton]}
                onPress={onClose}
              >
                <Text style={{
                  textAlign: 'center',
                  fontSize: 16,
                }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.confirmButton]}
                onPress={handleConfirm}
                disabled={!isValid}
              >
                <Text style={{
                  textAlign: 'center',
                  fontSize: 16,
                  color: '#fff',
                }}>
                  Confirm Lock
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  modalContent: {
    backgroundColor: PURE_WHITE,
    borderRadius: 15,
    padding: 25,
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: TEXT_COLOR_DARK,
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: TEXT_COLOR_LIGHT,
    textAlign: 'center',
    marginBottom: 20,
  },
  customInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 25,
    width: '80%',
  },
  inputGroup: {
    alignItems: 'center',
  },
  customInput: {
    borderWidth: 1,
    borderColor: LIGHT_GRAY_BORDER,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 15,
    fontSize: 24,
    color: TEXT_COLOR_DARK,
    textAlign: 'center',
    width: 80,
    marginBottom: 5,
  },
  inputLabel: {
    fontSize: 14,
    color: TEXT_COLOR_LIGHT,
  },
  customInputSeparator: {
    fontSize: 24,
    color: TEXT_COLOR_DARK,
    marginHorizontal: 15,
    marginBottom: 20,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 10,
  },
  actionButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 8,
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  confirmButton: {
    backgroundColor: PRIMARY_COLOR,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  cancelButtonText: {
    color: TEXT_COLOR_LIGHT,
  },
  confirmButtonText: {
    color: '#fff',
  },
}); 