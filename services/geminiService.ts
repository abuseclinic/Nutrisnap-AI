import { GoogleGenAI } from "@google/genai";
import { NutritionAnalysis } from "../types";

// PASTIKAN NAMA VARIABEL INI SAMA PERSIS DENGAN DI VERCEL / .ENV
const apiKey = import.meta.env.VITE_GEMINI_KEY;

// Cek jika API Key kosong (untuk debugging)
if (!apiKey) {
  console.error("CRITICAL: API Key is missing! Check your environment variable.");
}

const ai = new GoogleGenAI(apiKey);

// Schema menggunakan String biasa agar aman dari error import
const nutritionSchema = {
  type: "object",
  properties: {
    totalCalories: {
      type: "number",
      description: "The total estimated calories in the meal.",
    },
    macros: {
      type: "object",
      properties: {
        protein: { type: "number", description: "Total protein in grams." },
        carbs: { type: "number", description: "Total carbohydrates in grams." },
        fat: { type: "number", description: "Total fat in grams." },
      },
      required: ["protein", "carbs", "fat"],
    },
    foodItems: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string", description: "Name of the food item." },
          approxCalories: { type: "number", description: "Approximate calories for this item." },
          protein: { type: "number", description: "Protein in grams for this item." },
          carbs: { type: "number", description: "Carbohydrates in grams for this item." },
          fat: { type: "number", description: "Fat in grams for this item." },
        },
        required: ["name", "approxCalories", "protein", "carbs", "fat"],
      },
    },
    summary: {
      type: "string",
      description: "A short, friendly summary of the meal's nutritional value (1-2 sentences).",
    },
  },
  required: ["totalCalories", "macros", "foodItems", "summary"],
};

export const analyzeFoodImage = async (base64Image: string): Promise<NutritionAnalysis> => {
  const mimeTypeMatch = base64Image.match(/^data:(image\/\w+);base64,/);
  const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : "image/jpeg";
  const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "");

  try {
    const prompt = "Analyze this image of food. Identify the items and provide a nutritional breakdown including total calories and macros (protein, carbs, fat). Be realistic with portion sizes based on the image.";

    const model = ai.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: nutritionSchema,
      },
    });

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Data,
          mimeType: mimeType,
        },
      },
    ]);

    const response = result.response;
    const text = response.text();

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
