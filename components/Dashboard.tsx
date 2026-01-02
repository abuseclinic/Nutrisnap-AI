import React, { useState } from 'react';
import { Camera, Droplets, Weight, Settings, Flame, ChevronRight, ScanLine, Upload, Sparkles } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area, XAxis, Tooltip } from 'recharts';
import { MealEntry } from '../types';

interface Insight {
  title: string;
  text: string;
  highlight: string;
  suffix: string;
}

interface DashboardProps {
  onScan: () => void;
  onUpload: () => void;
  onWaterClick: () => void;
  onWeightClick: () => void;
  onSettingsClick: () => void;
  onInsightClick: () => void;
  recentMeals: MealEntry[];
  totalCalories: number;
  dailyGoal: number;
  macros: { protein: number; carbs: number; fat: number };
  insight?: Insight;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  onScan, 
  onUpload, 
  onWaterClick, 
  onWeightClick, 
  onSettingsClick,
  onInsightClick,
  recentMeals, 
  totalCalories, 
  dailyGoal, 
  macros,
  insight
}) => {
  const [sortOption, setSortOption] = useState('time_desc');
  
  // Mock data for the activity chart
  const activityData = [
    { day: 'Mon', calories: 1850 },
    { day: 'Tue', calories: 2100 },
    { day: 'Wed', calories: 1950 },
    { day: 'Thu', calories: 2300 },
    { day: 'Fri', calories: 1800 },
    { day: 'Sat', calories: 2400 },
    { day: 'Sun', calories: totalCalories || 2150 },
  ];

  const sortedMeals = [...recentMeals].sort((a, b) => {
    if (sortOption === 'cals_desc') return b.calories - a.calories;
    if (sortOption === 'cals_asc') return a.calories - b.calories;
    if (sortOption === 'time_asc') return a.timestamp.getTime() - b.timestamp.getTime();
    return b.timestamp.getTime() - a.timestamp.getTime();
  });

  const MacroRing = ({ value, total, color, label }: { value: number, total: number, color: string, label: string }) => {
    const data = [
      { name: 'Used', value: value },
      { name: 'Remaining', value: Math.max(0, total - value) }
    ];

    // Calculate calories: 9 cal/g for Fats, 4 cal/g for Protein/Carbs
    const calories = Math.round(value * (label === 'Fats' ? 9 : 4));

    return (
      <div className="flex flex-col items-center">
        <div className="w-20 h-20 relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={28}
                outerRadius={35}
                startAngle={90}
                endAngle={-270}
                dataKey="value"
                stroke="none"
              >
                <Cell fill={color} />
                <Cell fill="#374151" /> {/* dark:gray-700 */}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
            <span className="text-xs font-bold text-gray-700 dark:text-gray-200 leading-none">{value}g</span>
            <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium mt-0.5">{calories} cal</span>
          </div>
        </div>
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1">{label}</span>
      </div>
    );
  };

  return (
    <div className="flex h-full bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
      {/* Quick Action Sidebar */}
      <div className="w-16 md:w-20 bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 flex flex-col items-center py-8 gap-6 shrink-0 shadow-sm z-20 transition-colors duration-300">
        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-2">
          <Flame size={24} fill="currentColor" />
        </div>
        
        <div className="flex flex-col gap-4 w-full items-center">
          <button 
            onClick={onScan}
            className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/30 hover:scale-105 transition-transform"
            title="Scan Food"
          >
            <Camera size={20} />
          </button>

          <button 
            onClick={onUpload}
            className="w-10 h-10 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-primary/50 hover:text-primary dark:hover:text-primary transition-all"
            title="Upload Photo"
          >
            <Upload size={20} />
          </button>
          
          <div className="w-8 h-px bg-gray-100 dark:bg-gray-800 my-1"></div>
          
          <button 
            onClick={onWaterClick}
            className="p-3 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-colors relative group" 
            title="Water Tracker"
          >
            <Droplets size={22} />
            <span className="absolute left-full ml-2 px-2 py-1 bg-gray-800 dark:bg-gray-700 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
              Log Water
            </span>
          </button>
          
          <button 
            onClick={onWeightClick}
            className="p-3 text-gray-400 hover:text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-xl transition-colors relative group" 
            title="Weight Log"
          >
            <Weight size={22} />
             <span className="absolute left-full ml-2 px-2 py-1 bg-gray-800 dark:bg-gray-700 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
              Log Weight
            </span>
          </button>
        </div>

        <div className="mt-auto">
          <button 
            onClick={onSettingsClick}
            className="p-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-xl transition-colors"
            title="Settings"
          >
            <Settings size={22} />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        <div className="p-6 md:p-8 flex flex-col gap-8">
          
          {/* Header */}
          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Welcome back, Alex</p>
            </div>
            <div className="text-right">
              <span className="text-xs font-semibold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-3 py-1 rounded-full">
                On Track
              </span>
            </div>
          </div>

          {/* Grid Layout for Tablet/Desktop */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            
            {/* 1. Summary Header: Calories - Col 1 */}
            <div className="w-full bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 relative overflow-hidden group hover:shadow-md transition-all cursor-pointer">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 dark:bg-primary/10 rounded-full -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
              
              <div className="relative z-10">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-500 dark:text-gray-400 font-medium">Daily Calories</span>
                  <span className="text-gray-400 dark:text-gray-500 text-sm">{totalCalories} / {dailyGoal} kcal</span>
                </div>
                
                <div className="flex items-end gap-2 mb-4">
                  <span className="text-4xl font-bold text-gray-800 dark:text-white">{totalCalories}</span>
                  <span className="text-sm text-gray-400 dark:text-gray-500 mb-1.5">kcal consumed</span>
                </div>

                {/* Progress Bar */}
                <div className="h-3 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-primary to-emerald-400 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${Math.min((totalCalories / dailyGoal) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* 2. Macro Breakdown - Col 2 */}
            <div className="w-full bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 transition-colors">
              <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-6">Macro Targets</h3>
              <div className="flex justify-around items-center">
                {/* Protein - Orange */}
                <MacroRing 
                  value={macros.protein} 
                  total={150} 
                  color="#f97316" // Orange
                  label="Protein"
                />
                {/* Carbs - Blue */}
                <MacroRing 
                  value={macros.carbs} 
                  total={200} 
                  color="#3b82f6" // Blue
                  label="Carbs"
                />
                {/* Fat - Green */}
                <MacroRing 
                  value={macros.fat} 
                  total={70} 
                  color="#10b981" // Green
                  label="Fats"
                />
              </div>
            </div>

            {/* AI Smart Insight Card */}
            {insight && (
              <div 
                onClick={onInsightClick}
                className="md:col-span-2 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-950 dark:via-purple-950 dark:to-pink-950 p-5 rounded-3xl border border-indigo-100 dark:border-indigo-900 flex items-center gap-4 relative overflow-hidden shadow-sm cursor-pointer hover:shadow-lg hover:shadow-indigo-500/20 hover:scale-[1.01] transition-all duration-300 active:scale-[0.98] group"
              >
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/40 dark:bg-white/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none group-hover:bg-white/50 dark:group-hover:bg-white/10 transition-colors"></div>
                  
                  <div className="w-10 h-10 rounded-xl bg-white dark:bg-indigo-900/50 shadow-sm flex items-center justify-center shrink-0 text-indigo-500 dark:text-indigo-400 relative z-10 group-hover:scale-110 transition-transform">
                    <Sparkles size={20} className="fill-indigo-100 dark:fill-indigo-900" />
                  </div>
                  
                  <div className="relative z-10 flex-1">
                     <div className="flex items-center gap-2 mb-0.5">
                       <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 dark:text-indigo-300 bg-white/50 dark:bg-black/20 px-2 py-0.5 rounded-full">
                         {insight.title}
                       </span>
                     </div>
                     <p className="text-indigo-900 dark:text-indigo-100 text-sm font-medium leading-relaxed">
                       {insight.text} <span className="font-bold underline decoration-indigo-300 dark:decoration-indigo-500 decoration-2 underline-offset-2">{insight.highlight}</span> {insight.suffix}
                     </p>
                  </div>
                  
                  <div className="relative z-10 text-indigo-300 dark:text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ChevronRight size={20} />
                  </div>
              </div>
            )}

            {/* 4. Activity Chart: Calorie Trends - Span 2 Cols on Tablet */}
            <div className="md:col-span-2 bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 transition-colors">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-semibold text-gray-800 dark:text-gray-100">Calorie Trend</h3>
                <select className="bg-gray-50 dark:bg-gray-800 text-xs border-none rounded-lg py-1 px-2 text-gray-500 dark:text-gray-400 outline-none cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700">
                  <option>Last 7 Days</option>
                  <option>Last 30 Days</option>
                </select>
              </div>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={activityData}>
                    <defs>
                      <linearGradient id="colorCal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.2)', backgroundColor: '#1f2937', color: '#f3f4f6' }}
                      itemStyle={{ color: '#e5e7eb' }}
                      cursor={{ stroke: '#374151' }}
                    />
                    <XAxis 
                      dataKey="day" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#9ca3af', fontSize: 10 }}
                      dy={10}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="calories" 
                      stroke="#10b981" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorCal)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 3. Visual Meal Log - Span 2 Cols on Tablet */}
            <div className="md:col-span-2">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-gray-800 dark:text-gray-100">Recent Meals</h3>
                {recentMeals.length > 0 && (
                  <select 
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value)}
                    className="bg-gray-50 dark:bg-gray-800 text-xs border-none rounded-lg py-1 px-2 text-gray-500 dark:text-gray-400 outline-none cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <option value="time_desc">Newest First</option>
                    <option value="time_asc">Oldest First</option>
                    <option value="cals_desc">Highest Calories</option>
                    <option value="cals_asc">Lowest Calories</option>
                  </select>
                )}
              </div>
              
              <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 min-h-[140px]">
                {sortedMeals.length === 0 ? (
                  <div className="w-full h-32 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-2xl bg-gray-50/50 dark:bg-gray-900/50">
                    <span className="text-sm font-medium">No meals logged yet</span>
                  </div>
                ) : (
                  sortedMeals.map((meal) => (
                    <div key={meal.id} className="min-w-[160px] bg-white dark:bg-gray-900 p-3 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 shrink-0 hover:shadow-md transition-all cursor-pointer">
                      <div className="h-20 w-full rounded-xl overflow-hidden mb-3 bg-gray-100 dark:bg-gray-800 relative">
                        {meal.imageSrc ? (
                          <img src={meal.imageSrc} alt={meal.name} className="w-full h-full object-cover hover:scale-110 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300 dark:text-gray-600">
                            <ScanLine size={20} />
                          </div>
                        )}
                      </div>
                      <h4 className="font-semibold text-gray-800 dark:text-gray-200 text-sm truncate">{meal.name}</h4>
                      <p className="text-gray-500 dark:text-gray-400 text-xs mt-1 mb-3">{meal.calories} kcal</p>
                      
                      {/* Macros */}
                      <div className="flex gap-1 mb-2">
                        <div className="flex flex-col items-center flex-1 bg-orange-50 dark:bg-orange-900/20 rounded-lg py-1.5">
                           <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400">{meal.macros.protein}g</span>
                           <span className="text-[8px] text-orange-400 dark:text-orange-500/70 font-medium uppercase">Prot</span>
                        </div>
                        <div className="flex flex-col items-center flex-1 bg-blue-50 dark:bg-blue-900/20 rounded-lg py-1.5">
                           <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400">{meal.macros.carbs}g</span>
                           <span className="text-[8px] text-blue-400 dark:text-blue-500/70 font-medium uppercase">Carb</span>
                        </div>
                        <div className="flex flex-col items-center flex-1 bg-green-50 dark:bg-green-900/20 rounded-lg py-1.5">
                           <span className="text-[10px] font-bold text-green-600 dark:text-green-400">{meal.macros.fat}g</span>
                           <span className="text-[8px] text-green-400 dark:text-green-500/70 font-medium uppercase">Fat</span>
                        </div>
                      </div>

                      <p className="text-gray-400 dark:text-gray-600 text-[10px] text-right">
                        {meal.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;