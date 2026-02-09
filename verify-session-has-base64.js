// Verify if a session has BASE64 images in Supabase
// Usage: node verify-session-has-base64.js <SESSION_CODE>

const sessionCode = process.argv[2];

if (!sessionCode) {
  console.log('❌ Használat: node verify-session-has-base64.js <SESSION_CODE>');
  console.log('   Példa: node verify-session-has-base64.js UK1S5P');
  process.exit(1);
}

const API_URL = process.env.VERCEL_URL 
  ? `https://${process.env.VERCEL_URL}`
  : 'http://localhost:3000';

async function verifySession() {
  console.log('🔍 Checking session:', sessionCode);
  console.log('🌐 API URL:', API_URL);
  console.log('');
  
  try {
    // Fetch session from API
    const response = await fetch(`${API_URL}/api/simple-api/sessions/${sessionCode}/download`);
    
    if (!response.ok) {
      console.log('❌ Session not found in Supabase');
      console.log('💡 This session might be too old or was never created');
      return;
    }
    
    const sessionData = await response.json();
    
    console.log('✅ Session found in Supabase');
    console.log('📊 Session info:');
    console.log('   - Code:', sessionData.code || sessionData.sessionCode);
    console.log('   - Subject:', sessionData.subject);
    console.log('   - Class:', sessionData.className);
    console.log('   - Exercises:', sessionData.exercises?.length || 0);
    console.log('');
    
    if (!sessionData.exercises || sessionData.exercises.length === 0) {
      console.log('❌ No exercises in session!');
      return;
    }
    
    // Check first exercise image
    const firstExercise = sessionData.exercises[0];
    const imageUrl = firstExercise.imageUrl;
    
    console.log('🖼️ First exercise image check:');
    console.log('   - Has imageUrl:', !!imageUrl);
    console.log('   - Image length:', imageUrl?.length || 0, 'chars');
    
    if (!imageUrl) {
      console.log('❌ NO IMAGE URL - This session has no images!');
      return;
    }
    
    if (imageUrl.length < 200) {
      console.log('❌ MOCK URL DETECTED - This is an OLD session!');
      console.log('   - URL:', imageUrl);
      console.log('');
      console.log('💡 This session was created BEFORE the BASE64 fix');
      console.log('💡 You need to create a NEW session to test JSON import');
      return;
    }
    
    if (imageUrl.startsWith('data:image/')) {
      console.log('✅ BASE64 IMAGE DETECTED - This session is ready for JSON import!');
      console.log('   - Format:', imageUrl.substring(0, 30) + '...');
      console.log('   - Size:', formatBytes(imageUrl.length));
      console.log('');
      
      // Calculate total size
      let totalSize = 0;
      sessionData.exercises.forEach(ex => {
        if (ex.imageUrl && ex.imageUrl.startsWith('data:')) {
          totalSize += ex.imageUrl.length;
        }
      });
      
      console.log('📊 Total embedded images size:', formatBytes(totalSize));
      console.log('');
      console.log('🎉 This session is PERFECT for JSON import!');
      console.log('✅ Download JSON → Share with students → They can load offline!');
      
    } else if (imageUrl.includes('drive.google.com')) {
      console.log('⚠️ GOOGLE DRIVE URL - This session uses Drive links');
      console.log('   - URL:', imageUrl.substring(0, 50) + '...');
      console.log('');
      console.log('💡 This session requires Google Drive access');
      console.log('💡 For offline JSON import, create a NEW session');
      
    } else {
      console.log('❓ UNKNOWN IMAGE FORMAT');
      console.log('   - URL:', imageUrl.substring(0, 100));
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

verifySession();
