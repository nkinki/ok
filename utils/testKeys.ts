// Test API keys for demonstration (these are fake/invalid keys)
export const TEST_KEYS = {
  // These are example patterns - NOT real keys
  gemini: 'AIzaSyDemoKey1234567890abcdefghijklmnop'
};

// Example .env format for testing - Gemini only
export const SAMPLE_ENV_FORMAT = `# Google Gemini API Keys - Ingyenes és megbízható! 🔥
GEMINI_API_KEY="AIzaSyCoaDruS_LQBvgFFD46jiSINB6aLODC7Xk"
GEMINI_API_KEY_2="AIzaSyCfgrNHbpdXsxUTSceTmWv_78cXuOGhZMc"
GEMINI_API_KEY_3="AIzaSyDu0Wg7fbuWVyvJgV7eTHoVqWmHobgQ28Q"
GEMINI_API_KEY_4="AIzaSyCUfxV-QOT3Qpf9f-Mqo8gm1z5akAyrUIY"
GEMINI_API_KEY_5="AIzaSyBSVE5hcNLE-tGVNh02nL9YnRdN6XSNQC4"
GEMINI_API_KEY_6="AIzaSyBlqj1hHoN8VxzYmabE65pBQDIt-s4d7JA"
GEMINI_API_KEY_7="AIzaSyB-lGipmE-uSN0pr-2XZ6OP8ApI-YEPU3o"
GEMINI_API_KEY_8="AIzaSyAL-pLNOKk53QBm7Dw8jV3qq4iA9Fwd1F8"
GEMINI_API_KEY_9="AIzaSyDt8woWKgWfBPZLQBUG3MnKRiXWK8kCV0g"

# Regisztráció: https://aistudio.google.com/
# Ingyenes kvóta: 15 kérés/perc, 1500 kérés/nap
# Több kulcs = nagyobb kapacitás`;

// Test function to verify the scanner works
export const testKeyScanner = () => {
  console.log('🧪 Testing API Key Scanner - Gemini only...');
  console.log('🔍 Expected: GEMINI: 9 (total: 9)');
};