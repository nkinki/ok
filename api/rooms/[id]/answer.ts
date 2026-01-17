import type { VercelRequest, VercelResponse } from '@vercel/node'
import gameStateManager from '../../../services/gameStateManager'

interface SubmitAnswerRequest {
  playerId: string
  selectedAnswers: number[]
  responseTime: number
}

export default async function submitAnswerHandler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ message: 'Method not allowed' })
    return
  }

  const { id } = req.query
  const { playerId, selectedAnswers, responseTime }: SubmitAnswerRequest = req.body

  if (typeof id !== 'string') {
    res.status(400).json({ message: 'Érvénytelen verseny azonosító' })
    return
  }

  try {
    // Validate input
    if (!playerId || !Array.isArray(selectedAnswers) || typeof responseTime !== 'number') {
      res.status(400).json({ message: 'Érvénytelen kérés adatok' })
      return
    }

    if (responseTime < 0) {
      res.status(400).json({ message: 'Érvénytelen válaszidő' })
      return
    }

    // Submit answer through game state manager
    const success = gameStateManager.submitAnswer(id, playerId, selectedAnswers, responseTime)
    
    if (!success) {
      res.status(400).json({ message: 'Nem sikerült elküldeni a választ' })
      return
    }

    res.status(200).json({
      message: 'Válasz sikeresen elküldve',
      timestamp: new Date()
    })

  } catch (error) {
    console.error('Answer submission error:', error)
    res.status(500).json({ message: 'Belső szerver hiba' })
  }
}