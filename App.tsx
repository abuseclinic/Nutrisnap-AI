import React, { useState, useRef } from 'react';
import { ChevronRight, ChevronDown, Utensils, Award, Info, RefreshCw, Pencil, Check, X, ArrowLeft, Share2, PlusCircle, Droplets, Weight, Minus, Plus, User, Calendar, Trash2, Sparkles } from 'lucide-react';
import { AppState, NutritionAnalysis, MacroNutrients, MealEntry, FoodItem } from './types';
import { analyzeFoodImage } from './services/geminiService';
import NutritionChart from './components/NutritionChart';
import LoadingScreen from './components/LoadingScreen';
import CameraComponent from './components/Camera';
import Dashboard from './components/Dashboard';

// Mock initial data
const INITIAL_MEALS: MealEntry[] = [];

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(AppState.IDLE);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<NutritionAnalysis | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');
  
  // Dashboard Data
  const [recentMeals, setRecentMeals] = useState<MealEntry[]>(INITIAL_MEALS);
  
  // Tracker State
  const [waterGlasses, setWaterGlasses] = useState(3);
  const [waterGoal, setWaterGoal] = useState(8);
  const [currentWeight, setCurrentWeight] = useState(72.5);
  const [activeModal, setActiveModal] = useState<'water' | 'weight' | 'settings' | 'suggestion' | null>(null);
  
  // Profile State
  const [userProfile, setUserProfile] = useState({
    gender: 'female' as 'male' | 'female',
    age: 24,
    birthday: '1999-05-15'
  });
  
  // Editing state
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<NutritionAnalysis | null>(null);
  
  // UI State
  const [isItemsExpanded, setIsItemsExpanded] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Derived Stats for Dashboard
  const totalCaloriesToday = recentMeals
    .filter(m => m.timestamp.getDate() === new Date().getDate())
    .reduce((sum, item) => sum + item.calories, 0);

  const totalMacrosToday = recentMeals
    .filter(m => m.timestamp.getDate() === new Date().getDate())
    .reduce((acc, item) => ({
      protein: acc.protein + item.macros.protein,
      carbs: acc.carbs + item.macros.carbs,
      fat: acc.fat + item.macros.fat
    }), { protein: 0, carbs: 0, fat: 0 });

  // Generate Smart Insight based on macros
  const getSmartInsight = () => {
    // Logic: If protein is low (< 50g so far today), show protein suggestion
    if (totalMacrosToday.protein < 50) {
      return {
        title: "AI Suggestion",
        text: "You are low on protein today. Try adding",
        highlight: "Greek yogurt",
        suffix: "to your snack."
      };
    }
    // Logic: If carbs are high (> 200g), show carb warning
    if (totalMacrosToday.carbs > 200) {
      return {
        title: "Diet Balance",
        text: "Carb intake is high. Consider a",
        highlight: "low-carb dinner",
        suffix: "like grilled chicken."
      };
    }
    // Default positive reinforcement
    return {
      title: "On Track",
      text: "Great job! You're hitting your goals. Stay",
      highlight: "hydrated",
      suffix: "for better recovery."
    };
  };

  const insight = getSmartInsight();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setImageSrc(result);
        startAnalysis(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCameraCapture = (capturedImage: string) => {
    setImageSrc(capturedImage);
    setState(AppState.IDLE); // Close camera view
    startAnalysis(capturedImage);
  };

  const startAnalysis = async (image: string) => {
    setState(AppState.ANALYZING);
    setErrorMsg('');
    try {
      const result = await analyzeFoodImage(image);
      setAnalysis(result);
      setState(AppState.RESULTS);
      setIsItemsExpanded(false); // Reset expansion on new analysis
    } catch (err: any) {
      console.error(err);
      // Display the actual error message if available
      setErrorMsg(err.message || "Failed to analyze image. Please try again with a clearer photo.");
      setState(AppState.ERROR);
    }
  };

  const resetApp = () => {
    setState(AppState.IDLE);
    setImageSrc(null);
    setAnalysis(null);
    setErrorMsg('');
    setIsEditing(false);
    setEditForm(null);
    setIsItemsExpanded(false);
  };

  const addToLog = () => {
    if (analysis && imageSrc) {
      const newMeal: MealEntry = {
        id: Date.now().toString(),
        name: analysis.foodItems.length > 0 ? analysis.foodItems[0].name : 'Unknown Meal',
        calories: analysis.totalCalories,
        timestamp: new Date(),
        imageSrc: imageSrc,
        macros: analysis.macros
      };
      setRecentMeals([newMeal, ...recentMeals]);
      resetApp();
    }
  };

  const handleQuickAddSuggestion = () => {
    const currentInsight = getSmartInsight();
    
    // Determine macros based on the suggestion type (simple heuristics for demo)
    let macros = { protein: 5, carbs: 5, fat: 5 };
    let cals = 100;
    
    if (currentInsight.highlight.toLowerCase().includes("yogurt")) {
       macros = { protein: 15, carbs: 6, fat: 0 };
       cals = 90;
    } else if (currentInsight.highlight.toLowerCase().includes("low-carb")) {
       macros = { protein: 30, carbs: 5, fat: 10 };
       cals = 250;
    }

    const newMeal: MealEntry = {
      id: Date.now().toString(),
      name: `Quick Add: ${currentInsight.highlight}`,
      calories: cals,
      timestamp: new Date(),
      imageSrc: null,
      macros: macros
    };
    setRecentMeals([newMeal, ...recentMeals]);
    setActiveModal(null);
  };

  const handleStartEdit = () => {
    if (analysis) {
      setEditForm(JSON.parse(JSON.stringify(analysis))); // Deep copy
      setIsEditing(true);
      setIsItemsExpanded(true); // Auto-expand items when editing
    }
  };

  const handleSaveEdit = () => {
    if (editForm) {
      setAnalysis(editForm);
      setIsEditing(false);
      setEditForm(null);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditForm(null);
  };

  const handleEditChange = (field: string, value: string, nestedField?: keyof MacroNutrients) => {
    if (!editForm) return;
    const numValue = parseFloat(value) || 0;

    if (field === 'totalCalories') {
      setEditForm({ ...editForm, totalCalories: numValue });
    } else if (field === 'macros' && nestedField) {
      setEditForm({
        ...editForm,
        macros: {
          ...editForm.macros,
          [nestedField]: numValue
        }
      });
    }
  };

  const handleFoodItemChange = (index: number, field: keyof FoodItem, value: string) => {
    if (!editForm) return;
    const newItems = [...editForm.foodItems];
    const numValue = parseFloat(value);
    
    if (field === 'name') {
      newItems[index] = { ...newItems[index], name: value };
    } else {
      newItems[index] = { ...newItems[index], [field]: isNaN(numValue) ? 0 : numValue };
    }
    
    setEditForm({ ...editForm, foodItems: newItems });
  };

  const deleteFoodItem = (index: number) => {
    if (!editForm) return;
    const newItems = editForm.foodItems.filter((_, i) => i !== index);
    setEditForm({ ...editForm, foodItems: newItems });
  };

  const addFoodItem = () => {
    if (!editForm) return;
    const newItem: FoodItem = { name: 'New Item', approxCalories: 0, protein: 0, carbs: 0, fat: 0 };
    setEditForm({ ...editForm, foodItems: [...editForm.foodItems, newItem] });
  };

  const handleShare = async () => {
    const dataToShare = isEditing && editForm ? editForm : analysis;
    if (!dataToShare) return;

    const shareText = `🍽️ NutriSnap Analysis\n\n` +
      `🔥 Calories: ${dataToShare.totalCalories} kcal\n` +
      `💪 Protein: ${dataToShare.macros.protein}g\n` +
      `🍞 Carbs: ${dataToShare.macros.carbs}g\n` +
      `🥑 Fat: ${dataToShare.macros.fat}g\n\n` +
      `📝 ${dataToShare.summary}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'NutriSnap Meal Analysis',
          text: shareText,
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      // Fallback for browsers without Web Share API
      try {
        await navigator.clipboard.writeText(shareText);
        alert('Analysis copied to clipboard!');
      } catch (err) {
        console.error('Failed to copy: ', err);
      }
    }
  };

  // --- Modals ---

  const renderModals = () => {
    if (!activeModal) return null;

    let title = '';
    if (activeModal === 'water') title = 'Hydration';
    else if (activeModal === 'weight') title = 'Weight Log';
    else if (activeModal === 'settings') title = 'Profile Settings';
    else if (activeModal === 'suggestion') title = 'AI Recommendation';

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 w-full max-w-sm shadow-2xl scale-100 animate-in zoom-in-95 duration-200 transition-colors" onClick={(e) => e.stopPropagation()}>
          
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h3>
            <button onClick={() => setActiveModal(null)} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
              <X size={20} className="text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          {/* Water Content */}
          {activeModal === 'water' && (
            <div className="flex flex-col items-center w-full">
              <div className="w-32 h-32 bg-blue-50 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-6 relative overflow-hidden">
                 <Droplets size={48} className="text-blue-500 z-10" />
                 <div className="absolute bottom-0 w-full bg-blue-100 dark:bg-blue-600/50 transition-all duration-500" style={{ height: `${Math.min((waterGlasses / waterGoal) * 100, 100)}%` }}></div>
              </div>
              
              <div className="flex items-center justify-center gap-6 mb-8 w-full">
                <button 
                  onClick={() => setWaterGlasses(Math.max(0, waterGlasses - 1))}
                  className="w-12 h-12 rounded-full border-2 border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-400 hover:border-blue-500 hover:text-blue-500 transition-colors"
                >
                  <Minus size={24} />
                </button>
                <div className="text-center w-24">
                  <span className="text-4xl font-bold text-gray-900 dark:text-white">{waterGlasses}</span>
                  <p className="text-xs text-gray-400 dark:text-gray-500 font-medium">of {waterGoal} glasses</p>
                </div>
                <button 
                  onClick={() => setWaterGlasses(waterGlasses + 1)}
                  className="w-12 h-12 rounded-full bg-blue-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/30 hover:bg-blue-600 transition-colors"
                >
                  <Plus size={24} />
                </button>
              </div>

              {/* Goal Setting Section */}
               <div className="w-full bg-gray-50 dark:bg-gray-800 rounded-xl p-4 mb-4 flex items-center justify-between">
                <div className="flex flex-col text-left">
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Daily Goal</span>
                  <span className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wide">Target Intake</span>
                </div>
                <div className="flex items-center gap-3 bg-white dark:bg-gray-700 rounded-lg p-1 border border-gray-100 dark:border-gray-600">
                   <button 
                     onClick={() => setWaterGoal(Math.max(1, waterGoal - 1))}
                     className="w-8 h-8 rounded-md flex items-center justify-center text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600 hover:text-blue-500 transition-colors"
                   >
                     <Minus size={16} />
                   </button>
                   <span className="text-sm font-bold text-gray-900 dark:text-white w-6 text-center">{waterGoal}</span>
                   <button 
                     onClick={() => setWaterGoal(waterGoal + 1)}
                     className="w-8 h-8 rounded-md flex items-center justify-center text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600 hover:text-blue-500 transition-colors"
                   >
                     <Plus size={16} />
                   </button>
                </div>
              </div>
              
              <button 
                onClick={() => setActiveModal(null)}
                className="w-full py-3.5 bg-gray-900 dark:bg-primary text-white rounded-xl font-semibold hover:opacity-90 transition-opacity"
              >
                Save Progress
              </button>
            </div>
          )}

          {/* Weight Content */}
          {activeModal === 'weight' && (
            <div className="flex flex-col items-center w-full">
              <div className="w-full bg-gray-50 dark:bg-gray-800 rounded-2xl p-6 mb-6 flex flex-col items-center">
                 <Weight size={32} className="text-purple-500 mb-2" />
                 <div className="flex items-baseline gap-1">
                   <input 
                    type="number" 
                    value={currentWeight}
                    onChange={(e) => setCurrentWeight(parseFloat(e.target.value))}
                    className="text-4xl font-bold text-gray-900 dark:text-white bg-transparent text-center w-24 outline-none border-b-2 border-purple-200 dark:border-purple-800 focus:border-purple-500 transition-colors"
                   />
                   <span className="text-gray-400 dark:text-gray-500 font-medium">kg</span>
                 </div>
              </div>

              <button 
                onClick={() => setActiveModal(null)}
                className="w-full py-3.5 bg-gray-900 dark:bg-primary text-white rounded-xl font-semibold hover:bg-gray-800 transition-colors"
              >
                Update Weight
              </button>
            </div>
          )}

          {/* Suggestion Content */}
          {activeModal === 'suggestion' && (
            <div className="flex flex-col gap-6 items-center text-center">
              <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mb-2 animate-pulse-slow">
                <Sparkles size={40} className="text-indigo-500 dark:text-indigo-400" />
              </div>
              
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{insight.title}</h3>
                <p className="text-gray-500 dark:text-gray-400 leading-relaxed">
                  {insight.text} <span className="font-bold text-indigo-600 dark:text-indigo-400">{insight.highlight}</span> {insight.suffix}
                </p>
              </div>

              <div className="bg-indigo-50/50 dark:bg-indigo-900/20 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800 w-full text-left flex items-center gap-4 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors cursor-pointer" onClick={handleQuickAddSuggestion}>
                <div className="w-12 h-12 bg-white dark:bg-gray-800 rounded-lg flex items-center justify-center shadow-sm text-2xl border border-indigo-100 dark:border-gray-700">
                   🥗
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-gray-900 dark:text-white">{insight.highlight}</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Tap to quick add • Est. Calories</p>
                </div>
                 <button 
                  className="p-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors shadow-md shadow-indigo-200 dark:shadow-none"
                 >
                   <Plus size={20} />
                 </button>
              </div>

              <button 
                onClick={() => setActiveModal(null)}
                className="w-full py-3.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                Maybe Later
              </button>
            </div>
          )}

          {/* Settings Content */}
          {activeModal === 'settings' && (
            <div className="flex flex-col gap-6">
              
              {/* Gender */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Gender</label>
                <div className="flex gap-4">
                  <button 
                    onClick={() => setUserProfile({...userProfile, gender: 'male'})}
                    className={`flex-1 py-3 rounded-xl border-2 flex items-center justify-center gap-2 transition-all ${userProfile.gender === 'male' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'border-gray-200 dark:border-gray-700 text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'}`}
                  >
                    <User size={20} />
                    <span className="font-medium">Male</span>
                  </button>
                  <button 
                    onClick={() => setUserProfile({...userProfile, gender: 'female'})}
                    className={`flex-1 py-3 rounded-xl border-2 flex items-center justify-center gap-2 transition-all ${userProfile.gender === 'female' ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400' : 'border-gray-200 dark:border-gray-700 text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'}`}
                  >
                     <User size={20} />
                     <span className="font-medium">Female</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Age */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                    <Calendar size={14} /> Age
                  </label>
                  <div className="relative">
                    <input 
                      type="number" 
                      value={userProfile.age}
                      onChange={(e) => setUserProfile({...userProfile, age: parseInt(e.target.value) || 0})}
                      className="w-full p-3 bg-gray-50 dark:bg-gray-800 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 text-gray-800 dark:text-white font-semibold"
                    />
                  </div>
                </div>
                
                {/* Weight */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                    <Weight size={14} /> Weight
                  </label>
                  <div className="relative">
                    <input 
                      type="number" 
                      value={currentWeight}
                      onChange={(e) => setCurrentWeight(parseFloat(e.target.value) || 0)}
                      className="w-full p-3 bg-gray-50 dark:bg-gray-800 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 text-gray-800 dark:text-white font-semibold"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-medium">kg</span>
                  </div>
                </div>
              </div>

              {/* Birthday */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Birthday</label>
                <input 
                  type="date" 
                  value={userProfile.birthday}
                  onChange={(e) => setUserProfile({...userProfile, birthday: e.target.value})}
                  className="w-full p-3 bg-gray-50 dark:bg-gray-800 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 text-gray-800 dark:text-white font-semibold text-sm"
                />
              </div>

              <button 
                onClick={() => setActiveModal(null)}
                className="w-full py-3.5 bg-gray-900 dark:bg-primary text-white rounded-xl font-semibold mt-2"
              >
                Save Profile
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  // --- Views ---

  // Replaced RenderIdle with Dashboard
  const renderDashboard = () => (
    <div className="h-full relative">
       <Dashboard 
         onScan={() => setState(AppState.CAMERA)}
         onUpload={() => fileInputRef.current?.click()}
         onWaterClick={() => setActiveModal('water')}
         onWeightClick={() => setActiveModal('weight')}
         onSettingsClick={() => setActiveModal('settings')}
         onInsightClick={() => setActiveModal('suggestion')}
         recentMeals={recentMeals}
         totalCalories={totalCaloriesToday}
         dailyGoal={2200}
         macros={totalMacrosToday}
         insight={insight}
       />
       
       {/* Upload FAB (Floating Action Button) if user prefers uploading over scanning from dashboard */}
       <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileUpload}
       />
    </div>
  );

  const renderResults = () => {
    if (!analysis) return null;
    
    const displayData = isEditing && editForm ? editForm : analysis;

    return (
      <div className="h-full bg-gray-50 dark:bg-gray-950 flex flex-col md:flex-row overflow-hidden transition-colors">
        {/* Left Panel: Image Container (Top on Mobile, Left on Tablet) */}
        <div className={`relative w-full md:w-1/2 shrink-0 ${imageSrc ? 'h-[40vh] md:h-full' : 'h-40 md:h-full'} bg-black overflow-hidden flex items-center justify-center group`}>
          {imageSrc && (
            <>
              {/* Blurred Background for aesthetic fill */}
              <div className="absolute inset-0 z-0 opacity-40">
                <img 
                  src={imageSrc} 
                  alt="Background" 
                  className="w-full h-full object-cover blur-2xl scale-110" 
                />
              </div>
              
              {/* Main Image - Contain to ensure it fits without distortion */}
              <img 
                src={imageSrc} 
                alt="Food" 
                className="relative z-10 w-full h-full object-contain pointer-events-none select-none shadow-xl"
              />
              
              {/* Gradient Overlay for text readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent z-20 pointer-events-none"></div>
            </>
          )}
          
          {/* Top Controls */}
          <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-30">
            <button 
              onClick={resetApp}
              className="p-2 bg-black/30 backdrop-blur-md rounded-full text-white hover:bg-black/40 transition-colors border border-white/20"
            >
              <ArrowLeft size={20} />
            </button>
            
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <button 
                    onClick={handleCancelEdit}
                    className="p-2 bg-red-500/80 backdrop-blur-md rounded-full text-white hover:bg-red-600 transition-colors shadow-lg"
                  >
                    <X size={20} />
                  </button>
                  <button 
                    onClick={handleSaveEdit}
                    className="p-2 bg-primary backdrop-blur-md rounded-full text-white hover:bg-primary/90 transition-colors shadow-lg"
                  >
                    <Check size={20} />
                  </button>
                </>
              ) : (
                <>
                  <button 
                    onClick={() => imageSrc && startAnalysis(imageSrc)}
                    className="p-2 bg-black/30 backdrop-blur-md rounded-full text-white hover:bg-black/40 transition-colors border border-white/20"
                    title="Re-analyze"
                  >
                    <RefreshCw size={20} />
                  </button>

                  <button 
                    onClick={handleShare}
                    className="p-2 bg-black/30 backdrop-blur-md rounded-full text-white hover:bg-black/40 transition-colors border border-white/20"
                  >
                    <Share2 size={20} />
                  </button>
                  <button 
                    onClick={handleStartEdit}
                    className="p-2 bg-black/30 backdrop-blur-md rounded-full text-white hover:bg-black/40 transition-colors border border-white/20"
                  >
                    <Pencil size={20} />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Big Calorie Display */}
          <div className="absolute bottom-4 left-4 right-4 text-white z-30">
            {isEditing ? (
               <div className="flex items-end gap-2 bg-black/40 backdrop-blur-sm p-3 rounded-xl border border-white/10 w-fit">
                 <input
                    type="number"
                    value={displayData.totalCalories}
                    onChange={(e) => handleEditChange('totalCalories', e.target.value)}
                    className="w-32 bg-transparent border-b-2 border-primary text-3xl font-bold text-white outline-none px-1"
                 />
                 <span className="mb-2 text-sm font-medium opacity-90">kcal</span>
               </div>
            ) : (
              <>
                <h2 className="text-4xl font-bold">{displayData.totalCalories}</h2>
                <p className="text-sm font-medium opacity-90">Total Calories</p>
              </>
            )}
          </div>
        </div>

        {/* Right Panel: Scrollable Content */}
        <div className={`flex-1 overflow-y-auto no-scrollbar relative z-30 flex flex-col ${isEditing ? 'bg-amber-50/30 dark:bg-amber-900/5' : 'bg-gray-50 md:bg-white dark:bg-gray-950'}`}>
          
          {/* Editing Banner - Sticky Header */}
          {isEditing && (
            <div className="sticky top-0 z-40 bg-amber-50/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-amber-200 dark:border-amber-900/50 px-6 py-3 flex items-center justify-between shadow-sm animate-in slide-in-from-top-2">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-500">
                <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
                <span className="font-semibold text-sm">Editing Mode</span>
              </div>
              <span className="text-xs text-amber-600/70 dark:text-amber-500/70 hidden sm:block">Tap fields to modify</span>
            </div>
          )}

          <div className={`p-6 md:p-8 space-y-6 -mt-4 md:mt-0 ${isEditing ? 'bg-transparent' : 'bg-gray-50 md:bg-white dark:bg-gray-950'} rounded-t-3xl md:rounded-none flex-1 transition-colors`}>
          
             {/* Action Button: Log Meal - only show when NOT editing */}
             {!isEditing && (
               <button 
                 onClick={addToLog}
                 className="w-full py-4 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20 flex items-center justify-center gap-2 transform transition-all active:scale-95"
               >
                 <PlusCircle size={20} />
                 <span>Log Meal</span>
               </button>
             )}

            {/* Summary Card */}
            <div className={`bg-white dark:bg-gray-900 p-5 rounded-2xl shadow-sm border transition-all ${isEditing ? 'border-amber-300 dark:border-amber-700 ring-4 ring-amber-50 dark:ring-amber-900/10' : 'border-gray-100 dark:border-gray-800'}`}>
              <div className="flex items-start gap-3 w-full">
                <Info className={`w-5 h-5 flex-shrink-0 mt-0.5 ${isEditing ? 'text-amber-500' : 'text-primary'}`} />
                {isEditing ? (
                  <textarea
                    value={displayData.summary}
                    onChange={(e) => setEditForm({...editForm!, summary: e.target.value})}
                    className="w-full text-sm text-gray-800 dark:text-gray-200 bg-amber-50/50 dark:bg-black/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 focus:ring-2 focus:ring-amber-500/40 outline-none resize-none"
                    rows={3}
                  />
                ) : (
                  <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                    {displayData.summary}
                  </p>
                )}
              </div>
            </div>

            {/* Macros Chart */}
            <div className={`bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border transition-all ${isEditing ? 'border-amber-300 dark:border-amber-700 ring-4 ring-amber-50 dark:ring-amber-900/10' : 'border-gray-100 dark:border-gray-800'}`}>
              <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
                <Award className={`w-5 h-5 ${isEditing ? 'text-amber-500' : 'text-orange-500'}`} />
                Macro Breakdown
              </h3>
              
              <NutritionChart macros={displayData.macros} />
              
              <div className="grid grid-cols-3 gap-4 mt-6">
                {/* Carbs */}
                <div className={`text-center p-3 rounded-xl transition-all ${isEditing ? 'bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-500/20 hover:ring-blue-500/50 cursor-text' : 'bg-blue-50 dark:bg-blue-900/20'}`}>
                  {isEditing ? (
                     <input
                      type="number"
                      value={displayData.macros.carbs}
                      onChange={(e) => handleEditChange('macros', e.target.value, 'carbs')}
                      className="w-full bg-transparent text-center text-blue-700 dark:text-blue-300 font-bold text-lg outline-none border-b border-blue-300/50 focus:border-blue-500"
                   />
                  ) : (
                    <div className="text-blue-600 dark:text-blue-400 font-bold text-lg">{displayData.macros.carbs}g</div>
                  )}
                  <div className="text-xs text-blue-400 dark:text-blue-300/70 font-medium mt-1">Carbs</div>
                </div>

                {/* Protein */}
                <div className={`text-center p-3 rounded-xl transition-all ${isEditing ? 'bg-green-50 dark:bg-green-900/20 ring-2 ring-green-500/20 hover:ring-green-500/50 cursor-text' : 'bg-green-50 dark:bg-green-900/20'}`}>
                   {isEditing ? (
                     <input
                      type="number"
                      value={displayData.macros.protein}
                      onChange={(e) => handleEditChange('macros', e.target.value, 'protein')}
                      className="w-full bg-transparent text-center text-green-700 dark:text-green-300 font-bold text-lg outline-none border-b border-green-300/50 focus:border-green-500"
                   />
                  ) : (
                    <div className="text-green-600 dark:text-green-400 font-bold text-lg">{displayData.macros.protein}g</div>
                  )}
                  <div className="text-xs text-green-400 dark:text-green-300/70 font-medium mt-1">Protein</div>
                </div>

                {/* Fat */}
                <div className={`text-center p-3 rounded-xl transition-all ${isEditing ? 'bg-orange-50 dark:bg-orange-900/20 ring-2 ring-orange-500/20 hover:ring-orange-500/50 cursor-text' : 'bg-orange-50 dark:bg-orange-900/20'}`}>
                   {isEditing ? (
                     <input
                      type="number"
                      value={displayData.macros.fat}
                      onChange={(e) => handleEditChange('macros', e.target.value, 'fat')}
                      className="w-full bg-transparent text-center text-orange-700 dark:text-orange-300 font-bold text-lg outline-none border-b border-orange-300/50 focus:border-orange-500"
                   />
                  ) : (
                    <div className="text-orange-600 dark:text-orange-400 font-bold text-lg">{displayData.macros.fat}g</div>
                  )}
                  <div className="text-xs text-orange-400 dark:text-orange-300/70 font-medium mt-1">Fat</div>
                </div>
              </div>
            </div>

            {/* Food Items List - Expandable */}
            {(displayData.foodItems.length > 0 || isEditing) && (
              <div className={`bg-white dark:bg-gray-900 rounded-2xl shadow-sm border transition-all mb-8 overflow-hidden ${isEditing ? 'border-amber-300 dark:border-amber-700 ring-4 ring-amber-50 dark:ring-amber-900/10' : 'border-gray-100 dark:border-gray-800'}`}>
                <button 
                  onClick={() => setIsItemsExpanded(!isItemsExpanded)}
                  className="w-full p-6 flex justify-between items-center bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Utensils className={`w-5 h-5 ${isEditing ? 'text-amber-500' : 'text-gray-500 dark:text-gray-400'}`} />
                    <h3 className="font-semibold text-gray-800 dark:text-gray-200">Detected Items</h3>
                  </div>
                  {isItemsExpanded ? (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  )}
                </button>
                
                <div className={`px-6 pb-2 space-y-2 ${isItemsExpanded ? 'block' : 'hidden'}`}>
                  {displayData.foodItems.map((item, idx) => (
                    <div key={idx} className="py-3 border-b border-gray-50 dark:border-gray-800 last:border-0">
                      {isEditing ? (
                        <div className="space-y-3 bg-gray-50/80 dark:bg-gray-800/80 p-3 rounded-xl border border-gray-200 dark:border-gray-700">
                          <div className="flex items-center justify-between gap-2">
                             <input 
                               type="text"
                               value={item.name}
                               onChange={(e) => handleFoodItemChange(idx, 'name', e.target.value)}
                               className="flex-1 bg-white dark:bg-black border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20 dark:text-white"
                               placeholder="Item name"
                             />
                             <button 
                               onClick={() => deleteFoodItem(idx)}
                               className="p-2 text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                             >
                               <Trash2 size={16} />
                             </button>
                          </div>
                          
                          <div className="flex items-center gap-3">
                             <div className="flex-1 relative">
                               <input 
                                 type="number"
                                 value={item.approxCalories}
                                 onChange={(e) => handleFoodItemChange(idx, 'approxCalories', e.target.value)}
                                 className="w-full bg-white dark:bg-black border border-gray-200 dark:border-gray-600 rounded-lg pl-3 pr-8 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary/20 dark:text-white"
                               />
                               <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium">kcal</span>
                             </div>
                             
                             {/* Mini Macros Input */}
                             <div className="flex gap-2">
                               <div className="relative w-16">
                                  <input 
                                    type="number"
                                    value={item.carbs}
                                    onChange={(e) => handleFoodItemChange(idx, 'carbs', e.target.value)}
                                    className="w-full bg-white dark:bg-black border border-gray-200 dark:border-gray-600 text-blue-600 dark:text-blue-400 rounded-lg px-2 py-1 text-xs font-bold text-center outline-none focus:border-blue-300"
                                  />
                                  <span className="text-[9px] text-gray-400 absolute -bottom-4 left-0 w-full text-center">Carbs</span>
                               </div>
                               <div className="relative w-16">
                                  <input 
                                    type="number"
                                    value={item.protein}
                                    onChange={(e) => handleFoodItemChange(idx, 'protein', e.target.value)}
                                    className="w-full bg-white dark:bg-black border border-gray-200 dark:border-gray-600 text-green-600 dark:text-green-400 rounded-lg px-2 py-1 text-xs font-bold text-center outline-none focus:border-green-300"
                                  />
                                  <span className="text-[9px] text-gray-400 absolute -bottom-4 left-0 w-full text-center">Prot</span>
                               </div>
                               <div className="relative w-16">
                                  <input 
                                    type="number"
                                    value={item.fat}
                                    onChange={(e) => handleFoodItemChange(idx, 'fat', e.target.value)}
                                    className="w-full bg-white dark:bg-black border border-gray-200 dark:border-gray-600 text-orange-600 dark:text-orange-400 rounded-lg px-2 py-1 text-xs font-bold text-center outline-none focus:border-orange-300"
                                  />
                                  <span className="text-[9px] text-gray-400 absolute -bottom-4 left-0 w-full text-center">Fat</span>
                               </div>
                             </div>
                          </div>
                          <div className="h-2"></div>
                        </div>
                      ) : (
                        <>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-gray-700 dark:text-gray-200 font-medium">{item.name}</span>
                            <span className="text-gray-600 dark:text-gray-400 font-semibold text-sm">{item.approxCalories} kcal</span>
                          </div>
                          
                          {/* Granular Macros for Item */}
                          <div className="grid grid-cols-3 gap-2 bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
                            <div className="text-center">
                              <span className="block text-xs font-bold text-blue-600 dark:text-blue-400">{item.carbs || 0}g</span>
                              <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wide">Carbs</span>
                            </div>
                            <div className="text-center border-l border-gray-200 dark:border-gray-700">
                              <span className="block text-xs font-bold text-green-600 dark:text-green-400">{item.protein || 0}g</span>
                              <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wide">Prot</span>
                            </div>
                            <div className="text-center border-l border-gray-200 dark:border-gray-700">
                              <span className="block text-xs font-bold text-orange-600 dark:text-orange-400">{item.fat || 0}g</span>
                              <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wide">Fat</span>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  ))}

                  {isEditing && (
                    <button 
                      onClick={addFoodItem}
                      className="w-full py-3 mt-2 border-2 border-dashed border-amber-300/50 dark:border-amber-700/50 rounded-xl text-amber-600 dark:text-amber-400 font-medium text-sm flex items-center justify-center gap-2 hover:bg-amber-50 dark:hover:bg-amber-900/10 transition-colors"
                    >
                      <PlusCircle size={16} />
                      Add Item
                    </button>
                  )}

                  <div className="h-2"></div>
                </div>

                {/* Collapsed Preview (First 3 items) - Only show when NOT editing */}
                {!isItemsExpanded && !isEditing && (
                  <div className="px-6 pb-6 space-y-3">
                    {displayData.foodItems.slice(0, 3).map((item, idx) => (
                       <div key={idx} className="flex justify-between items-center py-1">
                        <span className="text-gray-600 dark:text-gray-300 text-sm">{item.name}</span>
                        <span className="text-gray-400 text-sm">{item.approxCalories} kcal</span>
                      </div>
                    ))}
                    {displayData.foodItems.length > 3 && (
                      <div className="text-xs text-gray-400 pt-1">
                        + {displayData.foodItems.length - 3} more items...
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderError = () => (
    <div className="flex flex-col items-center justify-center h-full p-6 bg-white dark:bg-gray-950 text-center">
      <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-full flex items-center justify-center mb-6">
        <Info size={32} />
      </div>
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Oops!</h3>
      <p className="text-gray-500 dark:text-gray-400 mb-8">{errorMsg}</p>
      <button 
        onClick={resetApp}
        className="w-full max-w-xs py-3 px-6 bg-primary text-white rounded-xl font-semibold shadow-lg shadow-primary/20"
      >
        Try Again
      </button>
    </div>
  );

  // --- Main Render ---

  return (
    <div className="w-full h-full bg-white dark:bg-gray-950 relative overflow-hidden flex flex-col transition-colors">
      {state === AppState.CAMERA && (
        <CameraComponent 
          onCapture={handleCameraCapture} 
          onClose={() => setState(AppState.IDLE)} 
        />
      )}
      
      {state === AppState.ANALYZING && <LoadingScreen imageSrc={imageSrc} />}
      
      {state === AppState.IDLE && renderDashboard()}
      {state === AppState.RESULTS && renderResults()}
      {state === AppState.ERROR && renderError()}
      {renderModals()}
    </div>
  );
};

export default App;