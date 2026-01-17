import { GoogleGenAI, Type, Schema } from "@google/genai";
import { ExerciseData, ExerciseType } from "../types";
import { logger } from "../utils/logger";

// Define the schema for the output to ensure structured JSON
const exerciseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: "The title of the exercise found in the image." },
    instruction: { type: Type.STRING, description: "The specific instruction for the student." },
    type: { 
      type: Type.STRING, 
      enum: ["MATCHING", "CATEGORIZATION", "QUIZ"],
      description: "The type of logic required to solve the exercise." 
    },
    matchingPairs: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          left: { type: Type.STRING, description: "Text on the left side or first item." },
          right: { type: Type.STRING, description: "Text on the right side or matching definition." },
        }
      },
      description: "Filled only if type is MATCHING."
    },
    categories: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "List of category names. Filled only if type is CATEGORIZATION."
    },
    categorizationItems: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          text: { type: Type.STRING },
          categoryName: { type: Type.STRING, description: "Must match one of the categories list." }
        }
      },
      description: "Filled only if type is CATEGORIZATION."
    },
    quizQuestions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          question: { type: Type.STRING },
          options: { type: Type.ARRAY, items: { type: Type.STRING } },
          correctOptionIndex: { type: Type.INTEGER }
        }
      },
      description: "Filled only if type is QUIZ or if it is a flowchart/logic task."
    }
  },
  required: ["title", "instruction", "type"]
};

export const analyzeImage = async (base64Image: string, userHint?: string): Promise<ExerciseData> => {
  // Get Gemini API Keys
  let geminiKey = typeof localStorage !== 'undefined' ? localStorage.getItem('gemini_api_key') : null;
  let geminiKeys = typeof localStorage !== 'undefined' ? localStorage.getItem('gemini_api_keys') : null;

  // Parse multiple API keys for pool functionality
  let geminiKeyPool: string[] = [];
  if (geminiKeys) {
    geminiKeyPool = geminiKeys.split('\n')
      .map(key => key.trim())
      .filter(key => key.length > 0 && key.startsWith('AIza'));
  }
  if (geminiKey && geminiKey.startsWith('AIza')) {
    geminiKeyPool.unshift(geminiKey);
  }

  // Debug logging
  logger.info("Gemini API kulcsok állapota:", {
    gemini: `${geminiKeyPool.length} kulcs`
  });

  // Fallback check for environment variables
  if (geminiKeyPool.length === 0 && typeof process !== 'undefined' && process.env && process.env.GEMINI_API_KEY) {
      geminiKeyPool.push(process.env.GEMINI_API_KEY);
  }
  
  // Check if we have at least one API key
  if (geminiKeyPool.length === 0) {
    logger.error("Nincs Gemini API kulcs beállítva!");
    throw new Error("Nincs Gemini API kulcs! Kérlek állítsd be legalább egy kulcsot a Beállítások menüben!");
  }

  logger.info(`🎯 Gemini használata: ${geminiKeyPool.length} kulcs elérhető`);

  // Use Gemini with pool functionality
  return await analyzeWithGeminiPool(base64Image, geminiKeyPool, userHint);
};

