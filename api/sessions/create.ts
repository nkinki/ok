import { VercelRequest, VercelResponse } from '@vercel/node'

// In-memory session storage for Vercel
let sessions = new Map()

export default function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization')
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method === 'POST') {
    try {
      const { code, exercises } = req.body

      if (!code || !exercises || !Array.isArray(exercises)) {
        return res.status(400).json({ error: 'Kód és feladatok megadása kötelező' })
      }

      const session = {
        code: code.toUpperCase(),
        exercises,
        createdAt: new Date(),
        isActive: true,
        students: []
      }

      sessions.set(code.toUpperCase(), session)

      return res.json({
        success: true,
        session,
        message: 'Munkamenet sikeresen létrehozva'
      })
    } catch (error) {
      console.error('Session creation error:', error)
      return res.status(500).json({ error: 'Internal server error' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}