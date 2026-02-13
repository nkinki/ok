// Vercel Serverless Function - Save results to Supabase
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      sessionCode, 
      slotNumber,
      studentName, 
      studentClass, 
      score, 
      totalQuestions,
      timeSpent,
      completedAt 
    } = req.body;

    if (!sessionCode || !studentName || score === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    console.log('📊 Saving result:', { sessionCode, studentName, score });

    // Insert result into Supabase
    const { data, error } = await supabase
      .from('slot_results')
      .insert([
        {
          session_code: sessionCode,
          slot_number: slotNumber || 1,
          student_name: studentName,
          student_class: studentClass || '',
          score: score,
          total_questions: totalQuestions || 0,
          time_spent: timeSpent || 0,
          completed_at: completedAt || new Date().toISOString()
        }
      ])
      .select();

    if (error) {
      console.error('❌ Supabase error:', error);
      return res.status(500).json({ 
        error: 'Database error',
        message: error.message 
      });
    }

    console.log('✅ Result saved:', data);

    return res.status(200).json({
      success: true,
      data: data[0]
    });

  } catch (error) {
    console.error('❌ Save result error:', error);
    
    return res.status(500).json({ 
      error: 'Server error',
      message: error.message 
    });
  }
}
