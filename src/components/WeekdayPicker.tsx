import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface WeekdayPickerProps {
  selectedDays: boolean[];
  onDaysChange: (days: boolean[]) => void;
}

export const WeekdayPicker: React.FC<WeekdayPickerProps> = ({
  selectedDays,
  onDaysChange,
}) => {
  const toggleDay = (dayIndex: number) => {
    const newSelectedDays = [...selectedDays];
    newSelectedDays[dayIndex] = !newSelectedDays[dayIndex];
    onDaysChange(newSelectedDays);
  };

  return (
    <View style={styles.container}>
      {DAYS.map((day, index) => (
        <TouchableOpacity
          key={day}
          style={[
            styles.dayButton,
            selectedDays[index] && styles.selectedDayButton,
          ]}
          onPress={() => toggleDay(index)}
        >
          <Text
            style={[
              styles.dayText,
              selectedDays[index] && styles.selectedDayText,
            ]}
          >
            {day}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
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
  },
  selectedDayButton: {
    backgroundColor: '#FF7757',
    borderColor: '#FF7757',
  },
  dayText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
  selectedDayText: {
    color: '#fff',
  },
}); 