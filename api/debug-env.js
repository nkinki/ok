// Vercel Serverless Function - Debug Environment Variables
module.exports = async function handler(req, res) {
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
    const PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY;
    const SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID;

    return res.status(200).json({
      hasPrivateKey: !!PRIVATE_KEY,
      privateKeyLength: PRIVATE_KEY ? PRIVATE_KEY.length : 0,
      privateKeyStart: PRIVATE_KEY ? PRIVATE_KEY.substring(0, 50) : 'missing',
      privateKeyEnd: PRIVATE_KEY ? PRIVATE_KEY.substring(PRIVATE_KEY.length - 50) : 'missing',
      hasServiceAccountEmail: !!SERVICE_ACCOUNT_EMAIL,
      serviceAccountEmail: SERVICE_ACCOUNT_EMAIL || 'missing',
      hasFolderId: !!FOLDER_ID,
      folderId: FOLDER_ID || 'missing',
      nodeVersion: process.version
    });

  } catch (error) {
    return res.status(500).json({ 
      error: 'Debug error',
      message: error.message 
    });
  }
};
