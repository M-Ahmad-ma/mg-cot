import React from 'react';
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
import { useObservation } from '../context';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../../App';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type GradeSelectionScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'GradeSelection'
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

export const GradeSelectionScreen = () => {
  const navigation = useNavigation<GradeSelectionScreenNavigationProp>();
  const grades = ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5'];
  const { selectedGrade, setSelectedGrade } = useObservation();
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

  const handleNext = () => {
    navigation.navigate('SingleGradeDetails');
  };

  const isFormValid = () => {
    return !!selectedGrade;
  };

  return (
    <ScrollView style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.contentContainer}>
        <Text style={styles.screenTitle}>Select Grade</Text>
        <Text style={styles.screenSubtitle}>
          Choose the grade for observation
        </Text>

        {grades.map(grade => (
          <TouchableOpacity
            key={grade}
            style={[
              styles.card,
              selectedGrade === grade && styles.cardSelected,
            ]}
            onPress={() => setSelectedGrade(grade)}
          >
            <Text
              style={[
                styles.cardText,
                selectedGrade === grade && styles.cardTextSelected,
              ]}
            >
              {grade}
            </Text>
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          style={[
            styles.primaryButton,
            !isFormValid() && styles.disabledButton,
          ]}
          onPress={handleNext}
          disabled={!isFormValid()}
        >
          <Text style={styles.primaryButtonText}>Next</Text>
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
  cardText: {
    fontSize: 16,
    color: COLORS.text,
  },
  cardTextSelected: {
    color: '#fff',
    fontWeight: '600',
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
});
