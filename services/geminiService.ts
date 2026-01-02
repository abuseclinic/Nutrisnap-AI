import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { NutritionAnalysis } from "../types";

// Gunakan VITE_ agar terbaca oleh Vite dan Vercel
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || "");

const nutritionSchema = {
  type: SchemaType.OBJECT,
  properties: {
    totalCalories: {
      type: SchemaType.NUMBER,
      description: "The total estimated calories in the meal.",
    },
    macros: {
      type: SchemaType.OBJECT,
      properties: {
        protein: { type: SchemaType.NUMBER, description: "Total protein in grams." },
        carbs: { type: SchemaType.NUMBER, description: "Total carbohydrates in grams." },
        fat: { type: SchemaType.NUMBER, description: "Total fat in grams." },
      },
      required: ["protein", "carbs", "fat"],
    },
    foodItems: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          name: { type: SchemaType.STRING, description: "Name of the food item." },
          approxCalories: { type: SchemaType.NUMBER, description: "Approximate calories for this item." },
          protein: { type: SchemaType.NUMBER, description: "Protein in grams for this item." },
          carbs: { type: SchemaType.NUMBER, description: "Carbohydrates in grams for this item." },
          fat: { type: SchemaType.NUMBER, description: "Fat in grams for this item." },
        },
        required: ["name", "approxCalories", "protein", "carbs", "fat"],
      },
    },
    summary: {
      type: SchemaType.STRING,
      description: "A short, friendly summary of the meal's nutritional value.",
    },
  },
  required: ["totalCalories", "macros", "foodItems", "summary"],
};

export const analyzeFoodImage = async (base64Image: string): Promise<NutritionAnalysis> => {
  const mimeTypeMatch = base64Image.match(/^data:(image\/\w+);base64,/);
  const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : "image/jpeg";
  const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "");
  
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: nutritionSchema,
      },
    });

    const prompt = "Analyze this image of food and provide nutritional breakdown.";

    const result = await model.generateContent([
      { text: prompt },
      {
        inlineData: {
          mimeType: mimeType,
          data: base64Data,
        },
      },
    ]);

    const response = await result.response;
    return JSON.parse(response.text()) as NutritionAnalysis;

  } catch (error) {
    console.error("Error analyzing image:", error);
    throw error;
  }
};
