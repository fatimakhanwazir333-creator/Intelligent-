
import React, { useState, useRef, useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleGenAI } from "@google/genai";

// --- TYPES ---
export type Gender = 'Man' | 'Woman' | 'Child' | 'Personal';
export interface FabricData { id: string; image: string; analysis?: string; }
export interface ClientDetails { name: string; notes: string; priority: 'Standard' | 'Express'; silhouetteMode: 'Stock' | 'Personal'; }
export interface GarmentModifications { sleeves: string; pockets: number; fit: string; }
export interface RenderProfile { model: Gender; userSilhouette?: string; background: 'minimal_white' | 'original'; modifications: GarmentModifications; }
export interface GarmentConfig { kernel_state: 'ACTIVE' | 'IDLE'; render_profile: RenderProfile; }
export interface HistorySnapshot { config: GarmentConfig; previewUrl: string | null; }
export interface GroundingSource { title: string; uri: string; }
export interface ChatMessage { role: 'user' | 'assistant'; content: string; timestamp: number; data?: any; sources?: GroundingSource[]; }
export enum ModelType { GEMINI_TEXT = 'gemini-3-flash-preview', GEMINI_IMAGE = 'gemini-2.5-flash-image' }
export interface SessionState { fabric: FabricData | null; previewUrl: string | null; history: ChatMessage[]; isProcessing: boolean; designMetadata: GarmentConfig; clientDetails?: ClientDetails; userSilhouette?: string; past: HistorySnapshot[]; future: HistorySnapshot[]; }

