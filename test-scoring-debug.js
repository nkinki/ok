// Debug script to test scoring system
console.log('🧪 Testing Scoring Debug');
console.log('=======================');

// Simulate a quiz exercise with 3 questions
const quizContent = {
  questions: [
    { question: 'Q1?', options: ['A', 'B'], correctIndex: 0 },
    { question: 'Q2?', options: ['A', 'B'], correctIndex: 1 },
    { question: 'Q3?', options: ['A', 'B'], correctIndex: 0 }
  ]
};

// Simulate QuizExercise scoring logic
let score = 0;

// Student answers correctly to 2 out of 3 questions
console.log('\n📝 Quiz Exercise Simulation:');
console.log('Question 1: Correct answer → +10 points');
score += 10;
console.log('Current score:', score);

console.log('Question 2: Wrong answer → +0 points');
// No points added
console.log('Current score:', score);

console.log('Question 3: Correct answer → +10 points');
score += 10;
console.log('Final score:', score);

// This should be the score passed to onNext
console.log('\n🎯 Expected Results:');
console.log('Total questions:', quizContent.questions.length);
console.log('Correct answers:', 2);
console.log('Score passed to onNext:', score);
console.log('Expected API payload:');
console.log({
  results: [{
    exerciseIndex: 0,
    isCorrect: false, // Not all questions correct
    score: score, // 20 points
    timeSpent: 30000,
    answer: {
      totalQuestions: 3,
      correctAnswers: score, // This might be wrong!
      questions: quizContent.questions
    }
  }],
  summary: {
    totalScore: score // 20 points
  }
});

console.log('\n⚠️ Potential Issue Found:');
console.log('In QuizExercise, the quizAnswer object has:');
console.log('correctAnswers: score');
console.log('But score is the total points (20), not the number of correct answers (2)!');
console.log('This might confuse the API or teacher interface.');

console.log('\n🔍 Checking other exercise types:');

// Simulate MatchingExercise
const matchingContent = {
  pairs: [
    { id: 'p1', left: 'A', right: '1' },
    { id: 'p2', left: 'B', right: '2' },
    { id: 'p3', left: 'C', right: '3' },
    { id: 'p4', left: 'D', right: '4' }
  ]
};

const correctPairs = 3; // Student got 3 out of 4 correct
const matchingScore = correctPairs * 10; // 30 points

console.log('\n🔗 Matching Exercise:');
console.log('Total pairs:', matchingContent.pairs.length);
console.log('Correct pairs:', correctPairs);
console.log('Score:', matchingScore);

// Simulate CategorizationExercise
const categorizationContent = {
  items: [
    { id: 'i1', text: 'Item 1', categoryId: 'cat1' },
    { id: 'i2', text: 'Item 2', categoryId: 'cat2' },
    { id: 'i3', text: 'Item 3', categoryId: 'cat1' }
  ]
};

const correctItems = 2; // Student got 2 out of 3 correct
const categorizationScore = correctItems * 10; // 20 points

console.log('\n📂 Categorization Exercise:');
console.log('Total items:', categorizationContent.items.length);
console.log('Correct items:', correctItems);
console.log('Score:', categorizationScore);

console.log('\n📊 Session Total:');
const totalScore = score + matchingScore + categorizationScore;
console.log('Quiz score:', score);
console.log('Matching score:', matchingScore);
console.log('Categorization score:', categorizationScore);
console.log('Total session score:', totalScore);

const totalQuestions = quizContent.questions.length + matchingContent.pairs.length + categorizationContent.items.length;
const totalCorrect = 2 + 3 + 2; // 7 correct out of 10 total
const expectedPercentage = Math.round((totalScore / (totalQuestions * 10)) * 100);

console.log('\nTotal questions/items:', totalQuestions);
console.log('Total correct:', totalCorrect);
console.log('Expected percentage:', expectedPercentage + '%');

console.log('\n✅ Debug completed!');
console.log('If students are getting 0 points, check:');
console.log('1. Are the exercise components calling onNext with the correct score?');
console.log('2. Is the API receiving the score in summary.totalScore?');
console.log('3. Is the API correctly adding the score to the existing total?');
console.log('4. Check browser console for API submission logs');