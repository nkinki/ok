import type { VercelResponse } from '@vercel/node'
import { withAuth, AuthenticatedRequest } from '../utils/middleware'
import { MockGameRoomRepository } from '../../services/mockGameDatabase'
import { 
  validateRoomTitle, 
  validateRoomDescription, 
  validateMaxPlayers, 
  validateQuestionCount, 
  validateTimePerQuestion,
  sanitizeString 
} from '../utils/security'

interface CreateRoomRequest {
  title: string
  description?: string
  maxPlayers: number
  questionsCount: number
  timePerQuestion: number
  selectedExercises?: any[]
}

async function createRoomHandler(req: AuthenticatedRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ message: 'Method not allowed' })
    return
  }

  try {
    const { title, description, maxPlayers, questionsCount, timePerQuestion, selectedExercises }: CreateRoomRequest = req.body
    const teacher = req.teacher!

    // Validate and sanitize input
    if (!validateRoomTitle(title)) {
      res.status(400).json({ message: 'A verseny címe 3-100 karakter hosszú legyen és csak érvényes karaktereket tartalmazzon' })
      return
    }

    if (description && !validateRoomDescription(description)) {
      res.status(400).json({ message: 'A leírás 5-500 karakter hosszú legyen' })
      return
    }

    if (!validateMaxPlayers(maxPlayers)) {
      res.status(400).json({ message: 'A játékosok száma 2 és 50 között legyen' })
      return
    }

    if (!validateQuestionCount(questionsCount)) {
      res.status(400).json({ message: 'A kérdések száma 5 és 50 között legyen' })
      return
    }

    if (!validateTimePerQuestion(timePerQuestion)) {
      res.status(400).json({ message: 'A kérdésenkénti idő 10 és 120 másodperc között legyen' })
      return
    }

    // Sanitize inputs
    const sanitizedTitle = sanitizeString(title)
    const sanitizedDescription = description ? sanitizeString(description) : undefined

    // Create new game room
    const newRoom = await MockGameRoomRepository.create({
      title: sanitizedTitle,
      description: sanitizedDescription,
      teacherId: teacher.id,
      maxPlayers,
      questionsCount,
      timePerQuestion,
      status: 'waiting'
    })

    // Add exercises to room if provided
    if (selectedExercises && selectedExercises.length > 0) {
      try {
        const response = await fetch(`${process.env.VERCEL_URL || 'http://localhost:3000'}/api/rooms/${newRoom.id}/exercises`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${teacher.id}` // Simple auth for internal call
          },
          body: JSON.stringify({ selectedExercises })
        })
        
        if (!response.ok) {
          console.warn('Failed to add exercises to room:', await response.text())
        }
      } catch (error) {
        console.warn('Error adding exercises to room:', error)
      }
    }

    res.status(201).json({
      room: newRoom,
      message: 'Verseny sikeresen létrehozva'
    })

  } catch (error) {
    console.error('Room creation error:', error)
    res.status(500).json({ message: 'Belső szerver hiba' })
  }
}

export default withAuth(createRoomHandler)