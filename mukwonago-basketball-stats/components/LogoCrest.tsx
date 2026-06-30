import React from 'react';

interface LogoCrestProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function LogoCrest({ className = '', size = 'md' }: LogoCrestProps) {
  const dimensions = {
    sm: { width: 48, height: 48, text: 'text-xs' },
    md: { width: 80, height: 80, text: 'text-sm' },
    lg: { width: 120, height: 120, text: 'text-base' },
  }[size];

  return (
    <div id="muk-logo-crest-container" className={`flex flex-col items-center justify-center ${className}`}>
      <div id="muk-logo-svg-wrapper" className="relative transition-transform duration-300 hover:scale-105">
        <svg
          width={dimensions.width}
          height={dimensions.height}
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="drop-shadow-[0_4px_10px_rgba(26,79,203,0.3)]"
        >
          {/* Outer Shield Border */}
          <path
            d="M50 5 L85 20 V55 C85 75 50 95 50 95 C50 95 15 75 15 55 V20 L50 5 Z"
            fill="#112B4F"
            stroke="#1A4FCB"
            strokeWidth="4"
          />
          
          {/* Inner Accent Path */}
          <path
            d="M50 9 L80 22 V53 C80 70 50 88 50 88 C50 88 20 70 20 53 V22 L50 9 Z"
            fill="#0A1A33"
            stroke="#F6B61C"
            strokeWidth="2"
          />

          {/* Basketball lines inside shield */}
          <circle cx="50" cy="50" r="26" fill="#1A4FCB" stroke="#F6B61C" strokeWidth="2.5" />
          
          {/* Basketball Seams */}
          <path
            d="M26.5 50 H73.5"
            stroke="#0A1A33"
            strokeWidth="2"
          />
          <path
            d="M50 26.5 V73.5"
            stroke="#0A1A33"
            strokeWidth="2"
          />
          <path
            d="M31.5 31.5 C40 40 40 60 31.5 68.5"
            stroke="#0A1A33"
            strokeWidth="2"
            fill="none"
          />
          <path
            d="M68.5 31.5 C60 40 60 60 68.5 68.5"
            stroke="#0A1A33"
            strokeWidth="2"
            fill="none"
          />

          {/* Centered Crest Text */}
          <rect x="32" y="42" width="36" height="16" rx="3" fill="#F6B61C" stroke="#143A91" strokeWidth="1" />
          <text
            x="50"
            y="54"
            fill="#0A1A33"
            fontSize="10"
            fontWeight="bold"
            textAnchor="middle"
            fontFamily="monospace"
          >
            MUK
          </text>
        </svg>
      </div>

      <div id="muk-logo-text-group" className="text-center mt-2">
        <span className={`block font-black tracking-wider text-brand-gold ${size === 'lg' ? 'text-lg' : 'text-sm'}`}>
          MUKWONAGO
        </span>
        <span className="block text-[9px] font-bold uppercase tracking-[0.2em] text-brand-white/80">
          Junior Indians
        </span>
      </div>
    </div>
  );
}
