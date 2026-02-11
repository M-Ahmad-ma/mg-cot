import React, { useState, useEffect } from 'react';
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
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import {
  verifySchool,
  startVisitWithSavedSchool,
  clearObservationState,
} from '../services/api';
import { callResetObservationState } from '../context/ObservationContext';

type ClassroomSelectionProps = {
  navigation: NativeStackNavigationProp<
    RootStackParamList,
    'ClassroomSelection'
  >;
};

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

export const ClassroomSelectionScreen = ({
  navigation,
}: ClassroomSelectionProps) => {
  const [schoolCode, setSchoolCode] = useState('');
  const [_teacherCnic, _setTeacherCnic] = useState('');
  const [_observerCnic, _setObserverCnic] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ schoolCode?: string }>({});
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

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    if (!schoolCode.trim()) {
      newErrors.schoolCode = 'Please enter school code';
    } else if (schoolCode.trim().length < 2) {
      newErrors.schoolCode = 'School code must be at least 2 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isFormValid = () => {
    return schoolCode.trim().length > 0;
  };

  const handleContinue = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setIsLoading(true);

      // Step 1: Verify school and save school ID
      console.log('Step 1: Verifying school...');
      const schoolData = await verifySchool(schoolCode.trim());

      // Step 2: Start visit with the saved school ID
      console.log('Step 2: Starting visit...');
      const visitResult = await startVisitWithSavedSchool();

      // Check if visit was successful
      if (!visitResult.success) {
        throw new Error(visitResult.message || 'Failed to start visit');
      }

      // Both steps successful - navigate to next screen
      console.log('Both API calls successful!');
      console.log('School Data:', schoolData);
      console.log('Visit Result:', visitResult);

      // Reset observation state to ensure grade selection is shown
      await clearObservationState();
      await callResetObservationState();

      // Navigate to GradeTypeSelection screen within SetupStack
      navigation.navigate('GradeTypeSelection' as never);
    } catch (error: any) {
      console.error('Error in handleContinue:', error);

      // Show appropriate error message
      let errorMessage = error.message || 'An error occurred';

      if (errorMessage.includes('Network request failed')) {
        errorMessage = 'Network error. Please check your internet connection.';
      } else if (
        errorMessage.includes('401') ||
        errorMessage.includes('Unauthorized')
      ) {
        errorMessage = 'Authentication failed. Please login again.';
      } else if (errorMessage.includes('404')) {
        errorMessage = 'School not found. Please check the school code.';
      }

      Alert.alert('Error', errorMessage, [
        { text: 'OK', onPress: () => console.log('Alert closed') },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.contentContainer}>
        <Text style={styles.screenTitle}>Classroom Details</Text>
        <Text style={styles.screenSubtitle}>
          Enter the following information to start
        </Text>

        <Text style={styles.label}>School Code</Text>
        <TextInput
          style={[styles.input, errors.schoolCode && styles.inputError]}
          placeholder="Enter school code"
          placeholderTextColor={COLORS.textSecondary}
          value={schoolCode}
          onChangeText={text => {
            setSchoolCode(text);
            if (errors.schoolCode) {
              setErrors(prev => ({ ...prev, schoolCode: undefined }));
            }
          }}
        />
        {errors.schoolCode && (
          <Text style={styles.errorText}>{errors.schoolCode}</Text>
        )}

        {/* Optional: Uncomment if you need these fields later */}
        {/*
        <Text style={styles.label}>Teacher CNIC</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter teacher's CNIC"
          placeholderTextColor={COLORS.textSecondary}
          keyboardType="numeric"
          maxLength={13}
          value={teacherCnic}
          onChangeText={setTeacherCnic}
        />

        <Text style={styles.label}>Observer CNIC</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter observer's CNIC"
          placeholderTextColor={COLORS.textSecondary}
          keyboardType="numeric"
          maxLength={13}
          value={observerCnic}
          onChangeText={setObserverCnic}
        />
        */}

        <TouchableOpacity
          style={[
            styles.primaryButton,
            !isFormValid() && styles.disabledButton,
          ]}
          onPress={handleContinue}
          disabled={isLoading || !isFormValid()}
        >
          <Text style={styles.primaryButtonText}>
            {isLoading ? 'Processing...' : 'Start Observation'}
          </Text>
        </TouchableOpacity>

        {/* Loading indicator */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Processing...</Text>
          </View>
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
  errorText: {
    fontSize: 12,
    color: COLORS.error,
    marginTop: -12,
    marginBottom: 12,
    marginLeft: 4,
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
    opacity: 0.6,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    marginTop: 16,
    padding: 10,
    backgroundColor: '#e8f5e9',
    borderRadius: 8,
    alignItems: 'center',
  },
  loadingText: {
    color: COLORS.primaryDark,
    fontSize: 14,
  },
});

export default ClassroomSelectionScreen;
