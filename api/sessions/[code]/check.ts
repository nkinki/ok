import { VercelRequest, VercelResponse } from '@vercel/node'

// In-memory session storage for Vercel (shared with create.ts)
let sessions = new Map()

export default function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization')
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method === 'GET') {
    try {
      const { code } = req.query

      if (!code || typeof code !== 'string') {
        return res.status(400).json({ error: 'Kód megadása kötelező' })
      }

      const sessionCode = code.toUpperCase()
      const session = sessions.get(sessionCode)

      if (!session || !session.isActive) {
        return res.json({ 
          exists: false, 
          error: 'Hibás kód vagy a munkamenet nem aktív' 
        })
      }

      return res.json({
        exists: true,
        session: {
          code: session.code,
          exerciseCount: session.exercises.length,
          isActive: session.isActive
        }
      })
    } catch (error) {
      console.error('Session check error:', error)
      return res.status(500).json({ error: 'Internal server error' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}