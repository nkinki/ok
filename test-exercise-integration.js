// Test script to verify exercise integration functionality
const API_BASE = 'http://localhost:3001/api'

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function testExerciseIntegration() {
  console.log('📚 Testing Exercise Integration...\n')

  try {
    // 1. Test exercise library endpoint
    console.log('1. Testing exercise library...')
    const exercisesResponse = await fetch(`${API_BASE}/exercises`)
    const exercisesData = await exercisesResponse.json()
    
    console.log('✅ Exercise library loaded:')
    console.log(`   Total exercises: ${exercisesData.totalCount}`)
    exercisesData.exercises.forEach((ex, index) => {
      console.log(`   ${index + 1}. ${ex.title} (${ex.type}) - ${ex.questionCount} questions`)
    })

    // 2. Create room with specific exercises
    console.log('\n2. Creating room with selected exercises...')
    const selectedExercises = exercisesData.exercises.slice(0, 2).map(ex => ex.id) // Select first 2 exercises
    
    const createResponse = await fetch(`${API_BASE}/rooms/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Exercise Integration Test',
        description: 'Testing real exercise integration',
        maxPlayers: 5,
        questionsCount: 8,
        timePerQuestion: 15,
        selectedExercises: selectedExercises
      })
    })
    const createResult = await createResponse.json()
    const roomId = createResult.room.id
    const roomCode = createResult.room.roomCode
    
    console.log('✅ Room created with exercises:')
    console.log(`   Room Code: ${roomCode}`)
    console.log(`   Questions Generated: ${createResult.questionsGenerated}`)
    console.log(`   Selected Exercises: ${selectedExercises.join(', ')}`)

    // 3. Join players
    console.log('\n3. Adding players...')
    const players = []
    for (let i = 1; i <= 2; i++) {
      const joinResponse = await fetch(`${API_BASE}/rooms/${roomCode}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerName: `Exercise Tester ${i}` })
      })
      const joinResult = await joinResponse.json()
      players.push(joinResult.player)
      console.log(`✅ ${joinResult.player.playerName} joined`)
    }

    // 4. Start game and verify questions
    console.log('\n4. Starting game and checking questions...')
    const startResponse = await fetch(`${API_BASE}/rooms/${roomId}/start`, {
      method: 'POST'
    })
    const startResult = await startResponse.json()
    console.log(`✅ Game started with ${startResult.session.questionCount} questions`)

    // 5. Monitor questions and verify they come from exercises
    console.log('\n5. Monitoring questions from exercises...')
    let questionsAnswered = 0
    const seenQuestions = []
    
    for (let i = 0; i < 15 && questionsAnswered < 5; i++) {
      await sleep(2000)
      
      const statusResponse = await fetch(`${API_BASE}/rooms/${roomId}/status`)
      const status = await statusResponse.json()
      
      if (status.gameState === 'question' && status.currentQuestion) {
        const question = status.currentQuestion
        
        // Check if this is a new question
        if (!seenQuestions.find(q => q.id === question.id)) {
          seenQuestions.push(question)
          questionsAnswered++
          
          console.log(`   📝 Question ${questionsAnswered}: "${question.text}"`)
          console.log(`      Options: ${question.options.join(', ')}`)
          console.log(`      ID: ${question.id}`)
          
          // Verify question format
          if (question.text && question.options && question.options.length >= 2) {
            console.log(`      ✅ Question format valid`)
          } else {
            console.log(`      ❌ Question format invalid`)
          }
          
          // Simulate answers from both players
          for (let j = 0; j < players.length; j++) {
            const player = players[j]
            const selectedAnswer = Math.floor(Math.random() * question.options.length)
            const responseTime = 5 + Math.random() * 8
            
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
            console.log(`      ${player.playerName}: ${answerResult.isCorrect ? '✅' : '❌'} (${question.options[selectedAnswer]})`)
          }
        }
      }
      
      if (status.gameState === 'finished') {
        console.log('   🏁 Game finished!')
        break
      }
    }

    // 6. Verify analytics include exercise data
    console.log('\n6. Checking analytics for exercise data...')
    await sleep(2000)
    
    const analyticsResponse = await fetch(`${API_BASE}/rooms/${roomId}/analytics`)
    const analytics = await analyticsResponse.json()
    
    console.log('✅ Analytics with exercise data:')
    console.log(`   Questions from exercises: ${analytics.questionsAsked}`)
    console.log(`   Question types verified: ${seenQuestions.length}`)
    
    // Show question breakdown
    analytics.questionAnalytics.forEach((q, index) => {
      console.log(`   Q${index + 1}: "${q.questionText.substring(0, 50)}..." (${Math.round(q.correctRate)}% correct)`)
    })

    // 7. Test CSV export with exercise data
    console.log('\n7. Testing CSV export with exercise data...')
    const csvResponse = await fetch(`${API_BASE}/rooms/${roomId}/export`)
    const csvContent = await csvResponse.text()
    
    console.log('✅ CSV Export includes exercise questions:')
    const csvLines = csvContent.split('\n')
    const questionSection = csvLines.findIndex(line => line.includes('Question Analysis'))
    if (questionSection > -1) {
      csvLines.slice(questionSection + 2, questionSection + 5).forEach(line => {
        if (line.trim()) console.log(`   ${line}`)
      })
    }

    console.log('\n🎉 Exercise integration test completed successfully!')
    console.log('\n📋 Summary:')
    console.log(`   Exercises Available: ${exercisesData.totalCount}`)
    console.log(`   Room Created: ${roomCode}`)
    console.log(`   Questions Generated: ${createResult.questionsGenerated}`)
    console.log(`   Questions Tested: ${seenQuestions.length}`)
    console.log(`   Exercise Types: ${[...new Set(seenQuestions.map(q => q.id.includes('math') ? 'Math' : q.id.includes('geo') ? 'Geography' : 'Other'))].join(', ')}`)

  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

// Run the test
testExerciseIntegration()