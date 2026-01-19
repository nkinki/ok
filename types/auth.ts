export interface Teacher {
  id: string
  email: string
  fullName: string
  createdAt: Date
  lastLogin?: Date
  isActive: boolean
  authProvider: 'local' | 'google' | 'code'
  googleId?: string
  subject?: string
}

// Internal interface for database storage (includes password)
export interface TeacherWithPassword extends Teacher {
  password?: string // Optional for Google OAuth users
}

export interface LoginRequest {
  username: string
  password: string
}

export interface GoogleLoginRequest {
  credential: string // Google JWT token
}

export interface LoginResponse {
  token: string
  teacher: Teacher
  expiresAt: string
}

// Remove RegisterRequest - no manual registration allowed

export interface AuthState {
  isAuthenticated: boolean
  teacher: Teacher | null
  token: string | null
  loading: boolean
  error: string | null
}

export interface AuthContextType extends AuthState {
  loginWithCode: (code: string) => Promise<void>
  loginWithGoogle: (credential: string) => Promise<void>
  logout: () => void
  clearError: () => void
}