import type { VercelRequest, VercelResponse } from '@vercel/node'
import { withAuth, AuthenticatedRequest } from '../../utils/middleware'
import { MockGameRoomRepository, MockGameQuestionRepository, MockGamePlayerRepository } from '../../../services/mockGameDatabase'
import gameStateManager from '../../../services/gameStateManager'

export default async function startGameHandler(req: AuthenticatedRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ message: 'Method not allowed' })
    return
  }

  const { id } = req.query
  const teacher = req.teacher!

  if (typeof id !== 'string') {
    res.status(400).json({ message: 'Érvénytelen verseny azonosító' })
    return
  }

  try {
    // Check if room exists and belongs to teacher
    const room = await MockGameRoomRepository.findById(id)
    if (!room) {
      res.status(404).json({ message: 'Verseny nem található' })
      return
    }

    if (room.teacherId !== teacher.id) {
      res.status(403).json({ message: 'Nincs jogosultsága ehhez a versenyhez' })
      return
    }

    // Check room status
    if (room.status !== 'waiting') {
      res.status(400).json({ 
        message: room.status === 'active' 
          ? 'A verseny már elkezdődött' 
          : 'A verseny már befejeződött'
      })
      return
    }

    // Get players
    const players = await MockGamePlayerRepository.findByRoom(id)
    if (players.length === 0) {
      res.status(400).json({ message: 'Nincsenek játékosok a versenyben' })
      return
    }

    // Get questions
    const questions = await MockGameQuestionRepository.findByRoom(id)
    if (questions.length === 0) {
      res.status(400).json({ message: 'Nincsenek kérdések a versenyben' })
      return
    }

    // Update room status
    await MockGameRoomRepository.update(id, { 
      status: 'active',
      startedAt: new Date()
    })

    // Create game session
    const session = gameStateManager.createSession(room, questions, players)
    
    // Start the game
    const started = gameStateManager.startGame(id)
    
    if (!started) {
      res.status(500).json({ message: 'Nem sikerült elindítani a versenyt' })
      return
    }

    res.status(200).json({
      message: 'Verseny sikeresen elindítva',
      session: {
        roomId: session.roomId,
        state: session.currentState,
        playerCount: session.players.length,
        questionCount: session.questions.length
      }
    })

  } catch (error) {
    console.error('Game start error:', error)
    res.status(500).json({ message: 'Belső szerver hiba' })
  }
}