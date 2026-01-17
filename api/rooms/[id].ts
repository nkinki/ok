import type { VercelResponse } from '@vercel/node'
import { withAuth, AuthenticatedRequest } from '../utils/middleware'
import { MockGameRoomRepository } from '../../services/mockGameDatabase'

async function roomHandler(req: AuthenticatedRequest, res: VercelResponse): Promise<void> {
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

    switch (req.method) {
      case 'GET':
        // Get room details
        res.status(200).json({ room })
        break

      case 'PUT':
        // Update room (only if status is 'waiting')
        if (room.status !== 'waiting') {
          res.status(400).json({ message: 'Csak várakozó állapotú versenyt lehet módosítani' })
          return
        }

        const { title, description, maxPlayers, questionsCount, timePerQuestion } = req.body

        // Validate input
        if (title && title.trim().length < 3) {
          res.status(400).json({ message: 'A verseny címe legalább 3 karakter hosszú legyen' })
          return
        }

        if (maxPlayers && (maxPlayers < 2 || maxPlayers > 100)) {
          res.status(400).json({ message: 'A játékosok száma 2 és 100 között legyen' })
          return
        }

        if (questionsCount && (questionsCount < 1 || questionsCount > 50)) {
          res.status(400).json({ message: 'A kérdések száma 1 és 50 között legyen' })
          return
        }

        if (timePerQuestion && (timePerQuestion < 5 || timePerQuestion > 300)) {
          res.status(400).json({ message: 'A kérdésenkénti idő 5 és 300 másodperc között legyen' })
          return
        }

        const updatedRoom = await MockGameRoomRepository.update(id, {
          title: title?.trim(),
          description: description?.trim(),
          maxPlayers,
          questionsCount,
          timePerQuestion
        })

        res.status(200).json({
          room: updatedRoom,
          message: 'Verseny sikeresen frissítve'
        })
        break

      case 'DELETE':
        // Delete room (only if status is 'waiting' or 'finished')
        if (room.status === 'active') {
          res.status(400).json({ message: 'Aktív versenyt nem lehet törölni' })
          return
        }

        const deleted = await MockGameRoomRepository.delete(id)
        if (deleted) {
          res.status(200).json({ message: 'Verseny sikeresen törölve' })
        } else {
          res.status(500).json({ message: 'Hiba történt a törlés során' })
        }
        break

      default:
        res.status(405).json({ message: 'Method not allowed' })
        break
    }

  } catch (error) {
    console.error('Room operation error:', error)
    res.status(500).json({ message: 'Belső szerver hiba' })
  }
}

export default withAuth(roomHandler)