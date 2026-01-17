import type { VercelRequest, VercelResponse } from '@vercel/node'
import { MockGameRoomRepository, MockGamePlayerRepository } from '../../../services/mockGameDatabase'
import { withPublicSecurity } from '../../utils/middleware'
import { validateRoomCode } from '../../utils/security'

async function checkRoomHandler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'GET') {
    res.status(405).json({ message: 'Method not allowed' })
    return
  }

  const { roomCode } = req.query

  if (typeof roomCode !== 'string' || !validateRoomCode(roomCode.toUpperCase())) {
    res.status(400).json({ message: 'Érvénytelen verseny kód formátum' })
    return
  }

  try {
    // Find room by code
    const room = await MockGameRoomRepository.findByCode(roomCode.toUpperCase())
    if (!room) {
      res.status(404).json({ message: 'A verseny kód nem található' })
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

    // Get current player count
    const currentPlayers = await MockGamePlayerRepository.findByRoom(room.id)
    
    // Check if room is full
    if (currentPlayers.length >= room.maxPlayers) {
      res.status(400).json({ message: 'A verseny megtelt' })
      return
    }

    res.status(200).json({
      room: {
        id: room.id,
        roomCode: room.roomCode,
        title: room.title,
        description: room.description,
        maxPlayers: room.maxPlayers,
        questionsCount: room.questionsCount,
        timePerQuestion: room.timePerQuestion,
        status: room.status
      },
      playerCount: currentPlayers.length,
      availableSlots: room.maxPlayers - currentPlayers.length
    })

  } catch (error) {
    console.error('Room check error:', error)
    res.status(500).json({ message: 'Belső szerver hiba' })
  }
}

export default withPublicSecurity(checkRoomHandler)