export interface FoodItem {
  name: string;
  approxCalories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface MacroNutrients {
  protein: number;
  carbs: number;
  fat: number;
}

export interface NutritionAnalysis {
  totalCalories: number;
  macros: MacroNutrients;
  foodItems: FoodItem[];
  summary: string;
}

export interface MealEntry {
  id: string;
  name: string;
  calories: number;
  timestamp: Date;
  imageSrc: string | null;
  macros: MacroNutrients;
}

export enum AppState {
  IDLE = 'IDLE',
  CAMERA = 'CAMERA',
  ANALYZING = 'ANALYZING',
  RESULTS = 'RESULTS',
  ERROR = 'ERROR'
}