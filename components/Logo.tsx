
import React from 'react';

export default function Logo({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <div className={`${className} relative group`}>
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full filter drop-shadow-md"
      >
        <defs>
          <linearGradient id="thread-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FF3366" />
            <stop offset="50%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#9400D3" />
          </linearGradient>
          
          <filter id="glow">
            <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
            <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Spool Body - Tilted Modern Interpretation */}
        <g transform="rotate(-15 50 50)">
          <ellipse cx="35" cy="30" rx="12" ry="4" fill="#1a1a1a" />
          
          <rect x="25" y="34" width="20" height="3" rx="1.5" fill="#FF0000" className="animate-pulse" />
          <rect x="23" y="38" width="24" height="3" rx="1.5" fill="#FF7F00" style={{ animationDelay: '0.1s' }} className="animate-pulse" />
          <rect x="22" y="42" width="26" height="3" rx="1.5" fill="#FFFF00" style={{ animationDelay: '0.2s' }} className="animate-pulse" />
          <rect x="22" y="46" width="26" height="3" rx="1.5" fill="#00FF00" style={{ animationDelay: '0.3s' }} className="animate-pulse" />
          <rect x="23" y="50" width="24" height="3" rx="1.5" fill="#0000FF" style={{ animationDelay: '0.4s' }} className="animate-pulse" />
          <rect x="24" y="54" width="22" height="3" rx="1.5" fill="#4B0082" style={{ animationDelay: '0.5s' }} className="animate-pulse" />
          <rect x="26" y="58" width="18" height="3" rx="1.5" fill="#9400D3" style={{ animationDelay: '0.6s' }} className="animate-pulse" />

          <ellipse cx="35" cy="65" rx="14" ry="5" fill="#1a1a1a" />
        </g>

        {/* The Needle - Ultra Sleek */}
        <g className="transition-all duration-700 group-hover:translate-x-1">
          <path
            d="M75 20 L75 85"
            stroke="#1a1a1a"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <ellipse cx="75" cy="28" rx="1.5" ry="4" fill="white" stroke="#1a1a1a" strokeWidth="0.5" />
          <circle cx="75" cy="28" r="1" fill="#FF3366" className="animate-ping opacity-40" />
        </g>

        {/* Signature "S" Thread Curve */}
        <path
          d="M45 45 C 60 45, 90 35, 75 28 C 60 20, 50 60, 75 80 C 90 90, 100 70, 95 60"
          stroke="url(#thread-gradient)"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
          filter="url(#glow)"
          className="animate-[draw_4s_ease-in-out_infinite]"
          style={{ strokeDasharray: '200', strokeDashoffset: '0' }}
        />
      </svg>
      <style>{`
        @keyframes draw {
          0% { stroke-dashoffset: 200; }
          50% { stroke-dashoffset: 0; }
          100% { stroke-dashoffset: -200; }
        }
      `}</style>
    </div>
  );
}
