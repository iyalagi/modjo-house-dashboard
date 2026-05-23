import React from 'react';

const PageLoader = () => {
  return (
    <div className="h-screen flex flex-col items-center justify-center bg-white">
      <style>
        {`
          @keyframes spinOuter { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }
          @keyframes spinInner { 0%{transform:rotate(0deg)} 100%{transform:rotate(-360deg)} }
          @keyframes spinRing  { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }
          @keyframes dropFall  { 0%{opacity:0;transform:translateY(-8px)} 30%{opacity:1} 100%{opacity:0;transform:translateY(20px)} }
          @keyframes ripple    { 0%{r:2;opacity:0.9} 100%{r:24;opacity:0} }
          @keyframes waterFlow { 0%{stroke-dashoffset:0} 100%{stroke-dashoffset:-80} }
          @keyframes textBlink { 0%,100%{opacity:1} 50%{opacity:0.45} }
          @keyframes leafSway1 { 0%,100%{transform:rotate(-5deg)} 50%{transform:rotate(3deg)} }
          @keyframes leafSway2 { 0%,100%{transform:rotate(5deg)} 50%{transform:rotate(-3deg)} }
          @keyframes glowPulse { 0%,100%{opacity:0.7} 50%{opacity:1} }

          .sp-wrap {
            display:flex; flex-direction:column; align-items:center;
            justify-content:center; min-height:380px;
            background:transparent; padding:32px 20px;
            position:relative; overflow:hidden;
          }
          .outer-ring { transform-origin:120px 120px; animation:spinOuter 3.2s linear infinite; }
          .mid-ring    { transform-origin:120px 120px; animation:spinInner 2s linear infinite; }
          .inner-ring  { transform-origin:120px 120px; animation:spinRing 5s linear infinite; }
          .drop1 { animation:dropFall 1.5s ease-in infinite 0s; }
          .drop2 { animation:dropFall 1.5s ease-in infinite 0.38s; }
          .drop3 { animation:dropFall 1.5s ease-in infinite 0.76s; }
          .drop4 { animation:dropFall 1.5s ease-in infinite 1.14s; }
          .leaf1 { transform-origin:68px 166px; animation:leafSway1 2.4s ease-in-out infinite; }
          .leaf2 { transform-origin:172px 166px; animation:leafSway2 2.4s ease-in-out infinite 0.5s; }
          .ripple1 { animation:ripple 2s ease-out infinite 0s; }
          .ripple2 { animation:ripple 2s ease-out infinite 0.67s; }
          .ripple3 { animation:ripple 2s ease-out infinite 1.34s; }
          .wstream  { stroke-dasharray:7 5; animation:waterFlow 0.9s linear infinite; }
          .glow-logo { animation:glowPulse 2.6s ease-in-out infinite; }
          .txt-main {
            font-family:'Courier New',monospace; font-size:13px; letter-spacing:3.5px;
            color:#3ab3c4; text-transform:uppercase; animation:textBlink 2s ease-in-out infinite;
            margin-top:16px; position:relative; z-index:2;
          }
          .txt-sub {
            font-family:'Courier New',monospace; font-size:10px; letter-spacing:2.5px;
            color:#5ecfe0; text-transform:uppercase; margin-top:5px;
            position:relative; z-index:2; opacity:0.7;
          }
        `}
      </style>

      <div className="sp-wrap">
        <svg className="glow-logo" width="240" height="240" viewBox="0 0 240 240" style={{position:'relative',zIndex:2,overflow:'visible'}}>
          <g className="outer-ring">
            <circle cx="120" cy="120" r="109" fill="none" stroke="#1a4d5588" strokeWidth="2" strokeDasharray="5 5"/>
            <circle cx="120" cy="13"  r="4.5" fill="#3ab3c4" opacity="0.9"/>
            <circle cx="205" cy="65"  r="3.5" fill="#3ab3c4" opacity="0.7"/>
            <circle cx="205" cy="175" r="4.5" fill="#3ab3c4" opacity="0.85"/>
            <circle cx="120" cy="227" r="3.5" fill="#3ab3c4" opacity="0.7"/>
            <circle cx="35"  cy="175" r="4.5" fill="#3ab3c4" opacity="0.9"/>
            <circle cx="35"  cy="65"  r="3.5" fill="#3ab3c4" opacity="0.7"/>
          </g>

          <g className="mid-ring">
            <circle cx="120" cy="120" r="91" fill="none" stroke="#2d6e3a88" strokeWidth="1.5" strokeDasharray="3 8"/>
            <rect x="116" y="31" width="8" height="8" rx="2" fill="#4fc86a" opacity="0.65" transform="rotate(0   120 120)"/>
            <rect x="116" y="31" width="8" height="8" rx="2" fill="#4fc86a" opacity="0.65" transform="rotate(60  120 120)"/>
            <rect x="116" y="31" width="8" height="8" rx="2" fill="#4fc86a" opacity="0.65" transform="rotate(120 120 120)"/>
            <rect x="116" y="31" width="8" height="8" rx="2" fill="#4fc86a" opacity="0.65" transform="rotate(180 120 120)"/>
            <rect x="116" y="31" width="8" height="8" rx="2" fill="#4fc86a" opacity="0.65" transform="rotate(240 120 120)"/>
            <rect x="116" y="31" width="8" height="8" rx="2" fill="#4fc86a" opacity="0.65" transform="rotate(300 120 120)"/>
          </g>

          <g className="inner-ring">
            <circle cx="120" cy="120" r="63" fill="none" stroke="#3ab3c466" strokeWidth="1" strokeDasharray="2 11"/>
          </g>

          <circle cx="120" cy="120" r="72" fill="none" stroke="#3ab3c4" strokeWidth="2.5"/>

          <path d="M120,120 L120,48 A72,72 0 0,1 182.4,84 Z" fill="#3ab3c4" opacity="0.85"/>
          <path d="M120,120 L182.4,156 A72,72 0 0,1 120,192 Z" fill="#3ab3c4" opacity="0.85"/>
          <path d="M120,120 L57.6,156 A72,72 0 0,1 57.6,84 Z" fill="#3ab3c4" opacity="0.85"/>

          <line x1="120" y1="120" x2="120"   y2="48"  stroke="#00000055" strokeWidth="2.5"/>
          <line x1="120" y1="120" x2="182.4" y2="84"  stroke="#00000055" strokeWidth="2.5"/>
          <line x1="120" y1="120" x2="182.4" y2="156" stroke="#00000055" strokeWidth="2.5"/>
          <line x1="120" y1="120" x2="120"   y2="192" stroke="#00000055" strokeWidth="2.5"/>
          <line x1="120" y1="120" x2="57.6"  y2="156" stroke="#00000055" strokeWidth="2.5"/>
          <line x1="120" y1="120" x2="57.6"  y2="84"  stroke="#00000055" strokeWidth="2.5"/>

          <circle cx="120" cy="120" r="18" fill="transparent" stroke="#3ab3c4" strokeWidth="2.5"/>
          <circle cx="120" cy="120" r="9"  fill="#3ab3c4" opacity="0.95"/>

          <rect x="113" y="0" width="14" height="7" rx="3.5" fill="#2d6e8a"/>
          <line x1="120" y1="7" x2="120" y2="26" stroke="#3ab3c4" strokeWidth="3" strokeLinecap="round"/>

          <g transform="translate(103,198)">
            <ellipse className="drop1" cx="4"  cy="0" rx="2.5" ry="3.5" fill="#3ab3c4"/>
            <ellipse className="drop2" cx="12" cy="0" rx="2"   ry="3"   fill="#5ecfe0"/>
            <ellipse className="drop3" cx="20" cy="0" rx="2.5" ry="3.5" fill="#3ab3c4"/>
            <ellipse className="drop4" cx="28" cy="0" rx="2"   ry="3"   fill="#5ecfe0"/>
          </g>

          <g transform="translate(120,233)">
            <circle className="ripple1" cx="0" cy="0" r="2" fill="none" stroke="#3ab3c4" strokeWidth="1.5"/>
            <circle className="ripple2" cx="0" cy="0" r="2" fill="none" stroke="#3ab3c4" strokeWidth="1"/>
            <circle className="ripple3" cx="0" cy="0" r="2" fill="none" stroke="#5ecfe0" strokeWidth="0.8"/>
          </g>

          <line x1="120" y1="192" x2="120" y2="197" stroke="#3ab3c488" strokeWidth="2" strokeLinecap="round" className="wstream" strokeDasharray="5 4"/>

          <g className="leaf1">
            <ellipse cx="68" cy="163" rx="19" ry="9"  fill="#2d6e3a" transform="rotate(-28 68 163)"/>
            <ellipse cx="58" cy="156" rx="13" ry="5.5" fill="#4fc86a" opacity="0.72" transform="rotate(-38 58 156)"/>
            <line x1="79" y1="159" x2="60" y2="168" stroke="#1a4d22" strokeWidth="0.8"/>
          </g>
          <g className="leaf2">
            <ellipse cx="172" cy="163" rx="19" ry="9"  fill="#2d6e3a" transform="rotate(28 172 163)"/>
            <ellipse cx="182" cy="156" rx="13" ry="5.5" fill="#4fc86a" opacity="0.72" transform="rotate(38 182 156)"/>
            <line x1="161" y1="159" x2="180" y2="168" stroke="#1a4d22" strokeWidth="0.8"/>
          </g>

          <rect x="58" y="175" width="124" height="5" rx="2.5" fill="#3b2a1a" opacity="0.6"/>
        </svg>

        <div className="txt-main">Memuat Monitoring Irigasi</div>
        <div className="txt-sub">Smart Modjo House</div>
      </div>
    </div>
  );
};

export default PageLoader;
