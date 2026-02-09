// Express API Server for Google Drive Auto-Download
import express from 'express';
import cors from 'cors';
import { google } from 'googleapis';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const app = express();
const PORT = process.env.API_PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'API server running' });
});

// Google Drive Auto-Download Endpoint
app.get('/api/drive-download', async (req, res) => {
  try {
    const { fileName } = req.query;

    if (!fileName) {
      return res.status(400).json({ error: 'fileName parameter required' });
    }

    console.log('📥 Auto-download request for:', fileName);

    // Google Drive API setup
    const FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID || '1tWt9sAMIQT7FdXlFFOTMCCT175nMAti6';
    const SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!SERVICE_ACCOUNT_EMAIL || !PRIVATE_KEY) {
      console.error('❌ Missing Google credentials');
      console.error('SERVICE_ACCOUNT_EMAIL:', SERVICE_ACCOUNT_EMAIL ? 'present' : 'missing');
      console.error('PRIVATE_KEY:', PRIVATE_KEY ? 'present' : 'missing');
      return res.status(500).json({ 
        error: 'Server configuration error',
        message: 'Missing Google Drive credentials'
      });
    }

    // Create JWT client
    const auth = new google.auth.JWT(
      SERVICE_ACCOUNT_EMAIL,
      null,
      PRIVATE_KEY,
      ['https://www.googleapis.com/auth/drive.readonly']
    );

    const drive = google.drive({ version: 'v3', auth });

    // Search for file by name in folder
    console.log('🔍 Searching for file:', fileName, 'in folder:', FOLDER_ID);
    
    const searchResponse = await drive.files.list({
      q: `name='${fileName}' and '${FOLDER_ID}' in parents and trashed=false`,
      fields: 'files(id, name, mimeType, size)',
      pageSize: 1
    });

    const files = searchResponse.data.files;

    if (!files || files.length === 0) {
      console.log('❌ File not found:', fileName);
      return res.status(404).json({ 
        error: 'File not found',
        fileName,
        message: 'A fájl nem található a Google Drive mappában. Ellenőrizd, hogy a tanár feltöltötte-e.'
      });
    }

    const file = files[0];
    console.log('✅ File found:', file.name, 'ID:', file.id, 'Size:', file.size);

    // Download file content
    const downloadResponse = await drive.files.get({
      fileId: file.id,
      alt: 'media'
    }, {
      responseType: 'text'
    });

    const jsonContent = downloadResponse.data;
    console.log('✅ File downloaded successfully, size:', JSON.stringify(jsonContent).length);

    // Parse and validate JSON
    let parsedData;
    try {
      parsedData = typeof jsonContent === 'string' ? JSON.parse(jsonContent) : jsonContent;
    } catch (parseError) {
      console.error('❌ JSON parse error:', parseError);
      return res.status(500).json({ error: 'Invalid JSON file' });
    }

    // Validate session data
    if (!parsedData.exercises || !Array.isArray(parsedData.exercises)) {
      return res.status(400).json({ error: 'Invalid session format - missing exercises' });
    }

    console.log('✅ JSON validated:', parsedData.exercises.length, 'exercises');

    // Return JSON data
    return res.status(200).json({
      success: true,
      fileName: file.name,
      fileId: file.id,
      data: parsedData
    });

  } catch (error) {
    console.error('❌ Drive download error:', error);
    
    // Handle specific Google API errors
    if (error.code === 403) {
      return res.status(403).json({ 
        error: 'Access denied',
        message: 'A service account-nak nincs hozzáférése a Drive mappához. Ellenőrizd a megosztási beállításokat.'
      });
    }

    return res.status(500).json({ 
      error: 'Server error',
      message: error.message 
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 API Server running on http://localhost:${PORT}`);
  console.log(`📁 Google Drive Folder ID: ${process.env.GOOGLE_DRIVE_FOLDER_ID}`);
  console.log(`📧 Service Account: ${process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL}`);
});
