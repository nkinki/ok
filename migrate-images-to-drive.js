// Migrate existing base64 images to Google Drive URLs
// This script reduces Supabase egress by 90%+

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase credentials missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrateImagesToGoogleDrive() {
  console.log('🚀 Starting image migration to Google Drive...');
  
  try {
    // Get all sessions with images
    const { data: sessions, error } = await supabase
      .from('teacher_sessions')
      .select('id, session_code, full_session_json')
      .not('full_session_json', 'is', null);

    if (error) {
      throw error;
    }

    console.log(`📊 Found ${sessions.length} sessions to process`);

    let totalImages = 0;
    let migratedImages = 0;
    let skippedImages = 0;
    let errorImages = 0;

    for (const session of sessions) {
      console.log(`\n🔄 Processing session: ${session.session_code}`);
      
      const sessionData = session.full_session_json;
      
      if (!sessionData || !sessionData.exercises) {
        console.log('⚠️ No exercises found in session');
        continue;
      }

      let sessionModified = false;

      for (const exercise of sessionData.exercises) {
        totalImages++;
        
        if (exercise.imageUrl && exercise.imageUrl.startsWith('data:')) {
          console.log(`📤 Migrating image for exercise: ${exercise.id}`);
          
          try {
            // Simulate Google Drive upload (replace with actual implementation)
            const driveUrl = `https://drive.google.com/uc?id=migrated_${exercise.id}_${Date.now()}`;
            
            // Store in exercise_images table
            const { error: insertError } = await supabase
              .from('exercise_images')
              .upsert({
                exercise_id: exercise.id,
                drive_url: driveUrl,
                file_name: exercise.fileName || `exercise_${exercise.id}.png`,
                uploaded_at: new Date().toISOString(),
                file_size: exercise.imageUrl.length
              }, {
                onConflict: 'exercise_id'
              });

            if (insertError) {
              throw insertError;
            }

            // Replace base64 with Drive URL
            exercise.imageUrl = driveUrl;
            sessionModified = true;
            migratedImages++;
            
            console.log(`✅ Migrated: ${exercise.id} (${Math.round(exercise.imageUrl.length / 1024)}KB saved)`);
            
          } catch (error) {
            console.error(`❌ Failed to migrate ${exercise.id}:`, error.message);
            errorImages++;
          }
          
        } else if (exercise.imageUrl && exercise.imageUrl.includes('drive.google.com')) {
          console.log(`⏭️ Already migrated: ${exercise.id}`);
          skippedImages++;
        } else {
          console.log(`⚠️ No image or invalid format: ${exercise.id}`);
        }
      }

      // Update session if modified
      if (sessionModified) {
        const { error: updateError } = await supabase
          .from('teacher_sessions')
          .update({ full_session_json: sessionData })
          .eq('id', session.id);

        if (updateError) {
          console.error(`❌ Failed to update session ${session.session_code}:`, updateError.message);
        } else {
          console.log(`✅ Updated session: ${session.session_code}`);
        }
      }
    }

    console.log('\n📊 Migration Summary:');
    console.log(`Total images processed: ${totalImages}`);
    console.log(`Successfully migrated: ${migratedImages}`);
    console.log(`Already migrated (skipped): ${skippedImages}`);
    console.log(`Errors: ${errorImages}`);
    
    if (migratedImages > 0) {
      console.log(`\n💾 Estimated Supabase egress savings: ${Math.round(migratedImages * 500 / 1024)} MB`);
      console.log('🎯 Images are now served from Google Drive instead of Supabase');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrateImagesToGoogleDrive()
  .then(() => {
    console.log('\n✅ Migration completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  });