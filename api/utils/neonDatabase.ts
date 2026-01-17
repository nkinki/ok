import { query, transaction } from '../../database/connection'
import { Teacher, TeacherWithPassword } from '../../types/auth'

// Production database repository using Neon PostgreSQL
export class NeonTeacherRepository {
  static async findByUsername(username: string): Promise<TeacherWithPassword | null> {
    try {
      const result = await query(
        'SELECT * FROM teachers WHERE username = $1',
        [username]
      )
      
      if (result.rows.length === 0) return null
      
      return this.mapRowToTeacher(result.rows[0])
    } catch (error) {
      console.error('Error finding teacher by username:', error)
      throw error
    }
  }

  static async findByEmail(email: string): Promise<TeacherWithPassword | null> {
    try {
      const result = await query(
        'SELECT * FROM teachers WHERE email = $1',
        [email]
      )
      
      if (result.rows.length === 0) return null
      
      return this.mapRowToTeacher(result.rows[0])
    } catch (error) {
      console.error('Error finding teacher by email:', error)
      throw error
    }
  }

  static async findById(id: string): Promise<TeacherWithPassword | null> {
    try {
      const result = await query(
        'SELECT * FROM teachers WHERE id = $1',
        [id]
      )
      
      if (result.rows.length === 0) return null
      
      return this.mapRowToTeacher(result.rows[0])
    } catch (error) {
      console.error('Error finding teacher by id:', error)
      throw error
    }
  }

  static async create(teacherData: Omit<TeacherWithPassword, 'id' | 'createdAt' | 'lastLogin'>): Promise<Teacher> {
    try {
      const result = await query(
        `INSERT INTO teachers (username, email, full_name, auth_provider, google_id, is_active)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [
          teacherData.username,
          teacherData.email,
          teacherData.fullName,
          teacherData.authProvider,
          teacherData.googleId,
          teacherData.isActive
        ]
      )
      
      const teacher = this.mapRowToTeacher(result.rows[0])
      const { password, ...teacherWithoutPassword } = teacher
      return teacherWithoutPassword
    } catch (error) {
      console.error('Error creating teacher:', error)
      throw error
    }
  }

  static async updateGoogleInfo(id: string, googleId: string): Promise<void> {
    try {
      await query(
        'UPDATE teachers SET google_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [googleId, id]
      )
    } catch (error) {
      console.error('Error updating Google info:', error)
      throw error
    }
  }

  static async updateProfile(id: string, updates: Partial<Pick<Teacher, 'fullName'>>): Promise<Teacher | null> {
    try {
      const result = await query(
        'UPDATE teachers SET full_name = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
        [updates.fullName, id]
      )
      
      if (result.rows.length === 0) return null
      
      const teacher = this.mapRowToTeacher(result.rows[0])
      const { password, ...teacherWithoutPassword } = teacher
      return teacherWithoutPassword
    } catch (error) {
      console.error('Error updating teacher profile:', error)
      throw error
    }
  }

  static async updateLastLogin(id: string): Promise<void> {
    try {
      await query(
        'UPDATE teachers SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
        [id]
      )
    } catch (error) {
      console.error('Error updating last login:', error)
      throw error
    }
  }

  // Helper method to map database row to Teacher object
  private static mapRowToTeacher(row: any): TeacherWithPassword {
    return {
      id: row.id,
      username: row.username,
      email: row.email,
      fullName: row.full_name,
      authProvider: row.auth_provider,
      googleId: row.google_id,
      isActive: row.is_active,
      createdAt: new Date(row.created_at),
      lastLogin: row.last_login ? new Date(row.last_login) : undefined,
      password: undefined // No password for Google OAuth users
    }
  }
}

// Validation utilities (same as before)
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