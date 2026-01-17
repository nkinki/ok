import type { VercelRequest, VercelResponse } from '@vercel/node'
import gameStateManager from '../../../services/gameStateManager'
import { MockGameRoomRepository } from '../../../services/mockGameDatabase'

export default async function gameStatusHandler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'GET') {
    res.status(405).json({ message: 'Method not allowed' })
    return
  }

  const { id } = req.query

  if (typeof id !== 'string') {
    res.status(400).json({ message: 'Érvénytelen verseny azonosító' })
    return
  }

  try {
    // Get room info
    const room = await MockGameRoomRepository.findById(id)
    if (!room) {
      res.status(404).json({ message: 'Verseny nem található' })
      return
    }

    // Get game session
    const session = gameStateManager.getSession(id)
    
    if (!session) {
      res.status(200).json({
        roomId: id,
        roomStatus: room.status,
        gameState: 'not_started',
        isActive: false,
        message: 'A verseny még nem kezdődött el'
      })
      return
    }

    // Return current game state
    res.status(200).json({
      roomId: session.roomId,
      roomStatus: room.status,
      gameState: session.currentState,
      isActive: session.isActive,
      currentQuestionIndex: session.currentQuestionIndex,
      totalQuestions: session.questions.length,
      timeRemaining: session.timeRemaining,
      playerCount: session.players.length,
      startTime: session.startTime,
      questionStartTime: session.questionStartTime
    })

  } catch (error) {
    console.error('Game status error:', error)
    res.status(500).json({ message: 'Belső szerver hiba' })
  }
}