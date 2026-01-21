
import React, { useState, useRef, useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleGenAI } from "@google/genai";

// --- 1. TYPES ---
export type Gender = 'Man' | 'Woman' | 'Child' | 'Personal';
export interface FabricData { id: string; image: string; analysis?: string; }
export interface ClientDetails { name: string; notes: string; priority: 'Standard' | 'Express'; silhouetteMode: 'Stock' | 'Personal'; }
export interface GarmentModifications { sleeves: string; pockets: number; fit: string; }
export interface RenderProfile { model: Gender; userSilhouette?: string; background: 'minimal_white' | 'original'; modifications: GarmentModifications; }
export interface GarmentConfig { kernel_state: 'ACTIVE' | 'IDLE'; render_profile: RenderProfile; }
export interface HistorySnapshot { config: GarmentConfig; previewUrl: string | null; }
export interface ChatMessage { role: 'user' | 'assistant'; content: string; timestamp: number; data?: any; }
export enum ModelType { GEMINI_TEXT = 'gemini-3-flash-preview', GEMINI_IMAGE = 'gemini-2.5-flash-image' }
export interface SessionState { fabric: FabricData | null; previewUrl: string | null; history: ChatMessage[]; isProcessing: boolean; designMetadata: GarmentConfig; clientDetails?: ClientDetails; userSilhouette?: string; past: HistorySnapshot[]; future: HistorySnapshot[]; }

// --- 2. CONSTANTS ---
const INITIAL_GARMENT_CONFIG: GarmentConfig = {
  kernel_state: 'IDLE',
  render_profile: {
    model: 'Woman',
    background: 'minimal_white',
    modifications: {
      sleeves: 'sleeveless',
      pockets: 0,
      fit: 'sculpted form-fitting architectural couture'
    }
  }
};

const SYSTEM_PROMPT = `You are Arslan Wazir, a world-class luxury fashion design engineer.
CORE MISSION: Manage couture garment state with precision.
JSON OUTPUT: Provide explanation then COMPLETE updated state in JSON.
{
  "kernel_state": "ACTIVE",
  "render_profile": {
    "model": "man | woman | child | personal",
    "modifications": { "sleeves": "string", "pockets": number, "fit": "string" }
  }
}`;

// --- 3. AI SERVICES ---
const getAIClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

const analyzeFabric = async (fabricBase64: string): Promise<string> => {
  const ai = getAIClient();
  const response = await ai.models.generateContent({
    model: ModelType.GEMINI_TEXT,
    contents: {
      parts: [
        { inlineData: { data: fabricBase64.split(',')[1], mimeType: 'image/jpeg' } },
        { text: "Analyze this luxury fabric. Describe its artistic potential for haute couture in one elegant sentence." }
      ]
    }
  });
  return response.text || "Material essence captured.";
};

const updateDesignLogic = async (userPrompt: string, currentConfig: GarmentConfig, chatHistory: { role: string, content: string }[]) => {
  const ai = getAIClient();
  const historyParts = chatHistory.map(h => `${h.role === 'user' ? 'Client' : 'Arslan Wazir'}: ${h.content}`).join('\n');
  const prompt = `CURRENT_ATELIER_STATE: ${JSON.stringify(currentConfig)}\nCLIENT_WISH: "${userPrompt}"\n${SYSTEM_PROMPT}\nPREVIOUS_LOG:\n${historyParts}`;
  
  const response = await ai.models.generateContent({
    model: ModelType.GEMINI_TEXT,
    contents: prompt
  });

  const text = response.text || '';
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Aesthetic manifest missing.");
    const data = JSON.parse(jsonMatch[0]);
    const displayMessage = text.replace(/\{[\s\S]*\}/, '').replace(/```json|```/g, '').trim() || "Design refined.";
    
    return { 
      updatedConfig: {
        ...currentConfig,
        render_profile: { 
          ...currentConfig.render_profile, 
          model: (data.render_profile?.model?.charAt(0).toUpperCase() + data.render_profile?.model?.slice(1)) as Gender || currentConfig.render_profile.model,
          modifications: { ...currentConfig.render_profile.modifications, ...data.render_profile.modifications } 
        }
      }, 
      message: displayMessage 
    };
  } catch (e) {
    return { updatedConfig: currentConfig, message: text };
  }
};

