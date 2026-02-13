// Quick diagnostic endpoint to test Google Drive credentials
const { google } = require('googleapis');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  try {
    // Check environment variables
    const hasEmail = !!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const hasKey = !!process.env.GOOGLE_PRIVATE_KEY;
    const hasFolderId = !!process.env.GOOGLE_DRIVE_FOLDER_ID;
    
    const diagnostics = {
      environment: {
        GOOGLE_SERVICE_ACCOUNT_EMAIL: hasEmail ? '✅ Set' : '❌ Missing',
        GOOGLE_PRIVATE_KEY: hasKey ? '✅ Set' : '❌ Missing',
        GOOGLE_DRIVE_FOLDER_ID: hasFolderId ? '✅ Set' : '❌ Missing',
      },
      values: {
        email: hasEmail ? process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL : null,
        keyLength: hasKey ? process.env.GOOGLE_PRIVATE_KEY.length : 0,
        folderId: hasFolderId ? process.env.GOOGLE_DRIVE_FOLDER_ID : null,
      }
    };

    // Try to create auth client
    if (hasEmail && hasKey) {
      try {
        const PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n');
        
        const auth = new google.auth.JWT(
          process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
          null,
          PRIVATE_KEY,
          ['https://www.googleapis.com/auth/drive.readonly']
        );

        // Try to authenticate
        await auth.authorize();
        diagnostics.auth = '✅ Authentication successful';
        
        // Try to list files
        const drive = google.drive({ version: 'v3', auth });
        const FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID;
        
        const response = await drive.files.list({
          q: `'${FOLDER_ID}' in parents and trashed=false`,
          fields: 'files(id, name)',
          pageSize: 5
        });
        
        diagnostics.driveAccess = '✅ Drive access successful';
        diagnostics.filesFound = response.data.files.length;
        diagnostics.files = response.data.files.map(f => f.name);
        
      } catch (authError) {
        diagnostics.auth = '❌ Authentication failed';
        diagnostics.authError = authError.message;
      }
    }

    return res.status(200).json(diagnostics);
    
  } catch (error) {
    return res.status(500).json({ 
      error: error.message,
      stack: error.stack 
    });
  }
};
