import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';

interface TimerContextType {
  isTimerActive: boolean;
  startTime: Date | null;
  elapsedSeconds: number;
  startTimer: () => void;
  stopTimer: () => void;
  resetTimer: () => void;
  getStartTimeISO: () => string | null;
}

const TimerContext = createContext<TimerContextType | undefined>(undefined);

export const TimerProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    if (isTimerActive) {
      interval = setInterval(() => {
        if (startTime) {
          const now = new Date();
          const diff = Math.floor((now.getTime() - startTime.getTime()) / 1000);
          setElapsedSeconds(diff);
        }
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isTimerActive, startTime]);

  const startTimer = useCallback(() => {
    const now = new Date();
    setStartTime(now);
    setIsTimerActive(true);
    setElapsedSeconds(0);
  }, []);

  const stopTimer = useCallback(() => {
    setIsTimerActive(false);
  }, []);

  const resetTimer = useCallback(() => {
    setIsTimerActive(false);
    setStartTime(null);
    setElapsedSeconds(0);
  }, []);

  const getStartTimeISO = useCallback((): string | null => {
    return startTime ? startTime.toISOString() : null;
  }, [startTime]);

  return (
    <TimerContext.Provider
      value={{
        isTimerActive,
        startTime,
        elapsedSeconds,
        startTimer,
        stopTimer,
        resetTimer,
        getStartTimeISO,
      }}
    >
      {children}
    </TimerContext.Provider>
  );
};

export const useTimer = (): TimerContextType => {
  const context = useContext(TimerContext);
  if (!context) {
    throw new Error('useTimer must be used within a TimerProvider');
  }
  return context;
};