const analyzeWithGemini = async (base64Image: string, apiKey: string, userHint?: string): Promise<ExerciseData> => {
  // Validate API key format
  if (!apiKey || apiKey.trim() === '' || apiKey === 'PLACEHOLDER_API_KEY') {
    logger.error("Gemini API kulcs hiányzik!");
    throw new Error("Gemini API kulcs hiányzik! Kérlek állítsd be a kulcsot a Beállítások menüben.");
  }
  
  if (!apiKey.startsWith('AIza')) {
    logger.error("Hibás Gemini API kulcs formátum!");
    logger.error(`Kapott kulcs: "${apiKey.substring(0, 10)}..." (${apiKey.length} karakter)`);
    throw new Error("Hibás Gemini API kulcs formátum! A Gemini API kulcs 'AIza'-val kezdődik.");
  }

  logger.info("Gemini API hívás indítása...", { keyLength: apiKey.length, hasHint: !!userHint });

  // Add initial delay to prevent rate limiting
  logger.info("⏳ Kezdeti várakozás (2mp) a rate limit elkerülésére...");
  await new Promise(resolve => setTimeout(resolve, 2000));

  const ai = new GoogleGenAI({ apiKey });

  let prompt = `
    You are an expert educational assistant for Hungarian students.
    Task: Analyze the provided image of a textbook or workbook exercise and convert it into a structured JSON format.
    
    CRITICAL RULES:
    1. **SEPARATE LEFT AND RIGHT TEXT**: The image typically has text on the LEFT side (context/background) and on the RIGHT side (specific task).
    2. **LEFT SIDE TEXT**: Extract all background text, context, explanations (usually on the left) - this goes to "title"
    3. **RIGHT SIDE TEXT**: Extract the specific task instructions, questions, options (usually on the right) - this goes to "instruction"
    4. **VERBATIM EXTRACTION**: Extract text EXACTLY as it appears in the image, word for word.
    5. **LANGUAGE**: The output must be in HUNGARIAN.
    6. **OUTPUT FORMAT**: Return ONLY valid JSON, no other text.
    
    WHAT TO EXTRACT:
    - "title": ALL background/context text from the LEFT side of the image
    - "instruction": The specific task instruction from the RIGHT side of the image
    - Questions and answers exactly as written
    
    Task Types: MATCHING, CATEGORIZATION, QUIZ.
    
    Return JSON in this exact format:
    {
      "title": "Complete background/context text from LEFT side of image",
      "instruction": "Specific task instruction from RIGHT side of image",
      "type": "MATCHING|CATEGORIZATION|QUIZ",
      "matchingPairs": [{"left": "text", "right": "text"}],
      "categories": ["category1", "category2"],
      "categorizationItems": [{"text": "item", "categoryName": "category"}],
      "quizQuestions": [{"question": "complete question text", "options": ["exact option A", "exact option B", "exact option C"], "correctOptionIndex": 0}]
    }
    
    Fill only the fields relevant to the detected exercise type.
    REMEMBER: LEFT side text → title, RIGHT side text → instruction!
  `;

  if (userHint) {
    prompt += `\n\nIMPORTANT USER HINT/CORRECTION: The user states: "${userHint}". Please adjust your analysis to strictly follow this instruction (e.g. change exercise type or fix text).`;
  }

  try {
    // Add 60s timeout
    const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Időtúllépés: A Google AI nem válaszolt 60 másodpercen belül.")), 60000)
    );

    // Try only the best 4 models - most reliable ones
    const modelsToTry = [
      "gemini-3.0-flash-preview",
      "gemini-2.5-flash",
      "gemini-2.5-pro",
      "gemini-2.5-flash-lite"
    ];
    let lastError: any = null;

    logger.info(`🔄 Elérhető Gemini modellek: ${modelsToTry.join(', ')}`);

    for (let i = 0; i < modelsToTry.length; i++) {
      const modelName = modelsToTry[i];
      try {
        logger.info(`🚀 Próbálkozás ${modelName} modellel... (${i + 1}/${modelsToTry.length})`);
        
        const apiCallPromise = ai.models.generateContent({
          model: modelName,
          contents: {
            parts: [
              { inlineData: { mimeType: "image/jpeg", data: base64Image } },
              { text: prompt }
            ]
          },
          config: {
            temperature: 0.1,
          }
        });

        const response: any = await Promise.race([apiCallPromise, timeoutPromise]);
        logger.success(`✅ Sikeres Gemini válasz ${modelName} modellel!`);
        logger.info(`🔑 Használt API kulcs: ${apiKey.substring(0, 6)}...${apiKey.substring(apiKey.length - 4)}`);
        
        const text = response.text;
        if (!text) throw new Error("Üres választ küldött az AI.");

        // Parse the response
        let rawData;
        try {
          const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
          rawData = JSON.parse(cleanText);
        } catch (parseError) {
          logger.warn("JSON parsing failed, creating basic structure", parseError);
          rawData = {
            title: "Feldolgozott feladat (szerkesztés szükséges)",
            instruction: "Kézi szerkesztés szükséges - az AI nem tudta feldolgozni a képet",
            type: "QUIZ",
            quizQuestions: [
              {
                question: "Kérdés 1 (szerkeszd át)?",
                options: ["A válasz", "B válasz", "C válasz"],
                correctOptionIndex: 0
              }
            ]
          };
        }
        
        logger.info("Gemini JSON feldolgozva", { title: rawData.title, type: rawData.type });
        
        // Add small delay after successful processing to avoid rate limits
        logger.info("⏳ Biztonsági várakozás (2mp)...");
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        return transformToInternalData(rawData);
        
      } catch (modelError: any) {
        logger.warn(`❌ ${modelName} model hiba:`, modelError.message);
        lastError = modelError;
        
        // Add delay before trying next model to avoid rate limits
        if (i < modelsToTry.length - 1) { // Don't wait after the last attempt
          logger.info("⏳ Várakozás 3 másodperc a következő model előtt...");
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
        
        // Continue to next model for any error (quota, rate limit, not found, etc.)
        continue;
      }
    }
    
    // If all models failed, throw the last error
    throw lastError || new Error("Minden Gemini model sikertelen volt");

  } catch (error: any) {
    logger.error("Hiba történt a Gemini elemzés során", { error: error.message, code: error?.status });
    console.error("Error analyzing image with Gemini:", error);
    
    // Better error messages for common issues
    if (error.message?.includes('API_KEY_INVALID')) {
      throw new Error("Hibás Gemini API kulcs! Ellenőrizd, hogy érvényes Gemini API kulcsot adtál-e meg.");
    } else if (error.message?.includes('QUOTA_EXCEEDED') || 
               error.message?.includes('RESOURCE_EXHAUSTED') || 
               error.message?.includes('429') ||
               error.message?.includes('Quota exceeded')) {
      throw new Error("🚫 Gemini API kvóta elfogyott!\n\n💡 Megoldások:\n• Várj 1-2 órát\n• Használj másik API kulcsot\n• Frissítsd a Google AI fiókod\n\n📖 Részletek: https://ai.google.dev/gemini-api/docs/rate-limits");
    } else if (error.message?.includes('RATE_LIMIT')) {
      throw new Error("Túl sok Gemini kérés! Várj 1-2 percet, majd próbáld újra.");
    } else if (error.message?.includes('Időtúllépés')) {
      throw new Error("Időtúllépés! A Google AI nem válaszolt időben. Próbáld újra.");
    } else if (error.message?.includes('NOT_FOUND')) {
      throw new Error("A kért Gemini model nem található. Próbálkozás másik modellel...");
    } else {
      throw new Error(`Gemini API hiba: ${error.message || 'Ismeretlen hiba történt'}`);
    }
  }
};

