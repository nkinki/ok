import type { VercelRequest, VercelResponse } from '@vercel/node'
import { verifyToken } from './auth'
import { TeacherRepository } from './database'
import { Teacher } from '../../types/auth'
import { withSecurity, withRateLimit } from './security'

export interface AuthenticatedRequest extends VercelRequest {
  teacher?: Teacher
}

export function withAuth(handler: (req: AuthenticatedRequest, res: VercelResponse) => Promise<void>) {
  return withSecurity(
    withRateLimit({ 
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 30, // 30 requests per minute
      message: 'Túl sok kérés. Próbáld újra 1 perc múlva.'
    })(
      async (req: AuthenticatedRequest, res: VercelResponse) => {
        try {
          const authHeader = req.headers.authorization
          
          if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'Hiányzó vagy érvénytelen token' })
          }

          const token = authHeader.substring(7) // Remove 'Bearer ' prefix
          const payload = verifyToken(token)
          
          if (!payload) {
            return res.status(401).json({ message: 'Érvénytelen token' })
          }

          // Get teacher from database to ensure they still exist and are active
          const teacherWithPassword = await TeacherRepository.findById(payload.teacherId)
          if (!teacherWithPassword || !teacherWithPassword.isActive) {
            return res.status(401).json({ message: 'Érvénytelen felhasználó' })
          }

          // Remove password from teacher object
          const { password, ...teacher } = teacherWithPassword
          req.teacher = teacher

          return handler(req, res)
        } catch (error) {
          console.error('Auth middleware error:', error)
          return res.status(500).json({ message: 'Belső szerver hiba' })
        }
      }
    )
  )
}

// Public endpoints with basic security and rate limiting
export function withPublicSecurity(handler: (req: VercelRequest, res: VercelResponse) => Promise<void>) {
  return withSecurity(
    withRateLimit({ 
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 60, // 60 requests per minute for public endpoints
      message: 'Túl sok kérés. Próbáld újra 1 perc múlva.'
    })(handler)
  )
}