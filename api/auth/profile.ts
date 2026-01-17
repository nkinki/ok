import type { VercelRequest, VercelResponse } from '@vercel/node'
import { TeacherRepository } from '../utils/database'
import { withAuth, AuthenticatedRequest } from '../utils/middleware'
import { Teacher } from '../../types/auth'

async function profileHandler(req: AuthenticatedRequest, res: VercelResponse) {
  try {
    if (req.method === 'GET') {
      // Get current teacher profile
      const teacher = req.teacher!
      res.status(200).json({ teacher })
      
    } else if (req.method === 'PUT') {
      // Update teacher profile
      const { fullName } = req.body
      
      if (!fullName || fullName.trim().length < 2) {
        return res.status(400).json({ message: 'A teljes név legalább 2 karakter hosszú legyen' })
      }
      
      // Update teacher in database
      const updatedTeacher = await TeacherRepository.updateProfile(req.teacher!.id, {
        fullName: fullName.trim()
      })
      
      if (!updatedTeacher) {
        return res.status(404).json({ message: 'Tanár nem található' })
      }
      
      res.status(200).json({ teacher: updatedTeacher })
      
    } else {
      res.status(405).json({ message: 'Method not allowed' })
    }
  } catch (error) {
    console.error('Profile error:', error)
    res.status(500).json({ message: 'Belső szerver hiba' })
  }
}

export default withAuth(profileHandler)