const analyzeWithGeminiPool = async (base64Image: string, apiKeys: string[], userHint?: string): Promise<ExerciseData> => {
  if (apiKeys.length === 0) {
    throw new Error("Nincs Gemini API kulcs a pool-ban!");
  }

  logger.info(`🔄 Gemini API Pool használata: ${apiKeys.length} kulcs elérhető`);

  let lastError: any = null;
  const keyResults: Array<{key: string, status: 'success' | 'quota' | 'invalid' | 'suspended' | 'leaked' | 'error', error?: string}> = [];
  const keysToRemove: string[] = []; // Track keys that should be removed
  
  for (let i = 0; i < apiKeys.length; i++) {
    const apiKey = apiKeys[i];
    const keyPreview = `${apiKey.substring(0, 6)}...${apiKey.substring(apiKey.length - 4)}`;
    
    try {
      logger.info(`🚀 Próbálkozás ${i + 1}/${apiKeys.length} kulccsal: ${keyPreview}`);
      
      const result = await analyzeWithGemini(base64Image, apiKey, userHint);
      
      keyResults.push({key: keyPreview, status: 'success'});
      logger.success(`✅ Sikeres válasz ${i + 1}. kulccsal: ${keyPreview}`);
      logger.info(`🎯 VÉGSŐ EREDMÉNY: Feldolgozás sikeres a(z) ${keyPreview} kulccsal!`);
      
      // Log final summary
      logger.info(`📊 Gemini kulcs összegzés:`, keyResults);
      
      return result;
      
    } catch (error: any) {
      logger.warn(`❌ ${i + 1}. kulcs (${keyPreview}) sikertelen: ${error.message}`);
      lastError = error;
      
      // Categorize the error
      let errorType: 'quota' | 'invalid' | 'suspended' | 'leaked' | 'error' = 'error';
      if (error.message?.includes('QUOTA_EXCEEDED') || 
          error.message?.includes('RESOURCE_EXHAUSTED') || 
          error.message?.includes('429') ||
          error.message?.includes('rate limit') ||
          error.message?.includes('Quota exceeded')) {
        errorType = 'quota';
        logger.info(`⏭️ Kvóta elfogyott, váltás következő kulcsra...`);
        
        // Add delay before trying next key
        if (i < apiKeys.length - 1) {
          logger.info("⏳ Várakozás 5 másodperc a következő kulcs előtt...");
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
      } else if (error.message?.includes('API_KEY_INVALID') || 
                 error.message?.includes('invalid') ||
                 error.message?.includes('Hibás Gemini API kulcs')) {
        errorType = 'invalid';
        keysToRemove.push(apiKey); // Mark for removal
        logger.info(`⏭️ Hibás kulcs (eltávolítva), próbálkozás következő kulccsal...`);
      } else if (error.message?.includes('CONSUMER_SUSPENDED') || error.message?.includes('suspended')) {
        errorType = 'suspended';
        keysToRemove.push(apiKey); // Mark for removal
        logger.info(`⏭️ Felfüggesztett kulcs (eltávolítva), próbálkozás következő kulccsal...`);
      } else if (error.message?.includes('leaked') || error.message?.includes('reported as leaked')) {
        errorType = 'leaked';
        keysToRemove.push(apiKey); // Mark for removal
        logger.info(`⏭️ Kiszivárgott kulcs (eltávolítva), próbálkozás következő kulccsal...`);
      } else {
        logger.info(`⏭️ Egyéb hiba, próbálkozás következő kulccsal...`);
      }
      
      keyResults.push({
        key: keyPreview, 
        status: errorType, 
        error: error.message?.substring(0, 100) + (error.message?.length > 100 ? '...' : '')
      });
      
      continue;
    }
  }
  
  // Clean up bad keys from localStorage
  if (keysToRemove.length > 0) {
    logger.info(`🧹 Hibás kulcsok eltávolítása: ${keysToRemove.length} kulcs`);
    
    // Get current keys from localStorage
    const currentSingleKey = localStorage.getItem('gemini_api_key');
    const currentPoolKeys = localStorage.getItem('gemini_api_keys');
    
    // Remove bad keys from single key
    if (currentSingleKey && keysToRemove.includes(currentSingleKey)) {
      localStorage.removeItem('gemini_api_key');
      logger.info(`🗑️ Hibás egyedi kulcs eltávolítva`);
    }
    
    // Remove bad keys from pool
    if (currentPoolKeys) {
      const cleanedKeys = currentPoolKeys.split('\n')
        .map(key => key.trim())
        .filter(key => key.length > 0 && !keysToRemove.includes(key));
      
      if (cleanedKeys.length > 0) {
        localStorage.setItem('gemini_api_keys', cleanedKeys.join('\n'));
        logger.info(`🧹 Pool tisztítva: ${currentPoolKeys.split('\n').length} → ${cleanedKeys.length} kulcs`);
      } else {
        localStorage.removeItem('gemini_api_keys');
        logger.info(`🗑️ Pool teljesen kiürítve (minden kulcs hibás volt)`);
      }
    }
  }
  
  // All keys failed - log detailed summary
  logger.error(`🚫 Minden Gemini kulcs (${apiKeys.length}) sikertelen volt!`);
  logger.error(`📊 Részletes Gemini kulcs összegzés:`, keyResults);
  
  // Create user-friendly summary
  const quotaKeys = keyResults.filter(r => r.status === 'quota').length;
  const invalidKeys = keyResults.filter(r => r.status === 'invalid').length;
  const suspendedKeys = keyResults.filter(r => r.status === 'suspended').length;
  const leakedKeys = keyResults.filter(r => r.status === 'leaked').length;
  const errorKeys = keyResults.filter(r => r.status === 'error').length;
  
  let summaryMessage = `🚫 Minden Gemini API kulcs sikertelen volt! (${apiKeys.length} kulcs próbálva)\n\n`;
  summaryMessage += `📊 Összegzés:\n`;
  if (quotaKeys > 0) summaryMessage += `• ${quotaKeys} kulcs: Kvóta elfogyott (várj 1-2 órát)\n`;
  if (suspendedKeys > 0) summaryMessage += `• ${suspendedKeys} kulcs: Felfüggesztett fiók (eltávolítva)\n`;
  if (leakedKeys > 0) summaryMessage += `• ${leakedKeys} kulcs: Kiszivárgott kulcs (eltávolítva)\n`;
  if (invalidKeys > 0) summaryMessage += `• ${invalidKeys} kulcs: Hibás/érvénytelen (eltávolítva)\n`;
  if (errorKeys > 0) summaryMessage += `• ${errorKeys} kulcs: Egyéb hiba\n`;
  summaryMessage += `\n💡 Megoldások:\n`;
  summaryMessage += `• Várj 1-2 órát (kvóta reset)\n`;
  summaryMessage += `• Szerezz be új, érvényes Gemini API kulcsokat\n`;
  summaryMessage += `• Ellenőrizd a Google AI Studio fiókod állapotát`;
  
  if (keysToRemove.length > 0) {
    summaryMessage += `\n\n🧹 ${keysToRemove.length} hibás kulcs automatikusan eltávolítva!`;
  }
  
  throw lastError || new Error(summaryMessage);
};

const transformToInternalData = (raw: any): ExerciseData => {
  const type = raw.type as ExerciseType;
  let content: any = {};

  if (type === ExerciseType.MATCHING) {
    content = {
      pairs: raw.matchingPairs?.map((p: any, index: number) => ({
        id: `pair-${index}`,
        left: p.left,
        right: p.right
      })) || []
    };
  } else if (type === ExerciseType.CATEGORIZATION) {
    const categories = raw.categories?.map((c: string, i: number) => ({
      id: `cat-${i}`,
      name: c
    })) || [];
    
    content = {
      categories,
      items: raw.categorizationItems?.map((item: any, i: number) => {
        const cat = categories.find((c: any) => c.name === item.categoryName);
        return {
          id: `item-${i}`,
          text: item.text,
          categoryId: cat ? cat.id : categories[0]?.id // Fallback
        };
      }) || []
    };
  } else {
    // Quiz or default
    content = {
      questions: raw.quizQuestions?.map((q: any, i: number) => ({
        id: `q-${i}`,
        question: q.question,
        options: q.options,
        correctIndex: q.correctOptionIndex
      })) || []
    };
  }

  return {
    title: raw.title,
    instruction: raw.instruction,
    type,
    content,
    boundingBox: raw.boundingBox
  };
};