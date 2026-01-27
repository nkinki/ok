// Test script to verify question-based scoring system
import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3002/api/simple-api';

async function testQuestionBasedScoring() {
  console.log('🧪 Testing Question-Based Scoring System');
  console.log('==========================================');

  try {
    // Test 1: Create a session with mixed exercise types
    const testSession = {
      code: 'TEST123',
      className: 'Test Class',
      subject: 'test',
      exercises: [
        {
          id: '1',
          type: 'QUIZ',
          title: 'Test Quiz',
          content: {
            questions: [
              { question: 'Q1?', options: ['A', 'B'], correctIndex: 0 },
              { question: 'Q2?', options: ['A', 'B'], correctIndex: 1 }
            ]
          }
        },
        {
          id: '2',
          type: 'MATCHING',
          title: 'Test Matching',
          content: {
            pairs: [
              { id: 'p1', left: 'Left1', right: 'Right1' },
              { id: 'p2', left: 'Left2', right: 'Right2' },
              { id: 'p3', left: 'Left3', right: 'Right3' }
            ]
          }
        },
        {
          id: '3',
          type: 'CATEGORIZATION',
          title: 'Test Categorization',
          content: {
            categories: [
              { id: 'cat1', name: 'Category 1' },
              { id: 'cat2', name: 'Category 2' }
            ],
            items: [
              { id: 'item1', text: 'Item 1', categoryId: 'cat1' },
              { id: 'item2', text: 'Item 2', categoryId: 'cat2' }
            ]
          }
        }
      ]
    };

    console.log('📝 Creating test session...');
    const createResponse = await fetch(`${API_BASE}/sessions/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testSession)
    });

    if (!createResponse.ok) {
      throw new Error(`Failed to create session: ${createResponse.status}`);
    }

    const sessionData = await createResponse.json();
    console.log('✅ Session created:', sessionData.session.code);

    // Test 2: Check session status and question count
    console.log('\n📊 Checking session status...');
    const statusResponse = await fetch(`${API_BASE}/sessions/${testSession.code}/status`);
    const statusData = await statusResponse.json();
    
    console.log('Session info:', {
      code: statusData.session.code,
      exerciseCount: statusData.session.exerciseCount,
      totalQuestions: statusData.session.totalQuestions
    });

    // Expected: 2 quiz questions + 3 matching pairs + 2 categorization items = 7 total questions
    const expectedQuestions = 2 + 3 + 2; // 7 questions total
    const expectedMaxScore = expectedQuestions * 10; // 70 points total

    console.log(`Expected questions: ${expectedQuestions}`);
    console.log(`Expected max score: ${expectedMaxScore} points`);
    console.log(`Actual questions: ${statusData.session.totalQuestions}`);

    if (statusData.session.totalQuestions === expectedQuestions) {
      console.log('✅ Question counting is correct!');
    } else {
      console.log('❌ Question counting is incorrect!');
    }

    // Test 3: Join as a student
    console.log('\n👨‍🎓 Joining as student...');
    const joinResponse = await fetch(`${API_BASE}/sessions/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionCode: testSession.code,
        name: 'Test Student',
        className: 'Test Class'
      })
    });

    const joinData = await joinResponse.json();
    console.log('✅ Student joined:', joinData.student.studentName);

    // Test 4: Submit results with question-based scoring
    console.log('\n📤 Submitting test results...');
    const testResults = [
      { exerciseId: '1', isCorrect: true, score: 20, timeSpent: 5000 }, // 2 questions * 10 points = 20
      { exerciseId: '2', isCorrect: false, score: 20, timeSpent: 8000 }, // 2/3 pairs correct * 10 points = 20
      { exerciseId: '3', isCorrect: true, score: 20, timeSpent: 6000 }  // 2 items * 10 points = 20
    ];

    const totalScore = 60; // 6 out of 7 questions correct * 10 points
    const expectedPercentage = Math.round((totalScore / expectedMaxScore) * 100); // ~86%

    const resultsResponse = await fetch(`${API_BASE}/sessions/${testSession.code}/results`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentId: joinData.student.id,
        results: testResults,
        summary: {
          completedExercises: 3,
          totalScore: totalScore
        }
      })
    });

    if (resultsResponse.ok) {
      console.log('✅ Results submitted successfully');
      console.log(`Total score: ${totalScore} points`);
      console.log(`Expected percentage: ${expectedPercentage}%`);
    }

    // Test 5: Check participants with question-based scoring
    console.log('\n👥 Checking participants...');
    const participantsResponse = await fetch(`${API_BASE}/sessions/${testSession.code}/participants`);
    const participantsData = await participantsResponse.json();

    if (participantsData.success && participantsData.participants.length > 0) {
      const student = participantsData.participants[0];
      console.log('Student performance:', {
        name: student.student_name,
        totalScore: student.total_score,
        percentage: student.percentage,
        maxPossibleScore: participantsData.maxPossibleScore,
        totalQuestions: participantsData.totalQuestions
      });

      if (student.percentage === expectedPercentage) {
        console.log('✅ Question-based percentage calculation is correct!');
      } else {
        console.log('❌ Question-based percentage calculation is incorrect!');
        console.log(`Expected: ${expectedPercentage}%, Got: ${student.percentage}%`);
      }
    }

    // Cleanup
    console.log('\n🧹 Cleaning up...');
    await fetch(`${API_BASE}/sessions/${testSession.code}`, { method: 'DELETE' });
    console.log('✅ Test session deleted');

    console.log('\n🎉 Question-based scoring test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testQuestionBasedScoring();