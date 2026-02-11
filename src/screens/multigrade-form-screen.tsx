// MultiGradeFormScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  StyleSheet,
  BackHandler,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import {
  getDomainsWithQuestions,
  getPreviousRatings,
  getVisitId,
  submitRatings,
} from '../services/api';
import { useObservation } from '../context';
import { useAuth } from '../context/AuthContext';

type MultiGradeFormNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'MultiGradeForm'
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
  low: '#D32F2F',
  mediumLow: '#F57C00',
  medium: '#FBC02D',
  mediumHigh: '#7CB342',
  high: '#388E3C',
};

interface Question {
  id: number;
  question_description: string;
}

interface Domain {
  id: number;
  name: string;
  description?: string;
  type: 'single' | 'combined' | 'additional';
  questions: Question[];
}

export const MultiGradeFormScreen = () => {
  const navigation = useNavigation<MultiGradeFormNavigationProp>();
  const insets = useSafeAreaInsets();
  const { selectedGrades, isMultiGrade } = useObservation();
  const { lockObservation } = useAuth();

  useFocusEffect(
    React.useCallback(() => {
      const backHandler = BackHandler.addEventListener(
        'hardwareBackPress',
        () => true,
      );
      return () => backHandler.remove();
    }, []),
  );

  const [filteredDomains, setFilteredDomains] = useState<Domain[]>([]);
  const [scores, setScores] = useState<{ [key: number]: number | null }>({});
  const [currentDomainIndex, setCurrentDomainIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const filterDomainsByType = useCallback(
    (domains: Domain[]) => {
      const standardDomains = domains.filter(d =>
        isMultiGrade ? d.type === 'combined' : d.type === 'single',
      );
      setFilteredDomains(standardDomains);
    },
    [isMultiGrade],
  );

  const fetchDomains = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getDomainsWithQuestions();
      if (res && Array.isArray(res.data)) {
        filterDomainsByType(res.data);
      } else {
        Alert.alert('Error', 'Failed to load domains');
      }
    } catch {
      Alert.alert('Error', 'Failed to load domains');
    } finally {
      setLoading(false);
    }
  }, [filterDomainsByType]);

  const fetchPreviousRatings = useCallback(async () => {
    const storedVisitId = await getVisitId();
    const visitId = storedVisitId ? parseInt(storedVisitId, 10) : null;

    if (!visitId || selectedGrades.length === 0) {
      return;
    }

    try {
      const result = await getPreviousRatings(
        visitId,
        selectedGrades,
        'combined',
      );

      if (result.success && result.data) {
        const ratingsMap: { [questionId: number]: number } = {};
        result.data.forEach(rating => {
          if (rating.question_id && rating.previous_rating !== undefined) {
            ratingsMap[rating.question_id] = rating.previous_rating;
          }
        });
        setScores(ratingsMap);
      }
    } catch {
      console.error('Error fetching previous ratings');
    }
  }, [selectedGrades]);

  useEffect(() => {
    lockObservation();
    fetchDomains();
    fetchPreviousRatings();
  }, [lockObservation, fetchDomains, fetchPreviousRatings]);

  const handleScore = (questionId: number, score: number) => {
    setScores(prev => ({ ...prev, [questionId]: score }));
  };

  const isDomainComplete = (domain: Domain) =>
    domain.questions.length === 0 ||
    domain.questions.every(
      q => scores[q.id] !== undefined && scores[q.id] !== null,
    );

  const getTotalScore = (): number =>
    Object.values(scores).reduce(
      (sum: number, s: number | null) => sum + (s || 0),
      0,
    );

  const getMaxScore = (): number =>
    filteredDomains.reduce((sum, d) => sum + d.questions.length * 5, 0);

  const handleComplete = async () => {
    const storedVisitId = await getVisitId();
    const visitId = storedVisitId ? parseInt(storedVisitId, 10) : null;

    if (!visitId) {
      Alert.alert('Error', 'No visit ID found. Please start a visit first.');
      return;
    }

    const ratings = Object.entries(scores)
      .map(([questionId, rating]) => ({
        question_id: parseInt(questionId, 10),
        rating: rating || 0,
      }))
      .filter(r => r.rating > 0);

    if (ratings.length === 0) {
      Alert.alert('Error', 'No ratings to submit.');
      return;
    }

    try {
      setSubmitting(true);

      const result = await submitRatings(visitId, {
        grade_names: selectedGrades,
        context_type: 'combined',
        ratings,
      });

      if (result.success) {
        const rootNav = navigation.getParent();
        if (rootNav) {
          rootNav.reset({
            index: 0,
            routes: [
              {
                name: 'ObservationFlow',
                state: { routes: [{ name: 'AdditionalObservation' }] },
              },
            ],
          });
        } else {
          navigation.reset({
            index: 0,
            routes: [
              {
                name: 'ObservationFlow',
                state: { routes: [{ name: 'AdditionalObservation' }] },
              },
            ],
          } as never);
        }
      } else {
        Alert.alert(
          'Submission Warning',
          result.message ||
            'Failed to submit ratings. Do you want to continue anyway?',
          [
            {
              text: 'Cancel',
              style: 'cancel',
            },
            {
              text: 'Continue',
              onPress: () => {
                const rootNav = navigation.getParent();
                if (rootNav) {
                  rootNav.reset({
                    index: 0,
                    routes: [
                      {
                        name: 'ObservationFlow',
                        state: { routes: [{ name: 'AdditionalObservation' }] },
                      },
                    ],
                  });
                } else {
                  navigation.reset({
                    index: 0,
                    routes: [
                      {
                        name: 'ObservationFlow',
                        state: { routes: [{ name: 'AdditionalObservation' }] },
                      },
                    ],
                  } as never);
                }
              },
            },
          ],
        );
      }
    } catch {
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
            onPress: () => {
              const rootNav = navigation.getParent();
              if (rootNav) {
                rootNav.reset({
                  index: 0,
                  routes: [
                    {
                      name: 'ObservationFlow',
                      state: { routes: [{ name: 'AdditionalObservation' }] },
                    },
                  ],
                });
              } else {
                navigation.reset({
                  index: 0,
                  routes: [
                    {
                      name: 'ObservationFlow',
                      state: { routes: [{ name: 'AdditionalObservation' }] },
                    },
                  ],
                } as never);
              }
            },
          },
        ],
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (filteredDomains.length === 0) {
    return (
      <View style={styles.loader}>
        <Text>No domains found</Text>
      </View>
    );
  }

  const allDisplayDomains = filteredDomains;

  const renderDomainTabs = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.tabsContainer}
    >
      {allDisplayDomains.map((domain, index) => (
        <TouchableOpacity
          key={domain.id}
          style={[
            styles.tabButton,
            currentDomainIndex === index && styles.tabButtonActive,
          ]}
          onPress={() => setCurrentDomainIndex(index)}
        >
          <Text
            style={[
              styles.tabText,
              currentDomainIndex === index && styles.tabTextActive,
            ]}
          >
            {domain.name}
          </Text>
        </TouchableOpacity>
      ))}
      <TouchableOpacity
        style={[
          styles.tabButton,
          currentDomainIndex === allDisplayDomains.length &&
            styles.tabButtonActive,
        ]}
        onPress={() => setCurrentDomainIndex(allDisplayDomains.length)}
      >
        <Text
          style={[
            styles.tabText,
            currentDomainIndex === allDisplayDomains.length &&
              styles.tabTextActive,
          ]}
        >
          Summary
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );

  if (currentDomainIndex === allDisplayDomains.length) {
    return (
      <ScrollView style={[styles.container, { paddingTop: insets.top }]}>
        {renderDomainTabs()}
        <View style={styles.contentContainer}>
          <Text style={styles.screenTitle}>Observation Summary</Text>

          <View style={styles.totalScoreCard}>
            <Text style={styles.totalScoreTitle}>Total Score</Text>
            <Text style={styles.totalScoreValue}>
              {getTotalScore()} / {getMaxScore()}
            </Text>
            <Text style={styles.averageScore}>
              Average: {(getTotalScore() / getMaxScore()).toFixed(2)}
            </Text>
          </View>

          {allDisplayDomains.map(domain => {
            const domainScore = domain.questions.reduce(
              (sum, q) => sum + (scores[q.id] || 0),
              0,
            );
            return (
              <View key={domain.id} style={styles.domainScoreCard}>
                <Text style={styles.domainScoreTitle}>{domain.name}</Text>
                <Text style={styles.domainScoreValue}>
                  {domainScore} / {domain.questions.length * 5}
                </Text>
              </View>
            );
          })}

          <TouchableOpacity
            style={[styles.primaryButton, submitting && styles.disabledButton]}
            onPress={handleComplete}
            disabled={submitting}
          >
            <Text style={styles.primaryButtonText}>
              {submitting ? 'Submitting...' : 'Complete & Continue'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  const domain = allDisplayDomains[currentDomainIndex];

  return (
    <ScrollView style={[styles.container, { paddingTop: insets.top }]}>
      {renderDomainTabs()}
      <View style={styles.contentContainer}>
        <Text style={styles.screenTitle}>{domain.name}</Text>
        {domain.description ? (
          <Text style={styles.screenSubtitle}>{domain.description}</Text>
        ) : null}

        {domain.questions.length === 0 ? (
          <View style={styles.questionCard}>
            <Text style={styles.questionText}>
              No questions for this domain
            </Text>
          </View>
        ) : (
          domain.questions.map(q => (
            <View key={q.id} style={styles.questionCard}>
              <Text style={styles.questionText}>{q.question_description}</Text>
              <View style={styles.scoreRow}>
                {[1, 2, 3, 4, 5].map(score => (
                  <TouchableOpacity
                    key={score}
                    style={[
                      styles.scoreButton,
                      scores[q.id] === score && {
                        backgroundColor: COLORS.primary,
                        borderColor: COLORS.primary,
                      },
                    ]}
                    onPress={() => handleScore(q.id, score)}
                  >
                    <Text
                      style={[
                        styles.scoreButtonText,
                        scores[q.id] === score && { color: '#fff' },
                      ]}
                    >
                      {score}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))
        )}

        <View style={styles.navigationButtons}>
          <TouchableOpacity
            onPress={() => setCurrentDomainIndex(prev => Math.max(prev - 1, 0))}
            disabled={currentDomainIndex === 0}
            style={styles.secondaryButton}
          >
            <Text style={styles.secondaryButtonText}>Previous</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() =>
              setCurrentDomainIndex(prev =>
                prev < allDisplayDomains.length ? prev + 1 : prev,
              )
            }
            disabled={!isDomainComplete(domain)}
            style={styles.primaryButton}
          >
            <Text style={styles.primaryButtonText}>
              {currentDomainIndex === allDisplayDomains.length - 1
                ? 'Finish'
                : 'Next'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  contentContainer: { padding: 20 },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  screenSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 12,
  },
  questionCard: {
    marginBottom: 16,
    backgroundColor: COLORS.card,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  questionText: { marginBottom: 8, color: COLORS.text },
  scoreRow: { flexDirection: 'row', justifyContent: 'space-between' },
  scoreButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  scoreButtonText: { color: COLORS.text, fontWeight: '600' },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    padding: 12,
    borderRadius: 8,
  },
  disabledButton: {
    backgroundColor: COLORS.primaryLight,
  },
  primaryButtonText: { color: '#fff', fontWeight: '600' },
  secondaryButton: {
    backgroundColor: COLORS.card,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  secondaryButtonText: { color: COLORS.primary, fontWeight: '600' },
  totalScoreCard: {
    backgroundColor: COLORS.primary,
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  totalScoreTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  totalScoreValue: { fontSize: 36, fontWeight: 'bold', color: '#fff' },
  averageScore: { fontSize: 16, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  domainScoreCard: {
    backgroundColor: COLORS.card,
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  domainScoreTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  domainScoreValue: { fontSize: 16, fontWeight: 'bold', color: COLORS.primary },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
  },
  tabButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tabButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  tabText: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary },
  tabTextActive: { color: '#fff' },
});
