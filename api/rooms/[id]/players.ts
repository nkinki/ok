import type { VercelRequest, VercelResponse } from '@vercel/node'
import { MockGameRoomRepository, MockGamePlayerRepository } from '../../../services/mockGameDatabase'

export default async function roomPlayersHandler(req: VercelRequest, res: VercelResponse): Promise<void> {
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
    // Check if room exists
    const room = await MockGameRoomRepository.findById(id)
    if (!room) {
      res.status(404).json({ message: 'Verseny nem található' })
      return
    }

    // Get all players in the room
    const players = await MockGamePlayerRepository.findByRoom(id)

    res.status(200).json({
      players: players.sort((a, b) => a.joinedAt.getTime() - b.joinedAt.getTime()),
      count: players.length,
      maxPlayers: room.maxPlayers,
      room: {
        id: room.id,
        roomCode: room.roomCode,
        title: room.title,
        status: room.status
      }
    })

  } catch (error) {
    console.error('Room players error:', error)
    res.status(500).json({ message: 'Belső szerver hiba' })
  }
}