// --- CONSTANTS ---
export const INITIAL_GARMENT_CONFIG: GarmentConfig = {
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

export const SYSTEM_PROMPT = `You are Arslan Wazir, a world-class luxury fashion design engineer.
CORE MISSION: Manage state of couture garments with precision. 
CRITICAL RULE: DESIGN CONTINUITY. Preserve existing attributes when modifying one.
JSON OUTPUT: Provide explanation then COMPLETE state JSON.`;

// --- SERVICES ---
// Use named parameter and direct access to process.env.API_KEY as per guidelines.
const getAIClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

const analyzeFabric = async (fabricBase64: string): Promise<string> => {
  const ai = getAIClient();
  // Fixed: Use correct Content object structure { parts: [...] } instead of an array.
  const response = await ai.models.generateContent({
    model: ModelType.GEMINI_TEXT,
    contents: { 
      parts: [
        { inlineData: { data: fabricBase64.split(',')[1], mimeType: 'image/jpeg' } }, 
        { text: "Analyze this luxury fabric. Describe its artistic potential for haute couture in one elegant sentence." }
      ] 
    }
  });
  return response.text || "Material essence captured by Arslan Wazir.";
};

const updateDesignLogic = async (userPrompt: string, currentConfig: GarmentConfig, chatHistory: { role: string, content: string }[]) => {
  const ai = getAIClient();
  const historyParts = chatHistory.map(h => `${h.role === 'user' ? 'Client' : 'Arslan Wazir'}: ${h.content}`).join('\n');
  const prompt = `CURRENT_ATELIER_STATE: ${JSON.stringify(currentConfig)}\nCLIENT_WISH: "${userPrompt}"\n${SYSTEM_PROMPT}\nPREVIOUS_CONVERSATION:\n${historyParts}`;
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: prompt,
    config: { thinkingConfig: { thinkingBudget: 4000 } }
  });

  const text = response.text || '';
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Aesthetic manifest missing.");
    const data = JSON.parse(jsonMatch[0]);
    const displayMessage = text.replace(/\{[\s\S]*\}/, '').replace(/```json|```/g, '').trim() || "The design has been refined.";
    
    return { 
      updatedConfig: {
        ...currentConfig,
        render_profile: { ...currentConfig.render_profile, modifications: { ...currentConfig.render_profile.modifications, ...data.render_profile.modifications } }
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
  
  // Fix: Explicitly type parts to any[] to avoid TypeScript narrowing to the first element's type,
  // preventing errors when pushing parts with different keys (inlineData vs text).
  const parts: any[] = [{ inlineData: { data: fabricBase64.split(',')[1], mimeType: 'image/jpeg' } }];
  if (isPersonal) parts.push({ inlineData: { data: profile.userSilhouette!.split(',')[1], mimeType: 'image/jpeg' } });
  parts.push({ text: `High-fashion editorial. Redress model/silhouette using this fabric. Fit: ${mods.fit}. Sleeves: ${mods.sleeves}. Pockets: ${mods.pockets}. Editorial quality.` });

  const response = await ai.models.generateContent({
    model: ModelType.GEMINI_IMAGE,
    contents: { parts },
    config: { imageConfig: { aspectRatio: "9:16", imageSize: "1K" } }
  });

  const imgPart = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
  if (imgPart?.inlineData?.data) return `data:image/png;base64,${imgPart.inlineData.data}`;
  throw new Error("Synthesis disrupted.");
};

// --- COMPONENTS ---
const Logo = ({ className = "w-10 h-10" }) => (
  <div className={`${className} relative`}>
    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
      <path d="M75 20 L75 85" stroke="#1a1a1a" strokeWidth="1.5" />
      <path d="M45 45 C 60 45, 90 35, 75 28 C 60 20, 50 60, 75 80" stroke="#FF3366" strokeWidth="2.5" fill="none" />
    </svg>
  </div>
);

const StitchingAnimation = () => (
  <div className="relative w-48 h-48 flex items-center justify-center animate-pulse">
    <svg viewBox="0 0 140 140" className="w-full h-full" fill="none">
      <path d="M70 25 L95 25 L115 45 L105 55 L105 115 L35 115 L35 55 L25 45 L45 25 Z" stroke="#FF3366" strokeWidth="2" />
    </svg>
  </div>
);

const App = () => {
  const [state, setState] = useState<SessionState>({
    fabric: null, previewUrl: null, history: [], isProcessing: false,
    designMetadata: INITIAL_GARMENT_CONFIG, userSilhouette: undefined, past: [], future: []
  });
  const [wizardStep, setWizardStep] = useState<'HOME' | 'READY'>('HOME');

  const handleUpload = async (b64: string) => {
    setState(s => ({ ...s, isProcessing: true, fabric: { id: '1', image: b64 } }));
    setWizardStep('READY');
    try {
      const analysis = await analyzeFabric(b64);
      const preview = await renderGarment(b64, state.designMetadata);
      setState(s => ({ ...s, previewUrl: preview, isProcessing: false, history: [{ role: 'assistant', content: analysis, timestamp: Date.now() }] }));
    } catch (e) { setState(s => ({ ...s, isProcessing: false })); }
  };

  const handleAlter = async (prompt: string) => {
    if (!state.fabric) return;
    setState(s => ({ ...s, isProcessing: true }));
    try {
      const { updatedConfig, message } = await updateDesignLogic(prompt, state.designMetadata, state.history);
      const preview = await renderGarment(state.fabric.image, updatedConfig);
      setState(s => ({ ...s, designMetadata: updatedConfig, previewUrl: preview, isProcessing: false, history: [...s.history, { role: 'user', content: prompt, timestamp: Date.now() }, { role: 'assistant', content: message, timestamp: Date.now() }] }));
    } catch (e) { setState(s => ({ ...s, isProcessing: false })); }
  };

  if (wizardStep === 'HOME') {
    return (
      <div className="flex flex-col h-full items-center justify-center p-8 bg-[#FFF9FA]">
        <Logo className="w-24 h-24 mb-6" />
        <h1 className="text-3xl font-black stitch-lab-signature mb-2">STITCH LAB Ai</h1>
        <p className="text-[10px] mono uppercase tracking-[0.3em] text-gray-400 mb-12">Atelier Design Suite</p>
        <input type="file" id="fabric" hidden onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => handleUpload(ev.target?.result as string);
            reader.readAsDataURL(file);
          }
        }} />
        <label htmlFor="fabric" className="w-full max-w-xs p-6 bg-[#FF3366] rounded-[2rem] text-white text-center font-bold uppercase tracking-widest cursor-pointer shadow-xl hover:scale-105 transition-all">
          Upload Material
        </label>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#FFF9FA] overflow-hidden">
      <header className="p-4 border-b bg-white flex items-center justify-between">
        <div className="flex items-center gap-2">
           <Logo className="w-8 h-8" />
           <span className="font-black text-xs uppercase tracking-tighter">Atelier Session</span>
        </div>
        <button onClick={() => setWizardStep('HOME')} className="text-[10px] font-bold text-gray-400">EXIT</button>
      </header>
      
      <main className="flex-1 relative bg-white flex items-center justify-center overflow-hidden">
        {state.isProcessing && (
          <div className="absolute inset-0 z-20 bg-white/80 backdrop-blur-md flex flex-col items-center justify-center">
            <StitchingAnimation />
            <span className="mt-4 text-[10px] font-black uppercase text-[#FF3366] animate-pulse">Synthesizing...</span>
          </div>
        )}
        {state.previewUrl ? (
          <img src={state.previewUrl} className="max-h-full object-contain p-4 rounded-[2rem]" alt="Preview" />
        ) : <StitchingAnimation />}
      </main>

      <footer className="h-40 bg-white border-t p-6 flex flex-col">
        <div className="flex-1 overflow-y-auto mb-4 no-scrollbar">
          {state.history.map((m, i) => (
            <div key={i} className={`text-[10px] mb-2 ${m.role === 'user' ? 'text-right text-[#FF3366]' : 'text-left text-gray-500'}`}>
              {m.content}
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input 
            type="text" 
            placeholder="Alter design..."
            className="flex-1 bg-rose-50/50 rounded-xl px-4 text-xs outline-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleAlter(e.currentTarget.value);
                e.currentTarget.value = '';
              }
            }}
          />
        </div>
      </footer>
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<React.StrictMode><App /></React.StrictMode>);
