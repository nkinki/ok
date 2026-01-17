// Test script to verify leaderboard functionality
const API_BASE = 'http://localhost:3001/api'

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function testLeaderboard() {
  console.log('🏆 Testing Leaderboard System...\n')

  try {
    // 1. Create room and join multiple players
    console.log('1. Setting up game with multiple players...')
    const createResponse = await fetch(`${API_BASE}/rooms/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Leaderboard Test',
        description: 'Testing leaderboard and scoring',
        maxPlayers: 10,
        questionsCount: 3,
        timePerQuestion: 15
      })
    })
    const createResult = await createResponse.json()
    const roomId = createResult.room.id
    const roomCode = createResult.room.roomCode
    console.log('✅ Room created:', roomCode)

    // Join multiple players
    const players = []
    for (let i = 1; i <= 3; i++) {
      const joinResponse = await fetch(`${API_BASE}/rooms/${roomCode}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerName: `Player ${i}` })
      })
      const joinResult = await joinResponse.json()
      players.push(joinResult.player)
      console.log(`✅ ${joinResult.player.playerName} joined`)
    }

    // 2. Start the game
    console.log('\n2. Starting the game...')
    const startResponse = await fetch(`${API_BASE}/rooms/${roomId}/start`, {
      method: 'POST'
    })
    console.log('✅ Game started')

    // 3. Monitor game and simulate different player performances
    console.log('\n3. Simulating game with different player performances...')
    
    let questionCount = 0
    for (let i = 0; i < 20; i++) {
      await sleep(2000)
      
      const statusResponse = await fetch(`${API_BASE}/rooms/${roomId}/status`)
      const status = await statusResponse.json()
      
      console.log(`   [${i * 2}s] State: ${status.gameState} | Question: ${status.currentQuestionIndex + 1}/${status.totalQuestions} | Time: ${status.timeRemaining}s`)
      
      // If we're in a question state, simulate different player answers
      if (status.gameState === 'question' && status.currentQuestion) {
        questionCount++
        console.log(`   📝 Question ${questionCount}: "${status.currentQuestion.text}"`)
        
        // Simulate different player performance levels
        for (let j = 0; j < players.length; j++) {
          const player = players[j]
          let selectedAnswer
          let responseTime
          
          // Player 1: Always correct, fast responses
          if (j === 0) {
            selectedAnswer = status.currentQuestion.options.findIndex((_, idx) => 
              status.currentQuestion.text.includes('2 + 2') ? idx === 1 : // "4" for math
              status.currentQuestion.text.includes('főváros') ? idx === 2 : // "Budapest"
              status.currentQuestion.text.includes('napja') ? idx === 1 : // "365"
              idx === 0
            )
            responseTime = 3 + Math.random() * 2 // 3-5 seconds
          }
          // Player 2: Sometimes correct, medium responses
          else if (j === 1) {
            selectedAnswer = Math.random() < 0.7 ? 
              status.currentQuestion.options.findIndex((_, idx) => 
                status.currentQuestion.text.includes('2 + 2') ? idx === 1 :
                status.currentQuestion.text.includes('főváros') ? idx === 2 :
                status.currentQuestion.text.includes('napja') ? idx === 1 :
                idx === 0
              ) : Math.floor(Math.random() * status.currentQuestion.options.length)
            responseTime = 8 + Math.random() * 5 // 8-13 seconds
          }
          // Player 3: Random answers, slow responses
          else {
            selectedAnswer = Math.floor(Math.random() * status.currentQuestion.options.length)
            responseTime = 12 + Math.random() * 8 // 12-20 seconds
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
          
          console.log(`   ${player.playerName}: ${answerResult.isCorrect ? '✅' : '❌'} (${Math.round(responseTime)}s) +${answerResult.pointsEarned || 0} points`)
        }
      }
      
      // Show leaderboard when available
      if (status.gameState === 'leaderboard' && status.leaderboard) {
        console.log('\n   🏆 LEADERBOARD:')
        status.leaderboard.forEach(player => {
          console.log(`   ${player.rank}. ${player.playerName}: ${player.totalScore} points (${player.correctAnswers} correct)`)
        })
        console.log('')
      }
      
      // Show final results
      if (status.gameState === 'finished') {
        console.log('\n   🎉 FINAL RESULTS:')
        if (status.leaderboard) {
          status.leaderboard.forEach(player => {
            console.log(`   ${player.rank}. ${player.playerName}: ${player.totalScore} points (${player.correctAnswers} correct)`)
          })
        }
        break
      }
    }

    // 4. Test leaderboard API endpoint
    console.log('\n4. Testing leaderboard API endpoint...')
    const leaderboardResponse = await fetch(`${API_BASE}/rooms/${roomId}/leaderboard`)
    const leaderboardData = await leaderboardResponse.json()
    console.log('✅ Leaderboard API response:')
    leaderboardData.leaderboard.forEach(player => {
      console.log(`   ${player.rank}. ${player.playerName}: ${player.totalScore} points`)
    })

    console.log('\n🎉 Leaderboard test completed successfully!')

  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

// Run the test
testLeaderboard()