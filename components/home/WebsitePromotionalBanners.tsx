// @ts-nocheck
"use client";

import React, { useState, useEffect } from "react";
import { useActiveWebsiteAds } from "@/features/executive/hooks/useExecutiveQueries";
import { ChevronLeft, ChevronRight, Sparkles, ExternalLink } from "lucide-react";

export default function WebsitePromotionalBanners({ placement = "HOME_HERO" }: { placement?: string }) {
  const { data: ads = [], isLoading } = useActiveWebsiteAds(placement);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto cycle slider every 5 seconds
  useEffect(() => {
    if (!ads || ads.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % ads.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [ads]);

  if (isLoading || !ads || ads.length === 0) {
    return null;
  }

  const currentAd = ads[currentIndex];

  // Helper to format redirect URL safely without causing 404s
  const getSafeRedirectUrl = (url?: string) => {
    if (!url || url.trim() === "" || url.trim() === "#") {
      return process.env.NEXT_PUBLIC_WEBSITE_URL || "https://carblink.in";
    }
    const trimmed = url.trim();
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      return trimmed;
    }
    const websiteDomain = process.env.NEXT_PUBLIC_WEBSITE_URL || "https://carblink.in";
    return `${websiteDomain.replace(/\/+$/, "")}/${trimmed.replace(/^\/+/, "")}`;
  };

  const targetLink = getSafeRedirectUrl(currentAd.redirectUrl);
  const isExternal = targetLink.startsWith("http://") || targetLink.startsWith("https://");

  return (
    <div className="w-full my-6 max-w-7xl mx-auto px-4">
      <div className="relative overflow-hidden rounded-3xl bg-gray-900 shadow-2xl border border-white/10 group min-h-[220px] sm:min-h-[280px] md:min-h-[320px] flex items-center">
        {/* Background Image with Smooth Fade Transition */}
        <div className="absolute inset-0 z-0">
          <img
            src={currentAd.imageUrl}
            alt={currentAd.title}
            className="w-full h-full object-cover transform scale-100 group-hover:scale-105 transition-all duration-700 brightness-90"
            onError={(e) => {
              e.currentTarget.src =
                "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?q=80&w=1000&auto=format&fit=crop";
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-transparent" />
        </div>

        {/* Banner Content Layer */}
        <div className="relative z-10 p-6 sm:p-10 md:p-12 max-w-2xl text-white space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-orange/20 border border-primary-orange/40 text-primary-orange text-xs font-extrabold uppercase tracking-wider backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-primary-orange" /> Special Offer / Ad
          </div>

          <h2 className="text-2xl sm:text-4xl md:text-5xl font-black font-heading leading-tight drop-shadow-md text-white">
            {currentAd.title}
          </h2>

          {currentAd.subtitle && (
            <p className="text-white/80 text-sm sm:text-base font-medium max-w-lg leading-relaxed line-clamp-2">
              {currentAd.subtitle}
            </p>
          )}

        </div>

        {/* Carousel Slider Controls */}
        {ads.length > 1 && (
          <>
            <button
              onClick={() => setCurrentIndex((prev) => (prev - 1 + ads.length) % ads.length)}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/40 hover:bg-black/80 backdrop-blur-md text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity border border-white/20"
              aria-label="Previous Ad"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <button
              onClick={() => setCurrentIndex((prev) => (prev + 1) % ads.length)}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/40 hover:bg-black/80 backdrop-blur-md text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity border border-white/20"
              aria-label="Next Ad"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            {/* Slider Bullet Dots */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
              {ads.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-2 rounded-full transition-all ${
                    currentIndex === idx ? "w-6 bg-primary-orange" : "w-2 bg-white/40 hover:bg-white/70"
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
