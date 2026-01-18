import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization')
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    // For development/demo purposes, simulate Google OAuth
    const { credential } = req.body

    if (!credential) {
      return res.status(400).json({ message: 'Missing credential' })
    }

    // Decode the mock credential (base64 encoded JSON)
    let userData
    try {
      userData = JSON.parse(atob(credential))
    } catch (error) {
      return res.status(400).json({ message: 'Invalid credential format' })
    }

    // Validate that it's a school email
    if (!userData.email || !userData.email.endsWith('@szenmihalyatisk.hu')) {
      return res.status(403).json({ message: 'Csak @szenmihalyatisk.hu email címekkel lehet bejelentkezni' })
    }

    // Create a simple JWT-like token for demo purposes
    const token = btoa(JSON.stringify({
      sub: userData.sub,
      email: userData.email,
      name: userData.name,
      iat: Date.now(),
      exp: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 days
    }))

    // Return success response
    return res.status(200).json({
      success: true,
      token: token,
      user: {
        id: userData.sub,
        email: userData.email,
        name: userData.name,
        authProvider: 'google'
      },
      message: 'Sikeres bejelentkezés'
    })

  } catch (error) {
    console.error('Google auth error:', error)
    return res.status(500).json({ message: 'Belső szerver hiba' })
  }
}