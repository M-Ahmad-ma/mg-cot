import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTimer } from '../context/TimerContext';
import { Color } from 'react-native/types_generated/Libraries/Animated/AnimatedExports';

const COLORS = {
  primary: '#2E7D32',
  text: '#FFFFFF',
};

export const ObservationTimer: React.FC = () => {
  const { isTimerActive, elapsedSeconds } = useTimer();

  if (!isTimerActive) {
    return null;
  }

  const formatTime = (totalSeconds: number): string => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds
        .toString()
        .padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${seconds
      .toString()
      .padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.time}>{formatTime(elapsedSeconds)}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  time: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
});
