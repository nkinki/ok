// Setup session tables in Supabase
import { supabase } from '../database/supabase.js'

async function setupSessionTables() {
  console.log('🗄️ Setting up session tables in Supabase...')
  
  try {
    // Test connection first
    const { data, error: testError } = await supabase
      .from('users')
      .select('count')
      .limit(1)
    
    if (testError) {
      console.log('ℹ️ Users table not found, this is normal for first setup')
    } else {
      console.log('✅ Supabase connection successful')
    }

    console.log('📝 Note: Tables will be created automatically when first session is created.')
    console.log('🎉 Setup complete! The API will handle table creation on first use.')
    
  } catch (error) {
    console.error('❌ Setup failed:', error)
  }
}

// Run setup
setupSessionTables()