import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { MacroNutrients } from '../types';

interface NutritionChartProps {
  macros: MacroNutrients;
  className?: string;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b']; // Blue (Carbs), Green (Protein), Orange (Fat)

const NutritionChart: React.FC<NutritionChartProps> = ({ macros, className }) => {
  const data = [
    { name: 'Carbs', value: macros.carbs, unit: 'g' },
    { name: 'Protein', value: macros.protein, unit: 'g' },
    { name: 'Fat', value: macros.fat, unit: 'g' },
  ];

  return (
    <div className={`w-full relative ${className || 'h-64'}`}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
            stroke="none"
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', backgroundColor: '#1f2937', color: '#f3f4f6' }}
            itemStyle={{ color: '#e5e7eb' }}
            formatter={(value: number, name: string) => [`${value}g`, name]}
          />
        </PieChart>
      </ResponsiveContainer>
      
      {/* Center Text */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
        <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Macros</span>
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-4 mt-2">
        {data.map((item, index) => (
          <div key={item.name} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index] }}></div>
            <div className="text-xs font-medium text-gray-600 dark:text-gray-300">
              {item.name} <span className="text-gray-400 dark:text-gray-500">({item.value}g)</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NutritionChart;