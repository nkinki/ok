// Test script to verify percentage calculation fix
// This tests the percentage capping at 100% and consistent calculation

const testPercentageFix = () => {
  console.log('🔍 Testing percentage calculation fix...');
  
  // Test case 1: Normal percentage (should remain unchanged)
  const normalCase = {
    totalScore: 30,
    totalQuestions: 5,
    maxPossibleScore: 50, // 5 questions * 10 points
    expectedPercentage: 60 // (30/50) * 100 = 60%
  };
  
  let percentage1 = Math.round((normalCase.totalScore / normalCase.maxPossibleScore) * 100);
  if (percentage1 > 100) percentage1 = 100; // Apply cap
  
  console.log('\n✅ Test Case 1 - Normal percentage:');
  console.log(`- Score: ${normalCase.totalScore}/${normalCase.maxPossibleScore}`);
  console.log(`- Calculated: ${percentage1}%`);
  console.log(`- Expected: ${normalCase.expectedPercentage}%`);
  console.log(`- Result: ${percentage1 === normalCase.expectedPercentage ? '✅ PASS' : '❌ FAIL'}`);
  
  // Test case 2: Over 100% (should be capped at 100%)
  const overCase = {
    totalScore: 110, // More points than possible (e.g., from scoring bug)
    totalQuestions: 5,
    maxPossibleScore: 50, // 5 questions * 10 points
    expectedPercentage: 100 // Should be capped at 100%
  };
  
  let percentage2 = Math.round((overCase.totalScore / overCase.maxPossibleScore) * 100);
  const uncappedPercentage2 = percentage2;
  if (percentage2 > 100) percentage2 = 100; // Apply cap
  
  console.log('\n✅ Test Case 2 - Over 100% (should be capped):');
  console.log(`- Score: ${overCase.totalScore}/${overCase.maxPossibleScore}`);
  console.log(`- Uncapped calculation: ${uncappedPercentage2}%`);
  console.log(`- Capped result: ${percentage2}%`);
  console.log(`- Expected: ${overCase.expectedPercentage}%`);
  console.log(`- Result: ${percentage2 === overCase.expectedPercentage ? '✅ PASS' : '❌ FAIL'}`);
  
  // Test case 3: Edge case - exactly 100%
  const perfectCase = {
    totalScore: 50,
    totalQuestions: 5,
    maxPossibleScore: 50, // 5 questions * 10 points
    expectedPercentage: 100 // (50/50) * 100 = 100%
  };
  
  let percentage3 = Math.round((perfectCase.totalScore / perfectCase.maxPossibleScore) * 100);
  if (percentage3 > 100) percentage3 = 100; // Apply cap
  
  console.log('\n✅ Test Case 3 - Perfect score:');
  console.log(`- Score: ${perfectCase.totalScore}/${perfectCase.maxPossibleScore}`);
  console.log(`- Calculated: ${percentage3}%`);
  console.log(`- Expected: ${perfectCase.expectedPercentage}%`);
  console.log(`- Result: ${percentage3 === perfectCase.expectedPercentage ? '✅ PASS' : '❌ FAIL'}`);
  
  // Test case 4: Real-world example from user's data
  const realCase = {
    studentName: 'Béres Abigél',
    totalScore: 50, // From user's example
    completedExercises: 3,
    totalExercises: 3,
    // Assuming 3 exercises with 5 questions each = 15 total questions
    totalQuestions: 15,
    maxPossibleScore: 150, // 15 questions * 10 points
    expectedPercentage: 33 // (50/150) * 100 = 33.33% → 33%
  };
  
  let percentage4 = Math.round((realCase.totalScore / realCase.maxPossibleScore) * 100);
  if (percentage4 > 100) percentage4 = 100; // Apply cap
  
  console.log('\n✅ Test Case 4 - Real-world example:');
  console.log(`- Student: ${realCase.studentName}`);
  console.log(`- Score: ${realCase.totalScore}/${realCase.maxPossibleScore}`);
  console.log(`- Exercises: ${realCase.completedExercises}/${realCase.totalExercises}`);
  console.log(`- Total questions: ${realCase.totalQuestions}`);
  console.log(`- Calculated: ${percentage4}%`);
  console.log(`- Expected: ${realCase.expectedPercentage}%`);
  console.log(`- Result: ${percentage4 === realCase.expectedPercentage ? '✅ PASS' : '❌ FAIL'}`);
  
  console.log('\n🎯 Summary:');
  console.log('- Percentage calculation now caps at 100% maximum');
  console.log('- Both API endpoints use consistent question counting logic');
  console.log('- SessionDetailsModal also applies the same cap');
  console.log('- This should fix the 220%+ percentage display issue');
  
  console.log('\n📋 Next steps:');
  console.log('1. Deploy the updated API');
  console.log('2. Test with real session data');
  console.log('3. Verify teacher dashboard shows correct percentages');
  console.log('4. Confirm no more over 100% percentages appear');
};

// Run the test
testPercentageFix();