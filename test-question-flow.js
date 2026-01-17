// Test script to verify question flow functionality
const API_BASE = 'http://localhost:3001/api'

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function testQuestionFlow() {
  console.log('🎯 Testing Question Flow...\n')

  try {
    // 1. Create room and join player
    console.log('1. Setting up game...')
    const createResponse = await fetch(`${API_BASE}/rooms/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Question Flow Test',
        description: 'Testing question display and timing',
        maxPlayers: 10,
        questionsCount: 3,
        timePerQuestion: 10
      })
    })
    const createResult = await createResponse.json()
    const roomId = createResult.room.id
    const roomCode = createResult.room.roomCode
    console.log('✅ Room created:', roomCode)

    const joinResponse = await fetch(`${API_BASE}/rooms/${roomCode}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerName: 'Test Player' })
    })
    const joinResult = await joinResponse.json()
    console.log('✅ Player joined:', joinResult.player.playerName)

    // 2. Check initial status
    console.log('\n2. Checking initial game status...')
    let statusResponse = await fetch(`${API_BASE}/rooms/${roomId}/status`)
    let status = await statusResponse.json()
    console.log('✅ Initial state:', status.gameState)
    console.log('   Questions available:', status.totalQuestions)

    // 3. Start the game
    console.log('\n3. Starting the game...')
    const startResponse = await fetch(`${API_BASE}/rooms/${roomId}/start`, {
      method: 'POST'
    })
    const startResult = await startResponse.json()
    console.log('✅ Game started:', startResult.message)

    // 4. Monitor game progression
    console.log('\n4. Monitoring game progression...')
    
    for (let i = 0; i < 15; i++) {
      await sleep(2000) // Check every 2 seconds
      
      statusResponse = await fetch(`${API_BASE}/rooms/${roomId}/status`)
      status = await statusResponse.json()
      
      console.log(`   [${i * 2}s] State: ${status.gameState} | Question: ${status.currentQuestionIndex + 1}/${status.totalQuestions} | Time: ${status.timeRemaining}s`)
      
      // If we're in a question state, show the question and submit an answer
      if (status.gameState === 'question' && status.currentQuestion) {
        console.log(`   📝 Question: "${status.currentQuestion.text}"`)
        console.log(`   📋 Options: ${status.currentQuestion.options.join(', ')}`)
        
        // Submit a random answer
        const randomAnswer = Math.floor(Math.random() * status.currentQuestion.options.length)
        console.log(`   🎯 Submitting answer: ${randomAnswer} (${status.currentQuestion.options[randomAnswer]})`)
        
        const answerResponse = await fetch(`${API_BASE}/rooms/${roomId}/answer`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            playerId: joinResult.player.id,
            selectedAnswers: [randomAnswer],
            responseTime: 5
          })
        })
        const answerResult = await answerResponse.json()
        console.log(`   ${answerResult.isCorrect ? '✅' : '❌'} Answer result: ${answerResult.isCorrect ? 'Correct' : 'Wrong'}`)
      }
      
      // Stop monitoring if game is finished
      if (status.gameState === 'finished') {
        console.log('   🏁 Game finished!')
        break
      }
    }

    console.log('\n🎉 Question flow test completed!')

  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

// Run the test
testQuestionFlow()