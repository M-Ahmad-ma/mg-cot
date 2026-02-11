import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
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
import { addGrades, getVisitId } from '../services/api';

type MultiGradeSelectionNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'MultiGradeSelection'
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
};

const GRADES = ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5'];

export const MultiGradeSelectionScreen = () => {
  const navigation = useNavigation<MultiGradeSelectionNavigationProp>();
  const insets = useSafeAreaInsets();
  const {
    selectedGrades,
    setSelectedGrades,
    gradeData,
    updateGradeData,
    removeGradeData,
    getGradesForApi,
    isMultiGrade,
  } = useObservation();
  const { startObservation } = useAuth();

  useFocusEffect(
    React.useCallback(() => {
      const backHandler = BackHandler.addEventListener(
        'hardwareBackPress',
        () => true,
      );
      return () => backHandler.remove();
    }, []),
  );

  const toggleGrade = (grade: string) => {
    if (selectedGrades.includes(grade)) {
      setSelectedGrades(selectedGrades.filter(g => g !== grade));
      removeGradeData(grade);
    } else {
      setSelectedGrades([...selectedGrades, grade]);
      updateGradeData(grade, {
        grade_name: grade,
        subject: '',
        total_students: 0,
        present_boys: 0,
        present_girls: 0,
      });
    }
  };

  console.log(isMultiGrade);

  const isFormValid = (): boolean => {
    if (selectedGrades.length === 0) return false;
    for (const grade of selectedGrades) {
      const data = gradeData[grade];
      if (!data?.subject.trim()) return false;
      if (data?.present_girls === undefined || data?.present_girls === null)
        return false;
      if (data?.present_boys === undefined || data?.present_boys === null)
        return false;
      if (data?.total_students === undefined || data?.total_students === null)
        return false;
    }
    return true;
  };

  const handleContinue = async () => {
    if (selectedGrades.length === 0) {
      Alert.alert('Error', 'Please select at least one grade');
      return;
    }

    for (const grade of selectedGrades) {
      const data = gradeData[grade];
      if (!data?.subject.trim()) {
        Alert.alert('Error', `Please enter subject for ${grade}`);
        return;
      }
      if (data?.present_girls === undefined || data?.present_girls === null) {
        Alert.alert('Error', `Please enter girls attendance for ${grade}`);
        return;
      }
      if (data?.present_boys === undefined || data?.present_boys === null) {
        Alert.alert('Error', `Please enter boys attendance for ${grade}`);
        return;
      }
      if (data?.total_students === undefined || data?.total_students === null) {
        Alert.alert('Error', `Please enter total students for ${grade}`);
        return;
      }
    }

    try {
      // Get the grades data in API format
      const gradesForApi = getGradesForApi();

      // Here you would typically have the visit ID from somewhere
      // For this example, I'll assume you get it from navigation params or context
      const storedVisitId = await getVisitId();
      const visitId = storedVisitId ? parseInt(storedVisitId, 10) : null;

      if (!visitId) {
        throw new Error('No visit ID found. Please start a visit first.');
      }

      // Make the API call to add grades
      const addGradesResult = await addGrades(visitId, gradesForApi);

      if (!addGradesResult.success) {
        throw new Error(addGradesResult.message || 'Failed to add grades');
      }

      startObservation();
      navigation.navigate('MultiGradeForm');
    } catch (error) {
      console.error('Error adding grades:', error);
      Alert.alert('Error', 'Failed to save grades. Please try again.');
    }
  };

  const handleNumberInputChange = (
    grade: string,
    field: 'present_girls' | 'present_boys' | 'total_students',
    text: string,
  ) => {
    if (text === '') {
      updateGradeData(grade, { [field]: 0 });
    } else {
      const numericValue = parseInt(text.replace(/[^0-9]/g, ''), 10);
      if (!isNaN(numericValue)) {
        updateGradeData(grade, { [field]: numericValue });
      }
    }
  };

  const calculateTotalPresent = (girls: number, boys: number): number => {
    return (girls || 0) + (boys || 0);
  };

  return (
    <ScrollView style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.contentContainer}>
        <Text style={styles.screenTitle}>Select Multiple Grades</Text>
        <Text style={styles.screenSubtitle}>
          Select grades and assign subjects and attendance
        </Text>

        <View style={styles.descriptionCard}>
          <Text style={styles.descriptionTitle}>Instructions:</Text>
          <Text style={styles.descriptionText}>
            • Select multiple grades for observation
          </Text>
          <Text style={styles.descriptionText}>
            • Assign subject, girls and boys attendance for each grade
          </Text>
          <Text style={styles.descriptionText}>
            • Click "Continue" to proceed to the observation form
          </Text>
        </View>

        {GRADES.map(grade => {
          const currentData = gradeData[grade];
          const presentGirls = currentData?.present_girls || 0;
          const presentBoys = currentData?.present_boys || 0;
          const totalStudents = currentData?.total_students || 0;
          const totalPresent = calculateTotalPresent(presentGirls, presentBoys);
          const absentStudents = totalStudents - totalPresent;

          return (
            <TouchableOpacity
              key={grade}
              style={[
                styles.card,
                selectedGrades.includes(grade) && styles.cardSelected,
              ]}
              onPress={() => toggleGrade(grade)}
            >
              <View style={styles.cardRow}>
                <Text
                  style={[
                    styles.cardText,
                    selectedGrades.includes(grade) && styles.cardTextSelected,
                  ]}
                >
                  {grade}
                </Text>
                {selectedGrades.includes(grade) && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </View>
              {selectedGrades.includes(grade) && (
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Subject:</Text>
                  <TextInput
                    style={styles.subjectInput}
                    placeholder="Enter subject"
                    placeholderTextColor={COLORS.textSecondary}
                    value={currentData?.subject || ''}
                    onChangeText={text =>
                      updateGradeData(grade, { subject: text })
                    }
                  />

                  <View style={styles.attendanceRow}>
                    <View style={styles.attendanceInputContainer}>
                      <Text style={styles.inputLabel}>Girls Present:</Text>
                      <TextInput
                        style={styles.attendanceInput}
                        placeholder="Present girls"
                        placeholderTextColor={COLORS.textSecondary}
                        keyboardType="numeric"
                        value={
                          presentGirls === 0 ? '' : presentGirls.toString()
                        }
                        onChangeText={text =>
                          handleNumberInputChange(grade, 'present_girls', text)
                        }
                      />
                    </View>
                    <View style={styles.attendanceInputContainer}>
                      <Text style={styles.inputLabel}>Boys Present:</Text>
                      <TextInput
                        style={styles.attendanceInput}
                        placeholder="Present boys"
                        placeholderTextColor={COLORS.textSecondary}
                        keyboardType="numeric"
                        value={presentBoys === 0 ? '' : presentBoys.toString()}
                        onChangeText={text =>
                          handleNumberInputChange(grade, 'present_boys', text)
                        }
                      />
                    </View>
                  </View>

                  <View style={{ marginTop: 9 }}>
                    <Text style={styles.inputLabel}>Total Students:</Text>
                    <TextInput
                      style={styles.totalInput}
                      placeholder="Total enrolled"
                      placeholderTextColor={COLORS.textSecondary}
                      keyboardType="numeric"
                      value={
                        totalStudents === 0 ? '' : totalStudents.toString()
                      }
                      onChangeText={text =>
                        handleNumberInputChange(grade, 'total_students', text)
                      }
                    />
                  </View>

                  <View style={styles.statsContainer}>
                    <View style={styles.statRow}>
                      <Text style={styles.statLabel}>Total Present:</Text>
                      <Text style={styles.statValue}>{totalPresent}</Text>
                    </View>
                    <View style={styles.statRow}>
                      <Text style={styles.statLabel}>Absent:</Text>
                      <Text
                        style={[
                          styles.statValue,
                          { color: absentStudents > 0 ? '#D32F2F' : '#4CAF50' },
                        ]}
                      >
                        {absentStudents > 0 ? absentStudents : 0}
                      </Text>
                    </View>
                  </View>
                </View>
              )}
            </TouchableOpacity>
          );
        })}

        <TouchableOpacity
          style={[
            styles.primaryButton,
            !isFormValid() && styles.disabledButton,
          ]}
          onPress={handleContinue}
          disabled={!isFormValid()}
        >
          <Text style={styles.primaryButtonText}>Continue</Text>
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
  card: {
    backgroundColor: COLORS.card,
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardText: {
    fontSize: 16,
    color: COLORS.text,
  },
  cardTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  checkmark: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  inputContainer: {
    marginTop: 12,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
    marginBottom: 4,
  },
  subjectInput: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 6,
    padding: 8,
    fontSize: 14,
    marginBottom: 8,
  },
  attendanceRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  attendanceInputContainer: {
    flex: 1,
    marginRight: 8,
  },
  attendanceInput: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 6,
    padding: 8,
    fontSize: 14,
  },
  totalInput: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 6,
    padding: 8,
    fontSize: 14,
  },
  statsContainer: {
    marginTop: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 8,
    borderRadius: 6,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: 'white',
    fontWeight: '500',
  },
  statValue: {
    fontSize: 12,
    color: 'white',
    fontWeight: 'bold',
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  disabledButton: {
    backgroundColor: COLORS.primaryLight,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  descriptionCard: {
    backgroundColor: COLORS.card,
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.primaryLight,
    borderLeftWidth: 4,
  },
  descriptionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 13,
    color: COLORS.text,
    marginBottom: 4,
    lineHeight: 18,
  },
});
