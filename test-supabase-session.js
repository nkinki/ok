// Test Supabase session creation
const testData = {
  sessionCode: 'TEST123',
  slotNumber: 1,
  subject: 'info',
  className: '8.a',
  exercises: [
    {
      id: 'test1',
      type: 'QUIZ',
      title: 'Test feladat'
    }
  ]
};

console.log('📊 Testing Supabase session creation...');
console.log('Test data:', testData);

fetch('https://nyirad.vercel.app/api/simple-api/sessions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(testData)
})
.then(response => {
  console.log('Response status:', response.status);
  return response.json();
})
.then(data => {
  console.log('Response data:', data);
})
.catch(error => {
  console.error('Error:', error);
});
