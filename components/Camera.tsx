import React, { useRef, useState, useEffect } from 'react';
import { Camera as CameraIcon, X, RefreshCw, Zap } from 'lucide-react';

interface CameraProps {
  onCapture: (imageSrc: string) => void;
  onClose: () => void;
}

const Camera: React.FC<CameraProps> = ({ onCapture, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string>('');
  const [isFlashing, setIsFlashing] = useState(false);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' } // Prefer back camera
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError("Could not access camera. Please check permissions.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      // Haptic feedback
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try {
          navigator.vibrate(50);
        } catch (e) {
          // Ignore if vibration is not supported or allowed
        }
      }

      // Visual flash effect
      setIsFlashing(true);
      setTimeout(() => setIsFlashing(false), 150);

      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageSrc = canvas.toDataURL('image/jpeg', 0.8);
        
        // Add a slight delay to allow the flash animation to be seen before unmounting
        setTimeout(() => {
          onCapture(imageSrc);
        }, 200);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col relative">
      {/* Flash Overlay */}
      <div 
        className={`absolute inset-0 bg-white z-[60] pointer-events-none transition-opacity duration-150 ease-out ${isFlashing ? 'opacity-100' : 'opacity-0'}`} 
      />

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10 bg-gradient-to-b from-black/50 to-transparent">
        <button onClick={onClose} className="p-2 bg-white/10 backdrop-blur-md rounded-full text-white">
          <X size={24} />
        </button>
        <span className="text-white font-medium">Take Photo</span>
        <div className="w-10"></div> {/* Spacer */}
      </div>

      {/* Viewfinder */}
      <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
        {error ? (
          <div className="text-white text-center p-6">
            <p className="mb-4">{error}</p>
            <button 
              onClick={startCamera}
              className="px-4 py-2 bg-white/20 rounded-lg text-sm"
            >
              Retry
            </button>
          </div>
        ) : (
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            className="w-full h-full object-cover"
          />
        )}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* Controls */}
      <div className="bg-black p-8 pb-12 flex justify-center items-center gap-8">
        <button 
          onClick={handleCapture}
          className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center relative group"
          disabled={!!error}
        >
          <div className="w-16 h-16 bg-white rounded-full group-active:scale-90 transition-transform"></div>
        </button>
      </div>
    </div>
  );
};

export default Camera;