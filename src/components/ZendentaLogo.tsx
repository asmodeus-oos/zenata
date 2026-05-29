import React from "react";

interface ZendentaLogoProps {
  className?: string;
  size?: number;
}

export function ZendentaLogo({ className = "", size = 40 }: ZendentaLogoProps) {
  return (
    <div className={`flex items-center justify-center select-none shrink-0 ${className}`}>
      <img
        src="/logo.png"
        alt="Zendenta Logo"
        width={size}
        height={size}
        className="transition-transform hover:scale-105 duration-300 object-contain"
        onError={(e) => {
          // Fallback if image fails to load
          e.currentTarget.style.display = 'none';
        }}
      />
    </div>
  );
}
