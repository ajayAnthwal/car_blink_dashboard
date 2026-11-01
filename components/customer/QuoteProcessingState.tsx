"use client";

import React, { useState, useEffect } from "react";
import { 
  Car, 
  Search, 
  Sparkles, 
  CheckCircle2 
} from "lucide-react";

interface QuoteProcessingStateProps {
  vehicleDetails?: string;
  serviceName?: string;
}

const COMPARISON_STEPS = [
  {
    title: "Analyzing Vehicle Specs & Scope",
    desc: "Mapping manufacturer checklists and required spare parts.",
  },
  {
    title: "Scanning Verified Partner Workshops Nearby",
    desc: "Checking live bay availability across certified multi-brand garages.",
  },
  {
    title: "Comparing Labor Rates & OEM Parts",
    desc: "Evaluating genuine OEM/OES part prices to eliminate dealership markup.",
  },
  {
    title: "Negotiating Exclusive Volume Discounts",
    desc: "Applying CarBlink platform discounts for guaranteed best rates.",
  },
  {
    title: "Finalizing Competitive Quotations",
    desc: "Quotes are being generated with transparent breakdown & turnaround times.",
  }
];

export default function QuoteProcessingState({ vehicleDetails, serviceName }: QuoteProcessingStateProps) {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % COMPARISON_STEPS.length);
    }, 3500);

    return () => clearInterval(timer);
  }, []);

  const activeStepData = COMPARISON_STEPS[currentStep];
  const progressPercent = Math.round(((currentStep + 1) / COMPARISON_STEPS.length) * 100);

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 p-4 sm:p-5 text-white shadow-lg border border-slate-700/60">
      {/* Background subtle ambient glow */}
      <div className="absolute -top-16 -right-16 w-48 h-48 bg-primary-orange/15 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 space-y-3.5">
        {/* Top Header Row: Compact Icon + Title + Live Badge */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {/* Compact Animated Scanner Icon */}
            <div className="relative w-10 h-10 shrink-0 rounded-xl bg-gradient-to-br from-primary-orange to-amber-500 p-0.5 shadow-md shadow-orange-500/20 flex items-center justify-center">
              <div className="w-full h-full rounded-[10px] bg-slate-900 flex items-center justify-center relative overflow-hidden">
                <Car className="w-5 h-5 text-primary-orange animate-pulse" />
                <Search className="w-2.5 h-2.5 text-emerald-400 absolute bottom-1 right-1" />
              </div>
            </div>

            <div>
              <h3 className="font-heading font-black text-sm sm:text-base text-white tracking-tight leading-snug">
                Comparing Verified Workshops &amp; Securing Best Price
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-300 line-clamp-1">
                Analyzing certified garages for <span className="text-amber-300 font-semibold">{vehicleDetails || "your vehicle"}</span> to deliver zero-markup rates.
              </p>
            </div>
          </div>

          {/* Live Status Pill */}
          <div className="self-start sm:self-center shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[10px] font-bold text-amber-300 shadow-2xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="uppercase tracking-wider">Live Analysis</span>
          </div>
        </div>

        {/* Middle: Compact Progress Bar & Current Stage */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-3 backdrop-blur-sm space-y-2">
          <div className="flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-1.5 min-w-0">
              <Sparkles className="w-3.5 h-3.5 text-primary-orange shrink-0 animate-spin" />
              <span className="font-bold text-slate-300 shrink-0">
                Stage {currentStep + 1}/{COMPARISON_STEPS.length}:
              </span>
              <span className="text-amber-300 font-extrabold truncate">
                {activeStepData.title}
              </span>
            </div>
            <span className="font-mono font-black text-emerald-400 text-xs shrink-0 pl-2">
              {progressPercent}%
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full h-1.5 bg-slate-700/70 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-primary-orange via-amber-400 to-emerald-400 rounded-full transition-all duration-700 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
            <span className="flex items-center gap-1.5 line-clamp-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
              {activeStepData.desc}
            </span>
            <span className="hidden sm:inline-block text-[10px] text-slate-400 shrink-0">~5-15 mins</span>
          </div>
        </div>
      </div>
    </div>
  );
}
