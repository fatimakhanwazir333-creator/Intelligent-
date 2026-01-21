
import React, { useRef, useState, useEffect } from 'react';

interface CameraCaptureProps {
  onCapture: (base64: string) => void;
  onClose: () => void;
}

const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isFlashOn, setIsFlashOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  useEffect(() => {
    async function startCamera() {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: 'environment',
            width: { ideal: 1080 }, 
            height: { ideal: 1920 } 
          }, 
          audio: false 
        });
        setStream(s);
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          setIsReady(true);
        }

        const track = s.getVideoTracks()[0];
        const capabilities = (track as any).getCapabilities?.();
        if (capabilities && capabilities.torch) {
          setHasTorch(true);
        }
      } catch (err) {
        console.error("Camera access denied", err);
        onClose();
      }
    }
    startCamera();
    return () => {
      stream?.getTracks().forEach(t => t.stop());
    };
  }, []);

  const toggleFlash = async () => {
    if (!stream || !hasTorch) return;
    const track = stream.getVideoTracks()[0];
    try {
      await (track as any).applyConstraints({
        advanced: [{ torch: !isFlashOn }]
      });
      setIsFlashOn(!isFlashOn);
    } catch (err) {
      console.error("Flash toggle failed", err);
    }
  };

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const data = canvas.toDataURL('image/jpeg', 0.9);
        setCapturedImage(data);
      }
    }
  };

  if (capturedImage) {
    return (
      <div className="fixed inset-0 z-[150] bg-black flex flex-col items-center justify-center p-6 space-y-12">
        <div className="w-full max-w-md aspect-[9/16] bg-zinc-900 rounded-[2rem] overflow-hidden shadow-2xl relative">
          <img src={capturedImage} alt="Captured Silhouette" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none"></div>
          <div className="absolute bottom-6 inset-x-0 text-center">
            <span className="text-[10px] mono text-white uppercase tracking-[0.4em] drop-shadow-md">Portrait Verified</span>
          </div>
        </div>
        
        <div className="flex flex-col gap-4 w-full max-w-xs">
          <button 
            onClick={() => onCapture(capturedImage)}
            className="w-full py-5 bg-[#FF3366] text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-lg active:scale-95 transition-all"
          >
            Confirm & Continue
          </button>
          <button 
            onClick={() => setCapturedImage(null)}
            className="w-full py-4 text-white/60 text-[10px] mono font-bold uppercase hover:text-white"
          >
            Retake Photo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[150] bg-black flex flex-col items-center justify-center overflow-hidden">
      <div className="absolute top-6 left-6 right-6 flex justify-between items-center z-20">
        <div className="flex flex-col">
          <span className="text-[10px] mono text-white/50 uppercase tracking-widest">Atelier Lens v1.1</span>
          <span className="text-[8px] mono text-[#FF3366] uppercase">Precision Silhouette Mode</span>
        </div>
        
        <div className="flex gap-4 items-center">
          {hasTorch && (
            <button 
              onClick={toggleFlash}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isFlashOn ? 'bg-[#FF3366] text-white shadow-[0_0_15px_rgba(255,51,102,0.6)]' : 'bg-white/10 text-white/70 backdrop-blur'}`}
            >
              <svg className="w-5 h-5" fill={isFlashOn ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </button>
          )}
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/10 backdrop-blur flex items-center justify-center text-white">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M6 18L18 6M6 6l12 12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>

      <div className="relative w-full h-full max-w-md bg-zinc-900 overflow-hidden flex items-center justify-center">
        {!isReady && (
          <div className="flex flex-col items-center gap-4">
             <div className="w-8 h-8 border-2 border-[#FF3366] border-t-transparent rounded-full animate-spin"></div>
             <span className="text-[10px] mono text-white/40 uppercase">Activating Lens...</span>
          </div>
        )}
        <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
           <svg viewBox="0 0 100 100" className="w-[80%] h-[80%] opacity-20 text-[#FF3366]" fill="none" stroke="currentColor">
              <path d="M50 15 C 40 15, 35 25, 35 30 C 35 35, 45 35, 50 35 C 55 35, 65 35, 65 30 C 65 25, 60 15, 50 15 Z" strokeWidth="0.5"/>
              <path d="M35 35 L25 55 L30 85 L70 85 L75 55 L65 35 Z" strokeWidth="0.5"/>
              <path d="M35 85 L35 95 M65 85 L65 95" strokeWidth="0.5"/>
           </svg>
           <div className="absolute bottom-32 text-center">
              <p className="text-[9px] mono text-white/60 uppercase tracking-[0.3em]">Align silhouette in frame</p>
           </div>
        </div>
      </div>

      <div className="absolute bottom-12 inset-x-0 flex flex-col items-center gap-8 z-20">
        <button onClick={takePhoto} className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center group active:scale-90 transition-all">
          <div className="w-14 h-14 bg-white rounded-full group-hover:scale-95 transition-transform"></div>
        </button>
        <span className="text-[8px] mono text-[#FF3366] uppercase tracking-[0.5em] animate-pulse">Deep Mapping Engine Ready</span>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default CameraCapture;
