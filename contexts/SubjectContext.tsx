import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Tantárgyi adatok típusai
interface SubjectCredential {
  subject: string;
  displayName: string;
  theme: string;
  password: string;
}

interface SubjectContextType {
  // Jelenlegi tantárgy állapot
  currentSubject: string | null;
  subjectDisplayName: string;
  subjectTheme: string;
  isAuthenticated: boolean;
  
  // Tantárgyi műveletek
  login: (password: string) => Promise<boolean>;
  logout: () => void;
  switchSubject: () => void;
  
  // Tantárgyi adatok
  availableSubjects: SubjectCredential[];
  getSubjectInfo: (subject: string) => SubjectCredential | null;
}

// Tantárgyi jelszavak és adatok
const SUBJECT_CREDENTIALS: SubjectCredential[] = [
  { subject: 'info', password: 'infoxxx', displayName: 'Informatika', theme: 'blue' },
  { subject: 'matek', password: 'matekxxx', displayName: 'Matematika', theme: 'green' },
  { subject: 'magy', password: 'magyxxx', displayName: 'Magyar nyelv', theme: 'red' },
  { subject: 'tori', password: 'torixxx', displayName: 'Történelem', theme: 'purple' },
  { subject: 'termeszet', password: 'termxxx', displayName: 'Természetismeret', theme: 'orange' }
];

// Színkódok tantárgyankénti témákhoz
export const SUBJECT_THEMES = {
  blue: {
    primary: 'bg-blue-600',
    secondary: 'bg-blue-100',
    text: 'text-blue-900',
    border: 'border-blue-200',
    hover: 'hover:bg-blue-700'
  },
  green: {
    primary: 'bg-green-600',
    secondary: 'bg-green-100',
    text: 'text-green-900',
    border: 'border-green-200',
    hover: 'hover:bg-green-700'
  },
  red: {
    primary: 'bg-red-600',
    secondary: 'bg-red-100',
    text: 'text-red-900',
    border: 'border-red-200',
    hover: 'hover:bg-red-700'
  },
  purple: {
    primary: 'bg-purple-600',
    secondary: 'bg-purple-100',
    text: 'text-purple-900',
    border: 'border-purple-200',
    hover: 'hover:bg-purple-700'
  },
  orange: {
    primary: 'bg-orange-600',
    secondary: 'bg-orange-100',
    text: 'text-orange-900',
    border: 'border-orange-200',
    hover: 'hover:bg-orange-700'
  }
};

// Teljesítmény kategória színek
export const PERFORMANCE_COLORS = {
  excellent: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200' },
  good: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200' },
  average: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200' },
  poor: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200' }
};

// Context létrehozása
const SubjectContext = createContext<SubjectContextType | undefined>(undefined);

// Provider komponens
interface SubjectProviderProps {
  children: ReactNode;
}

