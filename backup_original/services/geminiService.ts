
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
  // 1. Get API Key
  let apiKey = typeof localStorage !== 'undefined' ? localStorage.getItem('gemini_api_key') : null;

  // Fallback checks
  if (!apiKey && typeof process !== 'undefined' && process.env && process.env.API_KEY) {
      apiKey = process.env.API_KEY;
  }
  
  if (!apiKey) {
    logger.error("API Kulcs hiányzik!");
    throw new Error("API Key not found. Kérlek állítsd be a kulcsot a Beállítások (Fogaskerék) menüben!");
  }

  logger.info("Gemini API hívás indítása...", { keyLength: apiKey.length, hasHint: !!userHint });

  const ai = new GoogleGenAI({ apiKey });

  let prompt = `
    You are an expert educational assistant for Hungarian students.
    Task: Analyze the provided image of a textbook or workbook exercise and convert it into a structured JSON format.
    
    CRITICAL RULES:
    1. **VERBATIM EXTRACTION**: Extract text EXACTLY as it appears in the image.
    2. **LANGUAGE**: The output must be in HUNGARIAN.
    
    Task Types: MATCHING, CATEGORIZATION, QUIZ.
  `;

  if (userHint) {
    prompt += `\n\nIMPORTANT USER HINT/CORRECTION: The user states: "${userHint}". Please adjust your analysis to strictly follow this instruction (e.g. change exercise type or fix text).`;
  }

  try {
    // Add 60s timeout
    const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Időtúllépés: A Google AI nem válaszolt 60 másodpercen belül.")), 60000)
    );

    const apiCallPromise = ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          { inlineData: { mimeType: "image/jpeg", data: base64Image } }, // Assume JPEG if compressed
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: exerciseSchema,
        temperature: 0.1,
      }
    });

    const response: any = await Promise.race([apiCallPromise, timeoutPromise]);

    logger.success("API Válasz megérkezett");
    const text = response.text;
    if (!text) throw new Error("Üres választ küldött az AI.");

    const rawData = JSON.parse(text);
    logger.info("JSON feldolgozva", { title: rawData.title, type: rawData.type });
    
    return transformToInternalData(rawData);

  } catch (error: any) {
    logger.error("Hiba történt az elemzés során", { error: error.message, code: error?.status });
    console.error("Error analyzing image:", error);
    throw error;
  }
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
