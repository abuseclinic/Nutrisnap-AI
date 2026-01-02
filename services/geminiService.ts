import { GoogleGenAI, Type } from "@google/genai";
import { NutritionAnalysis } from "../types";

// Access the environment variable using Vite's syntax (import.meta.env)
const apiKey = import.meta.env.VITE_GEMINI_KEY;

// Initialize the Google GenAI client instance
const ai = new GoogleGenAI(apiKey);

// Define the structured output schema
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
  // Determine MIME type (default to image/jpeg)
  const mimeTypeMatch = base64Image.match(/^data:(image\/\w+);base64,/);
  const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : "image/jpeg";

  // Remove the data URL prefix to get raw base64 string
  const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "");

  try {
    const prompt = "Analyze this image of food. Identify the items and provide a nutritional breakdown including total calories and macros (protein, carbs, fat). Be realistic with portion sizes based on the image.";

    // Initialize the model with the correct version and configuration
    const model = ai.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: nutritionSchema,
      },
    });

    // Generate content using the prompt and the base64 image
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
