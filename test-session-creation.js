// Test session creation API endpoint
const testSessionCreation = async () => {
  console.log('🧪 Testing session creation API...');
  
  const testData = {
    code: 'TEST123',
    exercises: [
      {
        id: 'test-1',
        fileName: 'test.jpg',
        title: 'Test Exercise',
        instruction: 'Test instruction',
        type: 'quiz'
      }
    ],
    sessionJson: {
      sessionCode: 'TEST123',
      subject: 'info',
      className: '7.b',
      createdAt: new Date().toISOString(),
      exercises: [
        {
          id: 'test-1',
          fileName: 'test.jpg',
          imageUrl: '',
          title: 'Test Exercise',
          instruction: 'Test instruction',
          type: 'quiz',
          content: { questions: [] }
        }
      ],
      metadata: {
        version: '1.0.0',
        exportedBy: 'Test',
        totalExercises: 1,
        estimatedTime: 3
      }
    },
    subject: 'info',
    className: '7.b',
    maxScore: 10
  };

  try {
    console.log('📤 Sending request to API...');
    const response = await fetch('https://nyirad.vercel.app/api/simple-api/sessions/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    });

    console.log('📡 Response status:', response.status);
    console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error response:', errorText);
      try {
        const errorJson = JSON.parse(errorText);
        console.error('❌ Parsed error:', errorJson);
      } catch (e) {
        console.error('❌ Could not parse error as JSON');
      }
    } else {
      const result = await response.json();
      console.log('✅ Success response:', result);
    }

  } catch (error) {
    console.error('❌ Network error:', error);
  }
};

// Run the test
testSessionCreation();