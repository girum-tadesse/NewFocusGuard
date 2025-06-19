import { ThemedText } from '@/components/ThemedText';
import React, { useEffect, useState } from 'react';
import {
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
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
const PRIMARY_COLOR = '#FF7757';
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
            <ThemedText style={styles.title}>
              Lock {selectedAppsCount} app{selectedAppsCount !== 1 ? 's' : ''}
            </ThemedText>

            <ThemedText style={styles.subtitle}>
              Enter Lock Duration
            </ThemedText>

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
                <ThemedText style={styles.inputLabel}>Hours</ThemedText>
              </View>

              <ThemedText style={styles.customInputSeparator}>:</ThemedText>

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
                <ThemedText style={styles.inputLabel}>Minutes</ThemedText>
              </View>
            </View>

            <View style={styles.actionButtonsContainer}>
              <TouchableOpacity
                style={[styles.actionButton, styles.cancelButton]}
                onPress={onClose}
              >
                <ThemedText style={[styles.actionButtonText, styles.cancelButtonText]}>Cancel</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.confirmButton, !isValid && styles.disabledButton]}
                onPress={handleConfirm}
                disabled={!isValid}
              >
                <ThemedText style={[styles.actionButtonText, styles.confirmButtonText, !isValid && styles.disabledButtonText]}>
                  Confirm Lock
                </ThemedText>
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
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  cancelButton: {
    backgroundColor: PURE_WHITE,
    borderColor: LIGHT_GRAY_BORDER,
    marginRight: 8,
  },
  confirmButton: {
    backgroundColor: PRIMARY_COLOR,
    borderColor: PRIMARY_COLOR,
    marginLeft: 8,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButtonText: {
    color: TEXT_COLOR_LIGHT,
  },
  confirmButtonText: {
    color: PURE_WHITE,
  },
  disabledButton: {
    backgroundColor: '#E0E0E0',
    borderColor: '#D0D0D0',
  },
  disabledButtonText: {
    color: '#A0A0A0',
  },
}); 