import { GoogleGenAI } from "@google/genai";
import { NutritionAnalysis } from "../types";

export const analyzeFoodImage = async (base64Image: string, isEnhanced: boolean = false): Promise<NutritionAnalysis> => {
  // Retrieve API Key: Prioritize process.env.API_KEY (standard) but fallback to VITE_API_KEY
  const apiKey = process.env.API_KEY || process.env.VITE_API_KEY;

  if (!apiKey) {
    throw new Error("API Key is missing. Please ensure API_KEY or VITE_API_KEY is set in your environment.");
  }

  // Initialize the API client with the key using the new SDK
  const ai = new GoogleGenAI({ apiKey: apiKey });

  // Extract mime type if available, default to image/jpeg
  const mimeTypeMatch = base64Image.match(/^data:(image\/\w+);base64,/);
  const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : "image/jpeg";

  // Remove data URL prefix if present to get just the base64 string
  // Also remove any whitespace (newlines) that might have crept in
  const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "").replace(/\s/g, "");

  try {
    const schemaDescription = `
      Return a JSON object with the following structure:
      {
        "totalCalories": number,
        "macros": {
          "protein": number (grams),
          "carbs": number (grams),
          "fat": number (grams)
        },
        "foodItems": [
          {
            "name": string,
            "approxCalories": number,
            "protein": number,
            "carbs": number,
            "fat": number
          }
        ],
        "summary": string (1-2 sentences)
      }
      Ensure all numeric values are numbers, not strings.
    `;

    let promptText = `Analyze this image of food. Identify the items and provide a nutritional breakdown. ${schemaDescription} Be realistic with portion sizes based on the image.`;

    if (isEnhanced) {
      promptText = `Conduct a deep, meticulous nutritional analysis of this food image. Break down complex dishes into individual ingredients, carefully estimating portion sizes and hidden calories (oils, sauces, dressings). ${schemaDescription} Provide a precise calculation of total calories and macros.`;
    }

    // Using gemini-2.0-flash-exp as it is a stable multimodal model available in the free tier
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Data
            }
          },
          {
            text: promptText
          }
        ]
      },
      config: {
        responseMimeType: 'application/json',
      }
    });

    const text = response.text;

    if (!text) {
      throw new Error("No response received from Gemini.");
    }

    // Clean up potential markdown code blocks if the model adds them despite MIME type
    const jsonString = text.replace(/```json\n|\n```/g, "").trim();
    const data = JSON.parse(jsonString) as NutritionAnalysis;
    return data;

  } catch (error: any) {
    console.error("Error analyzing image:", error);
    // Propagate the specific error message to the UI
    throw new Error(error.message || "Failed to analyze image with AI.");
  }
};