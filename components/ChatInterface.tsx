
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  isProcessing: boolean;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ messages, onSendMessage, isProcessing }) => {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isProcessing) {
      onSendMessage(input);
      setInput('');
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-2 space-y-2 scroll-smooth no-scrollbar">
        {messages.slice(-5).map((msg, idx) => (
          <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`max-w-[95%] px-4 py-2 text-[9px] leading-relaxed shadow-sm ${
              msg.role === 'user' 
                ? 'bg-[#FF3366] text-white rounded-[14px] rounded-tr-none' 
                : 'bg-[#FFF9FA] text-gray-600 rounded-[14px] rounded-tl-none border border-rose-50 font-medium'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        {isProcessing && (
           <div className="flex justify-start">
             <div className="px-4 py-2 bg-rose-50/20 rounded-full flex gap-1 items-center">
                <div className="w-1 h-1 bg-[#FF3366] rounded-full animate-bounce"></div>
                <div className="w-1 h-1 bg-[#FF3366] rounded-full animate-bounce delay-75"></div>
                <div className="w-1 h-1 bg-[#FF3366] rounded-full animate-bounce delay-150"></div>
             </div>
           </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="px-6 pb-2 pt-1 border-t border-rose-50 bg-white flex-none">
        <div className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isProcessing}
            placeholder="Alter silhouette..."
            className="w-full bg-[#FFF9FA] border border-rose-50 rounded-xl py-3 pl-4 pr-12 text-[10px] text-gray-800 focus:ring-1 focus:ring-[#FF3366]/20 transition-all outline-none placeholder:text-gray-300"
          />
          <button
            type="submit"
            disabled={!input.trim() || isProcessing}
            className="absolute right-1.5 w-8 h-8 bg-[#FF3366] text-white rounded-lg flex items-center justify-center disabled:opacity-20 transition-all shadow-md brand-button"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatInterface;
