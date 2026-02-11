import React, { createContext, useContext, useState, ReactNode } from 'react';
import { login as apiLogin } from '../services/api';
import {
  clearVisitId,
  clearSchoolId,
  clearObservationState,
} from '../services/api';
import { callResetObservationState } from './ObservationContext';

interface AuthContextType {
  isLoggedIn: boolean;
  observationStarted: boolean;
  observationLocked: boolean;
  login: (
    cnic: string,
    password: string,
  ) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  startObservation: () => void;
  lockObservation: () => void;
  unlockObservation: () => void;
  endObservation: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [observationStarted, setObservationStarted] = useState(false);
  const [observationLocked, setObservationLocked] = useState(false);

  const login = async (cnic: string, password: string) => {
    const result = await apiLogin(cnic, password);

    if (result.success) {
      setIsLoggedIn(true);
      await clearObservationState();
      await callResetObservationState();
    }

    return result;
  };

  const logout = () => {
    setIsLoggedIn(false);
    setObservationStarted(false);
    setObservationLocked(false);
  };

  const startObservation = () => {
    setObservationStarted(true);
  };

  const lockObservation = () => {
    setObservationLocked(true);
  };

  const unlockObservation = () => {
    setObservationLocked(false);
  };

  const endObservation = async () => {
    setObservationStarted(false);
    setObservationLocked(false);
    await clearVisitId();
    await clearSchoolId();
  };

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn,
        observationStarted,
        observationLocked,
        login: login,
        logout,
        startObservation,
        lockObservation,
        unlockObservation,
        endObservation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
