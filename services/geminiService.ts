import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { NutritionAnalysis } from "../types";

// Define schema using SchemaType from @google/generative-ai
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
      description: "A short, friendly summary of the meal's nutritional value (1-2 sentences).",
    },
  },
  required: ["totalCalories", "macros", "foodItems", "summary"],
};

export const analyzeFoodImage = async (base64Image: string): Promise<NutritionAnalysis> => {
  // Retrieve API Key from environment variables
  // Based on vite.config.ts, process.env.API_KEY is replaced during build with the actual env var
  const apiKey = process.env.API_KEY;

  if (!apiKey || apiKey === "undefined" || apiKey.includes("your_api_key_here")) {
    console.error("API Key check failed. Value:", apiKey);
    throw new Error("API Key is missing or invalid. Please check your Vercel environment variables.");
  }

  // Initialize the API client with the key using the older SDK class
  const genAI = new GoogleGenerativeAI(apiKey);

  // Extract mime type if available, default to image/jpeg
  const mimeTypeMatch = base64Image.match(/^data:(image\/\w+);base64,/);
  const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : "image/jpeg";

  // Remove data URL prefix if present to get just the base64 string
  const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "");
  
  try {
    // Get the model (using gemini-1.5-flash as a stable, widely available model)
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: nutritionSchema,
      },
    });

    const prompt = "Analyze this image of food. Identify the items and provide a nutritional breakdown including total calories and macros (protein, carbs, fat). Be realistic with portion sizes based on the image.";

    // Generate content using the older SDK structure (array of parts)
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Data,
          mimeType: mimeType,
        },
      },
    ]);

    const response = await result.response;
    const text = response.text();

    if (!text) {
      throw new Error("No response received from Gemini.");
    }

    const data = JSON.parse(text) as NutritionAnalysis;
    return data;

  } catch (error: any) {
    console.error("Error analyzing image:", error);
    // Propagate the specific error message to the UI
    throw new Error(error.message || "Failed to analyze image with AI.");
  }
};