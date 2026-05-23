import React from 'react';

const SyncLoader = () => {
  return (
    <div className="flex items-center justify-center overflow-visible w-8 h-8 relative">
      <style>
        {`
          @keyframes spinOuter2 { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }
          @keyframes spinInner2 { 0%{transform:rotate(0deg)} 100%{transform:rotate(-360deg)} }
          @keyframes dropSync   { 0%{opacity:0;transform:translateY(-5px)} 25%{opacity:1} 100%{opacity:0;transform:translateY(12px)} }
          @keyframes ripSync    { 0%{r:1;opacity:0.9} 100%{r:14;opacity:0} }
          @keyframes pulseGlow  { 0%,100%{opacity:0.65} 50%{opacity:1} }
          @keyframes waterS     { 0%{stroke-dashoffset:0} 100%{stroke-dashoffset:-50} }

          .sync-outer { transform-origin:44px 44px; animation:spinOuter2 3s linear infinite; }
          .sync-inner { transform-origin:44px 44px; animation:spinInner2 2s linear infinite; }
          .sd1 { animation:dropSync 1.4s ease-in infinite 0s; }
          .sd2 { animation:dropSync 1.4s ease-in infinite 0.35s; }
          .sd3 { animation:dropSync 1.4s ease-in infinite 0.7s; }
          .rs1 { animation:ripSync 1.8s ease-out infinite 0s; }
          .rs2 { animation:ripSync 1.8s ease-out infinite 0.6s; }
          .logo-pulse { animation:pulseGlow 2.4s ease-in-out infinite; }
          .wst2 { stroke-dasharray:4 3; animation:waterS 0.8s linear infinite; }
        `}
      </style>
      <svg className="logo-pulse absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" width="40" height="40" viewBox="0 0 88 100" style={{overflow:'visible'}}>
        <g className="sync-outer">
          <circle cx="44" cy="44" r="40" fill="none" stroke="#1a4d5599" strokeWidth="1.5" strokeDasharray="4 4"/>
          <circle cx="44" cy="5"  r="3" fill="#3ab3c4" opacity="0.9"/>
          <circle cx="79" cy="23" r="2.5" fill="#3ab3c4" opacity="0.7"/>
          <circle cx="79" cy="65" r="3" fill="#3ab3c4" opacity="0.85"/>
          <circle cx="44" cy="83" r="2.5" fill="#3ab3c4" opacity="0.7"/>
          <circle cx="9"  cy="65" r="3" fill="#3ab3c4" opacity="0.9"/>
          <circle cx="9"  cy="23" r="2.5" fill="#3ab3c4" opacity="0.7"/>
        </g>

        <g className="sync-inner">
          <circle cx="44" cy="44" r="29" fill="none" stroke="#2d6e3a88" strokeWidth="1" strokeDasharray="2 6"/>
        </g>

        <circle cx="44" cy="44" r="26" fill="none" stroke="#3ab3c4" strokeWidth="2"/>

        <path d="M44,44 L44,18 A26,26 0 0,1 66.5,31 Z" fill="#3ab3c4" opacity="0.85"/>
        <path d="M44,44 L66.5,57 A26,26 0 0,1 44,70 Z" fill="#3ab3c4" opacity="0.85"/>
        <path d="M44,44 L21.5,57 A26,26 0 0,1 21.5,31 Z" fill="#3ab3c4" opacity="0.85"/>

        <line x1="44" y1="44" x2="44"   y2="18" stroke="#00000066" strokeWidth="1.8"/>
        <line x1="44" y1="44" x2="66.5" y2="31" stroke="#00000066" strokeWidth="1.8"/>
        <line x1="44" y1="44" x2="66.5" y2="57" stroke="#00000066" strokeWidth="1.8"/>
        <line x1="44" y1="44" x2="44"   y2="70" stroke="#00000066" strokeWidth="1.8"/>
        <line x1="44" y1="44" x2="21.5" y2="57" stroke="#00000066" strokeWidth="1.8"/>
        <line x1="44" y1="44" x2="21.5" y2="31" stroke="#00000066" strokeWidth="1.8"/>

        <circle cx="44" cy="44" r="7" fill="none" stroke="#3ab3c4" strokeWidth="2"/>
        <circle cx="44" cy="44" r="3.5" fill="#3ab3c4" opacity="0.95"/>

        <rect x="40" y="0" width="8" height="4" rx="2" fill="#2d6e8a"/>
        <line x1="44" y1="4" x2="44" y2="11" stroke="#3ab3c4" strokeWidth="2" strokeLinecap="round"/>

        <g transform="translate(36,73)">
          <ellipse className="sd1" cx="2"  cy="0" rx="1.8" ry="2.5" fill="#3ab3c4"/>
          <ellipse className="sd2" cx="8"  cy="0" rx="1.5" ry="2"   fill="#5ecfe0"/>
          <ellipse className="sd3" cx="14" cy="0" rx="1.8" ry="2.5" fill="#3ab3c4"/>
        </g>

        <g transform="translate(44,87)">
          <circle className="rs1" cx="0" cy="0" r="1" fill="none" stroke="#3ab3c4" strokeWidth="1.2"/>
          <circle className="rs2" cx="0" cy="0" r="1" fill="none" stroke="#5ecfe0" strokeWidth="0.8"/>
        </g>

        <line x1="44" y1="70" x2="44" y2="73" stroke="#3ab3c488" strokeWidth="1.5" className="wst2"/>

        <ellipse cx="26" cy="62" rx="9" ry="4" fill="#2d6e3a" transform="rotate(-25 26 62)"/>
        <ellipse cx="62" cy="62" rx="9" ry="4" fill="#2d6e3a" transform="rotate(25 62 62)"/>
        <ellipse cx="22" cy="58" rx="6" ry="2.8" fill="#4fc86a" opacity="0.7" transform="rotate(-35 22 58)"/>
        <ellipse cx="66" cy="58" rx="6" ry="2.8" fill="#4fc86a" opacity="0.7" transform="rotate(35 66 58)"/>

        <rect x="22" y="68" width="44" height="3" rx="1.5" fill="#3b2a1a" opacity="0.55"/>
      </svg>
    </div>
  );
};

export default SyncLoader;
