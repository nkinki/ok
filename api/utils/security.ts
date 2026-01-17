import type { VercelRequest, VercelResponse } from '@vercel/node'

// Rate limiting store (in-memory for simplicity, use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

interface RateLimitOptions {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Maximum requests per window
  message?: string
}

export function withRateLimit(options: RateLimitOptions) {
  return function(handler: (req: VercelRequest, res: VercelResponse) => Promise<void>) {
    return async (req: VercelRequest, res: VercelResponse) => {
      const clientId = getClientId(req)
      const now = Date.now()
      
      // Clean up expired entries
      for (const [key, value] of rateLimitStore.entries()) {
        if (now > value.resetTime) {
          rateLimitStore.delete(key)
        }
      }
      
      const current = rateLimitStore.get(clientId)
      
      if (!current || now > current.resetTime) {
        // New window
        rateLimitStore.set(clientId, {
          count: 1,
          resetTime: now + options.windowMs
        })
      } else {
        // Within window
        if (current.count >= options.maxRequests) {
          return res.status(429).json({
            message: options.message || 'Túl sok kérés. Próbáld újra később.',
            retryAfter: Math.ceil((current.resetTime - now) / 1000)
          })
        }
        current.count++
      }
      
      return handler(req, res)
    }
  }
}

function getClientId(req: VercelRequest): string {
  // Use IP address as client identifier
  const forwarded = req.headers['x-forwarded-for']
  const ip = forwarded ? (Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0]) : req.socket?.remoteAddress
  return ip || 'unknown'
}

// Input validation utilities
export function validateRoomCode(roomCode: string): boolean {
  return /^[A-Z0-9]{6}$/.test(roomCode)
}

export function validatePlayerName(name: string): boolean {
  if (!name || typeof name !== 'string') return false
  const trimmed = name.trim()
  return trimmed.length >= 2 && trimmed.length <= 30 && /^[a-zA-ZáéíóöőúüűÁÉÍÓÖŐÚÜŰ\s\-\.]+$/.test(trimmed)
}

export function validateRoomTitle(title: string): boolean {
  if (!title || typeof title !== 'string') return false
  const trimmed = title.trim()
  return trimmed.length >= 3 && trimmed.length <= 100
}

export function validateRoomDescription(description: string): boolean {
  if (!description || typeof description !== 'string') return false
  const trimmed = description.trim()
  return trimmed.length >= 5 && trimmed.length <= 500
}

export function validateQuestionCount(count: number): boolean {
  return Number.isInteger(count) && count >= 5 && count <= 50
}

export function validateTimePerQuestion(time: number): boolean {
  return Number.isInteger(time) && time >= 10 && time <= 120
}

export function validateMaxPlayers(max: number): boolean {
  return Number.isInteger(max) && max >= 2 && max <= 50
}

// Sanitize input to prevent XSS
export function sanitizeString(input: string): string {
  if (!input || typeof input !== 'string') return ''
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .substring(0, 1000) // Limit length
}

// CORS headers
export function setCorsHeaders(res: VercelResponse, origin?: string) {
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://okos-gyakorlo-kahoot.vercel.app'
  ]
  
  const requestOrigin = origin || 'http://localhost:5173'
  const isAllowed = allowedOrigins.includes(requestOrigin)
  
  res.setHeader('Access-Control-Allow-Origin', isAllowed ? requestOrigin : allowedOrigins[0])
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Access-Control-Allow-Credentials', 'true')
}

// Security headers
export function setSecurityHeaders(res: VercelResponse) {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('X-XSS-Protection', '1; mode=block')
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' https://accounts.google.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://accounts.google.com")
}

// Combined security middleware
export function withSecurity(handler: (req: VercelRequest, res: VercelResponse) => Promise<void>) {
  return async (req: VercelRequest, res: VercelResponse) => {
    // Set security headers
    setSecurityHeaders(res)
    setCorsHeaders(res, req.headers.origin as string)
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      return res.status(200).end()
    }
    
    return handler(req, res)
  }
}