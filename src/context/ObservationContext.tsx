import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import {
  saveObservationState,
  getObservationState,
  clearObservationState,
  GradeData,
} from '../services/api';

const log = {
  info: (tag: string, message: string) => {
    console.log(`[Context][${tag}] ${message}`);
  },
};

interface ObservationContextType {
  isMultiGrade: boolean | null;
  setIsMultiGrade: (value: boolean | null) => void;
  selectedGrade: string | null;
  setSelectedGrade: (value: string | null) => void;
  selectedGrades: string[];
  setSelectedGrades: (value: string[]) => void;
  gradeData: { [key: string]: GradeData };
  setGradeData: (value: { [key: string]: GradeData }) => void;
  updateGradeData: (grade: string, data: Partial<GradeData>) => void;
  removeGradeData: (grade: string) => void;
  resetObservation: () => void;
  getGradesForApi: () => GradeData[];
  resetObservationState: () => Promise<void>;
  isLoaded: boolean;
}

const ObservationContext = createContext<ObservationContextType | undefined>(
  undefined,
);

export const ObservationProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [isMultiGrade, setIsMultiGrade] = useState<boolean | null>(null);
  const [selectedGrade, setSelectedGrade] = useState<string | null>(null);
  const [selectedGrades, setSelectedGrades] = useState<string[]>([]);
  const [gradeData, setGradeData] = useState<{ [key: string]: GradeData }>({});
  const [isLoaded, setIsLoaded] = useState(false);

  console.log(isMultiGrade);

  useEffect(() => {
    const loadState = async () => {
      const savedState = await getObservationState();
      if (savedState) {
        log.info('ObservationContext', 'Loading saved state');
        setIsMultiGrade(savedState.isMultiGrade);
        setSelectedGrade(savedState.selectedGrade);
        setSelectedGrades(savedState.selectedGrades);
        setGradeData(savedState.gradeData);
      }
      setIsLoaded(true);
    };
    loadState();
  }, []);

  useEffect(() => {
    if (isLoaded) {
      saveObservationState({
        isMultiGrade,
        selectedGrade,
        selectedGrades,
        gradeData,
      });
    }
  }, [isMultiGrade, selectedGrade, selectedGrades, gradeData, isLoaded]);

  const updateGradeData = (grade: string, data: Partial<GradeData>) => {
    setGradeData(prev => ({
      ...prev,
      [grade]: {
        ...(prev[grade] || {
          grade_name: grade,
          subject: '',
          total_students: 0,
          present_boys: 0,
          present_girls: 0,
        }),
        ...data,
      },
    }));
  };

  const removeGradeData = (grade: string) => {
    setGradeData(prev => {
      const newGradeData = { ...prev };
      delete newGradeData[grade];
      return newGradeData;
    });
  };

  const getGradesForApi = (): GradeData[] => {
    return Object.values(gradeData).filter(data =>
      selectedGrades.includes(data.grade_name),
    );
  };

  const resetObservationState = async () => {
    await clearObservationState();
    setIsMultiGrade(null);
    setSelectedGrade(null);
    setSelectedGrades([]);
    setGradeData({});
  };

  useEffect(() => {
    setResetObservationState(resetObservationState);
  }, []);

  return (
    <ObservationContext.Provider
      value={{
        isMultiGrade,
        setIsMultiGrade,
        selectedGrade,
        setSelectedGrade,
        selectedGrades,
        setSelectedGrades,
        gradeData,
        setGradeData,
        updateGradeData,
        removeGradeData,
        getGradesForApi,
        resetObservation: resetObservationState,
        resetObservationState,
        isLoaded,
      }}
    >
      {children}
    </ObservationContext.Provider>
  );
};

export const useObservation = (): ObservationContextType => {
  const context = useContext(ObservationContext);
  if (!context) {
    throw new Error(
      'useObservation must be used within an ObservationProvider',
    );
  }
  return context;
};

let resetFunc: (() => Promise<void>) | null = null;

export const setResetObservationState = (func: () => Promise<void>) => {
  resetFunc = func;
};

export const callResetObservationState = async () => {
  if (resetFunc) {
    await resetFunc();
  }
};
