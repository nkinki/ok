import type { VercelResponse } from '@vercel/node'
import { withAuth, AuthenticatedRequest } from '../utils/middleware'
import { MockGameRoomRepository } from '../../services/mockGameDatabase'

async function listRoomsHandler(req: AuthenticatedRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'GET') {
    res.status(405).json({ message: 'Method not allowed' })
    return
  }

  try {
    const teacher = req.teacher!

    // Get all rooms for this teacher
    const rooms = await MockGameRoomRepository.findByTeacher(teacher.id)

    res.status(200).json({
      rooms: rooms.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
      count: rooms.length
    })

  } catch (error) {
    console.error('Room list error:', error)
    res.status(500).json({ message: 'Belső szerver hiba' })
  }
}

export default withAuth(listRoomsHandler)