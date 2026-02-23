import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  BackHandler,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { useObservation } from '../context';
import { useAuth } from '../context/AuthContext';
import {
  getPreviousRatings,
  getVisitId,
  getDomainsWithQuestions,
  submitRatings,
} from '../services/api';

type ObservationScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'ObservationScreen'
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

interface GradeDataInfo {
  grade: string;
  subject: string;
  girlsAttendance: number;
  boysAttendance: number;
}

export const ObservationScreen: React.FC = () => {
  const {
    isMultiGrade,
    selectedGrade,
    selectedGrades,
    gradeData,
    isLoaded: contextLoaded,
  } = useObservation();

  const { lockObservation } = useAuth();
  const navigation = useNavigation<ObservationScreenNavigationProp>();
  const insets = useSafeAreaInsets();

  const [filteredDomains, setFilteredDomains] = useState<Domain[]>([]);
  const [scores, setScores] = useState<{ [key: number]: number | null }>({});
  const [multiGradeScores, setMultiGradeScores] = useState<{
    [grade: string]: { [questionId: number]: number };
  }>({});

  const [activeGradeTab, setActiveGradeTab] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [contextLoading, setContextLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      const backHandler = BackHandler.addEventListener(
        'hardwareBackPress',
        () => true,
      );
      return () => backHandler.remove();
    }, []),
  );

  useEffect(() => {
    if (contextLoaded !== undefined) {
      setContextLoading(!contextLoaded);
    }
  }, [contextLoaded]);

  /**
   * 🔧 FIXED DOMAIN FILTER
   * - Includes `additional` domains
   * - Hides domains with zero questions (clean UX)
   */
  const filterAndSetDomains = useCallback(
    (domains: Domain[]) => {
      const expectedType = isMultiGrade ? 'combined' : 'single';

      const usableDomains = domains.filter(domain => {
        if (domain.type === 'additional') {
          return domain.questions.length > 0;
        }

        return domain.type === expectedType && domain.questions.length > 0;
      });

      setFilteredDomains(usableDomains);
    },
    [isMultiGrade],
  );

  const fetchDomains = useCallback(async () => {
    if (!contextLoaded) return;

    try {
      const res = await getDomainsWithQuestions();

      if (res && Array.isArray(res.data)) {
        filterAndSetDomains(res.data);
      }
    } catch (e) {
      // Domain fetch failed
    } finally {
      setLoading(false);
    }
  }, [contextLoaded, filterAndSetDomains]);

  const fetchPreviousRatings = useCallback(async () => {
    const storedVisitId = await getVisitId();
    const visitId = storedVisitId ? parseInt(storedVisitId, 10) : null;

    if (!visitId) return;

    const gradeNames = isMultiGrade
      ? selectedGrades
      : selectedGrade
      ? [selectedGrade]
      : [];

    if (gradeNames.length === 0) return;

    try {
      const result = await getPreviousRatings(
        visitId,
        gradeNames,
        isMultiGrade ? 'combined' : 'single',
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
    } catch (e) {
      // Previous ratings fetch failed, continue anyway
    }
  }, [isMultiGrade, selectedGrade, selectedGrades]);

  useEffect(() => {
    if (contextLoaded) {
      lockObservation();
      fetchDomains();
      fetchPreviousRatings();
    }
  }, [lockObservation, fetchDomains, fetchPreviousRatings, contextLoaded]);

  const updateScore = (questionId: number, score: number) => {
    setScores(prev => ({ ...prev, [questionId]: score }));
  };

  const updateMultiGradeScore = (
    grade: string,
    questionId: number,
    score: number,
  ) => {
    setMultiGradeScores(prev => ({
      ...prev,
      [grade]: { ...(prev[grade] || {}), [questionId]: score },
    }));
  };

  const getGradesData = (): GradeDataInfo[] => {
    if (isMultiGrade) {
      return selectedGrades.map(grade => ({
        grade,
        subject: gradeData[grade]?.subject || '',
        girlsAttendance: gradeData[grade]?.present_girls || 0,
        boysAttendance: gradeData[grade]?.present_boys || 0,
      }));
    }

    if (selectedGrade) {
      return [
        {
          grade: selectedGrade,
          subject: gradeData[selectedGrade]?.subject || '',
          girlsAttendance: gradeData[selectedGrade]?.present_girls || 0,
          boysAttendance: gradeData[selectedGrade]?.present_boys || 0,
        },
      ];
    }

    return [];
  };

  const gradesData = getGradesData();

  useEffect(() => {
    if (isMultiGrade && gradesData.length && !activeGradeTab) {
      setActiveGradeTab(gradesData[0].grade);
    }
  }, [isMultiGrade, gradesData, activeGradeTab]);

  const isAllScored = (): boolean => {
    if (isMultiGrade) {
      return selectedGrades.every(grade =>
        filteredDomains.every(domain =>
          domain.questions.every(
            q => multiGradeScores[grade]?.[q.id] !== undefined,
          ),
        ),
      );
    }

    return filteredDomains.every(domain =>
      domain.questions.every(
        q => scores[q.id] !== undefined && scores[q.id] !== null,
      ),
    );
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
        grade_names: gradeNames,
        context_type: isMultiGrade ? 'combined' : 'single',
        ratings,
      });

      if (result.success) {
        navigation.navigate('AdditionalObservation');
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
                navigation.navigate('AdditionalObservation');
              },
            },
          ],
        );
      }
    } catch (error) {
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
              navigation.navigate('AdditionalObservation');
            },
          },
        ],
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (contextLoading || loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  /**
   * ======================
   * UI BELOW IS UNCHANGED
   * ======================
   */

  // ⬇️ Your existing JSX rendering continues here unchanged

  if (contextLoading || loading) {
    return (
      <ScrollView style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.contentContainer}>
          <Text style={styles.screenTitle}>Observation</Text>
          <Text style={styles.screenSubtitle}>Loading...</Text>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </ScrollView>
    );
  }

  if (!isMultiGrade && !selectedGrade) {
    return (
      <ScrollView style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.contentContainer}>
          <Text style={styles.screenTitle}>Observation</Text>
          <Text style={styles.screenSubtitle}>
            Please select a grade first from the Grades tab
          </Text>
        </View>
      </ScrollView>
    );
  }

  if (isMultiGrade) {
    if (gradesData.length === 0) {
      return (
        <ScrollView style={[styles.container, { paddingTop: insets.top }]}>
          <View style={styles.contentContainer}>
            <Text style={styles.screenTitle}>Observation</Text>
            <Text style={styles.screenSubtitle}>
              No grades selected. Please go back and select grades.
            </Text>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.primaryButtonText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      );
    }

    return (
      <ScrollView style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.contentContainer}>
          <Text style={styles.screenTitle}>Observation</Text>
          <Text style={styles.screenSubtitle}>Rate each practice (1-5)</Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.tabContainer}
          >
            {gradesData.map((data, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.tabButton,
                  activeGradeTab === data.grade && styles.tabButtonActive,
                ]}
                onPress={() => setActiveGradeTab(data.grade)}
              >
                <Text
                  style={[
                    styles.tabButtonText,
                    activeGradeTab === data.grade && styles.tabButtonTextActive,
                  ]}
                >
                  {data.grade}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {activeGradeTab && (
            <View>
              <View style={styles.gradeInfoCard}>
                <Text style={styles.gradeInfoTitle}>{activeGradeTab}</Text>
                <Text style={styles.gradeInfoText}>
                  Subject: {gradeData[activeGradeTab]?.subject}
                </Text>
                <Text style={styles.gradeInfoText}>
                  Attendance - Girls: {gradeData[activeGradeTab]?.present_girls}{' '}
                  | Boys: {gradeData[activeGradeTab]?.present_boys}
                </Text>
              </View>

              {filteredDomains.map(domain => (
                <View key={domain.id} style={styles.domainSection}>
                  {domain.questions.length === 0 ? (
                    <Text style={styles.noQuestionsText}>
                      No questions for this domain
                    </Text>
                  ) : (
                    domain.questions.map(question => (
                      <View key={question.id} style={styles.scoreCard}>
                        <Text style={styles.scoreLabel}>
                          {question.question_description}
                        </Text>
                        <View style={styles.scoreButtons}>
                          {[1, 2, 3, 4, 5].map(score => (
                            <TouchableOpacity
                              key={score}
                              style={[
                                styles.scoreButton,
                                multiGradeScores[activeGradeTab]?.[
                                  question.id
                                ] === score && styles.scoreButtonSelected,
                              ]}
                              onPress={() =>
                                updateMultiGradeScore(
                                  activeGradeTab,
                                  question.id,
                                  score,
                                )
                              }
                            >
                              <Text
                                style={[
                                  styles.scoreButtonText,
                                  multiGradeScores[activeGradeTab]?.[
                                    question.id
                                  ] === score && styles.scoreButtonTextSelected,
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
                </View>
              ))}
            </View>
          )}

          <TouchableOpacity
            style={[
              styles.primaryButton,
              (!isAllScored() || submitting) && styles.primaryButtonDisabled,
            ]}
            onPress={handleComplete}
            disabled={!isAllScored() || submitting}
          >
            <Text style={styles.primaryButtonText}>
              {submitting ? 'Submitting...' : 'Complete Observation'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.contentContainer}>
        <Text style={styles.screenTitle}>Observation</Text>
        <Text style={styles.screenSubtitle}>Rate each practice (1-5)</Text>

        {selectedGrade && (
          <View style={styles.gradeInfoCard}>
            <Text style={styles.gradeInfoTitle}>{selectedGrade}</Text>
            <Text style={styles.gradeInfoText}>
              Subject: {gradeData[selectedGrade]?.subject}
            </Text>
            <Text style={styles.gradeInfoText}>
              Attendance - Girls: {gradeData[selectedGrade]?.present_girls} |
              Boys: {gradeData[selectedGrade]?.present_boys}
            </Text>
          </View>
        )}

        {filteredDomains.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No Questions Available</Text>
            <Text style={styles.emptyText}>
              There are no observation questions available for single grade at
              this time.
            </Text>
          </View>
        ) : (
          filteredDomains.map(domain => (
            <View key={domain.id} style={styles.domainSection}>
              {domain.questions.length === 0 ? (
                <Text style={styles.noQuestionsText}>
                  No questions for this domain
                </Text>
              ) : (
                domain.questions.map(question => (
                  <View key={question.id} style={styles.scoreCard}>
                    <Text style={styles.scoreLabel}>
                      {question.question_description}
                    </Text>
                    <View style={styles.scoreButtons}>
                      {[1, 2, 3, 4, 5].map(score => (
                        <TouchableOpacity
                          key={score}
                          style={[
                            styles.scoreButton,
                            scores[question.id] === score &&
                              styles.scoreButtonSelected,
                          ]}
                          onPress={() => updateScore(question.id, score)}
                        >
                          <Text
                            style={[
                              styles.scoreButtonText,
                              scores[question.id] === score &&
                                styles.scoreButtonTextSelected,
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
            </View>
          ))
        )}

        <TouchableOpacity
          style={[
            styles.primaryButton,
            (!isAllScored() || submitting) && styles.primaryButtonDisabled,
          ]}
          onPress={handleComplete}
          disabled={!isAllScored() || submitting}
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
  tabContainer: {
    marginBottom: 16,
  },
  tabButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 8,
  },
  tabButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  tabButtonTextActive: {
    color: '#fff',
  },
  gradeInfoCard: {
    backgroundColor: COLORS.card,
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.primaryLight,
    borderLeftWidth: 4,
  },
  gradeInfoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 8,
  },
  gradeInfoText: {
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 4,
  },
  domainTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 12,
    marginTop: 16,
  },
  domainSection: {
    marginBottom: 16,
  },
  noQuestionsText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    padding: 16,
    textAlign: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 8,
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
  primaryButtonDisabled: {
    backgroundColor: COLORS.border,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    backgroundColor: COLORS.card,
    padding: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
