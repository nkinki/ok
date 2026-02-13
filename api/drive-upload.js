// Vercel Serverless Function - Upload/Update session JSON to Google Drive
import { google } from 'googleapis';

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
    const { slotNumber, sessionData } = req.body;

    if (!slotNumber || !sessionData) {
      return res.status(400).json({ error: 'slotNumber and sessionData required' });
    }

    console.log('📤 Upload request for slot:', slotNumber);

    // Google Drive API setup
    const FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID || '1tWt9sAMIQT7FdXlFFOTMCCT175nMAti6';
    const SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!SERVICE_ACCOUNT_EMAIL || !PRIVATE_KEY) {
      console.error('❌ Missing Google credentials');
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
      ['https://www.googleapis.com/auth/drive.file']
    );

    const drive = google.drive({ version: 'v3', auth });

    // File name based on slot
    const fileName = `session${slotNumber}.json`;
    
    // Search for existing file
    console.log('🔍 Searching for file:', fileName);
    const searchResponse = await drive.files.list({
      q: `name='${fileName}' and '${FOLDER_ID}' in parents and trashed=false`,
      fields: 'files(id, name)',
      pageSize: 1
    });

    const files = searchResponse.data.files;
    let fileId;

    if (files && files.length > 0) {
      // File exists - update it
      fileId = files[0].id;
      console.log('✅ File found, updating:', fileId);

      await drive.files.update({
        fileId: fileId,
        media: {
          mimeType: 'application/json',
          body: JSON.stringify(sessionData, null, 2)
        }
      });

      console.log('✅ File updated successfully');
    } else {
      // File doesn't exist - create it
      console.log('📝 File not found, creating new...');

      const fileMetadata = {
        name: fileName,
        parents: [FOLDER_ID],
        mimeType: 'application/json'
      };

      const media = {
        mimeType: 'application/json',
        body: JSON.stringify(sessionData, null, 2)
      };

      const createResponse = await drive.files.create({
        requestBody: fileMetadata,
        media: media,
        fields: 'id'
      });

      fileId = createResponse.data.id;
      console.log('✅ File created successfully:', fileId);
    }

    return res.status(200).json({
      success: true,
      fileName: fileName,
      fileId: fileId,
      message: 'Session uploaded successfully'
    });

  } catch (error) {
    console.error('❌ Drive upload error:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      stack: error.stack,
      response: error.response?.data
    });
    
    if (error.code === 403) {
      return res.status(403).json({ 
        error: 'Access denied',
        message: 'Service account needs write permission'
      });
    }

    return res.status(500).json({ 
      error: 'Server error',
      message: error.message,
      details: error.response?.data || error.toString()
    });
  }
};
