import { Teacher, TeacherWithPassword } from '../../types/auth'

// Import the appropriate repository based on environment
const isDevelopment = process.env.NODE_ENV === 'development' || 
                     (typeof window !== 'undefined' && window.location.hostname === 'localhost')

let TeacherRepository: any

if (isDevelopment) {
  // Development: Use localStorage mock
  const MOCK_TEACHERS_KEY = 'dev_mock_teachers'
  let mockTeachers: TeacherWithPassword[] = []

  class MockTeacherRepository {
    static async findByUsername(username: string): Promise<TeacherWithPassword | null> {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(MOCK_TEACHERS_KEY)
        if (stored) {
          mockTeachers = JSON.parse(stored)
        }
      }
      
      return mockTeachers.find(teacher => teacher.username === username) || null
    }

    static async findByEmail(email: string): Promise<TeacherWithPassword | null> {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(MOCK_TEACHERS_KEY)
        if (stored) {
          mockTeachers = JSON.parse(stored)
        }
      }
      
      return mockTeachers.find(teacher => teacher.email === email) || null
    }

    static async findById(id: string): Promise<TeacherWithPassword | null> {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(MOCK_TEACHERS_KEY)
        if (stored) {
          mockTeachers = JSON.parse(stored)
        }
      }
      
      return mockTeachers.find(teacher => teacher.id === id) || null
    }

    static async create(teacherData: Omit<TeacherWithPassword, 'id' | 'createdAt' | 'lastLogin'>): Promise<Teacher> {
      const newTeacher: TeacherWithPassword = {
        id: generateId(),
        ...teacherData,
        createdAt: new Date(),
        lastLogin: undefined
      }

      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(MOCK_TEACHERS_KEY)
        if (stored) {
          mockTeachers = JSON.parse(stored)
        }
      }

      mockTeachers.push(newTeacher)

      if (typeof window !== 'undefined') {
        localStorage.setItem(MOCK_TEACHERS_KEY, JSON.stringify(mockTeachers))
      }

      const { password, ...teacherWithoutPassword } = newTeacher
      return teacherWithoutPassword
    }

    static async updateGoogleInfo(id: string, googleId: string): Promise<void> {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(MOCK_TEACHERS_KEY)
        if (stored) {
          mockTeachers = JSON.parse(stored)
        }
      }

      const teacherIndex = mockTeachers.findIndex(teacher => teacher.id === id)
      if (teacherIndex !== -1) {
        mockTeachers[teacherIndex].googleId = googleId
        
        if (typeof window !== 'undefined') {
          localStorage.setItem(MOCK_TEACHERS_KEY, JSON.stringify(mockTeachers))
        }
      }
    }

    static async updateProfile(id: string, updates: Partial<Pick<Teacher, 'fullName'>>): Promise<Teacher | null> {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(MOCK_TEACHERS_KEY)
        if (stored) {
          mockTeachers = JSON.parse(stored)
        }
      }

      const teacherIndex = mockTeachers.findIndex(teacher => teacher.id === id)
      if (teacherIndex !== -1) {
        mockTeachers[teacherIndex] = { ...mockTeachers[teacherIndex], ...updates }
        
        if (typeof window !== 'undefined') {
          localStorage.setItem(MOCK_TEACHERS_KEY, JSON.stringify(mockTeachers))
        }
        
        const { password, ...teacherWithoutPassword } = mockTeachers[teacherIndex]
        return teacherWithoutPassword
      }
      
      return null
    }

    static async updateLastLogin(id: string): Promise<void> {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(MOCK_TEACHERS_KEY)
        if (stored) {
          mockTeachers = JSON.parse(stored)
        }
      }

      const teacherIndex = mockTeachers.findIndex(teacher => teacher.id === id)
      if (teacherIndex !== -1) {
        mockTeachers[teacherIndex].lastLogin = new Date()
        
        if (typeof window !== 'undefined') {
          localStorage.setItem(MOCK_TEACHERS_KEY, JSON.stringify(mockTeachers))
        }
      }
    }
  }

  TeacherRepository = MockTeacherRepository
} else {
  // Production: Use Neon PostgreSQL
  const { NeonTeacherRepository } = require('./neonDatabase')
  TeacherRepository = NeonTeacherRepository
}

export { TeacherRepository }

// Simple ID generator for development
function generateId(): string {
  return 'teacher_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now().toString(36)
}

// Validation utilities
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function validateUsername(username: string): boolean {
  return username.length >= 3 && /^[a-zA-Z0-9._-]+$/.test(username)
}

export function validatePassword(password: string): boolean {
  return password.length >= 6
}