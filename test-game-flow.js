// Test script to verify game flow functionality
const API_BASE = 'http://localhost:3001/api'

async function testGameFlow() {
  console.log('🧪 Testing Game Flow...\n')

  try {
    // 1. Test health check
    console.log('1. Testing API health...')
    const healthResponse = await fetch(`${API_BASE}/health`)
    const health = await healthResponse.json()
    console.log('✅ API Health:', health.status)

    // 2. Test room creation
    console.log('\n2. Testing room creation...')
    const createResponse = await fetch(`${API_BASE}/rooms/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Test Game Flow',
        description: 'Testing the complete game flow',
        maxPlayers: 10,
        questionsCount: 5,
        timePerQuestion: 30
      })
    })
    const createResult = await createResponse.json()
    console.log('✅ Room created:', createResult.room.roomCode)
    const roomId = createResult.room.id
    const roomCode = createResult.room.roomCode

    // 3. Test room check
    console.log('\n3. Testing room check...')
    const checkResponse = await fetch(`${API_BASE}/rooms/check/${roomCode}`)
    const checkResult = await checkResponse.json()
    console.log('✅ Room check:', checkResult.room.title)

    // 4. Test player join
    console.log('\n4. Testing player join...')
    const joinResponse = await fetch(`${API_BASE}/rooms/${roomCode}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        playerName: 'Test Player'
      })
    })
    const joinResult = await joinResponse.json()
    console.log('✅ Player joined:', joinResult.player.playerName)

    // 5. Test player list
    console.log('\n5. Testing player list...')
    const playersResponse = await fetch(`${API_BASE}/rooms/${roomId}/players`)
    const playersResult = await playersResponse.json()
    console.log('✅ Players in room:', playersResult.count)

    // 6. Test game status
    console.log('\n6. Testing game status...')
    const statusResponse = await fetch(`${API_BASE}/rooms/${roomId}/status`)
    const statusResult = await statusResponse.json()
    console.log('✅ Game status:', statusResult.gameState)

    // 7. Test game start
    console.log('\n7. Testing game start...')
    const startResponse = await fetch(`${API_BASE}/rooms/${roomId}/start`, {
      method: 'POST'
    })
    const startResult = await startResponse.json()
    console.log('✅ Game started:', startResult.message)

    // 8. Test answer submission
    console.log('\n8. Testing answer submission...')
    const answerResponse = await fetch(`${API_BASE}/rooms/${roomId}/answer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        playerId: joinResult.player.id,
        selectedAnswers: [0],
        responseTime: 5
      })
    })
    const answerResult = await answerResponse.json()
    console.log('✅ Answer submitted:', answerResult.message)

    console.log('\n🎉 All game flow tests passed!')
    console.log('\n📋 Summary:')
    console.log(`   Room Code: ${roomCode}`)
    console.log(`   Room ID: ${roomId}`)
    console.log(`   Player: ${joinResult.player.playerName}`)
    console.log(`   Status: Ready for development testing`)

  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

// Run the test
testGameFlow()