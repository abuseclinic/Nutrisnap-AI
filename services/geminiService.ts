import { GoogleGenAI, Type, Schema } from "@google/genai";
import { NutritionAnalysis } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const nutritionSchema: Schema = {
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
  // Remove data URL prefix if present to get just the base64 string
  const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "");
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Data,
            },
          },
          {
            text: "Analyze this image of food. Identify the items and provide a nutritional breakdown including total calories and macros (protein, carbs, fat). Be realistic with portion sizes based on the image.",
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: nutritionSchema,
        systemInstruction: "You are an expert nutritionist. Analyze food images accurately. If the image is not food, return 0 for all values and a summary stating that no food was detected.",
      },
    });

    const jsonText = response.text;
    if (!jsonText) {
      throw new Error("No response received from Gemini.");
    }

    const data = JSON.parse(jsonText) as NutritionAnalysis;
    return data;

  } catch (error) {
    console.error("Error analyzing image:", error);
    throw error;
  }
};