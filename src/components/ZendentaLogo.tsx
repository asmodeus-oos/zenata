import React from "react";

interface ZendentaLogoProps {
  className?: string;
  size?: number;
}

export function ZendentaLogo({ className = "", size = 40 }: ZendentaLogoProps) {
  return (
    <div className={`flex items-center justify-center select-none shrink-0 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="transition-transform hover:scale-105 duration-300"
      >
        {/* Soft elegant gradient shadow background */}
        <defs>
          <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2563EB" /> {/* Blue 600 */}
            <stop offset="100%" stopColor="#1D4ED8" /> {/* Blue 700 */}
          </linearGradient>
          <linearGradient id="glowGrad" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.4" /> {/* Sky 400 with opacity */}
            <stop offset="100%" stopColor="#2563EB" stopOpacity="0.1" />
          </linearGradient>
          <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#2563EB" floodOpacity="0.15" />
          </filter>
        </defs>

        {/* Dynamic Rounded Squircle Backdrop */}
        <rect
          x="6"
          y="6"
          width="88"
          height="88"
          rx="26"
          fill="url(#logoGrad)"
          filter="url(#shadow)"
        />

        {/* Ambient subtle glow ring */}
        <rect
          x="12"
          y="12"
          width="76"
          height="76"
          rx="20"
          border="1"
          stroke="url(#glowGrad)"
          strokeWidth="1.5"
          fill="none"
        />

        {/* Sleek, Modern stylized abstract tooth / letter Z medical geometry */}
        {/* Left clinical peak */}
        <path
          d="M32 32C32 28 42 26 44 32C46 38 43 45 43 50C43 55 45 62 42 66C39 70 34 68 32 64C30 60 32 44 32 32Z"
          fill="white"
          opacity="0.95"
        />
        
        {/* Right clinical peak */}
        <path
          d="M68 32C68 28 58 26 56 32C54 38 57 45 57 50C57 55 55 62 58 66C61 70 66 68 68 64C70 60 68 44 68 32Z"
          fill="white"
          opacity="0.95"
        />

        {/* Diagonal crossover connecting Z shape with medical dental arch */}
        <path
          d="M36 34L64 64"
          stroke="white"
          strokeWidth="7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Shiny enamel light reflection dot */}
        <circle cx="68" cy="36" r="3.5" fill="#38BDF8" />
        <circle cx="32" cy="62" r="2.5" fill="#38BDF8" opacity="0.8" />
      </svg>
    </div>
  );
}
