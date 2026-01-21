
import React, { useMemo } from 'react';

const COLORS = [
  '#FF0000', // Red
  '#FF7F00', // Orange
  '#FFFF00', // Yellow
  '#00FF00', // Green
  '#0000FF', // Blue
  '#4B0082', // Indigo
  '#9400D3'  // Violet
];

const ThreadRain: React.FC = () => {
  // Generate 42 threads (6 per color) with randomized properties
  const threads = useMemo(() => {
    return Array.from({ length: 42 }).map((_, i) => ({
      left: `${(i * 2.3) % 100}%`,
      background: COLORS[i % 7],
      duration: `${1.5 + Math.random() * 2}s`,
      delay: `${Math.random() * 3}s`,
      height: `${60 + Math.random() * 60}px`
    }));
  }, []);

  return (
    <div className="thread-rain-container">
      {threads.map((t, idx) => (
        <div
          key={idx}
          className="thread"
          style={{
            left: t.left,
            background: t.background,
            animationDuration: t.duration,
            animationDelay: t.delay,
            height: t.height,
            boxShadow: `0 0 8px ${t.background}`
          }}
        />
      ))}
    </div>
  );
};

export default ThreadRain;
