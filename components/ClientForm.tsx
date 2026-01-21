
import React, { useState } from 'react';
import { ClientDetails } from '../types';

interface ClientFormProps {
  onSubmit: (details: ClientDetails) => void;
  onSkip: () => void;
  onLaunchCamera: () => void;
  hasSilhouette: boolean;
  initialMode: 'Stock' | 'Personal';
}

const ClientForm: React.FC<ClientFormProps> = ({ onSubmit, onSkip, onLaunchCamera, hasSilhouette, initialMode }) => {
  const [details, setDetails] = useState<ClientDetails>({
    name: '',
    notes: '',
    priority: 'Standard',
    silhouetteMode: initialMode
  });

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/40 modal-blur">
      <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden p-8">
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-2 bg-[#FF3366] rounded-full animate-pulse"></div>
            <h2 className="text-[12px] font-black tracking-widest uppercase serif">Atelier Manifest</h2>
          </div>
          <p className="text-[9px] mono text-rose-300 uppercase">Finalize Design Specs</p>
        </header>

        <div className="space-y-6">
          <div className="flex flex-col gap-3">
            <label className="text-[9px] mono font-bold uppercase text-gray-400 block">Sourcing Mode</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setDetails({ ...details, silhouetteMode: 'Stock' })}
                className={`p-4 rounded-2xl flex flex-col items-center gap-2 border-2 transition-all ${
                  details.silhouetteMode === 'Stock' ? 'border-[#FF3366] bg-rose-50/20' : 'border-rose-50 grayscale opacity-60'
                }`}
              >
                <div className="text-[10px] font-bold uppercase tracking-widest serif text-gray-800">Model Portfolio</div>
              </button>
              
              <button
                type="button"
                onClick={() => {
                  if (!hasSilhouette) onLaunchCamera();
                  else setDetails({ ...details, silhouetteMode: 'Personal' });
                }}
                className={`p-4 rounded-2xl flex flex-col items-center gap-2 border-2 transition-all relative ${
                  details.silhouetteMode === 'Personal' ? 'border-[#FF3366] bg-rose-50/20' : 'border-rose-50 grayscale opacity-60'
                }`}
              >
                <div className="text-[10px] font-bold uppercase tracking-widest serif text-gray-800">Private Profile</div>
              </button>
            </div>
          </div>

          <div>
            <label className="text-[9px] mono font-bold uppercase text-gray-400 block mb-2">Client ID</label>
            <input 
              type="text" 
              placeholder="e.g. Signature_001"
              value={details.name}
              onChange={e => setDetails({ ...details, name: e.target.value })}
              className="w-full bg-rose-50/30 border-none rounded-2xl py-4 px-5 text-xs mono focus:ring-2 focus:ring-[#FF3366]/20 transition-all outline-none"
            />
          </div>

          <div>
            <label className="text-[9px] mono font-bold uppercase text-gray-400 block mb-2">Design Aspirations</label>
            <textarea 
              placeholder="Describe the mood (e.g. Sharp, Fluid, Regal)..."
              value={details.notes}
              onChange={e => setDetails({ ...details, notes: e.target.value })}
              className="w-full bg-rose-50/30 border-none rounded-2xl py-4 px-5 text-xs mono h-24 focus:ring-2 focus:ring-[#FF3366]/20 transition-all resize-none outline-none"
            />
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3">
          <button 
            onClick={() => onSubmit(details)}
            className="w-full py-4 bg-[#FF3366] text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-lg active:scale-95 transition-all"
          >
            Synthesize Garment
          </button>
          <button 
            onClick={onSkip}
            className="w-full py-4 text-rose-300 text-[10px] mono font-bold uppercase hover:text-[#FF3366]"
          >
            Bypass & Start
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClientForm;
