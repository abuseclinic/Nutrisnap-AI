import { GoogleGenAI, Type } from "@google/genai";
import { NutritionAnalysis } from "../types";

// Check for API key availability
const apiKey = process.env.API_KEY;
if (!apiKey) {
  console.error("API_KEY is missing. Please ensure it is set in your environment variables.");
}

// Initialize the API with the new SDK class
const ai = new GoogleGenAI({ apiKey: apiKey || "" });

// Define schema using Type from @google/genai
const nutritionSchema = {
  type: Type.OBJECT,
  properties: {
    totalCalories: {
      type: Type.NUMBER,
      description: "The total estimated calories in the meal.",
    },
    macros: {
      type: Type.OBJECT,
      properties: {
        protein: { type: Type.NUMBER, description: "Total protein in grams." },
        carbs: { type: Type.NUMBER, description: "Total carbohydrates in grams." },
        fat: { type: Type.NUMBER, description: "Total fat in grams." },
      },
      required: ["protein", "carbs", "fat"],
    },
    foodItems: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: "Name of the food item." },
          approxCalories: { type: Type.NUMBER, description: "Approximate calories for this item." },
          protein: { type: Type.NUMBER, description: "Protein in grams for this item." },
          carbs: { type: Type.NUMBER, description: "Carbohydrates in grams for this item." },
          fat: { type: Type.NUMBER, description: "Fat in grams for this item." },
        },
        required: ["name", "approxCalories", "protein", "carbs", "fat"],
      },
    },
    summary: {
      type: Type.STRING,
      description: "A short, friendly summary of the meal's nutritional value (1-2 sentences).",
    },
  },
  required: ["totalCalories", "macros", "foodItems", "summary"],
};

export const analyzeFoodImage = async (base64Image: string): Promise<NutritionAnalysis> => {
  if (!apiKey) {
    throw new Error("API Key is missing. Please check your app configuration.");
  }

  // Extract mime type if available, default to image/jpeg
  const mimeTypeMatch = base64Image.match(/^data:(image\/\w+);base64,/);
  const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : "image/jpeg";

  // Remove data URL prefix if present to get just the base64 string
  const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "");
  
  try {
    // Use gemini-2.5-flash-latest for robust multimodal analysis
    const prompt = "Analyze this image of food. Identify the items and provide a nutritional breakdown including total calories and macros (protein, carbs, fat). Be realistic with portion sizes based on the image.";

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-latest",
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType,
            },
          },
          {
            text: prompt,
          },
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: nutritionSchema,
        // Optional: reduce safety settings to avoid false positives on food images
        // safetySettings: [ ... ] 
      },
    });

    const text = response.text;

    if (!text) {
      throw new Error("No response received from Gemini.");
    }

    const data = JSON.parse(text) as NutritionAnalysis;
    return data;

  } catch (error) {
    console.error("Error analyzing image:", error);
    throw error;
  }
};