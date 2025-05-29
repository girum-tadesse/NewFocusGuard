import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import React, { useState } from 'react';
import {
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

interface ScheduleModalProps {
  isVisible: boolean;
  onClose: () => void;
  onConfirm: (schedule: ScheduleConfig) => void;
  selectedApps: string[];
}

interface ScheduleConfig {
  startDate: Date;
  endDate: Date;
  startTime: Date;
  endTime: Date;
  selectedDays: boolean[];
}

const DAYS_OF_WEEK = ['Today', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const ScheduleModal: React.FC<ScheduleModalProps> = ({
  isVisible,
  onClose,
  onConfirm,
  selectedApps,
}) => {
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date());
  const [selectedDays, setSelectedDays] = useState<boolean[]>(Array(8).fill(false));
  
  const [showStartDate, setShowStartDate] = useState(false);
  const [showEndDate, setShowEndDate] = useState(false);
  const [showStartTime, setShowStartTime] = useState(false);
  const [showEndTime, setShowEndTime] = useState(false);

  const handleDayToggle = (index: number) => {
    const newSelectedDays = [...selectedDays];
    
    if (index === 0) {
      newSelectedDays.fill(false);
      newSelectedDays[0] = !newSelectedDays[0];
      
      if (newSelectedDays[0]) {
        const today = new Date();
        setStartDate(today);
        setEndDate(today);
      }
    } else {
      newSelectedDays[0] = false;
      newSelectedDays[index] = !newSelectedDays[index];
    }
    
    setSelectedDays(newSelectedDays);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const handleDateChange = (
    setDate: (date: Date) => void,
    setShow: (show: boolean) => void
  ) => (event: DateTimePickerEvent, date?: Date) => {
    setShow(false);
    if (date) {
      setDate(date);
      const newSelectedDays = [...selectedDays];
      newSelectedDays[0] = false;
      setSelectedDays(newSelectedDays);
    }
  };

  const handleConfirm = () => {
    onConfirm({
      startDate,
      endDate,
      startTime,
      endTime,
      selectedDays: selectedDays.slice(1),
    });
  };

  const isConfirmDisabled = !selectedDays.some(day => day);

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Schedule Lock</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <MaterialIcons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>
            {selectedApps.length} app{selectedApps.length !== 1 ? 's' : ''} selected
          </Text>

          <ScrollView style={styles.scrollView}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Date Range</Text>
              <View style={styles.dateContainer}>
                <TouchableOpacity 
                  style={[
                    styles.dateButton,
                    selectedDays[0] && styles.dateButtonDisabled
                  ]} 
                  onPress={() => !selectedDays[0] && setShowStartDate(true)}
                  disabled={selectedDays[0]}
                >
                  <Text style={styles.dateButtonLabel}>Start Date</Text>
                  <Text style={[
                    styles.dateButtonText,
                    selectedDays[0] && styles.dateButtonTextDisabled
                  ]}>{formatDate(startDate)}</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[
                    styles.dateButton,
                    selectedDays[0] && styles.dateButtonDisabled
                  ]} 
                  onPress={() => !selectedDays[0] && setShowEndDate(true)}
                  disabled={selectedDays[0]}
                >
                  <Text style={styles.dateButtonLabel}>End Date</Text>
                  <Text style={[
                    styles.dateButtonText,
                    selectedDays[0] && styles.dateButtonTextDisabled
                  ]}>{formatDate(endDate)}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Time Range</Text>
              <View style={styles.dateContainer}>
                <TouchableOpacity 
                  style={styles.dateButton} 
                  onPress={() => setShowStartTime(true)}
                >
                  <Text style={styles.dateButtonLabel}>Start Time</Text>
                  <Text style={styles.dateButtonText}>{formatTime(startTime)}</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.dateButton} 
                  onPress={() => setShowEndTime(true)}
                >
                  <Text style={styles.dateButtonLabel}>End Time</Text>
                  <Text style={styles.dateButtonText}>{formatTime(endTime)}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Days</Text>
              <View style={styles.daysContainer}>
                {DAYS_OF_WEEK.map((day, index) => (
                  <TouchableOpacity
                    key={day}
                    style={[
                      styles.dayButton,
                      selectedDays[index] && styles.dayButtonSelected,
                      index === 0 && styles.todayButton
                    ]}
                    onPress={() => handleDayToggle(index)}
                  >
                    <Text style={[
                      styles.dayButtonText,
                      selectedDays[index] && styles.dayButtonTextSelected,
                      index === 0 && styles.todayButtonText
                    ]}>
                      {index === 0 ? day : day.slice(0, 3)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>

          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.button, styles.cancelButton]} 
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.button,
                styles.confirmButton,
                isConfirmDisabled && styles.disabledButton
              ]}
              onPress={handleConfirm}
              disabled={isConfirmDisabled}
            >
              <Text style={[
                styles.confirmButtonText,
                isConfirmDisabled && styles.disabledButtonText
              ]}>Schedule</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Date/Time Pickers */}
        {showStartDate && (
          <DateTimePicker
            value={startDate}
            mode="date"
            onChange={handleDateChange(setStartDate, setShowStartDate)}
          />
        )}
        {showEndDate && (
          <DateTimePicker
            value={endDate}
            mode="date"
            onChange={handleDateChange(setEndDate, setShowEndDate)}
          />
        )}
        {showStartTime && (
          <DateTimePicker
            value={startTime}
            mode="time"
            onChange={handleDateChange(setStartTime, setShowStartTime)}
          />
        )}
        {showEndTime && (
          <DateTimePicker
            value={endTime}
            mode="time"
            onChange={handleDateChange(setEndTime, setShowEndTime)}
          />
        )}
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
    backgroundColor: 'white',
    borderRadius: 20,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  scrollView: {
    maxHeight: '70%',
  },
  section: {
    marginBottom: 25,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  dateContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  dateButton: {
    flex: 1,
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  dateButtonDisabled: {
    backgroundColor: '#F0F0F0',
    borderColor: '#E0E0E0',
  },
  dateButtonLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  dateButtonText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  dateButtonTextDisabled: {
    color: '#999',
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  dayButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#F8F8F8',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 8,
  },
  dayButtonSelected: {
    backgroundColor: '#FF7757',
    borderColor: '#FF7757',
  },
  todayButton: {
    backgroundColor: '#E8F5E9',
    borderColor: '#4CAF50',
    marginBottom: 16,
    width: '100%',
    alignItems: 'center',
  },
  dayButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
  dayButtonTextSelected: {
    color: 'white',
  },
  todayButtonText: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 25,
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FF7757',
  },
  confirmButton: {
    backgroundColor: '#FF7757',
  },
  disabledButton: {
    backgroundColor: '#FFE5DD',
  },
  cancelButtonText: {
    color: '#FF7757',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButtonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButtonText: {
    color: '#FFB5A0',
  },
}); 