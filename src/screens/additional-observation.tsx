import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  BackHandler,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { useObservation, useTimer } from '../context';
import { useAuth } from '../context/AuthContext';
import {
  submitTeacherDiscussion,
  getVisitId,
  getTeacherDiscussionQuestions,
  clearObservationState,
} from '../services/api';

type TeacherDiscussionQuestion = {
  id: number;
  question: string;
  order?: number;
};

type AdditionalObservationNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'AdditionalObservation'
>;

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

export const AdditionalObservationScreen = () => {
  const [questions, setQuestions] = useState<TeacherDiscussionQuestion[]>([]);
  const [answers, setAnswers] = useState<{ [key: number]: boolean | null }>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<AdditionalObservationNavigationProp>();
  const { selectedGrade, selectedGrades, isMultiGrade, resetObservation } =
    useObservation();
  const { endObservation } = useAuth();
  const { stopTimer } = useTimer();

  useFocusEffect(
    React.useCallback(() => {
      const backHandler = BackHandler.addEventListener(
        'hardwareBackPress',
        () => true,
      );
      return () => backHandler.remove();
    }, []),
  );

  const fetchQuestions = useCallback(async () => {
    try {
      const result = await getTeacherDiscussionQuestions();
      if (result.success && result.data) {
        setQuestions(result.data);
      } else {
        Alert.alert('Error', result.message || 'Failed to load questions');
      }
    } catch {
      Alert.alert('Error', 'Failed to load questions. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const toggleAnswer = (questionId: number, answer: boolean) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: prev[questionId] === answer ? null : answer,
    }));
  };

  const isAllAnswered = (): boolean => {
    return questions.every(
      q => answers[q.id] !== undefined && answers[q.id] !== null,
    );
  };

  const getNoQuestions = (): TeacherDiscussionQuestion[] => {
    return questions.filter(q => answers[q.id] === false);
  };

  const handleComplete = async () => {
    const storedVisitId = await getVisitId();
    const visitId = storedVisitId ? parseInt(storedVisitId, 10) : null;

    if (!visitId) {
      Alert.alert('Error', 'No visit ID found. Please start a visit first.');
      return;
    }

    const gradeNames = isMultiGrade
      ? selectedGrades
      : selectedGrade
      ? [selectedGrade]
      : [];

    if (gradeNames.length === 0) {
      Alert.alert('Error', 'No grade selected. Please start over.');
      return;
    }

    try {
      setSubmitting(true);

      const responses = Object.entries(answers)
        .filter(([_, answer]) => answer !== null)
        .map(([questionId, answer]) => ({
          question_id: parseInt(questionId, 10),
          response: answer as boolean,
        }));

      const result = await submitTeacherDiscussion(visitId, {
        responses,
      });

      if (result.success) {
        const noQuestions = getNoQuestions();
        if (noQuestions.length === 0) {
          Alert.alert(
            'Success',
            'Additional observations submitted successfully!',
            [
              {
                text: 'OK',
                onPress: async () => {
                  stopTimer();
                  await clearObservationState();
                  resetObservation();
                  endObservation();
                  const rootNavigation = navigation.getParent();
                  if (rootNavigation) {
                    rootNavigation.reset({
                      index: 0,
                      routes: [{ name: 'Main' }],
                    });
                  }
                },
              },
            ],
          );
        } else {
          navigation.navigate('DiscussionChecklist', {
            noQuestions: noQuestions,
            answers: answers,
          });
        }
      } else {
        Alert.alert(
          'Submission Warning',
          result.message ||
            'Observation completed but submission failed. Please try again.',
          [
            {
              text: 'Retry',
              onPress: handleComplete,
            },
            {
              text: 'Cancel',
              style: 'cancel',
            },
          ],
        );
      }
    } catch {
      Alert.alert('Error', 'An unexpected error occurred. Please try again.', [
        {
          text: 'Retry',
          onPress: handleComplete,
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && questions.length === 0) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (submitting) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.submittingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.submittingText}>Submitting observation...</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.contentContainer}>
        <Text style={styles.screenTitle}>Additional Observations</Text>
        <Text style={styles.screenSubtitle}>
          Answer the following questions
        </Text>

        {questions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No Additional Observations</Text>
            <Text style={styles.emptyText}>
              There are no additional observation questions at this time.
            </Text>
          </View>
        ) : (
          questions.map((question, index) => (
            <View key={question.id || index} style={styles.binaryCard}>
              <Text style={styles.binaryQuestion}>{question.question}</Text>
              <View style={styles.binaryButtons}>
                <TouchableOpacity
                  style={[
                    styles.binaryButton,
                    answers[question.id] === true && styles.binaryButtonYes,
                  ]}
                  onPress={() => toggleAnswer(question.id, true)}
                >
                  <Text
                    style={[
                      styles.binaryButtonText,
                      answers[question.id] === true &&
                        styles.binaryButtonTextSelected,
                    ]}
                  >
                    Yes
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.binaryButton,
                    answers[question.id] === false && styles.binaryButtonNo,
                  ]}
                  onPress={() => toggleAnswer(question.id, false)}
                >
                  <Text
                    style={[
                      styles.binaryButtonText,
                      answers[question.id] === false &&
                        styles.binaryButtonTextSelected,
                    ]}
                  >
                    No
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}

        <TouchableOpacity
          style={[
            styles.primaryButton,
            (!isAllAnswered() || submitting) && styles.primaryButtonDisabled,
          ]}
          onPress={handleComplete}
          disabled={!isAllAnswered() || submitting}
        >
          <Text style={styles.primaryButtonText}>
            {submitting ? 'Submitting...' : 'Complete Observation'}
          </Text>
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyCard: {
    backgroundColor: COLORS.card,
    padding: 24,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
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
  binaryCard: {
    backgroundColor: COLORS.card,
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  binaryQuestion: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: 12,
  },
  binaryButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  binaryButton: {
    flex: 1,
    paddingVertical: 10,
    marginHorizontal: 8,
    borderRadius: 6,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  binaryButtonYes: {
    backgroundColor: COLORS.success,
    borderColor: COLORS.success,
  },
  binaryButtonNo: {
    backgroundColor: COLORS.error,
    borderColor: COLORS.error,
  },
  binaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  binaryButtonTextSelected: {
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
  primaryButtonDisabled: {
    backgroundColor: COLORS.border,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  // emptyContainer: {
  //   backgroundColor: COLORS.card,
  //   padding: 24,
  //   borderRadius: 8,
  //   alignItems: 'center',
  //   marginVertical: 20,
  // },
  // emptyTitle: {
  //   fontSize: 18,
  //   fontWeight: '600',
  //   color: COLORS.text,
  //   marginBottom: 8,
  //   textAlign: 'center',
  // },
  // emptyText: {
  //   fontSize: 14,
  //   color: COLORS.textSecondary,
  //   textAlign: 'center',
  //   lineHeight: 20,
  // },
  submittingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  submittingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
});
