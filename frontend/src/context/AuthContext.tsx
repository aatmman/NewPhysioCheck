import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

// DUMMY AUTH TYPES
export type Role = 'doctor' | 'patient';

export interface AuthUser {
  id: string;
  name: string;
  role: Role;
  email: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loginAsDoctor: () => void;
  loginAsPatient: () => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

const STORAGE_KEY = 'physiocheck_dummy_user';

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse dummy user', e);
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    setLoading(false);
  }, []);

  const loginAsDoctor = () => {
    const doctorUser: AuthUser = {
      id: 'doctor-1',
      name: 'Demo Doctor',
      role: 'doctor',
      email: 'doctor@demo.com'
    };
    setUser(doctorUser);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(doctorUser));
  };

  const loginAsPatient = () => {
    const patientUser: AuthUser = {
      id: 'patient-1',
      name: 'Demo Patient',
      role: 'patient',
      email: 'patient@demo.com'
    };
    setUser(patientUser);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(patientUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const value: AuthContextType = {
    user,
    loginAsDoctor,
    loginAsPatient,
    logout,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}



