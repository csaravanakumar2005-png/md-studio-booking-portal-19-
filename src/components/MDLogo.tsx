import React from "react";
// @ts-ignore
import mdLogoImg from "../assets/images/logo.jpeg";

interface MDLogoProps {
  className?: string;
}

export function MDLogo({ className = "w-full h-full" }: MDLogoProps) {
  return (
    <div className={`flex flex-col items-center justify-center text-center p-4 font-sans ${className}`}>
      {/* Premium rectangular frame holding the custom logo image */}
      <div className="relative group select-none my-2">
        {/* Animated ambient gold glow behind the frame */}
        <div className="absolute -inset-1 bg-gradient-to-r from-[#D4AF37] via-[#FFF5D1] to-[#F4D03F] rounded-2xl opacity-60 blur-md group-hover:opacity-100 transition duration-700 animate-pulse-glow" />
        
        {/* Actual rectangular gold border frame */}
        <div className="relative w-52 h-28 md:w-64 md:h-36 rounded-2xl border-4 border-[#D4AF37] p-1 bg-[#041C32] overflow-hidden shadow-2xl flex items-center justify-center">
          <img
            src={mdLogoImg}
            alt="MD Photography Logo"
            className="w-full h-full object-cover rounded-xl transition-transform duration-700 group-hover:scale-105 active:scale-95"
            referrerPolicy="no-referrer"
            onError={(e) => {
              // Fallback support if image fails to load
              (e.target as HTMLElement).style.display = "none";
            }}
          />
        </div>
      </div>

      {/* BRAND TEXT */}
      <h1 className="text-xl md:text-2xl font-black tracking-[0.35em] text-[#D4AF37] uppercase font-display mt-5 drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]">
        PHOTOGRAPHY
      </h1>
      
      {/* BRAND SUBTITLE */}
      <p className="text-[10px] md:text-[11px] text-[#D6D6D6] italic font-medium font-accent tracking-wider mt-2 border-t border-[#D4AF37]/30 pt-2 px-4 max-w-[325px]">
        "I'm not only giving your photos, I'm giving your cheerful memories.."
      </p>
    </div>
  );
}
