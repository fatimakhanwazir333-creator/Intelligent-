
import React, { useState } from 'react';
import { 
  Gender, 
  FabricData, 
  GarmentConfig, 
  SessionState, 
  ClientDetails,
  HistorySnapshot
} from './types.ts';
import { INITIAL_GARMENT_CONFIG } from './constants.ts';
import { analyzeFabric, renderGarment, updateDesignLogic } from './services/gemini.ts';
import Visualizer from './components/Visualizer.tsx';
import ChatInterface from './components/ChatInterface.tsx';
import FabricUploader from './components/FabricUploader.tsx';
import ClientForm from './components/ClientForm.tsx';
import FabricInspector from './components/FabricInspector.tsx';
import CameraCapture from './components/CameraCapture.tsx';
import Logo from './components/Logo.tsx';

type WizardStep = 'HOME' | 'CAPTURE' | 'FABRIC' | 'CLIENT' | 'READY';

export default function App() {
  const [state, setState] = useState<SessionState>({
    fabric: null,
    previewUrl: null,
    history: [],
    isProcessing: false,
    designMetadata: INITIAL_GARMENT_CONFIG,
    userSilhouette: undefined,
    past: [],
    future: []
  });

  const [wizardStep, setWizardStep] = useState<WizardStep>('HOME');
  const [isFabricInspectorOpen, setIsFabricInspectorOpen] = useState(false);
  const [isModelTrayExpanded, setIsModelTrayExpanded] = useState(false);
  const [activePath, setActivePath] = useState<'STOCK' | 'PERSONAL' | null>(null);

  const pushToHistory = (config: GarmentConfig, previewUrl: string | null) => {
    setState(prev => ({
      ...prev,
      past: [...prev.past, { config: prev.designMetadata, previewUrl: prev.previewUrl }],
      future: []
    }));
  };

  const handleUndo = () => {
    if (state.past.length === 0 || state.isProcessing) return;
    const previous = state.past[state.past.length - 1];
    const newPast = state.past.slice(0, state.past.length - 1);
    
    setState(prev => ({
      ...prev,
      designMetadata: previous.config,
      previewUrl: previous.previewUrl,
      past: newPast,
      future: [{ config: prev.designMetadata, previewUrl: prev.previewUrl }, ...prev.future]
    }));
  };

  const handleRedo = () => {
    if (state.future.length === 0 || state.isProcessing) return;
    const next = state.future[0];
    const newFuture = state.future.slice(1);

    setState(prev => ({
      ...prev,
      designMetadata: next.config,
      previewUrl: next.previewUrl,
      future: newFuture,
      past: [...prev.past, { config: prev.designMetadata, previewUrl: prev.previewUrl }]
    }));
  };

  const resetDesign = async () => {
    if (state.isProcessing || !state.fabric) return;
    pushToHistory(state.designMetadata, state.previewUrl);
    setState(prev => ({ ...prev, designMetadata: INITIAL_GARMENT_CONFIG, isProcessing: true }));
    try {
      const preview = await renderGarment(state.fabric.image, INITIAL_GARMENT_CONFIG);
      setState(prev => ({ ...prev, previewUrl: preview, isProcessing: false }));
    } catch (error) {
      setState(prev => ({ ...prev, isProcessing: false }));
    }
  };

  const resetToHome = () => {
    setWizardStep('HOME');
    setState({
      fabric: null,
      previewUrl: null,
      history: [],
      isProcessing: false,
      designMetadata: INITIAL_GARMENT_CONFIG,
      userSilhouette: undefined,
      past: [],
      future: []
    });
    setActivePath(null);
  };

  const handleGenderSwitch = async (newGender: Gender) => {
    setIsModelTrayExpanded(false);
    if (state.isProcessing || state.designMetadata.render_profile.model === newGender) return;

    pushToHistory(state.designMetadata, state.previewUrl);

    const updatedConfig: GarmentConfig = {
      ...state.designMetadata,
      render_profile: {
        ...state.designMetadata.render_profile,
        model: newGender,
        userSilhouette: newGender === 'Personal' ? state.userSilhouette : undefined
      }
    };

    setState(prev => ({ ...prev, designMetadata: updatedConfig, isProcessing: true }));

    if (state.fabric) {
      try {
        const preview = await renderGarment(state.fabric.image, updatedConfig);
        setState(prev => ({ ...prev, previewUrl: preview, isProcessing: false }));
      } catch (error) {
        setState(prev => ({ ...prev, isProcessing: false }));
      }
    }
  };

  const initiateProcessing = async (clientInfo?: ClientDetails) => {
    if (!state.fabric) return;
    setWizardStep('READY');
    
    const updatedConfig: GarmentConfig = {
      ...state.designMetadata,
      render_profile: {
        ...state.designMetadata.render_profile,
        model: activePath === 'PERSONAL' ? 'Personal' : state.designMetadata.render_profile.model,
        userSilhouette: activePath === 'PERSONAL' ? state.userSilhouette : undefined
      }
    };

    setState(prev => ({ ...prev, isProcessing: true, clientDetails: clientInfo, designMetadata: updatedConfig }));
    
    try {
      const analysis = await analyzeFabric(state.fabric!.image);
      setState(prev => ({
        ...prev,
        history: [{
          role: 'assistant',
          content: `Synthesis initiated. ${analysis}`,
          timestamp: Date.now()
        }]
      }));

      const preview = await renderGarment(state.fabric!.image, updatedConfig);
      setState(prev => ({ ...prev, previewUrl: preview, isProcessing: false }));
    } catch (error) {
      setState(prev => ({ ...prev, isProcessing: false }));
    }
  };

  const handleAlteration = async (userPrompt: string) => {
    if (!state.fabric) return;
    const currentSnapshot = { config: state.designMetadata, previewUrl: state.previewUrl };
    setState(prev => ({ ...prev, isProcessing: true }));
    try {
      const { updatedConfig, message } = await updateDesignLogic(
        userPrompt, 
        state.designMetadata, 
        state.history.slice(-10).map(h => ({ role: h.role, content: h.content }))
      );
      
      setState(prev => ({ 
        ...prev, 
        past: [...prev.past, currentSnapshot],
        future: [],
        designMetadata: updatedConfig,
        history: [...prev.history, { 
          role: 'user', 
          content: userPrompt, 
          timestamp: Date.now() 
        }, { 
          role: 'assistant', 
          content: message, 
          timestamp: Date.now() 
        }]
      }));

      const preview = await renderGarment(state.fabric.image, updatedConfig);
      setState(prev => ({ ...prev, previewUrl: preview, isProcessing: false }));
    } catch (error) {
      setState(prev => ({ ...prev, isProcessing: false }));
    }
  };

  const currentProfile = state.designMetadata.render_profile;
  const mods = currentProfile.modifications;

  if (wizardStep === 'HOME' && !state.previewUrl) {
    return (
      <div className="flex flex-col h-full bg-[#FFF9FA] items-center justify-center p-8 space-y-12 animate-in fade-in zoom-in duration-500">
        <div className="flex flex-col items-center gap-4 text-center">
          <Logo className="w-24 h-24" />
          <div className="cursor-default">
            <h1 className="text-3xl stitch-lab-signature font-black">STITCH LAB Ai</h1>
            <p className="text-[10px] mono uppercase tracking-[0.4em] text-gray-400">Atelier Design Suite</p>
          </div>
        </div>

        <div className="w-full space-y-4">
          <button 
            onClick={() => { setActivePath('STOCK'); setWizardStep('FABRIC'); }}
            className="w-full p-6 bg-white border border-rose-50 rounded-[2rem] shadow-sm hover:shadow-md transition-all group flex flex-col items-center gap-2"
          >
            <span className="text-xs font-black uppercase tracking-widest serif text-gray-800">Portfolio Synthesis</span>
            <span className="text-[9px] mono uppercase text-rose-300">Fast Mode • Stock Models</span>
          </button>

          <button 
            onClick={() => { setActivePath('PERSONAL'); setWizardStep('CAPTURE'); }}
            className="w-full p-6 bg-[#FF3366] rounded-[2rem] shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex flex-col items-center gap-2"
          >
            <span className="text-xs font-black uppercase tracking-widest serif text-white">Private Atelier</span>
            <span className="text-[9px] mono uppercase text-rose-100 opacity-80">Personal Profile • Custom Map</span>
          </button>
        </div>
        
        <p className="text-[8px] mono text-gray-300 uppercase absolute bottom-8 tracking-widest">Architectural Fashion Engine</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#FFF9FA] overflow-hidden animate-in fade-in duration-500">
      <header className="px-6 py-3 flex flex-col items-center border-b border-rose-50 bg-white/95 backdrop-blur-xl z-20 flex-none shadow-sm">
        <div className="flex justify-between w-full items-center">
          <div className="flex items-center gap-3">
            <button onClick={resetToHome} className="hover:scale-105 active:scale-95 transition-transform">
              <Logo className="w-10 h-10" />
            </button>
            <button onClick={resetToHome} className="flex flex-col text-left group">
              <h1 className="text-lg stitch-lab-signature tracking-tight leading-none font-black group-hover:opacity-80 transition-opacity">STITCH LAB Ai</h1>
              <span className="text-[7px] mono text-gray-400 font-bold uppercase tracking-[0.25em] mt-0.5">Atelier Session</span>
            </button>
          </div>
          <button onClick={resetToHome} className="text-gray-400 p-2 hover:bg-rose-50 rounded-full transition-all active:scale-90" title="Home">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </button>
        </div>
      </header>

      <main className="flex-[9] relative bg-white overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 z-0">
          <Visualizer 
            previewUrl={state.previewUrl} 
            isLoading={state.isProcessing} 
            fabricImage={state.fabric?.image || null}
            onInspectFabric={() => setIsFabricInspectorOpen(true)}
          />
        </div>

        {state.previewUrl && (
          <>
            {/* Design Specification HUD */}
            <div className="absolute top-6 right-6 z-10 pointer-events-none flex flex-col items-end gap-2">
               <div className="bg-white/70 backdrop-blur-xl px-4 py-2 rounded-2xl border border-white/50 shadow-sm flex flex-col gap-1 text-right">
                  <div className="flex flex-col">
                    <span className="text-[6px] mono uppercase text-gray-400 tracking-tighter">Current Fit</span>
                    <span className="text-[8px] font-black text-[#FF3366] uppercase truncate max-w-[120px]">{mods.fit}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[6px] mono uppercase text-gray-400 tracking-tighter">Sleeves</span>
                    <span className="text-[8px] font-black text-gray-800 uppercase">{mods.sleeves}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[6px] mono uppercase text-gray-400 tracking-tighter">Details</span>
                    <span className="text-[8px] font-black text-gray-800 uppercase">{mods.pockets} Pockets</span>
                  </div>
               </div>
            </div>

            <div className="absolute bottom-6 left-6 z-10 pointer-events-none flex items-center gap-2">
              <div className={`bg-white/90 backdrop-blur-2xl p-1.5 rounded-[2rem] border border-white/50 shadow-xl pointer-events-auto flex flex-col gap-1 w-fit transition-all duration-300 overflow-hidden ${isModelTrayExpanded ? 'max-h-60' : 'max-h-12'}`}>
                <button
                  onClick={() => setIsModelTrayExpanded(!isModelTrayExpanded)}
                  className={`px-6 py-2 rounded-full text-[9px] font-bold uppercase tracking-widest transition-all brand-button flex items-center justify-between gap-3 ${isModelTrayExpanded ? 'text-gray-400' : 'bg-[#FF3366] text-white shadow-inner'}`}
                >
                  {currentProfile.model}
                  <svg className={`w-3 h-3 transition-transform duration-300 ${isModelTrayExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {isModelTrayExpanded && (['Woman', 'Man', 'Child', 'Personal'] as Gender[]).filter(g => g !== currentProfile.model).map((gender) => (
                  <button
                    key={gender}
                    onClick={() => handleGenderSwitch(gender)}
                    disabled={state.isProcessing}
                    className="px-6 py-2 rounded-full text-[9px] font-bold uppercase tracking-widest transition-all brand-button text-gray-400 hover:bg-rose-50 hover:text-[#FF3366] text-left"
                  >
                    {gender}
                  </button>
                ))}
              </div>

              {/* Enhanced History Controls */}
              <div className="flex gap-1.5 pointer-events-auto bg-white/80 backdrop-blur-2xl p-1 rounded-full border border-white/50 shadow-xl">
                <button onClick={handleUndo} disabled={state.past.length === 0 || state.isProcessing} className="w-9 h-9 flex items-center justify-center text-[#FF3366] disabled:opacity-20 hover:bg-rose-50 rounded-full transition-all">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
                </button>
                <button onClick={resetDesign} disabled={state.isProcessing} className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-[#FF3366] hover:bg-rose-50 rounded-full transition-all" title="Reset Silhouette">
                   <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                </button>
                <button onClick={handleRedo} disabled={state.future.length === 0 || state.isProcessing} className="w-9 h-9 flex items-center justify-center text-[#FF3366] disabled:opacity-20 hover:bg-rose-50 rounded-full transition-all">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10H11a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" /></svg>
                </button>
              </div>
            </div>
          </>
        )}
      </main>

      <footer className="flex-[1] flex flex-col bg-white border-t border-rose-50 shadow-inner z-20 min-h-[90px] max-h-[140px]">
        <div className="flex-1 min-h-0 overflow-hidden">
          <ChatInterface messages={state.history} onSendMessage={handleAlteration} isProcessing={state.isProcessing} />
        </div>
      </footer>

      {wizardStep === 'CAPTURE' && <CameraCapture onCapture={(b) => { setState(p => ({ ...p, userSilhouette: b })); setWizardStep('FABRIC'); }} onClose={() => setWizardStep('HOME')} />}
      {wizardStep === 'FABRIC' && (
        <div className="fixed inset-0 z-[140] bg-black/60 backdrop-blur-xl flex flex-col items-center justify-center p-8">
          <div className="w-full max-sm bg-white rounded-[2.5rem] p-10 flex flex-col items-center gap-8 shadow-2xl animate-in zoom-in">
            <h2 className="text-lg font-black uppercase tracking-widest serif text-gray-800">Upload Fabric</h2>
            <div className="w-32 h-32 bg-rose-50 rounded-full flex items-center justify-center relative shadow-inner">
               <FabricUploader onUpload={(b) => { setState(p => ({ ...p, fabric: { id: Date.now().toString(), image: b } })); setWizardStep('CLIENT'); }} isLoading={false} />
            </div>
            <button onClick={() => setWizardStep('HOME')} className="text-[9px] mono uppercase text-gray-400">Cancel</button>
          </div>
        </div>
      )}
      {wizardStep === 'CLIENT' && <ClientForm onSubmit={initiateProcessing} onSkip={() => initiateProcessing()} onLaunchCamera={() => setWizardStep('CAPTURE')} hasSilhouette={!!state.userSilhouette} initialMode={activePath === 'PERSONAL' ? 'Personal' : 'Stock'} />}
      {isFabricInspectorOpen && state.fabric && <FabricInspector image={state.fabric.image} onClose={() => setIsFabricInspectorOpen(false)} />}
    </div>
  );
}
