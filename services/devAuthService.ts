// Development authentication service - simulates API calls
import { GoogleLoginRequest, LoginResponse, Teacher } from '../types/auth'

// Mock database for development
const MOCK_TEACHERS_KEY = 'dev_mock_teachers'
const ALLOWED_DOMAIN = 'szenmihalyatisk.hu'

interface MockTeacher extends Teacher {
  password?: string
}

// Helper functions
function getMockTeachers(): MockTeacher[] {
  const stored = localStorage.getItem(MOCK_TEACHERS_KEY)
  return stored ? JSON.parse(stored) : []
}

function saveMockTeachers(teachers: MockTeacher[]) {
  localStorage.setItem(MOCK_TEACHERS_KEY, JSON.stringify(teachers))
}

function generateId(): string {
  return 'teacher_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now().toString(36)
}

function generateToken(teacher: Teacher): string {
  // Simple mock token for development
  return btoa(JSON.stringify({
    teacherId: teacher.id,
    email: teacher.email,
    name: teacher.fullName,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days
  }))
}

function getTokenExpirationDate(): string {
  const now = new Date()
  const expirationDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) // 7 days
  return expirationDate.toISOString()
}

// Validation functions
function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

function validateUsername(username: string): boolean {
  return username.length >= 3 && /^[a-zA-Z0-9._-]+$/.test(username)
}

function validatePassword(password: string): boolean {
  return password.length >= 6
}

// Mock Google OAuth login for development
export async function mockGoogleLogin(credential: string): Promise<LoginResponse> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 800))

  // In development, simulate Google token verification
  // Parse a mock payload from the credential (in real app, this would be verified by Google)
  let mockPayload: any
  
  try {
    // For development, we'll accept a simple JSON string as credential
    mockPayload = JSON.parse(atob(credential))
  } catch {
    // If not valid JSON, create a mock payload for testing
    mockPayload = {
      sub: 'google_123456789',
      email: 'teszt.tanar@szenmihalyatisk.hu',
      name: 'Teszt Tanár',
      email_verified: true
    }
  }

  const { sub: googleId, email, name, email_verified } = mockPayload

  // Check if email is verified
  if (!email_verified) {
    throw new Error('Az email cím nincs megerősítve a Google fiókban')
  }

  // Check if email belongs to allowed domain
  if (!email || !email.endsWith(`@${ALLOWED_DOMAIN}`)) {
    throw new Error(`Csak @${ALLOWED_DOMAIN} email címekkel lehet bejelentkezni`)
  }

  // Extract username from email
  const username = email.split('@')[0]

  // Check if teacher already exists
  const teachers = getMockTeachers()
  let teacher = teachers.find(t => t.email === email)
  
  if (!teacher) {
    // Auto-create teacher account for institutional users
    const newTeacher: MockTeacher = {
      id: generateId(),
      email,
      fullName: name || email.split('@')[0],
      authProvider: 'google',
      googleId,
      isActive: true,
      createdAt: new Date(),
      lastLogin: undefined
    }
    
    teachers.push(newTeacher)
    saveMockTeachers(teachers)
    teacher = newTeacher
  } else {
    // Update existing teacher with Google info if needed
    if (!teacher.googleId) {
      teacher.googleId = googleId
      saveMockTeachers(teachers)
    }
  }

  // Check if account is active
  if (!teacher.isActive) {
    throw new Error('A fiók inaktív. Kérjen segítséget az adminisztrátortól.')
  }

  // Update last login
  teacher.lastLogin = new Date()
  saveMockTeachers(teachers)

  // Remove password from response
  const { password: _, ...teacherWithoutPassword } = teacher
  const token = generateToken(teacherWithoutPassword)
  const expiresAt = getTokenExpirationDate()

  return {
    token,
    teacher: teacherWithoutPassword,
    expiresAt
  }
}

// Mock profile update for development
export async function mockUpdateProfile(teacherId: string, updates: { fullName: string }): Promise<Teacher> {
  await new Promise(resolve => setTimeout(resolve, 500))
  
  const teachers = getMockTeachers()
  const teacherIndex = teachers.findIndex(t => t.id === teacherId)
  
  if (teacherIndex === -1) {
    throw new Error('Tanár nem található')
  }
  
  if (updates.fullName.trim().length < 2) {
    throw new Error('A teljes név legalább 2 karakter hosszú legyen')
  }
  
  teachers[teacherIndex].fullName = updates.fullName.trim()
  saveMockTeachers(teachers)
  
  const { password, ...teacherWithoutPassword } = teachers[teacherIndex]
  return teacherWithoutPassword
}
export function initializeDevAuth() {
  const teachers = getMockTeachers()
  if (teachers.length === 0) {
    const institutionalTeachers: MockTeacher[] = [
      {
        id: 'teacher_google_001',
        email: 'teszt.tanar@szenmihalyatisk.hu',
        fullName: 'Teszt Tanár',
        authProvider: 'google',
        googleId: 'google_123456789',
        isActive: true,
        createdAt: new Date(),
        lastLogin: undefined
      },
      {
        id: 'teacher_google_002',
        email: 'kovacs.anna@szenmihalyatisk.hu',
        fullName: 'Kovács Anna',
        authProvider: 'google',
        googleId: 'google_987654321',
        isActive: true,
        createdAt: new Date(),
        lastLogin: undefined
      }
    ]
    saveMockTeachers(institutionalTeachers)
    console.log('🔧 Development auth initialized with institutional Google accounts')
    console.log('📧 Test accounts: teszt.tanar@szenmihalyatisk.hu, kovacs.anna@szenmihalyatisk.hu')
  }
}