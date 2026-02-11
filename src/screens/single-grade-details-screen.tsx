import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  BackHandler,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useObservation } from '../context';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../../App';
import { useAuth } from '../context/AuthContext';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { addGrades, getVisitId } from '../services/api';

type SingleGradeDetailsNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'SingleGradeDetails'
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
};

export const SingleGradeDetailsScreen = () => {
  const navigation = useNavigation<SingleGradeDetailsNavigationProp>();
  const insets = useSafeAreaInsets();
  const { selectedGrade, gradeData, updateGradeData, setIsMultiGrade } =
    useObservation();
  const { startObservation } = useAuth();
  const [selectedSubject, setSelectedSubject] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    subject?: string;
    totalStudents?: string;
    girlsAttendance?: string;
    boysAttendance?: string;
  }>({});

  useFocusEffect(
    React.useCallback(() => {
      const backHandler = BackHandler.addEventListener(
        'hardwareBackPress',
        () => true,
      );
      return () => backHandler.remove();
    }, []),
  );

  const currentGradeData = selectedGrade ? gradeData[selectedGrade] : null;

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    if (!selectedSubject.trim()) {
      newErrors.subject = 'Please enter a subject';
    }

    const girlsAttendance = currentGradeData?.present_girls || 0;
    const boysAttendance = currentGradeData?.present_boys || 0;
    const totalStudents = currentGradeData?.total_students || 0;

    if (!totalStudents || totalStudents === 0) {
      newErrors.totalStudents = 'Please enter total students';
    } else if (totalStudents < 1) {
      newErrors.totalStudents = 'Total students must be at least 1';
    }

    if (!girlsAttendance || girlsAttendance === 0) {
      newErrors.girlsAttendance = 'Please enter girls attendance';
    } else if (girlsAttendance < 0) {
      newErrors.girlsAttendance = 'Girls attendance cannot be negative';
    }

    if (!boysAttendance || boysAttendance === 0) {
      newErrors.boysAttendance = 'Please enter boys attendance';
    } else if (boysAttendance < 0) {
      newErrors.boysAttendance = 'Boys attendance cannot be negative';
    }

    const totalPresent = girlsAttendance + boysAttendance;
    if (totalStudents > 0 && totalPresent > totalStudents) {
      newErrors.girlsAttendance = 'Total present cannot exceed total students';
      newErrors.boysAttendance = 'Total present cannot exceed total students';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleStartObservation = async () => {
    if (!selectedGrade) {
      Alert.alert('Error', 'No grade selected');
      return;
    }

    if (!validateForm()) {
      return;
    }

    const girlsAttendance = currentGradeData?.present_girls || 0;
    const boysAttendance = currentGradeData?.present_boys || 0;
    const totalStudents = currentGradeData?.total_students || 0;

    const storedVisitId = await getVisitId();
    const visitId = storedVisitId ? parseInt(storedVisitId, 10) : null;

    if (!visitId) {
      Alert.alert('Error', 'No visit ID found. Please start a visit first.');
      return;
    }

    setLoading(true);

    try {
      updateGradeData(selectedGrade, {
        subject: selectedSubject,
        present_girls: girlsAttendance,
        present_boys: boysAttendance,
        total_students: totalStudents,
      });

      const addGradesResult = await addGrades(visitId, [
        {
          grade_name: selectedGrade,
          subject: selectedSubject,
          present_girls: girlsAttendance,
          present_boys: boysAttendance,
          total_students: totalStudents,
        },
      ]);

      if (!addGradesResult.success) {
        Alert.alert('Error', addGradesResult.message || 'Failed to add grade');
        return;
      }

      startObservation();
      setIsMultiGrade(false);
      navigation.navigate('ObservationFlow');
    } catch (error) {
      console.error('Error starting observation:', error);
      Alert.alert('Error', 'Failed to start observation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!selectedGrade) {
    return (
      <ScrollView style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.contentContainer}>
          <Text style={styles.errorText}>
            No grade selected. Please go back and select a grade.
          </Text>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.contentContainer}>
        <Text style={styles.screenTitle}>Grade Details</Text>
        <Text style={styles.screenSubtitle}>
          {selectedGrade} - Enter the following information
        </Text>

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Setting up observation...</Text>
          </View>
        )}

        {!loading && (
          <>
            <Text style={styles.label}>Subject</Text>
            <TextInput
              style={[styles.input, errors.subject && styles.inputError]}
              placeholder="Enter subject (e.g., English, Mathematics)"
              placeholderTextColor={COLORS.textSecondary}
              value={selectedSubject}
              onChangeText={text => {
                setSelectedSubject(text);
                if (errors.subject) {
                  setErrors(prev => ({ ...prev, subject: undefined }));
                }
              }}
            />
            {errors.subject && (
              <Text style={styles.errorText}>{errors.subject}</Text>
            )}

            <Text style={styles.label}>Total Students</Text>
            <TextInput
              style={[styles.input, errors.totalStudents && styles.inputError]}
              placeholder="Enter total students"
              placeholderTextColor={COLORS.textSecondary}
              keyboardType="numeric"
              value={
                currentGradeData?.total_students
                  ? currentGradeData.total_students.toString()
                  : ''
              }
              onChangeText={text => {
                const numericValue = parseInt(text.replace(/[^0-9]/g, ''), 10);
                updateGradeData(selectedGrade, {
                  total_students: isNaN(numericValue) ? 0 : numericValue,
                });
                if (errors.totalStudents) {
                  setErrors(prev => ({ ...prev, totalStudents: undefined }));
                }
              }}
            />
            {errors.totalStudents && (
              <Text style={styles.errorText}>{errors.totalStudents}</Text>
            )}

            <Text style={styles.label}>Girls Attendance</Text>
            <TextInput
              style={[
                styles.input,
                errors.girlsAttendance && styles.inputError,
              ]}
              placeholder="Enter girls attendance"
              placeholderTextColor={COLORS.textSecondary}
              keyboardType="numeric"
              value={
                currentGradeData?.present_girls
                  ? currentGradeData.present_girls.toString()
                  : ''
              }
              onChangeText={text => {
                const numericValue = parseInt(text.replace(/[^0-9]/g, ''), 10);
                updateGradeData(selectedGrade, {
                  present_girls: isNaN(numericValue) ? 0 : numericValue,
                });
                if (errors.girlsAttendance) {
                  setErrors(prev => ({ ...prev, girlsAttendance: undefined }));
                }
              }}
            />
            {errors.girlsAttendance && (
              <Text style={styles.errorText}>{errors.girlsAttendance}</Text>
            )}

            <Text style={styles.label}>Boys Attendance</Text>
            <TextInput
              style={[styles.input, errors.boysAttendance && styles.inputError]}
              placeholder="Enter boys attendance"
              placeholderTextColor={COLORS.textSecondary}
              keyboardType="numeric"
              value={
                currentGradeData?.present_boys
                  ? currentGradeData.present_boys.toString()
                  : ''
              }
              onChangeText={text => {
                const numericValue = parseInt(text.replace(/[^0-9]/g, ''), 10);
                updateGradeData(selectedGrade, {
                  present_boys: isNaN(numericValue) ? 0 : numericValue,
                });
              }}
            />

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleStartObservation}
            >
              <Text style={styles.primaryButtonText}>Continue</Text>
            </TouchableOpacity>
          </>
        )}
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
  errorText: {
    fontSize: 12,
    color: COLORS.error,
    marginTop: -12,
    marginBottom: 12,
    marginLeft: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  inputError: {
    borderColor: COLORS.error,
    borderWidth: 2,
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
