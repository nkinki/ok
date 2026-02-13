// Vercel Serverless Function - Download from Public Google Drive Link
export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { driveLink } = req.query;

    if (!driveLink) {
      return res.status(400).json({ error: 'driveLink parameter required' });
    }

    console.log('📥 Download request for URL:', driveLink);

    // Extract file ID from Google Drive URL
    let fileId;
    
    // Handle different Google Drive URL formats
    if (driveLink.includes('/file/d/')) {
      fileId = driveLink.split('/file/d/')[1].split('/')[0];
    } else if (driveLink.includes('id=')) {
      fileId = driveLink.split('id=')[1].split('&')[0];
    } else if (driveLink.includes('/open?id=')) {
      fileId = driveLink.split('/open?id=')[1].split('&')[0];
    } else {
      return res.status(400).json({ error: 'Invalid Google Drive URL format' });
    }

    console.log('📄 Extracted file ID:', fileId);

    // Download from public Google Drive link (no auth needed!)
    const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
    
    const response = await fetch(downloadUrl);
    
    if (!response.ok) {
      console.error('❌ Download failed:', response.status);
      return res.status(404).json({ 
        error: 'File not found or not public',
        message: 'Ellenőrizd, hogy a fájl publikus-e és a link helyes-e.'
      });
    }

    const jsonContent = await response.text();
    console.log('✅ File downloaded successfully');

    // Parse and validate JSON
    let parsedData;
    try {
      parsedData = JSON.parse(jsonContent);
    } catch (parseError) {
      console.error('❌ JSON parse error:', parseError);
      return res.status(500).json({ error: 'Invalid JSON file' });
    }

    // Validate session data
    if (!parsedData.exercises || !Array.isArray(parsedData.exercises)) {
      return res.status(400).json({ error: 'Invalid session format - missing exercises' });
    }

    if (parsedData.exercises.length === 0) {
      return res.status(400).json({ 
        error: 'Empty session',
        message: 'A munkamenet üres.'
      });
    }

    console.log('✅ JSON validated:', parsedData.exercises.length, 'exercises');

    // Return JSON data
    return res.status(200).json({
      success: true,
      data: parsedData
    });

  } catch (error) {
    console.error('❌ Download error:', error);
    
    return res.status(500).json({ 
      error: 'Server error',
      message: error.message 
    });
  }
};
