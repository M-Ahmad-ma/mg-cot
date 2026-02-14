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
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { useObservation, useTimer } from '../context';
import { useAuth } from '../context/AuthContext';
import {
  clearObservationState,
  submitTeacherDiscussion,
  getVisitId,
} from '../services/api';

type DiscussionChecklistRouteProp = RouteProp<
  RootStackParamList,
  'DiscussionChecklist'
>;
type DiscussionChecklistNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'DiscussionChecklist'
>;

interface NoQuestion {
  id: number;
  question: string;
  order?: number;
}

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

export const DiscussionChecklistScreen = () => {
  const route = useRoute<DiscussionChecklistRouteProp>();
  const navigation = useNavigation<DiscussionChecklistNavigationProp>();
  const insets = useSafeAreaInsets();
  const { resetObservation } = useObservation();
  const { endObservation } = useAuth();
  const { stopTimer, getStartTimeISO } = useTimer();

  const { noQuestions: initialNoQuestions } = route.params || {};

  const [noQuestions, setNoQuestions] = useState<NoQuestion[]>(
    initialNoQuestions || [],
  );
  const [discussed, setDiscussed] = useState<{ [key: number]: boolean }>({});
  const [loading, setLoading] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      const backHandler = BackHandler.addEventListener(
        'hardwareBackPress',
        () => true,
      );
      return () => backHandler.remove();
    }, []),
  );

  const toggleDiscussed = useCallback((questionId: number) => {
    setDiscussed(prev => ({
      ...prev,
      [questionId]: !prev[questionId],
    }));
  }, []);

  const handleContinue = async () => {
    const storedVisitId = await getVisitId();
    const visitId = storedVisitId ? parseInt(storedVisitId, 10) : null;

    if (!visitId) {
      Alert.alert('Error', 'No visit ID found. Please start a visit first.');
      return;
    }

    try {
      setLoading(true);

      const responses = noQuestions.map(q => ({
        question_id: q.id,
        response: discussed[q.id] || false,
      }));

      const result = await submitTeacherDiscussion(visitId, { responses });

      if (result.success) {
        const endTime = new Date().toISOString();
        const startTime = getStartTimeISO();
        console.log('Observation completed:', { startTime, endTime });

        stopTimer();
        await clearObservationState();
        await resetObservation();
        endObservation();
        const rootNavigation = navigation.getParent();
        if (rootNavigation) {
          rootNavigation.reset({
            index: 0,
            routes: [{ name: 'Main' }],
          });
        }
      } else {
        Alert.alert(
          'Submission Warning',
          result.message ||
            'Failed to submit discussion. Do you want to continue anyway?',
          [
            {
              text: 'Cancel',
              style: 'cancel',
            },
            {
              text: 'Continue',
              onPress: completeObservation,
            },
          ],
        );
      }
    } catch (error) {
      console.error('Error submitting discussion:', error);
      Alert.alert(
        'Error',
        'An unexpected error occurred. Do you want to continue anyway?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Continue',
            onPress: completeObservation,
          },
        ],
      );
    } finally {
      setLoading(false);
    }
  };

  const completeObservation = async () => {
    try {
      const endTime = new Date().toISOString();
      const startTime = getStartTimeISO();
      console.log('Observation completed:', { startTime, endTime });

      stopTimer();
      await clearObservationState();
      await resetObservation();
      endObservation();
      const rootNavigation = navigation.getParent();
      if (rootNavigation) {
        rootNavigation.reset({
          index: 0,
          routes: [{ name: 'Main' }],
        });
      }
    } catch (error) {
      console.error('Error completing observation:', error);
      Alert.alert(
        'Error',
        'There was an error completing the observation. Please try again.',
        [
          {
            text: 'OK',
            onPress: () => {
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
    }
  };

  if (noQuestions.length === 0) {
    return (
      <ScrollView style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.contentContainer}>
          <Text style={styles.screenTitle}>Discussion Checklist</Text>
          <Text style={styles.screenSubtitle}>
            No items to discuss (all questions answered Yes)
          </Text>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleContinue}
            disabled={loading}
          >
            <Text style={styles.primaryButtonText}>
              {loading ? 'Completing...' : 'Complete Observation'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.contentContainer}>
        <Text style={styles.screenTitle}>Discussion Checklist</Text>
        <Text style={styles.screenSubtitle}>
          Mark items that were discussed with the teacher ({noQuestions.length}{' '}
          items need discussion)
        </Text>

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Submitting...</Text>
          </View>
        )}

        {!loading &&
          noQuestions.map((question, index) => (
            <TouchableOpacity
              key={question.id || index}
              style={[
                styles.checklistCard,
                discussed[question.id] && styles.checklistCardDiscussed,
              ]}
              onPress={() => toggleDiscussed(question.id)}
            >
              <View style={styles.checklistRow}>
                <Text
                  style={[
                    styles.checklistText,
                    discussed[question.id] && styles.checklistTextDiscussed,
                  ]}
                >
                  {question.question}
                </Text>
                <View
                  style={[
                    styles.checkbox,
                    discussed[question.id] && styles.checkboxChecked,
                  ]}
                >
                  {discussed[question.id] && (
                    <Text style={styles.checkboxCheck}>✓</Text>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          ))}

        <TouchableOpacity
          style={[
            styles.primaryButton,
            loading && styles.primaryButtonDisabled,
          ]}
          onPress={handleContinue}
          disabled={loading}
        >
          <Text style={styles.primaryButtonText}>
            {loading ? 'Submitting...' : 'Complete Observation'}
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
  checklistCard: {
    backgroundColor: COLORS.card,
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  checklistCardDiscussed: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  checklistRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  checklistText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
  },
  checklistTextDiscussed: {
    color: '#fff',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  checkboxChecked: {
    backgroundColor: '#fff',
  },
  checkboxCheck: {
    color: COLORS.primary,
    fontWeight: 'bold',
    fontSize: 14,
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
});
