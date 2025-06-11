import { ScheduleConfig } from '@/src/types/LockManagerTypes';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useState } from 'react';
import { Modal, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());

  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  const handleConfirm = () => {
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const [endHours, endMinutes] = endTime.split(':').map(Number);
    
    const finalStartDate = new Date(startDate);
    finalStartDate.setHours(startHours, startMinutes, 0, 0);
    
    const finalEndDate = new Date(endDate);
    finalEndDate.setHours(endHours, endMinutes, 0, 0);

    // If no days are selected, select all days
    const effectiveSelectedDays = selectedDays.some(day => day) 
      ? selectedDays 
      : [true, true, true, true, true, true, true];

    onConfirm({
      startDate: finalStartDate,
      endDate: finalEndDate,
      startTime: finalStartDate,
      endTime: finalEndDate,
      selectedDays: effectiveSelectedDays,
    });
  };
  
  const onStartDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || startDate;
    setShowStartDatePicker(Platform.OS === 'ios');
    setStartDate(currentDate);
    if (currentDate > endDate) {
      setEndDate(currentDate);
    }
  };

  const onEndDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || endDate;
    setShowEndDatePicker(Platform.OS === 'ios');
    setEndDate(currentDate);
  };
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

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
          
          <View style={styles.dateContainer}>
            <View style={styles.datePicker}>
              <Text style={styles.sectionTitle}>Start Date</Text>
              <TouchableOpacity onPress={() => setShowStartDatePicker(true)} style={styles.dateDisplay}>
                 <Text>{formatDate(startDate)}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.datePicker}>
              <Text style={styles.sectionTitle}>End Date</Text>
              <TouchableOpacity onPress={() => setShowEndDatePicker(true)} style={styles.dateDisplay}>
                 <Text>{formatDate(endDate)}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {showStartDatePicker && (
            <DateTimePicker
              testID="startDatePicker"
              value={startDate}
              mode="date"
              display="default"
              onChange={onStartDateChange}
              minimumDate={new Date()}
            />
          )}

          {showEndDatePicker && (
            <DateTimePicker
              testID="endDatePicker"
              value={endDate}
              mode="date"
              display="default"
              onChange={onEndDateChange}
              minimumDate={startDate}
            />
          )}


          <View style={styles.timeContainer}>
            <View style={styles.timePicker}>
                <Text style={styles.sectionTitle}>Start Time</Text>
                <TimePicker
                value={startTime}
                onChange={setStartTime}
                />
            </View>
            <View style={styles.timePicker}>
                <Text style={styles.sectionTitle}>End Time</Text>
                <TimePicker
                value={endTime}
                onChange={setEndTime}
                />
            </View>
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
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '500',
  },
  dateContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  datePicker: {
    flex: 1,
    marginHorizontal: 5,
  },
  dateDisplay: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  timePicker: {
    flex: 1,
    marginHorizontal: 5,
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