import type { VercelRequest, VercelResponse } from '@vercel/node'
import { OAuth2Client } from 'google-auth-library'
import { TeacherRepository } from '../utils/database'
import { generateToken, getTokenExpirationDate } from '../utils/auth'
import { GoogleLoginRequest, LoginResponse } from '../../types/auth'

// Google OAuth client
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

// Allowed domain for institutional login
const ALLOWED_DOMAIN = 'szenmihalyatisk.hu'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { credential }: GoogleLoginRequest = req.body

    // Validate input
    if (!credential) {
      return res.status(400).json({ message: 'Google credential kötelező' })
    }

    // Verify Google token
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID
    })

    const payload = ticket.getPayload()
    if (!payload) {
      return res.status(401).json({ message: 'Érvénytelen Google token' })
    }

    const { sub: googleId, email, name, email_verified } = payload

    // Check if email is verified
    if (!email_verified) {
      return res.status(401).json({ message: 'Az email cím nincs megerősítve a Google fiókban' })
    }

    // Check if email belongs to allowed domain
    if (!email || !email.endsWith(`@${ALLOWED_DOMAIN}`)) {
      return res.status(403).json({ 
        message: `Csak @${ALLOWED_DOMAIN} email címekkel lehet bejelentkezni` 
      })
    }

    // Extract username from email (part before @)
    const username = email.split('@')[0]

    // Check if teacher already exists
    let teacherWithPassword = await TeacherRepository.findByEmail(email)
    
    if (!teacherWithPassword) {
      // Auto-create teacher account for institutional users
      teacherWithPassword = await TeacherRepository.create({
        username,
        email,
        fullName: name || username,
        authProvider: 'google',
        googleId,
        isActive: true
      })
    } else {
      // Update existing teacher with Google info if needed
      if (!teacherWithPassword.googleId) {
        await TeacherRepository.updateGoogleInfo(teacherWithPassword.id, googleId)
        teacherWithPassword.googleId = googleId
      }
    }

    // Check if account is active
    if (!teacherWithPassword.isActive) {
      return res.status(401).json({ message: 'A fiók inaktív. Kérjen segítséget az adminisztrátortól.' })
    }

    // Update last login
    await TeacherRepository.updateLastLogin(teacherWithPassword.id)

    // Generate JWT token
    const { password: _, ...teacher } = teacherWithPassword
    const token = generateToken(teacher)
    const expiresAt = getTokenExpirationDate()

    const response: LoginResponse = {
      token,
      teacher,
      expiresAt
    }

    res.status(200).json(response)
  } catch (error) {
    console.error('Google login error:', error)
    if (error instanceof Error && error.message.includes('Token used too early')) {
      return res.status(401).json({ message: 'Google token érvénytelen vagy lejárt' })
    }
    res.status(500).json({ message: 'Belső szerver hiba' })
  }
}