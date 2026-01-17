// Test fixed rooms directly on port 3001
import fetch from 'node-fetch'

const BASE_URL = 'http://localhost:3001'

async function testFixedRoomsDirect() {
  console.log('🏫 Testing Fixed Rooms Direct...\n')
  
  try {
    // Test 1: Get fixed rooms
    console.log('1️⃣ Getting fixed rooms...')
    const fixedResponse = await fetch(`${BASE_URL}/api/rooms/fixed`)
    const fixedData = await fixedResponse.json()
    
    console.log('✅ Fixed rooms loaded:', fixedData.count)
    fixedData.fixedRooms.forEach(room => {
      console.log(`  📚 ${room.grade}. osztály - Kód: ${room.roomCode} - Játékosok: ${room.playerCount}`)
    })
    
    // Test 2: Test student joining with grade code
    console.log('\n2️⃣ Testing student joining with grade code...')
    const gradeCode = '5OSZ' // 5th grade code
    
    const joinResponse = await fetch(`${BASE_URL}/api/rooms/${gradeCode}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerName: 'Teszt Diák 5. osztály' })
    })
    
    if (joinResponse.ok) {
      const joinData = await joinResponse.json()
      console.log('✅ Student joined grade room:', joinData.player?.playerName)
      console.log('🏫 Room:', joinData.room?.title)
    } else {
      console.log('❌ Student join failed:', joinResponse.status)
    }
    
    console.log('\n📋 Summary:')
    console.log(`- Fixed rooms created: ${fixedData.count}`)
    console.log(`- Available codes: ${fixedData.fixedRooms.map(r => r.roomCode).join(', ')}`)
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

testFixedRoomsDirect()