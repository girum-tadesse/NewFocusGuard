import { ScheduleConfig } from '@/src/types/LockManagerTypes';
import React, { useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { TimePicker } from './TimePicker';
import { WeekdayPicker } from './WeekdayPicker';

interface ScheduleModalProps {
  isVisible: boolean;
  onClose: () => void;
  onConfirm: (schedule: ScheduleConfig) => void;
}

export const ScheduleModal: React.FC<ScheduleModalProps> = ({
  isVisible,
  onClose,
  onConfirm,
}) => {
  const [selectedDays, setSelectedDays] = useState<boolean[]>([false, false, false, false, false, false, false]);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');

  const handleConfirm = () => {
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const [endHours, endMinutes] = endTime.split(':').map(Number);
    
    const startTimeDate = new Date();
    startTimeDate.setHours(startHours, startMinutes, 0, 0);
    
    const endTimeDate = new Date();
    endTimeDate.setHours(endHours, endMinutes, 0, 0);

    onConfirm({
      startTime: startTimeDate,
      endTime: endTimeDate,
      selectedDays,
    });
  };

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.title}>Schedule Lock Time</Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Days</Text>
            <WeekdayPicker
              selectedDays={selectedDays}
              onDaysChange={setSelectedDays}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Start Time</Text>
            <TimePicker
              value={startTime}
              onChange={setStartTime}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>End Time</Text>
            <TimePicker
              value={endTime}
              onChange={setEndTime}
            />
          </View>

          <View style={styles.buttons}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.confirmButton]}
              onPress={handleConfirm}
            >
              <Text style={[styles.buttonText, styles.confirmButtonText]}>
                Confirm
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
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    marginBottom: 8,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 8,
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  confirmButton: {
    backgroundColor: '#FF7757',
  },
  buttonText: {
    textAlign: 'center',
    fontSize: 16,
  },
  confirmButtonText: {
    color: '#fff',
  },
}); 