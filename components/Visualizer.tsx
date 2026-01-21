
import React from 'react';
import Logo from './Logo.tsx';

interface VisualizerProps {
  previewUrl: string | null;
  isLoading: boolean;
  fabricImage: string | null;
  onImageClick?: () => void;
  onInspectFabric?: () => void;
}

const StitchingWaitingAnimation: React.FC<{ pulse?: boolean }> = ({ pulse = false }) => {
  return (
    <div className={`relative w-80 h-80 flex items-center justify-center ${pulse ? 'animate-pulse' : ''}`}>
      <svg
        viewBox="0 0 140 140"
        className="w-full h-full drop-shadow-[0_15px_40px_rgba(255,51,102,0.2)]"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="rainbow-stitch" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FF0000" />
            <stop offset="20%" stopColor="#FF7F00" />
            <stop offset="40%" stopColor="#FFFF00" />
            <stop offset="60%" stopColor="#00FF00" />
            <stop offset="80%" stopColor="#0000FF" />
            <stop offset="100%" stopColor="#9400D3" />
          </linearGradient>

          <filter id="stitch-glow">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* The Garment Silhouette Path (Rainbow Lines) */}
        <path
          d="M70 25 L95 25 L115 45 L105 55 L105 115 L35 115 L35 55 L25 45 L45 25 Z"
          stroke="url(#rainbow-stitch)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#stitch-glow)"
          className="animate-[draw-boundary_4s_linear_infinite]"
          style={{ strokeDasharray: '450', strokeDashoffset: '450' }}
        />
        
        {/* Detail Stitches */}
        <path d="M50 40 L90 40" stroke="url(#rainbow-stitch)" strokeWidth="1" strokeDasharray="2 4" opacity="0.5" />
        <path d="M70 25 L70 115" stroke="url(#rainbow-stitch)" strokeWidth="0.5" strokeDasharray="4 4" opacity="0.3" />
      </svg>
      <style>{`
        @keyframes draw-boundary {
          0% { stroke-dashoffset: 450; }
          45% { stroke-dashoffset: 0; }
          55% { stroke-dashoffset: 0; }
          100% { stroke-dashoffset: -450; }
        }
      `}</style>
    </div>
  );
};

const CoutureReconstructionOverlay: React.FC = () => {
  return (
    <div className="absolute inset-0 z-40 pointer-events-none rounded-3xl overflow-hidden bg-white/30 backdrop-blur-[2px] flex flex-col items-center justify-center">
      <div className="absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#FF3366] to-transparent shadow-[0_0_20px_rgba(255,51,102,1)] animate-[scan_2s_ease-in-out_infinite]"></div>
      <div className="scale-75 opacity-90">
        <StitchingWaitingAnimation pulse={true} />
      </div>
      <style>{`
        @keyframes scan {
          0% { top: -10%; }
          100% { top: 110%; }
        }
      `}</style>
    </div>
  );
};

export default function Visualizer({ previewUrl, isLoading, fabricImage, onImageClick, onInspectFabric }: VisualizerProps) {
  const isInitialLoad = isLoading && !previewUrl;
  const isAlteration = isLoading && previewUrl;

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-white overflow-hidden">
      {/* Initial Build State */}
      {isInitialLoad && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-white/95 backdrop-blur-xl animate-in fade-in duration-700">
          <StitchingWaitingAnimation />
          <div className="mt-8 flex flex-col items-center">
            <span className="text-[12px] font-black uppercase text-[#FF3366] tracking-[0.4em] serif italic animate-pulse">Synthesis</span>
            <div className="w-32 h-0.5 bg-rose-50 mt-4 overflow-hidden rounded-full">
              <div className="h-full bg-gradient-to-r from-[#FF3366] to-indigo-500 animate-[progress_1.5s_infinite]"></div>
            </div>
          </div>
        </div>
      )}

      {/* Modifying Existing State */}
      {isAlteration && <CoutureReconstructionOverlay />}

      {previewUrl ? (
        <div 
          className="w-full h-full relative z-10 flex items-center justify-center p-2 cursor-pointer"
          onClick={onImageClick}
        >
          <img 
            src={previewUrl} 
            alt="Couture Synthesis" 
            className={`max-h-full max-w-full object-contain rounded-3xl shadow-2xl transition-all duration-700 ${isAlteration ? 'opacity-30 blur-[4px] scale-95' : 'opacity-100 scale-100'}`} 
          />
        </div>
      ) : !isLoading && (
        <div className="relative z-10 flex flex-col items-center justify-center animate-in fade-in duration-1000">
          <StitchingWaitingAnimation />
          <div className="flex flex-col items-center mt-6">
            <span className="text-[10px] serif italic tracking-[0.5em] font-bold text-rose-300 uppercase">Arslan Wazir</span>
          </div>
        </div>
      )}

      {fabricImage && (
        <div className="absolute top-6 right-6 z-20">
          <button 
            onClick={onInspectFabric}
            className="w-14 h-14 rounded-2xl border-2 border-white overflow-hidden shadow-xl bg-white p-0.5 hover:scale-110 active:scale-95 transition-all group"
          >
            <img src={fabricImage} alt="Material" className="w-full h-full object-cover rounded-[0.8rem]" />
          </button>
        </div>
      )}

      <style>{`
        @keyframes progress {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}