export const SubjectProvider: React.FC<SubjectProviderProps> = ({ children }) => {
  const [currentSubject, setCurrentSubject] = useState<string | null>(null);
  const [subjectDisplayName, setSubjectDisplayName] = useState<string>('');
  const [subjectTheme, setSubjectTheme] = useState<string>('blue');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  // LocalStorage kulcsok
  const STORAGE_KEYS = {
    SUBJECT: 'okosgyakorlo_current_subject',
    DISPLAY_NAME: 'okosgyakorlo_subject_display_name',
    THEME: 'okosgyakorlo_subject_theme',
    AUTH_STATUS: 'okosgyakorlo_subject_auth',
    AUTH_TIMESTAMP: 'okosgyakorlo_auth_timestamp'
  };

  // Komponens betöltésekor ellenőrizzük a mentett állapotot
  useEffect(() => {
    try {
      const savedSubject = localStorage.getItem(STORAGE_KEYS.SUBJECT);
      const savedDisplayName = localStorage.getItem(STORAGE_KEYS.DISPLAY_NAME);
      const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME);
      const savedAuthStatus = localStorage.getItem(STORAGE_KEYS.AUTH_STATUS);
      const savedTimestamp = localStorage.getItem(STORAGE_KEYS.AUTH_TIMESTAMP);

      // Ellenőrizzük, hogy a session még érvényes-e (24 óra)
      const now = Date.now();
      const timestamp = savedTimestamp ? parseInt(savedTimestamp) : 0;
      const isSessionValid = (now - timestamp) < (24 * 60 * 60 * 1000); // 24 óra

      if (savedSubject && savedDisplayName && savedTheme && savedAuthStatus === 'true' && isSessionValid) {
        setCurrentSubject(savedSubject);
        setSubjectDisplayName(savedDisplayName);
        setSubjectTheme(savedTheme);
        setIsAuthenticated(true);
      } else {
        // Ha lejárt a session, töröljük az adatokat
        clearStoredAuth();
      }
    } catch (error) {
      console.error('Error loading subject context from localStorage:', error);
      clearStoredAuth();
    }
  }, []);

  // Mentett auth adatok törlése
  const clearStoredAuth = () => {
    try {
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
    } catch (error) {
      console.error('Error clearing stored auth:', error);
    }
  };

  // Tantárgyi bejelentkezés
  const login = async (password: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/simple-api/auth/subject', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ password })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Sikeres bejelentkezés
        setCurrentSubject(data.subject);
        setSubjectDisplayName(data.displayName);
        setSubjectTheme(data.theme);
        setIsAuthenticated(true);

        // Mentés localStorage-ba
        try {
          localStorage.setItem(STORAGE_KEYS.SUBJECT, data.subject);
          localStorage.setItem(STORAGE_KEYS.DISPLAY_NAME, data.displayName);
          localStorage.setItem(STORAGE_KEYS.THEME, data.theme);
          localStorage.setItem(STORAGE_KEYS.AUTH_STATUS, 'true');
          localStorage.setItem(STORAGE_KEYS.AUTH_TIMESTAMP, Date.now().toString());
        } catch (storageError) {
          console.warn('Could not save to localStorage:', storageError);
        }

        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error('Subject login error:', error);
      return false;
    }
  };

  // Kijelentkezés
  const logout = () => {
    setCurrentSubject(null);
    setSubjectDisplayName('');
    setSubjectTheme('blue');
    setIsAuthenticated(false);
    clearStoredAuth();
  };

  // Tantárgy váltás (kijelentkezés)
  const switchSubject = () => {
    logout();
  };

  // Tantárgy információ lekérése
  const getSubjectInfo = (subject: string): SubjectCredential | null => {
    return SUBJECT_CREDENTIALS.find(cred => cred.subject === subject) || null;
  };

  const contextValue: SubjectContextType = {
    currentSubject,
    subjectDisplayName,
    subjectTheme,
    isAuthenticated,
    login,
    logout,
    switchSubject,
    availableSubjects: SUBJECT_CREDENTIALS,
    getSubjectInfo
  };

  return (
    <SubjectContext.Provider value={contextValue}>
      {children}
    </SubjectContext.Provider>
  );
};

// Hook a context használatához
export const useSubject = (): SubjectContextType => {
  const context = useContext(SubjectContext);
  if (context === undefined) {
    throw new Error('useSubject must be used within a SubjectProvider');
  }
  return context;
};

// Utility függvények
export const getThemeClasses = (theme: string) => {
  return SUBJECT_THEMES[theme as keyof typeof SUBJECT_THEMES] || SUBJECT_THEMES.blue;
};

export const getPerformanceClasses = (category: string) => {
  return PERFORMANCE_COLORS[category as keyof typeof PERFORMANCE_COLORS] || PERFORMANCE_COLORS.poor;
};

// Teljesítmény számítási függvények
export const calculatePercentage = (correctAnswers: number, totalQuestions: number, totalScore?: number, maxScore?: number): number => {
  // Ha pontszám alapú számítás lehetséges
  if (totalScore !== undefined && maxScore !== undefined && maxScore > 0) {
    return Math.round((totalScore / maxScore) * 100);
  }
  
  // Egyszerű helyes válaszok alapján
  if (totalQuestions > 0) {
    return Math.round((correctAnswers / totalQuestions) * 100);
  }
  
  return 0;
};

export const getPerformanceCategory = (percentage: number): string => {
  if (percentage >= 90) return 'excellent';
  if (percentage >= 75) return 'good';
  if (percentage >= 60) return 'average';
  return 'poor';
};

export const getPerformanceCategoryLabel = (category: string): string => {
  const labels = {
    excellent: 'Kiváló',
    good: 'Jó',
    average: 'Közepes',
    poor: 'Gyenge'
  };
  return labels[category as keyof typeof labels] || 'Ismeretlen';
};

export default SubjectContext;