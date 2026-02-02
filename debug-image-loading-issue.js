// Debug script to check image loading issues in exercises
// Run this in browser console when students can't see images

console.log('🔍 IMAGE LOADING DEBUG STARTED');

// Check current session data
const checkSessionImages = () => {
  console.log('📊 CHECKING SESSION IMAGES...');
  
  // Check localStorage for session data
  const sessionKeys = Object.keys(localStorage).filter(key => key.startsWith('session_'));
  console.log('🗂️ Found session keys:', sessionKeys);
  
  sessionKeys.forEach(key => {
    try {
      const sessionData = JSON.parse(localStorage.getItem(key));
      if (sessionData && sessionData.exercises) {
        console.log(`📁 Session: ${key}`);
        console.log(`📊 Exercise count: ${sessionData.exercises.length}`);
        
        sessionData.exercises.forEach((exercise, index) => {
          const hasImage = !!exercise.imageUrl;
          const imageLength = exercise.imageUrl?.length || 0;
          const isBase64 = exercise.imageUrl?.startsWith('data:');
          
          console.log(`  📝 Exercise ${index + 1}: ${exercise.id || 'no-id'}`);
          console.log(`    🖼️ Has image: ${hasImage}`);
          console.log(`    📏 Image length: ${imageLength}`);
          console.log(`    🔗 Is base64: ${isBase64}`);
          console.log(`    📄 Title: ${exercise.title || 'no-title'}`);
          
          if (!hasImage) {
            console.warn(`    ⚠️ MISSING IMAGE for exercise ${index + 1}!`);
          } else if (imageLength < 1000) {
            console.warn(`    ⚠️ SUSPICIOUSLY SMALL IMAGE (${imageLength} chars) for exercise ${index + 1}!`);
          }
        });
      }
    } catch (error) {
      console.error(`❌ Error parsing session ${key}:`, error);
    }
  });
};

// Check current playlist in DailyChallenge
const checkCurrentPlaylist = () => {
  console.log('🎮 CHECKING CURRENT PLAYLIST...');
  
  // Try to access React component state (if available)
  const reactRoot = document.querySelector('#root');
  if (reactRoot && reactRoot._reactInternalFiber) {
    console.log('⚛️ React detected, but state access limited in production');
  }
  
  // Check for any images currently loaded in DOM
  const images = document.querySelectorAll('img');
  console.log(`🖼️ Found ${images.length} images in DOM:`);
  
  images.forEach((img, index) => {
    console.log(`  Image ${index + 1}:`);
    console.log(`    📏 Size: ${img.naturalWidth}x${img.naturalHeight}`);
    console.log(`    🔗 Src length: ${img.src.length}`);
    console.log(`    ✅ Loaded: ${img.complete && img.naturalHeight !== 0}`);
    console.log(`    🎯 Alt: ${img.alt}`);
    
    if (!img.complete || img.naturalHeight === 0) {
      console.warn(`    ⚠️ IMAGE FAILED TO LOAD!`);
      console.warn(`    🔗 Src preview: ${img.src.substring(0, 100)}...`);
    }
  });
};

// Check for console errors related to images
const checkConsoleErrors = () => {
  console.log('🚨 CHECKING FOR IMAGE-RELATED ERRORS...');
  
  // Override console.error to catch image errors
  const originalError = console.error;
  console.error = function(...args) {
    if (args.some(arg => typeof arg === 'string' && (
      arg.includes('image') || 
      arg.includes('ImageViewer') || 
      arg.includes('Failed to load') ||
      arg.includes('404')
    ))) {
      console.warn('🚨 IMAGE-RELATED ERROR DETECTED:', ...args);
    }
    originalError.apply(console, args);
  };
  
  console.log('✅ Error monitoring enabled');
};

// Main debug function
const debugImageIssues = () => {
  console.log('🔍 STARTING COMPREHENSIVE IMAGE DEBUG...');
  console.log('='.repeat(50));
  
  checkSessionImages();
  console.log('-'.repeat(30));
  
  checkCurrentPlaylist();
  console.log('-'.repeat(30));
  
  checkConsoleErrors();
  console.log('-'.repeat(30));
  
  console.log('✅ DEBUG COMPLETE - Check warnings above for issues');
  console.log('💡 If images are missing, try:');
  console.log('   1. Refresh the page');
  console.log('   2. Check if session was created with images');
  console.log('   3. Verify Google Drive connection');
  console.log('   4. Check browser console for 404 errors');
};

// Auto-run debug
debugImageIssues();

// Export for manual use
window.debugImageIssues = debugImageIssues;
window.checkSessionImages = checkSessionImages;
window.checkCurrentPlaylist = checkCurrentPlaylist;

console.log('🎯 Debug functions available:');
console.log('   debugImageIssues() - Full debug');
console.log('   checkSessionImages() - Check localStorage');
console.log('   checkCurrentPlaylist() - Check current state');