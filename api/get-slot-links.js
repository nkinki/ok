// Vercel Serverless Function - Get Slot Links from Environment Variables
export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Read slot links from environment variables
    const slotLinks = {
      slot1: process.env.SLOT_1_LINK || '',
      slot2: process.env.SLOT_2_LINK || '',
      slot3: process.env.SLOT_3_LINK || '',
      slot4: process.env.SLOT_4_LINK || '',
      slot5: process.env.SLOT_5_LINK || '',
      slot6: process.env.SLOT_6_LINK || '',
      slot7: process.env.SLOT_7_LINK || '',
      slot8: process.env.SLOT_8_LINK || '',
      slot9: process.env.SLOT_9_LINK || '',
      slot10: process.env.SLOT_10_LINK || ''
    };

    return res.status(200).json(slotLinks);

  } catch (error) {
    console.error('❌ Error loading slot links:', error);
    
    return res.status(500).json({ 
      error: 'Server error',
      message: error.message 
    });
  }
}
