import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react'
import { AuthState, AuthContextType, GoogleLoginRequest, Teacher } from '../types/auth'
import { mockGoogleLogin, initializeDevAuth } from '../services/devAuthService'

// Check if we're in development mode
const isDevelopment = process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost'

// Auth reducer
type AuthAction = 
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: { teacher: Teacher; token: string } }
  | { type: 'LOGIN_ERROR'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'CLEAR_ERROR' }
  | { type: 'RESTORE_SESSION'; payload: { teacher: Teacher; token: string } }

const initialState: AuthState = {
  isAuthenticated: false,
  teacher: null,
  token: null,
  loading: false,
  error: null
}

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'LOGIN_START':
      return { ...state, loading: true, error: null }
    
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        isAuthenticated: true,
        teacher: action.payload.teacher,
        token: action.payload.token,
        loading: false,
        error: null
      }
    
    case 'LOGIN_ERROR':
      return {
        ...state,
        isAuthenticated: false,
        teacher: null,
        token: null,
        loading: false,
        error: action.payload
      }
    
    case 'LOGOUT':
      return {
        ...initialState
      }
    
    case 'CLEAR_ERROR':
      return { ...state, error: null }
    
    case 'RESTORE_SESSION':
      return {
        ...state,
        isAuthenticated: true,
        teacher: action.payload.teacher,
        token: action.payload.token
      }
    
    default:
      return state
  }
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, dispatch] = useReducer(authReducer, initialState)

  // Restore session on mount
  useEffect(() => {
    // Initialize development auth if in dev mode
    if (isDevelopment) {
      initializeDevAuth()
    }

    const token = localStorage.getItem('auth_token')
    const teacherData = localStorage.getItem('teacher_data')
    
    if (token && teacherData) {
      try {
        const teacher = JSON.parse(teacherData)
        dispatch({ type: 'RESTORE_SESSION', payload: { teacher, token } })
      } catch (error) {
        // Invalid stored data, clear it
        localStorage.removeItem('auth_token')
        localStorage.removeItem('teacher_data')
      }
    }
  }, [])

  const loginWithGoogle = async (credential: string) => {
    dispatch({ type: 'LOGIN_START' })
    
    try {
      let data: any
      
      if (isDevelopment) {
        // Use mock Google authentication in development
        data = await mockGoogleLogin(credential)
      } else {
        // Use real Google API in production
        const response = await fetch('/api/auth/google', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ credential })
        })
        
        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.message || 'Google bejelentkezési hiba')
        }
        
        data = await response.json()
      }
      
      // Store in localStorage
      localStorage.setItem('auth_token', data.token)
      localStorage.setItem('teacher_data', JSON.stringify(data.teacher))
      
      dispatch({ 
        type: 'LOGIN_SUCCESS', 
        payload: { teacher: data.teacher, token: data.token } 
      })
    } catch (error) {
      dispatch({ 
        type: 'LOGIN_ERROR', 
        payload: error instanceof Error ? error.message : 'Ismeretlen hiba' 
      })
      throw error
    }
  }

  const logout = () => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('teacher_data')
    dispatch({ type: 'LOGOUT' })
  }

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' })
  }

  const value: AuthContextType = {
    ...state,
    loginWithGoogle,
    logout,
    clearError
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}