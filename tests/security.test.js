// Unit tests for security functions
const { 
  validateRoomCode, 
  validatePlayerName, 
  validateRoomTitle, 
  validateRoomDescription,
  validateQuestionCount,
  validateTimePerQuestion,
  validateMaxPlayers,
  sanitizeString 
} = require('../api/utils/security.ts')

// Mock console to avoid test output noise
console.log = jest.fn()
console.error = jest.fn()

describe('Security Validation Tests', () => {
  
  describe('validateRoomCode', () => {
    test('should accept valid 6-character alphanumeric codes', () => {
      expect(validateRoomCode('ABC123')).toBe(true)
      expect(validateRoomCode('XYZ789')).toBe(true)
      expect(validateRoomCode('123456')).toBe(true)
      expect(validateRoomCode('ABCDEF')).toBe(true)
    })

    test('should reject invalid room codes', () => {
      expect(validateRoomCode('abc123')).toBe(false) // lowercase
      expect(validateRoomCode('ABC12')).toBe(false) // too short
      expect(validateRoomCode('ABC1234')).toBe(false) // too long
      expect(validateRoomCode('ABC-12')).toBe(false) // special chars
      expect(validateRoomCode('')).toBe(false) // empty
      expect(validateRoomCode(null)).toBe(false) // null
    })
  })

  describe('validatePlayerName', () => {
    test('should accept valid player names', () => {
      expect(validatePlayerName('János')).toBe(true)
      expect(validatePlayerName('Kovács Péter')).toBe(true)
      expect(validatePlayerName('Nagy-Szabó Éva')).toBe(true)
      expect(validatePlayerName('Dr. Kiss')).toBe(true)
      expect(validatePlayerName('Árvíztűrő Tükörfúrógép')).toBe(true)
    })

    test('should reject invalid player names', () => {
      expect(validatePlayerName('A')).toBe(false) // too short
      expect(validatePlayerName('')).toBe(false) // empty
      expect(validatePlayerName('   ')).toBe(false) // only spaces
      expect(validatePlayerName('A'.repeat(31))).toBe(false) // too long
      expect(validatePlayerName('János123')).toBe(false) // numbers
      expect(validatePlayerName('János@')).toBe(false) // special chars
      expect(validatePlayerName(null)).toBe(false) // null
      expect(validatePlayerName(123)).toBe(false) // not string
    })
  })

  describe('validateRoomTitle', () => {
    test('should accept valid room titles', () => {
      expect(validateRoomTitle('Matematika verseny')).toBe(true)
      expect(validateRoomTitle('Történelem kvíz - 8. osztály')).toBe(true)
      expect(validateRoomTitle('ABC')).toBe(true) // minimum length
    })

    test('should reject invalid room titles', () => {
      expect(validateRoomTitle('AB')).toBe(false) // too short
      expect(validateRoomTitle('')).toBe(false) // empty
      expect(validateRoomTitle('A'.repeat(101))).toBe(false) // too long
      expect(validateRoomTitle(null)).toBe(false) // null
      expect(validateRoomTitle(123)).toBe(false) // not string
    })
  })

  describe('validateRoomDescription', () => {
    test('should accept valid descriptions', () => {
      expect(validateRoomDescription('Ez egy teszt leírás')).toBe(true)
      expect(validateRoomDescription('ABCDE')).toBe(true) // minimum length
    })

    test('should reject invalid descriptions', () => {
      expect(validateRoomDescription('ABCD')).toBe(false) // too short
      expect(validateRoomDescription('')).toBe(false) // empty
      expect(validateRoomDescription('A'.repeat(501))).toBe(false) // too long
      expect(validateRoomDescription(null)).toBe(false) // null
    })
  })

  describe('validateQuestionCount', () => {
    test('should accept valid question counts', () => {
      expect(validateQuestionCount(5)).toBe(true) // minimum
      expect(validateQuestionCount(25)).toBe(true) // middle
      expect(validateQuestionCount(50)).toBe(true) // maximum
    })

    test('should reject invalid question counts', () => {
      expect(validateQuestionCount(4)).toBe(false) // too low
      expect(validateQuestionCount(51)).toBe(false) // too high
      expect(validateQuestionCount(5.5)).toBe(false) // not integer
      expect(validateQuestionCount('5')).toBe(false) // string
      expect(validateQuestionCount(null)).toBe(false) // null
    })
  })

  describe('validateTimePerQuestion', () => {
    test('should accept valid time values', () => {
      expect(validateTimePerQuestion(10)).toBe(true) // minimum
      expect(validateTimePerQuestion(60)).toBe(true) // middle
      expect(validateTimePerQuestion(120)).toBe(true) // maximum
    })

    test('should reject invalid time values', () => {
      expect(validateTimePerQuestion(9)).toBe(false) // too low
      expect(validateTimePerQuestion(121)).toBe(false) // too high
      expect(validateTimePerQuestion(30.5)).toBe(false) // not integer
      expect(validateTimePerQuestion('30')).toBe(false) // string
    })
  })

  describe('validateMaxPlayers', () => {
    test('should accept valid player counts', () => {
      expect(validateMaxPlayers(2)).toBe(true) // minimum
      expect(validateMaxPlayers(25)).toBe(true) // middle
      expect(validateMaxPlayers(50)).toBe(true) // maximum
    })

    test('should reject invalid player counts', () => {
      expect(validateMaxPlayers(1)).toBe(false) // too low
      expect(validateMaxPlayers(51)).toBe(false) // too high
      expect(validateMaxPlayers(10.5)).toBe(false) // not integer
      expect(validateMaxPlayers('10')).toBe(false) // string
    })
  })

  describe('sanitizeString', () => {
    test('should sanitize potentially dangerous input', () => {
      expect(sanitizeString('<script>alert("xss")</script>')).toBe('scriptalert("xss")/script')
      expect(sanitizeString('Normal text')).toBe('Normal text')
      expect(sanitizeString('  Trimmed  ')).toBe('Trimmed')
      expect(sanitizeString('Text with <tags>')).toBe('Text with tags')
    })

    test('should handle edge cases', () => {
      expect(sanitizeString('')).toBe('')
      expect(sanitizeString(null)).toBe('')
      expect(sanitizeString(undefined)).toBe('')
      expect(sanitizeString(123)).toBe('')
      expect(sanitizeString('A'.repeat(2000))).toHaveLength(1000) // length limit
    })
  })
})

// Property-based test for room code uniqueness
describe('Room Code Generation Properties', () => {
  test('generated codes should be unique and valid', () => {
    const codes = new Set()
    
    // Generate 1000 codes and check uniqueness
    for (let i = 0; i < 1000; i++) {
      const code = generateRoomCode() // This would be imported from the actual implementation
      expect(validateRoomCode(code)).toBe(true)
      expect(codes.has(code)).toBe(false) // Should be unique
      codes.add(code)
    }
  })
})

// Mock room code generator for testing
function generateRoomCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

console.log('✅ Security validation tests completed')