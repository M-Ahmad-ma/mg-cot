import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  BackHandler,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

const COLORS = {
  primary: '#2E7D32',
  primaryLight: '#4CAF50',
  primaryDark: '#1B5E20',
  background: '#F1F8E9',
  card: '#FFFFFF',
  text: '#1B5E20',
  textSecondary: '#558B2F',
  border: '#C8E6C9',
  error: '#D32F2F',
  success: '#388E3C',
};

export const ObservationScoreScreen = () => {
  const practices = [
    'Classroom Environment',
    'Instructional Delivery',
    'Student Engagement',
    'Assessment & Feedback',
    'Professional Development',
  ];
  const [scores, setScores] = useState<{ [key: string]: number }>({});
  const insets = useSafeAreaInsets();

  useFocusEffect(
    React.useCallback(() => {
      const backHandler = BackHandler.addEventListener(
        'hardwareBackPress',
        () => true,
      );
      return () => backHandler.remove();
    }, []),
  );

  const updateScore = (practice: string, score: number) => {
    setScores(prev => ({ ...prev, [practice]: score }));
  };

  return (
    <ScrollView style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.contentContainer}>
        <Text style={styles.screenTitle}>Observation Score</Text>
        <Text style={styles.screenSubtitle}>Rate each practice (1-5)</Text>

        {practices.map(practice => (
          <View key={practice} style={styles.scoreCard}>
            <Text style={styles.scoreLabel}>{practice}</Text>
            <View style={styles.scoreButtons}>
              {[1, 2, 3, 4, 5].map(score => (
                <TouchableOpacity
                  key={score}
                  style={[
                    styles.scoreButton,
                    scores[practice] === score && styles.scoreButtonSelected,
                  ]}
                  onPress={() => updateScore(practice, score)}
                >
                  <Text
                    style={[
                      styles.scoreButtonText,
                      scores[practice] === score &&
                        styles.scoreButtonTextSelected,
                    ]}
                  >
                    {score}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        <TouchableOpacity style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>Submit & View Results</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  contentContainer: {
    padding: 20,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  screenSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 20,
  },
  scoreCard: {
    backgroundColor: COLORS.card,
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  scoreLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  scoreButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  scoreButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  scoreButtonSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  scoreButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  scoreButtonTextSelected: {
    color: '#fff',
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
