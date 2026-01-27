// Test script to verify question-based scoring logic
console.log('🧪 Testing Question-Based Scoring Logic');
console.log('======================================');

// Test data - simulating exercises with different types
const testExercises = [
  {
    id: '1',
    type: 'QUIZ',
    title: 'Test Quiz',
    content: {
      questions: [
        { question: 'Q1?', options: ['A', 'B'], correctIndex: 0 },
        { question: 'Q2?', options: ['A', 'B'], correctIndex: 1 },
        { question: 'Q3?', options: ['A', 'B'], correctIndex: 0 }
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
        { id: 'p3', left: 'Left3', right: 'Right3' },
        { id: 'p4', left: 'Left4', right: 'Right4' }
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
        { id: 'item2', text: 'Item 2', categoryId: 'cat2' },
        { id: 'item3', text: 'Item 3', categoryId: 'cat1' }
      ]
    }
  }
];

// Function to count total questions (same logic as in API)
function countTotalQuestions(exercises) {
  return exercises.reduce((total, exercise) => {
    if (exercise.type === 'QUIZ') {
      return total + (exercise.content?.questions?.length || 0);
    } else if (exercise.type === 'MATCHING') {
      return total + (exercise.content?.pairs?.length || 0);
    } else if (exercise.type === 'CATEGORIZATION') {
      return total + (exercise.content?.items?.length || 0);
    }
    return total;
  }, 0);
}

// Function to calculate percentage (same logic as in API)
function calculatePercentage(totalScore, totalQuestions) {
  const maxPossibleScore = totalQuestions * 10; // 10 points per question
  return maxPossibleScore > 0 
    ? Math.round((totalScore / maxPossibleScore) * 100)
    : 0;
}

// Function to determine performance category
function getPerformanceCategory(percentage) {
  if (percentage >= 90) return 'excellent';
  else if (percentage >= 75) return 'good';
  else if (percentage >= 60) return 'average';
  else return 'poor';
}

// Test the scoring logic
console.log('\n📊 Exercise Analysis:');
console.log('====================');

testExercises.forEach((exercise, index) => {
  let questionCount = 0;
  if (exercise.type === 'QUIZ') {
    questionCount = exercise.content?.questions?.length || 0;
  } else if (exercise.type === 'MATCHING') {
    questionCount = exercise.content?.pairs?.length || 0;
  } else if (exercise.type === 'CATEGORIZATION') {
    questionCount = exercise.content?.items?.length || 0;
  }
  
  console.log(`${index + 1}. ${exercise.title} (${exercise.type}): ${questionCount} questions`);
});

const totalQuestions = countTotalQuestions(testExercises);
const maxPossibleScore = totalQuestions * 10;

console.log(`\n📈 Scoring Summary:`);
console.log(`Total Questions: ${totalQuestions}`);
console.log(`Max Possible Score: ${maxPossibleScore} points`);
console.log(`Points per Question: 10`);

// Test different student scenarios
console.log('\n👨‍🎓 Student Scenarios:');
console.log('======================');

const studentScenarios = [
  { name: 'Perfect Student', correctAnswers: 10, description: 'All questions correct' },
  { name: 'Good Student', correctAnswers: 8, description: '8 out of 10 correct' },
  { name: 'Average Student', correctAnswers: 6, description: '6 out of 10 correct' },
  { name: 'Struggling Student', correctAnswers: 3, description: '3 out of 10 correct' },
  { name: 'No Answers', correctAnswers: 0, description: 'No correct answers' }
];

studentScenarios.forEach(scenario => {
  const totalScore = scenario.correctAnswers * 10;
  const percentage = calculatePercentage(totalScore, totalQuestions);
  const category = getPerformanceCategory(percentage);
  
  console.log(`\n${scenario.name}:`);
  console.log(`  - ${scenario.description}`);
  console.log(`  - Score: ${totalScore}/${maxPossibleScore} points`);
  console.log(`  - Percentage: ${percentage}%`);
  console.log(`  - Category: ${category}`);
});

// Test exercise-specific scoring
console.log('\n🎯 Exercise-Specific Scoring:');
console.log('=============================');

// Quiz Exercise: 3 questions, student gets 2 correct
const quizScore = 2 * 10; // 20 points
console.log(`Quiz Exercise: 2/3 correct = ${quizScore} points`);

// Matching Exercise: 4 pairs, student gets 3 correct
const matchingScore = 3 * 10; // 30 points
console.log(`Matching Exercise: 3/4 correct = ${matchingScore} points`);

// Categorization Exercise: 3 items, student gets 2 correct
const categorizationScore = 2 * 10; // 20 points
console.log(`Categorization Exercise: 2/3 correct = ${categorizationScore} points`);

const combinedScore = quizScore + matchingScore + categorizationScore; // 70 points
const combinedPercentage = calculatePercentage(combinedScore, totalQuestions);

console.log(`\nCombined Performance:`);
console.log(`  - Total Score: ${combinedScore}/${maxPossibleScore} points`);
console.log(`  - Percentage: ${combinedPercentage}%`);
console.log(`  - Category: ${getPerformanceCategory(combinedPercentage)}`);

// Verify the old vs new system
console.log('\n🔄 Old vs New System Comparison:');
console.log('=================================');

const oldSystemScore = 3; // 3 exercises completed (old system)
const oldSystemPercentage = Math.round((oldSystemScore / testExercises.length) * 100); // 100%

console.log(`Old System (Exercise-based):`);
console.log(`  - 3/3 exercises completed = 100%`);
console.log(`  - Does not account for partial correctness within exercises`);

console.log(`\nNew System (Question-based):`);
console.log(`  - 7/10 questions correct = 70%`);
console.log(`  - Accounts for partial correctness within exercises`);
console.log(`  - More granular and fair assessment`);

console.log('\n✅ Question-based scoring logic test completed!');
console.log('\nKey Benefits:');
console.log('- More accurate representation of student knowledge');
console.log('- Rewards partial understanding within exercises');
console.log('- Consistent 10-point scoring per question/item');
console.log('- Better differentiation between student performance levels');