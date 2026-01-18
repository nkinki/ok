import type { VercelRequest, VercelResponse } from '@vercel/node'
import { MockGameRoomRepository, MockGamePlayerRepository } from '../../../services/mockGameDatabase'
import { withPublicSecurity } from '../../utils/middleware'
import { validateRoomCode, validatePlayerName, sanitizeString } from '../../utils/security'

interface JoinRoomRequest {
  playerName: string
}

async function joinRoomHandler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ message: 'Method not allowed' })
    return
  }

  const { roomCode } = req.query
  const { playerName }: JoinRoomRequest = req.body

  if (typeof roomCode !== 'string' || !validateRoomCode(roomCode.toUpperCase())) {
    res.status(400).json({ message: 'Érvénytelen verseny kód formátum' })
    return
  }

  try {
    // Validate and sanitize player name
    if (!validatePlayerName(playerName)) {
      res.status(400).json({ 
        message: 'A név 2-30 karakter hosszú legyen és csak betűket, szóközöket, kötőjeleket és pontokat tartalmazzon' 
      })
      return
    }

    const sanitizedPlayerName = sanitizeString(playerName)

    // Check if room exists
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

    // Check if room is full
    const currentPlayers = await MockGamePlayerRepository.findByRoom(room.id)
    if (currentPlayers.length >= room.maxPlayers) {
      res.status(400).json({ message: 'A verseny megtelt' })
      return
    }

    // Check if player name is already taken in this room
    const existingPlayer = await MockGamePlayerRepository.findByNameInRoom(room.id, sanitizedPlayerName)
    if (existingPlayer) {
      res.status(400).json({ message: 'Ez a név már foglalt ebben a versenyben' })
      return
    }

    // Create new player
    const newPlayer = await MockGamePlayerRepository.create({
      roomId: room.id,
      playerName: sanitizedPlayerName,
      isConnected: true,
      totalScore: 0,
      correctAnswers: 0
    })

    // Get updated player count
    const updatedPlayers = await MockGamePlayerRepository.findByRoom(room.id)

    res.status(201).json({
      player: newPlayer,
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
      playerCount: updatedPlayers.length,
      message: 'Sikeresen csatlakoztál a versenyhez!'
    })

  } catch (error) {
    console.error('Player join error:', error)
    res.status(500).json({ message: 'Belső szerver hiba' })
  }
}

export default withPublicSecurity(joinRoomHandler)