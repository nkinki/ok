import type { VercelRequest, VercelResponse } from '@vercel/node'
import { healthCheck } from '../../database/connection'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const healthResult = await healthCheck()
    
    if (healthResult.status === 'healthy') {
      res.status(200).json(healthResult)
    } else {
      res.status(503).json(healthResult)
    }
  } catch (error) {
    console.error('Health check error:', error)
    res.status(503).json({ 
      status: 'error',
      database: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    })
  }
}