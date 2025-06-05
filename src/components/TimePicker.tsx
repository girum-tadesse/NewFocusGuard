import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface TimePickerProps {
  value: string; // HH:mm format
  onChange: (time: string) => void;
}

export const TimePicker: React.FC<TimePickerProps> = ({ value, onChange }) => {
  const [showPicker, setShowPicker] = useState(false);

  const handleTimeChange = (_: any, date?: Date) => {
    setShowPicker(false);
    if (date) {
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      onChange(`${hours}:${minutes}`);
    }
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <View>
      <TouchableOpacity
        style={styles.button}
        onPress={() => setShowPicker(true)}
      >
        <Text style={styles.buttonText}>{formatTime(value)}</Text>
      </TouchableOpacity>

      {showPicker && (
        <DateTimePicker
          value={(() => {
            const [hours, minutes] = value.split(':');
            const date = new Date();
            date.setHours(parseInt(hours), parseInt(minutes));
            return date;
          })()}
          mode="time"
          onChange={handleTimeChange}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  buttonText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
}); 