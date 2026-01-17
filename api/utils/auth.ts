import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { Teacher } from '../../types/auth'

// JWT Secret - in production this should be in environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production'
const JWT_EXPIRES_IN = '7d'

export interface JWTPayload {
  teacherId: string
  username: string
  email: string
}

export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12
  return bcrypt.hash(password, saltRounds)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export function generateToken(teacher: Teacher): string {
  const payload: JWTPayload = {
    teacherId: teacher.id,
    username: teacher.username,
    email: teacher.email
  }
  
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload
  } catch (error) {
    return null
  }
}

export function getTokenExpirationDate(): string {
  const now = new Date()
  const expirationDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) // 7 days
  return expirationDate.toISOString()
}