import React, { useEffect } from 'react';
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

type GradeTypeSelectionNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'GradeTypeSelection'
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

export const GradeTypeSelectionScreen = () => {
  const navigation = useNavigation<GradeTypeSelectionNavigationProp>();
  const { setIsMultiGrade } = useObservation();
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

  const handleMultiGrade = () => {
    setIsMultiGrade(true);
    navigation.navigate('MultiGradeSelection');
  };

  const handleSingleGrade = () => {
    setIsMultiGrade(false);
    navigation.navigate('GradeSelection');
  };

  return (
    <ScrollView style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.contentContainer}>
        <Text style={styles.screenTitle}>Grade Selection</Text>
        <Text style={styles.screenSubtitle}>
          Would you like to select multiple grades for observation?
        </Text>

        <TouchableOpacity
          style={styles.toggleButton}
          onPress={handleMultiGrade}
        >
          <Text style={styles.toggleButtonText}>
            Yes, select multiple grades
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.toggleButton}
          onPress={handleSingleGrade}
        >
          <Text style={styles.toggleButtonText}>No, select single grade</Text>
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
  toggleButton: {
    backgroundColor: COLORS.card,
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  toggleButtonText: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '600',
  },
});
