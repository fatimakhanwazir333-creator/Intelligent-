
import React, { useRef } from 'react';

interface FabricUploaderProps {
  onUpload: (base64: string) => void;
  isLoading: boolean;
}

const FabricUploader: React.FC<FabricUploaderProps> = ({ onUpload, isLoading }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) onUpload(event.target.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="w-full h-full">
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={isLoading}
        className="w-full h-full flex flex-col items-center justify-center relative overflow-hidden group"
        title="Upload Material Swatch"
      >
        <svg className="w-8 h-8 text-white transition-transform group-hover:rotate-90 duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
        </svg>

        {isLoading && (
          <div className="absolute inset-0 bg-blue-600 flex items-center justify-center z-10">
            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          </div>
        )}
      </button>
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept="image/*"
        onChange={handleFileChange}
      />
    </div>
  );
};

export default FabricUploader;
