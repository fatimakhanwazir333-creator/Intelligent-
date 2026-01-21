
import React, { useState } from 'react';

interface FabricInspectorProps {
  image: string;
  onClose: () => void;
}

const FabricInspector: React.FC<FabricInspectorProps> = ({ image, onClose }) => {
  const [zoom, setZoom] = useState(1);
  const [rotate, setRotate] = useState(0);

  return (
    <div className="fixed inset-0 z-[120] flex flex-col bg-white modal-blur overflow-hidden">
      <header className="p-6 flex items-center justify-between border-b border-rose-50 bg-white/80 z-20">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center text-[#FF3366]">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M15 19l-7-7 7-7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div>
            <h2 className="text-[11px] font-black tracking-widest uppercase serif">Textile Analysis</h2>
            <p className="text-[8px] mono text-rose-300 uppercase">Stitch Lab Material Matrix</p>
          </div>
        </div>

        <div className="flex gap-2">
           <button onClick={() => setZoom(prev => Math.min(prev + 0.5, 4))} className="w-10 h-10 rounded-xl border border-rose-100 flex items-center justify-center text-rose-300">+</button>
           <button onClick={() => setZoom(prev => Math.max(prev - 0.5, 0.5))} className="w-10 h-10 rounded-xl border border-rose-100 flex items-center justify-center text-rose-300">-</button>
           <button onClick={() => setRotate(prev => prev + 90)} className="w-10 h-10 rounded-xl border border-rose-100 flex items-center justify-center text-rose-300">
             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" strokeWidth="2" />
             </svg>
           </button>
        </div>
      </header>

      <div className="flex-1 relative flex items-center justify-center overflow-hidden design-grid bg-[#FFF9FA] p-12">
        <div 
          className="transition-transform duration-300 ease-out"
          style={{ 
            transform: `scale(${zoom}) rotate(${rotate}deg)`,
            maxWidth: '100%',
            maxHeight: '100%'
          }}
        >
          <img 
            src={image} 
            alt="Fabric Macro" 
            className="shadow-2xl rounded-2xl border-white border-[8px] drop-shadow-[0_20px_40px_rgba(255,51,102,0.1)]" 
          />
        </div>
      </div>

      <footer className="p-8 bg-white/80 border-t border-rose-50 flex justify-between items-center z-20">
        <div className="flex gap-10">
           <div className="flex flex-col">
             <span className="text-[8px] mono text-rose-300 uppercase">Magnification</span>
             <span className="text-[10px] mono font-bold uppercase text-[#FF3366]">{zoom.toFixed(1)}x</span>
           </div>
           <div className="flex flex-col">
             <span className="text-[8px] mono text-rose-300 uppercase">Orientation</span>
             <span className="text-[10px] mono font-bold uppercase text-[#FF3366]">{rotate}°</span>
           </div>
        </div>
        <div className="text-[9px] mono text-[#FF3366] font-black animate-pulse uppercase tracking-[0.2em]">
          Source: STITCHLAB_OPTICAL_ENGINE
        </div>
      </footer>
    </div>
  );
};

export default FabricInspector;
