"use client";

import React, { useState, useEffect } from "react";
import { 
  Car, 
  Sparkles, 
  ShieldCheck, 
  Clock, 
  TrendingDown, 
  CheckCircle2,
  Check
} from "lucide-react";

interface QuoteProcessingStateProps {
  vehicleDetails?: string;
  serviceName?: string;
}

const COMPARISON_STAGES = [
  {
    title: "Comparing verified workshop bids...",
    detail: "Auditing genuine OEM parts & labor rates to eliminate dealer markup.",
    badge: "Price Comparison",
  },
  {
    title: "Negotiating lowest direct rates...",
    detail: "CarBlink volume subsidies & exclusive discounts applied automatically.",
    badge: "Discount Lock",
  },
  {
    title: "Checking fastest technician slots...",
    detail: "Confirming bay availability for express turnaround on your service.",
    badge: "Slot Allocation",
  },
  {
    title: "Finalizing best price quotes...",
    detail: "Preparing transparent itemized quotes for your review & approval.",
    badge: "Final Audit",
  }
];

export default function QuoteProcessingState({ vehicleDetails, serviceName }: QuoteProcessingStateProps) {
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(12);

  useEffect(() => {
    const stageTimer = setInterval(() => {
      setCurrentStageIndex((prev) => (prev + 1) % COMPARISON_STAGES.length);
    }, 3200);

    const clockTimer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => {
      clearInterval(stageTimer);
      clearInterval(clockTimer);
    };
  }, []);

  const activeStage = COMPARISON_STAGES[currentStageIndex];
  const progressPercent = Math.round(((currentStageIndex + 1) / COMPARISON_STAGES.length) * 100);

  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white border border-slate-800 shadow-xl p-3.5 sm:p-5">
      {/* Scoped CSS Micro-Animations */}
      <style jsx>{`
        @keyframes mini-radar-ping {
          0% { transform: scale(0.7); opacity: 0.9; }
          60% { opacity: 0.3; }
          100% { transform: scale(2.2); opacity: 0; }
        }
        @keyframes mini-radar-sweep {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes mini-car-float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-3px); }
        }
        @keyframes mini-laser-scan {
          0%, 100% { top: 15%; opacity: 0.3; }
          50% { top: 75%; opacity: 1; }
        }
        @keyframes mini-shimmer {
          0% { transform: translateX(-150%); }
          100% { transform: translateX(200%); }
        }

        .animate-mini-ping-1 {
          animation: mini-radar-ping 2.6s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
        .animate-mini-ping-2 {
          animation: mini-radar-ping 2.6s cubic-bezier(0, 0, 0.2, 1) 1.2s infinite;
        }
        .animate-mini-sweep {
          animation: mini-radar-sweep 3.8s linear infinite;
        }
        .animate-mini-car {
          animation: mini-car-float 2.8s ease-in-out infinite;
        }
        .animate-mini-laser {
          animation: mini-laser-scan 2s ease-in-out infinite;
        }
        .animate-mini-shimmer {
          animation: mini-shimmer 2.2s ease-in-out infinite;
        }
      `}</style>

      {/* Subtle Ambient Glows */}
      <div className="absolute top-0 right-0 w-44 h-44 bg-primary-orange/15 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-44 h-44 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col gap-3">
        
        {/* COMPACT TOP ROW: Live Matcher Badge & Elapsed Timer */}
        <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2.5">
          <div className="flex items-center gap-2 min-w-0">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-orange"></span>
            </span>
            <span className="text-[11px] sm:text-xs font-extrabold uppercase tracking-wider text-orange-400 truncate">
              CarBlink Price Matcher
            </span>
            <span className="text-white/30 text-xs hidden sm:inline">•</span>
            <span className="text-slate-300 text-[11px] truncate hidden sm:inline">
              {vehicleDetails || "Your Vehicle"}
            </span>
          </div>

          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/10 text-[11px] font-mono text-slate-300 shrink-0">
            <Clock className="w-3 h-3 text-amber-400" />
            <span>{formatTimer(elapsedSeconds)}</span>
          </div>
        </div>

        {/* COMPACT MAIN CONTENT: Mini Radar on Left + Live Price Compare Details on Right */}
        <div className="flex flex-row items-center gap-3 sm:gap-5 py-1">
          
          {/* Mini Radar Sonar Visual (Compact ~88px - 100px diameter) */}
          <div className="relative w-20 h-20 sm:w-24 sm:h-24 shrink-0 flex items-center justify-center">
            
            {/* Outer Boundary Ring */}
            <div className="absolute inset-0 rounded-full border border-dashed border-orange-500/30" />
            
            {/* Pulsing Sonar Waves */}
            <div className="absolute w-12 h-12 rounded-full border border-orange-500/70 animate-mini-ping-1 pointer-events-none" />
            <div className="absolute w-12 h-12 rounded-full border border-amber-400/60 animate-mini-ping-2 pointer-events-none" />

            {/* 360° Rotating Sweep Cone */}
            <div 
              className="absolute inset-0 rounded-full animate-mini-sweep pointer-events-none"
              style={{
                background: 'conic-gradient(from 0deg, rgba(255, 122, 26, 0.35) 0deg, rgba(255, 122, 26, 0) 65deg, transparent 65deg)'
              }}
            />

            {/* Subtle Anonymous Radar Blip Dots (Generic workshops - NO partner names!) */}
            <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            <div className="absolute bottom-2 left-2 w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping" />
            <div className="absolute bottom-3 right-3 w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />

            {/* Center Vehicle Beacon with Diagnostic Scan Line */}
            <div className="relative z-10 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-gradient-to-tr from-orange-500 to-amber-400 p-0.5 shadow-md shadow-orange-500/30 animate-mini-car">
              <div className="w-full h-full rounded-full bg-slate-950 flex flex-col items-center justify-center relative overflow-hidden border border-white/20">
                <Car className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                {/* Laser scan line */}
                <div className="absolute inset-x-1 h-0.5 bg-white shadow-[0_0_6px_#fff] animate-mini-laser pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Right Text Block: CarBlink Best Price Working Message */}
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-primary-orange shrink-0 animate-spin" />
              <h3 className="text-xs sm:text-sm font-extrabold text-white font-heading truncate">
                CarBlink is comparing best prices for you
              </h3>
            </div>

            <p className="text-[11px] sm:text-xs text-amber-300 font-medium leading-tight line-clamp-1">
              {activeStage.title}
            </p>

            <p className="text-[10px] sm:text-[11px] text-slate-400 leading-tight line-clamp-1 hidden sm:block">
              {activeStage.detail}
            </p>

            {/* Slim Shimmer Progress Bar */}
            <div className="pt-1">
              <div className="relative w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-primary-orange via-amber-400 to-emerald-400 rounded-full transition-all duration-700 relative overflow-hidden"
                  style={{ width: `${progressPercent}%` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-mini-shimmer" />
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* COMPACT BOTTOM TRUST STRIP (One-line compact pills) */}
        <div className="flex items-center justify-between gap-1.5 border-t border-white/10 pt-2 text-[10px] sm:text-[11px] text-slate-300">
          <div className="flex items-center gap-1 truncate">
            <TrendingDown className="w-3 h-3 text-emerald-400 shrink-0" />
            <span className="font-semibold text-white">Direct Garage Price</span>
            <span className="text-slate-500 hidden sm:inline">(Zero Markup)</span>
          </div>

          <div className="flex items-center gap-1 truncate">
            <ShieldCheck className="w-3 h-3 text-blue-400 shrink-0" />
            <span className="font-semibold text-white">100% Genuine</span>
            <span className="text-slate-500 hidden sm:inline">OEM Spares</span>
          </div>

          <div className="flex items-center gap-1 truncate">
            <CheckCircle2 className="w-3 h-3 text-amber-400 shrink-0" />
            <span className="font-semibold text-white">Best Price Guarantee</span>
          </div>
        </div>

      </div>
    </div>
  );
}
