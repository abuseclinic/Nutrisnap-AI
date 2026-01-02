import React from 'react';
import { Loader2, ScanLine } from 'lucide-react';

interface LoadingScreenProps {
  imageSrc: string | null;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ imageSrc }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full w-full bg-gray-900/95 backdrop-blur-md fixed inset-0 z-50 animate-in fade-in duration-300">
      
      {imageSrc ? (
        <div className="relative w-72 h-72 rounded-2xl overflow-hidden shadow-2xl border-2 border-primary/30">
          <img 
            src={imageSrc} 
            alt="Analyzing" 
            className="w-full h-full object-cover opacity-60" 
          />
          
          {/* Scanning Overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none"></div>
          
          {/* Scanning Line */}
          <div className="absolute left-0 right-0 h-1 bg-primary shadow-[0_0_20px_2px_rgba(16,185,129,0.8)] animate-scan z-10"></div>
          
          {/* Corner markers for "scanning" look */}
          <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-primary"></div>
          <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-primary"></div>
          <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-primary"></div>
          <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-primary"></div>
          
          {/* Center Icon */}
           <div className="absolute inset-0 flex items-center justify-center">
             <ScanLine className="w-12 h-12 text-primary/80 animate-pulse" />
           </div>
        </div>
      ) : (
        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse-slow"></div>
          <div className="relative bg-white p-4 rounded-full shadow-xl">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
          </div>
        </div>
      )}

      <div className="mt-8 text-center space-y-2 px-6">
        <h2 className="text-xl font-bold text-white tracking-wide">
          ANALYZING MEAL
        </h2>
        <p className="text-gray-400 text-sm font-medium">
          Identifying ingredients & calculating macros...
        </p>
      </div>
    </div>
  );
};

export default LoadingScreen;