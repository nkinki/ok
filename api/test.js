// Teljesen új API fájl teszteléshez

export default function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Health check
    if (req.method === 'GET') {
      return res.status(200).json({ 
        status: 'working', 
        timestamp: new Date().toISOString(),
        message: 'Új API fájl működik!',
        method: req.method,
        url: req.url
      });
    }

    // POST test
    if (req.method === 'POST') {
      return res.status(200).json({
        status: 'post_working',
        body: req.body,
        timestamp: new Date().toISOString(),
        message: 'POST is működik!'
      });
    }

    // Default
    return res.status(200).json({ 
      error: 'Method not supported',
      method: req.method,
      supportedMethods: ['GET', 'POST']
    });

  } catch (error) {
    return res.status(500).json({ 
      error: 'Server error',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
}