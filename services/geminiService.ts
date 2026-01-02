import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { NutritionAnalysis } from "../types";

// Gunakan VITE_ prefix agar terbaca oleh Vite di Vercel
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || "");

const nutritionSchema = {
  type: SchemaType.OBJECT,
  properties: {
    totalCalories: { type: SchemaType.NUMBER },
    macros: {
      type: SchemaType.OBJECT,
      properties: {
        protein: { type: SchemaType.NUMBER },
        carbs: { type: SchemaType.NUMBER },
        fat: { type: SchemaType.NUMBER },
      },
      required: ["protein", "carbs", "fat"],
    },
    foodItems: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          name: { type: SchemaType.STRING },
          approxCalories: { type: SchemaType.NUMBER },
          protein: { type: SchemaType.NUMBER },
          carbs: { type: SchemaType.NUMBER },
          fat: { type: SchemaType.NUMBER },
        },
        required: ["name", "approxCalories"],
      },
    },
    summary: { type: SchemaType.STRING },
  },
  required: ["totalCalories", "macros", "foodItems", "summary"],
};

export const analyzeFoodImage = async (base64Image: string): Promise<NutritionAnalysis> => {
  const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "");
  
  try {
    // Gunakan model gemini-1.5-flash
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: nutritionSchema,
      },
    });

    const result = await model.generateContent([
      "Analyze this food image and provide nutrition data in JSON.",
      { inlineData: { data: base64Data, mimeType: "image/jpeg" } },
    ]);

    const response = await result.response;
    return JSON.parse(response.text()) as NutritionAnalysis;
  } catch (error) {
    console.error("Analysis Error:", error);
    throw error;
  }
};