const renderGarment = async (fabricBase64: string, config: GarmentConfig): Promise<string> => {
  const ai = getAIClient();
  const profile = config.render_profile;
  const mods = profile.modifications;
  const isPersonal = profile.model === 'Personal' && profile.userSilhouette;
  
  const parts: any[] = [{ inlineData: { data: fabricBase64.split(',')[1], mimeType: 'image/jpeg' } }];
  if (isPersonal) parts.push({ inlineData: { data: profile.userSilhouette!.split(',')[1], mimeType: 'image/jpeg' } });
  
  parts.push({ text: `High-fashion editorial. Redress ${isPersonal ? 'person' : profile.model + ' model'} using this fabric. Fit: ${mods.fit}. Sleeves: ${mods.sleeves}. Pockets: ${mods.pockets}. Editorial quality.` });

  const response = await ai.models.generateContent({
    model: ModelType.GEMINI_IMAGE,
    contents: { parts },
    config: { imageConfig: { aspectRatio: "9:16" } }
  });

  const imgPart = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
  if (imgPart?.inlineData?.data) return `data:image/png;base64,${imgPart.inlineData.data}`;
  throw new Error("Synthesis disrupted.");
};

// --- 4. COMPONENTS ---

const SewingSignature = () => {
  // Enhanced cursive path for "Arslan Wazir"
  const cursivePath = "M30,50 C40,25 55,20 60,45 C60,55 65,55 70,45 C75,35 80,35 85,45 C90,55 95,45 100,45 C105,45 110,35 115,45 L125,45 M145,20 L145,60 M145,45 C155,30 165,30 175,45 C185,60 195,60 205,45 C215,30 220,30 225,45 C230,60 235,45 240,45";

  return (
    <div className="relative flex flex-col items-center justify-center w-full max-w-sm h-32 -mt-4">
      {/* Animation Layer */}
      <svg width="280" height="100" viewBox="0 0 280 100" className="overflow-visible pointer-events-none absolute z-10">
        <defs>
          <filter id="stitch-glow-red">
            <feGaussianBlur stdDeviation="1.2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        
        {/* The Stitched Red Thread - Fades out after 4.5s */}
        <path
          d={cursivePath}
          fill="none"
          stroke="#FF3366"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray="700"
          strokeDashoffset="700"
          className="animate-[sew-and-fade_5s_linear_forwards]"
          filter="url(#stitch-glow-red)"
        />

        {/* The Blue Needle - Exits after 4.6s */}
        <g className="animate-[needle-exit_4.7s_linear_forwards]">
          <path
            d="M-5,-25 L0,5 L5,-25"
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <circle cx="0" cy="-18" r="1.8" fill="white" stroke="#3b82f6" strokeWidth="0.8" />
          <path d="M0,-18 Q5,-35 15,-40" stroke="#FF3366" strokeWidth="1.2" fill="none" />
          
          <animateMotion
            dur="4.5s"
            repeatCount="1"
            fill="freeze"
            path={cursivePath}
          />
        </g>
      </svg>
      
      {/* Result Layer - Fades in as thread fades out */}
      <div className="flex flex-col items-center justify-center opacity-0 animate-[reveal-clean_1s_ease-out_4.3s_forwards] relative z-20">
        <span className="handwritten text-[36px] text-[#1a1a1a] drop-shadow-sm select-none h-14 leading-none">Arslan Wazir</span>
        <div className="flex items-center gap-3 mt-2">
          <div className="h-[0.5px] w-8 bg-rose-100/50"></div>
          <span className="text-[7px] mono uppercase tracking-[0.5em] text-[#FF3366] font-black">Principal Fashion Engineer</span>
          <div className="h-[0.5px] w-8 bg-rose-100/50"></div>
        </div>
      </div>

      <style>{`
        @keyframes sew-and-fade {
          0% { stroke-dashoffset: 700; opacity: 0.6; }
          85% { stroke-dashoffset: 0; opacity: 0.6; }
          95% { stroke-dashoffset: 0; opacity: 0.6; }
          100% { stroke-dashoffset: 0; opacity: 0; }
        }
        @keyframes needle-exit {
          0% { opacity: 1; transform: scale(1); }
          96% { opacity: 1; transform: scale(1); }
          100% { opacity: 0; transform: translateY(-30px) scale(0.5); }
        }
        @keyframes reveal-clean {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

const Logo = ({ className = "w-10 h-10" }: { className?: string }) => (
  <div className={`${className} relative group`}>
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full filter drop-shadow-md">
      <defs>
        <linearGradient id="thread-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#FF3366" />
          <stop offset="50%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#9400D3" />
        </linearGradient>
      </defs>
      <g transform="rotate(-15 50 50)">
        <ellipse cx="35" cy="30" rx="12" ry="4" fill="#1a1a1a" />
        <rect x="25" y="34" width="20" height="3" rx="1.5" fill="#FF0000" />
        <rect x="23" y="38" width="24" height="3" rx="1.5" fill="#FF7F00" />
        <rect x="22" y="42" width="26" height="3" rx="1.5" fill="#FFFF00" />
        <rect x="22" y="46" width="26" height="3" rx="1.5" fill="#00FF00" />
        <rect x="23" y="50" width="24" height="3" rx="1.5" fill="#0000FF" />
        <ellipse cx="35" cy="65" rx="14" ry="5" fill="#1a1a1a" />
      </g>
      <path d="M75 20 L75 85" stroke="#1a1a1a" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M45 45 C 60 45, 90 35, 75 28 C 60 20, 50 60, 75 80 C 90 90, 100 70, 95 60" stroke="url(#thread-gradient)" strokeWidth="2.5" strokeLinecap="round" fill="none" className="animate-[draw_4s_ease-in-out_infinite]" style={{ strokeDasharray: '200', strokeDashoffset: '0' }} />
    </svg>
  </div>
);

const StitchingWaitingAnimation = ({ pulse = false }: { pulse?: boolean }) => (
  <div className={`relative w-64 h-64 flex items-center justify-center ${pulse ? 'animate-pulse' : ''}`}>
    <svg viewBox="0 0 140 140" className="w-full h-full drop-shadow-[0_15px_40px_rgba(255,51,102,0.2)]" fill="none">
      <defs>
        <linearGradient id="rainbow-stitch" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#FF0000" /><stop offset="20%" stopColor="#FF7F00" /><stop offset="40%" stopColor="#FFFF00" />
          <stop offset="60%" stopColor="#00FF00" /><stop offset="80%" stopColor="#0000FF" /><stop offset="100%" stopColor="#9400D3" />
        </linearGradient>
      </defs>
      <path d="M70 25 L95 25 L115 45 L105 55 L105 115 L35 115 L35 55 L25 45 L45 25 Z" stroke="url(#rainbow-stitch)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="animate-[draw-boundary_4s_linear_infinite]" style={{ strokeDasharray: '450', strokeDashoffset: '450' }} />
    </svg>
  </div>
);

const FabricUploader = ({ onUpload, isLoading }: { onUpload: (b64: string) => void, isLoading: boolean }) => {
  const fileRef = useRef<HTMLInputElement>(null);
  return (
    <div className="w-full h-full">
      <button onClick={() => fileRef.current?.click()} disabled={isLoading} className="w-full h-full flex flex-col items-center justify-center relative group">
        <svg className="w-8 h-8 text-white transition-transform group-hover:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
      </button>
      <input ref={fileRef} type="file" className="hidden" accept="image/*" onChange={(e) => {
        const file = e.target.files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (ev) => onUpload(ev.target?.result as string);
          reader.readAsDataURL(file);
        }
      }} />
    </div>
  );
};

const CameraCapture = ({ onCapture, onClose }: { onCapture: (b64: string) => void, onClose: () => void }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [captured, setCaptured] = useState<string | null>(null);

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } }).then(s => {
      if (videoRef.current) videoRef.current.srcObject = s;
    }).catch(e => onClose());
  }, []);

  const take = () => {
    if (videoRef.current && canvasRef.current) {
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      canvasRef.current.getContext('2d')?.drawImage(videoRef.current, 0, 0);
      setCaptured(canvasRef.current.toDataURL('image/jpeg'));
    }
  };

  if (captured) return (
    <div className="fixed inset-0 z-[200] bg-black flex flex-col items-center justify-center p-6 gap-6">
      <img src={captured} className="w-full max-w-xs rounded-3xl border-4 border-white/20" alt="Preview" />
      <div className="flex flex-col gap-3 w-full max-w-xs">
        <button onClick={() => onCapture(captured)} className="w-full p-5 bg-[#FF3366] text-white rounded-2xl font-black uppercase tracking-widest shadow-xl">Confirm & Continue</button>
        <button onClick={() => setCaptured(null)} className="text-white/60 uppercase text-[10px] font-bold py-2">Retake Photo</button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[200] bg-black flex flex-col items-center justify-center">
      <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
      <div className="absolute top-6 left-6 flex flex-col">
        <span className="text-[10px] mono text-white/50 uppercase tracking-widest">Atelier Lens v1.1</span>
        <span className="text-[8px] mono text-[#FF3366] uppercase">Deep Mapping Ready</span>
      </div>
      <div className="absolute bottom-12 flex flex-col items-center gap-8">
        <button onClick={take} className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center"><div className="w-14 h-14 bg-white rounded-full active:scale-90 transition-transform"></div></button>
        <button onClick={onClose} className="text-white/60 uppercase text-[10px] font-bold">Cancel</button>
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

// --- 5. MAIN APP ---

const App = () => {
  const [state, setState] = useState<SessionState>({
    fabric: null, previewUrl: null, history: [], isProcessing: false,
    designMetadata: INITIAL_GARMENT_CONFIG, userSilhouette: undefined, past: [], future: []
  });
  const [wizard, setWizard] = useState<'HOME' | 'CAPTURE' | 'FABRIC' | 'CLIENT' | 'READY'>('HOME');
  const [inspectOpen, setInspectOpen] = useState(false);
  const [trayExpanded, setTrayExpanded] = useState(false);
  const [activePath, setActivePath] = useState<'STOCK' | 'PERSONAL' | null>(null);

  const handleUpload = async (b64: string) => {
    setState(s => ({ ...s, fabric: { id: Date.now().toString(), image: b64 } }));
    setWizard('CLIENT');
  };

  const startDesign = async (clientInfo?: any) => {
    if (!state.fabric) return;
    setWizard('READY');
    const updatedConfig: GarmentConfig = {
      ...state.designMetadata,
      render_profile: {
        ...state.designMetadata.render_profile,
        model: activePath === 'PERSONAL' ? 'Personal' : state.designMetadata.render_profile.model,
        userSilhouette: activePath === 'PERSONAL' ? state.userSilhouette : undefined
      }
    };
    setState(s => ({ ...s, isProcessing: true, clientDetails: clientInfo, designMetadata: updatedConfig }));
    try {
      const analysis = await analyzeFabric(state.fabric.image);
      const preview = await renderGarment(state.fabric.image, updatedConfig);
      setState(s => ({ 
        ...s, 
        previewUrl: preview, 
        isProcessing: false, 
        history: [{ role: 'assistant', content: `Atelier reconstruction complete. ${analysis}`, timestamp: Date.now() }] 
      }));
    } catch (e) { setState(s => ({ ...s, isProcessing: false })); }
  };

  const handleAlter = async (prompt: string) => {
    if (!state.fabric) return;
    const snap = { config: state.designMetadata, previewUrl: state.previewUrl };
    setState(s => ({ ...s, isProcessing: true }));
    try {
      const { updatedConfig, message } = await updateDesignLogic(prompt, state.designMetadata, state.history);
      const preview = await renderGarment(state.fabric.image, updatedConfig);
      setState(s => ({ 
        ...s, 
        designMetadata: updatedConfig, 
        previewUrl: preview, 
        isProcessing: false, 
        past: [...s.past, snap], 
        history: [...s.history, { role: 'user', content: prompt, timestamp: Date.now() }, { role: 'assistant', content: message, timestamp: Date.now() }] 
      }));
    } catch (e) { setState(s => ({ ...s, isProcessing: false })); }
  };

  const undo = () => {
    if (state.past.length === 0) return;
    const prev = state.past[state.past.length - 1];
    setState(s => ({ 
      ...s, 
      designMetadata: prev.config, 
      previewUrl: prev.previewUrl, 
      past: s.past.slice(0, -1), 
      future: [{ config: s.designMetadata, previewUrl: s.previewUrl }, ...s.future] 
    }));
  };

  if (wizard === 'HOME') return (
    <div className="flex flex-col h-full items-center justify-center p-8 bg-[#FFF9FA] gap-2 overflow-hidden">
      <div className="text-center flex flex-col items-center w-full">
        <Logo className="w-16 h-16 mb-2" />
        <h1 className="text-3xl font-black stitch-lab-signature mb-2">STITCH LAB Ai</h1>
        <SewingSignature />
      </div>
      <div className="w-full max-w-xs space-y-4 mt-12">
        <button onClick={() => { setActivePath('STOCK'); setWizard('FABRIC'); }} className="w-full p-5 bg-white border border-rose-50 rounded-[2rem] shadow-sm flex flex-col items-center gap-1 group transition-all hover:shadow-md active:scale-95">
          <span className="text-xs font-black uppercase text-gray-800 tracking-widest">Portfolio Synthesis</span>
          <span className="text-[8px] text-rose-300 uppercase mono">Fast Mode • Stock Models</span>
        </button>
        <button onClick={() => { setActivePath('PERSONAL'); setWizard('CAPTURE'); }} className="w-full p-5 bg-[#FF3366] rounded-[2rem] text-white font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all flex flex-col items-center gap-1">
          <span>Private Atelier</span>
          <span className="text-[8px] opacity-70 uppercase mono">Deep Mapping Mode</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-[#FFF9FA] overflow-hidden">
      <header className="p-4 bg-white border-b flex justify-between items-center shadow-sm z-50">
        <div className="flex items-center gap-2" onClick={() => setWizard('HOME')}>
          <Logo className="w-10 h-10" />
          <h1 className="text-lg font-black stitch-lab-signature">STITCH LAB Ai</h1>
        </div>
        <button onClick={() => setWizard('HOME')} className="text-gray-400 uppercase text-[10px] font-bold p-2 hover:bg-rose-50 rounded-full">EXIT</button>
      </header>

      <main className="flex-1 relative bg-white flex items-center justify-center p-4 overflow-hidden">
        {state.isProcessing && (
          <div className="absolute inset-0 z-40 bg-white/60 backdrop-blur-md flex flex-col items-center justify-center">
            <div className="absolute top-0 inset-x-0 h-0.5 bg-[#FF3366] animate-[scan_2s_infinite] shadow-[0_0_15px_#FF3366]"></div>
            <StitchingWaitingAnimation pulse />
            <span className="mt-4 text-[11px] font-black uppercase text-[#FF3366] tracking-[0.3em] animate-pulse serif italic">Synthesizing Couture</span>
          </div>
        )}
        
        {state.previewUrl ? (
          <img src={state.previewUrl} className={`max-h-full rounded-[2.5rem] shadow-2xl object-contain transition-all duration-700 ${state.isProcessing ? 'opacity-30 blur-sm scale-95' : 'opacity-100 scale-100'}`} alt="Preview" />
        ) : <StitchingWaitingAnimation />}
        
        <div className="absolute top-6 right-6 flex flex-col items-end gap-2">
           {state.fabric && (
             <button onClick={() => setInspectOpen(true)} className="w-16 h-16 rounded-2xl border-4 border-white overflow-hidden shadow-xl active:scale-90 transition-transform">
               <img src={state.fabric.image} className="w-full h-full object-cover"/>
             </button>
           )}
           {state.previewUrl && (
             <div className="bg-white/70 backdrop-blur-md p-3 rounded-2xl border border-white/50 text-right shadow-sm">
                <div className="text-[6px] text-gray-400 uppercase mono">Fit Structure</div>
                <div className="text-[8px] font-black text-[#FF3366] uppercase truncate max-w-[100px]">{state.designMetadata.render_profile.modifications.fit}</div>
             </div>
           )}
        </div>

        <div className="absolute bottom-6 left-6 flex items-center gap-2">
          <div className={`bg-white/90 backdrop-blur-xl p-1.5 rounded-full border border-white/50 shadow-xl flex flex-col gap-1 transition-all duration-300 overflow-hidden ${trayExpanded ? 'max-h-60' : 'max-h-12'}`}>
            <button onClick={() => setTrayExpanded(!trayExpanded)} className="px-6 py-2 bg-[#FF3366] text-white rounded-full text-[9px] font-bold uppercase tracking-widest">{state.designMetadata.render_profile.model}</button>
            {trayExpanded && ['Woman', 'Man', 'Child', 'Personal'].filter(g => g !== state.designMetadata.render_profile.model).map(g => (
              <button key={g} onClick={() => { setTrayExpanded(false); handleAlter(`Switch model to ${g}`); }} className="px-6 py-2 text-gray-400 text-[9px] font-bold hover:text-[#FF3366] uppercase tracking-widest text-left">{g}</button>
            ))}
          </div>
          <button onClick={undo} disabled={state.past.length === 0 || state.isProcessing} className="w-10 h-10 flex items-center justify-center text-[#FF3366] bg-white/80 backdrop-blur-xl border border-white/50 shadow-xl rounded-full">↺</button>
        </div>
      </main>

      <footer className="h-44 bg-white border-t border-rose-50 p-6 flex flex-col gap-2 shadow-[0_-10px_40px_rgba(0,0,0,0.02)]">
        <div className="flex-1 overflow-y-auto no-scrollbar space-y-2">
          {state.history.slice(-5).map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`text-[10px] px-4 py-2 rounded-2xl max-w-[90%] ${m.role === 'user' ? 'bg-[#FF3366] text-white rounded-tr-none shadow-sm' : 'bg-rose-50/50 text-gray-600 rounded-tl-none border border-rose-100'}`}>
                {m.content}
              </div>
            </div>
          ))}
        </div>
        <div className="relative flex items-center mt-2">
          <input 
            type="text" 
            placeholder="Alter silhoutte logic..." 
            disabled={state.isProcessing}
            className="w-full bg-rose-50/30 rounded-2xl py-4 px-5 text-[11px] outline-none focus:ring-2 focus:ring-[#FF3366]/20 transition-all blue-silk-placeholder" 
            onKeyDown={e => {
              if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                handleAlter(e.currentTarget.value);
                e.currentTarget.value = '';
              }
            }} 
          />
        </div>
      </footer>

      {wizard === 'CAPTURE' && (
        <CameraCapture 
          onCapture={(b) => { setState(s => ({ ...s, userSilhouette: b })); setWizard('FABRIC'); }} 
          onClose={() => setWizard('HOME')} 
        />
      )}
      
      {wizard === 'FABRIC' && (
        <div className="fixed inset-0 z-[140] bg-black/60 backdrop-blur-xl flex flex-col items-center justify-center p-8">
          <div className="bg-white rounded-[3rem] p-12 flex flex-col items-center gap-8 shadow-2xl animate-in zoom-in duration-300">
            <h2 className="text-lg font-black uppercase text-gray-800 tracking-widest serif">Upload Material</h2>
            <div className="w-36 h-36 bg-rose-50 rounded-full flex items-center justify-center relative shadow-inner border-4 border-white scale-110">
               <FabricUploader onUpload={handleUpload} isLoading={false} />
            </div>
            <button onClick={() => setWizard('HOME')} className="text-[10px] uppercase text-gray-400 font-bold tracking-widest">Cancel Session</button>
          </div>
        </div>
      )}
      
      <style>{`@keyframes scan { 0% { top: -5%; } 100% { top: 105%; } }`}</style>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
