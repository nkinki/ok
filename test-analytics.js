// Test script to verify analytics functionality
const API_BASE = 'http://localhost:3001/api'

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function testAnalytics() {
  console.log('📊 Testing Analytics System...\n')

  try {
    // 1. Create room and join players
    console.log('1. Setting up game with players...')
    const createResponse = await fetch(`${API_BASE}/rooms/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Analytics Test Game',
        description: 'Testing analytics collection',
        maxPlayers: 5,
        questionsCount: 3,
        timePerQuestion: 10
      })
    })
    const createResult = await createResponse.json()
    const roomId = createResult.room.id
    const roomCode = createResult.room.roomCode
    console.log('✅ Room created:', roomCode)

    // Join 2 players
    const players = []
    for (let i = 1; i <= 2; i++) {
      const joinResponse = await fetch(`${API_BASE}/rooms/${roomCode}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerName: `Analytics Player ${i}` })
      })
      const joinResult = await joinResponse.json()
      players.push(joinResult.player)
      console.log(`✅ ${joinResult.player.playerName} joined`)
    }

    // 2. Start the game
    console.log('\n2. Starting game and collecting analytics...')
    const startResponse = await fetch(`${API_BASE}/rooms/${roomId}/start`, {
      method: 'POST'
    })
    console.log('✅ Game started')

    // 3. Play through some questions and collect data
    let questionsAnswered = 0
    for (let i = 0; i < 10 && questionsAnswered < 3; i++) {
      await sleep(2000)
      
      const statusResponse = await fetch(`${API_BASE}/rooms/${roomId}/status`)
      const status = await statusResponse.json()
      
      if (status.gameState === 'question' && status.currentQuestion) {
        console.log(`   📝 Question ${questionsAnswered + 1}: "${status.currentQuestion.text}"`)
        
        // Simulate different player performance
        for (let j = 0; j < players.length; j++) {
          const player = players[j]
          
          // Player 1: Always correct, fast
          // Player 2: Sometimes correct, slower
          let selectedAnswer, responseTime
          if (j === 0) {
            selectedAnswer = status.currentQuestion.text.includes('2 + 2') ? 1 : 
                            status.currentQuestion.text.includes('főváros') ? 2 : 1
            responseTime = 3 + Math.random() * 2
          } else {
            selectedAnswer = Math.random() < 0.6 ? 
              (status.currentQuestion.text.includes('2 + 2') ? 1 : 
               status.currentQuestion.text.includes('főváros') ? 2 : 1) :
              Math.floor(Math.random() * 4)
            responseTime = 6 + Math.random() * 4
          }
          
          const answerResponse = await fetch(`${API_BASE}/rooms/${roomId}/answer`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              playerId: player.id,
              selectedAnswers: [selectedAnswer],
              responseTime: Math.round(responseTime)
            })
          })
          const answerResult = await answerResponse.json()
          console.log(`   ${player.playerName}: ${answerResult.isCorrect ? '✅' : '❌'} (${Math.round(responseTime)}s)`)
        }
        
        questionsAnswered++
      }
      
      if (status.gameState === 'finished') {
        console.log('   🏁 Game finished!')
        break
      }
    }

    // 4. Test analytics endpoint
    console.log('\n3. Testing analytics endpoint...')
    await sleep(2000) // Wait for game to finish
    
    const analyticsResponse = await fetch(`${API_BASE}/rooms/${roomId}/analytics`)
    const analytics = await analyticsResponse.json()
    
    console.log('✅ Analytics collected:')
    console.log(`   Duration: ${analytics.duration} seconds`)
    console.log(`   Total Players: ${analytics.totalPlayers}`)
    console.log(`   Questions Asked: ${analytics.questionsAsked}`)
    console.log(`   Total Answers: ${analytics.totalAnswers}`)
    console.log(`   Correct Answers: ${analytics.correctAnswers}`)
    console.log(`   Overall Accuracy: ${analytics.overallAccuracy}%`)
    console.log(`   Average Response Time: ${Math.round(analytics.averageResponseTime)}s`)
    console.log(`   Game Completed: ${analytics.isCompleted}`)

    // 5. Test question-level analytics
    console.log('\n4. Question-level analytics:')
    analytics.questionAnalytics.forEach((q, index) => {
      console.log(`   Q${index + 1}: ${Math.round(q.correctRate)}% correct, ${Math.round(q.averageResponseTime)}s avg response`)
    })

    // 6. Test CSV export
    console.log('\n5. Testing CSV export...')
    const csvResponse = await fetch(`${API_BASE}/rooms/${roomId}/export`)
    const csvContent = await csvResponse.text()
    
    console.log('✅ CSV Export generated:')
    console.log('   First few lines:')
    csvContent.split('\n').slice(0, 5).forEach(line => {
      if (line.trim()) console.log(`   ${line}`)
    })

    // 7. Test player actions tracking
    console.log('\n6. Player actions tracked:')
    analytics.playerActions.slice(0, 3).forEach(action => {
      console.log(`   ${action.playerName}: ${action.isCorrect ? 'Correct' : 'Wrong'} answer in ${action.responseTime}s`)
    })

    console.log('\n🎉 Analytics system test completed successfully!')
    console.log('\n📋 Summary:')
    console.log(`   Room: ${roomCode}`)
    console.log(`   Players: ${analytics.totalPlayers}`)
    console.log(`   Questions: ${analytics.questionsAsked}`)
    console.log(`   Accuracy: ${analytics.overallAccuracy}%`)
    console.log(`   CSV Export: Ready`)

  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

// Run the test
testAnalytics()