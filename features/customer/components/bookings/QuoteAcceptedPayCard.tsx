"use client";

import React from "react";
import Image from "next/image";
import { 
  ArrowLeft, 
  ArrowRight, 
  Calendar, 
  CreditCard, 
  CheckCircle2, 
  Share2, 
  MessageCircle, 
  Copy 
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface QuoteAcceptedPayCardProps {
  quoteAmount: number;
  advanceAmount: number;
  remainingAmount?: number;
  isLoading?: boolean;
  onPay: () => void;
  onBack?: () => void;
  onShareLink?: (channel: "whatsapp" | "copy") => void;
  isSharingLink?: string | null;
  copiedType?: string | null;
  onPayFull?: () => void;
}

export default function QuoteAcceptedPayCard({
  quoteAmount,
  advanceAmount,
  remainingAmount,
  isLoading = false,
  onPay,
  onBack,
  onShareLink,
  isSharingLink,
  copiedType,
  onPayFull,
}: QuoteAcceptedPayCardProps) {
  const formatCurrency = (val: number) => {
    return Number(val || 0).toLocaleString("en-IN", {
      maximumFractionDigits: 2,
    });
  };

  return (
    <div className="w-full max-w-[480px] sm:max-w-[520px] mx-auto bg-white rounded-3xl p-4 sm:p-6 shadow-sm border border-slate-100/90 font-sans">
      {/* 1. Top Bar: Back Arrow (Left) + CarBlink Logo (Center) */}
      <div className="flex items-center justify-between mb-4 pt-1">
        <button
          type="button"
          onClick={() => {
            if (onBack) {
              onBack();
            } else if (typeof window !== "undefined") {
              window.history.back();
            }
          }}
          aria-label="Go back"
          className="p-2 -ml-2 rounded-full hover:bg-slate-100 active:bg-slate-200 text-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-orange"
        >
          <ArrowLeft className="w-6 h-6 stroke-[2.5]" />
        </button>

        <div className="flex-1 flex justify-center pr-8">
          <Image
            src="/logo_updated.png"
            alt="CarBlink"
            width={140}
            height={36}
            priority
            className="h-8 sm:h-8.5 w-auto object-contain"
          />
        </div>
      </div>

      {/* 2. Green Rosette Check Badge + Heading + Subtitle */}
      <div className="flex flex-col items-center text-center mb-5">
        <div className="relative mb-2.5 flex items-center justify-center">
          {/* Smooth scalloped rosette badge */}
          <svg
            className="w-16 h-16 text-[#16A34A] drop-shadow-xs"
            viewBox="0 0 48 48"
            fill="none"
            aria-hidden="true"
          >
            {/* Scalloped petals */}
            <path
              d="M 24.00 2.50 Q 28.66 6.61, 34.75 5.38 Q 36.73 11.27, 42.62 13.25 Q 41.39 19.34, 45.50 24.00 Q 41.39 28.66, 42.62 34.75 Q 36.73 36.73, 34.75 42.62 Q 28.66 41.39, 24.00 45.50 Q 19.34 41.39, 13.25 42.62 Q 11.27 36.73, 5.38 34.75 Q 6.61 28.66, 2.50 24.00 Q 6.61 19.34, 5.38 13.25 Q 11.27 11.27, 13.25 5.38 Q 19.34 6.61, 24.00 2.50 Z"
              fill="#16A34A"
            />
            {/* Crisp white checkmark */}
            <path
              d="M15 24.5L21.5 31L33 18"
              stroke="#ffffff"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Subtle green motion lines on top right */}
            <line x1="39" y1="8" x2="43.5" y2="4.5" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="43" y1="12" x2="46.5" y2="9.5" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </div>

        <h2 className="font-heading font-black text-2xl sm:text-3xl text-slate-900 tracking-tight">
          Quote Accepted!
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1">
          Pay a partial amount to confirm your booking.
        </p>
      </div>

      {/* 3. Peach / Light-Orange Rounded Summary Card */}
      <div className="bg-[#FFF4ED] border border-[#FDE6D2] rounded-3xl p-4 sm:p-5 mb-4 flex items-center justify-between">
        <div className="flex-1 text-center">
          <span className="text-xs sm:text-sm text-slate-700 font-medium block">
            Quote Amount
          </span>
          <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono mt-0.5 block tracking-tight">
            ₹{formatCurrency(quoteAmount)}
          </span>
        </div>

        <div className="w-[1px] bg-[#F1D2BC] self-stretch mx-2 my-1" />

        <div className="flex-1 text-center">
          <span className="text-xs sm:text-sm text-slate-700 font-medium block">
            Pay Now (Partial)
          </span>
          <span className="text-2xl sm:text-3xl font-black text-[#FF5500] font-mono mt-0.5 block tracking-tight">
            ₹{formatCurrency(advanceAmount)}
          </span>
        </div>
      </div>

      {/* 4. Light Green Rounded Banner */}
      <div className="bg-[#EDFDF4] border border-[#BBF7D0] rounded-2xl p-3.5 sm:p-4 mb-4 flex items-center gap-3">
        <div className="shrink-0 flex items-center justify-center pl-0.5">
          {/* Open green padlock with motion tick */}
          <svg className="w-8 h-8 text-[#16A34A]" viewBox="0 0 28 28" fill="none" aria-hidden="true">
            {/* Open shackle */}
            <path d="M8.5 11V7a5.5 5.5 0 0 1 11 0v1" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" />
            {/* Body */}
            <rect x="4.5" y="11" width="19" height="13" rx="3" fill="#16A34A" />
            {/* Keyhole dot & slot */}
            <circle cx="14" cy="16.5" r="1.5" fill="white" />
            <path d="M14 17.5V20" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
            {/* Sound / motion tick marks on top-right */}
            <line x1="22" y1="5" x2="24.5" y2="3" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" />
            <line x1="24.5" y1="8" x2="27" y2="6.5" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>

        <div className="w-[1px] bg-[#A7F3D0] self-stretch my-0.5" />

        <p className="text-xs sm:text-[13px] text-slate-800 leading-snug">
          Complete the <strong className="font-bold text-slate-900 font-mono">₹{formatCurrency(advanceAmount)}</strong> payment to{" "}
          <mark className="bg-[#FEF08A] text-slate-950 font-bold px-1 py-0.5 rounded">
            unlock the workshop&apos;s contact number &amp; location
          </mark>{" "}
          <span className="inline-block text-orange-500 font-bold select-none text-sm" aria-hidden="true">
            📍
          </span>{" "}
          instantly.
        </p>
      </div>

      {/* 5. White Rounded Info List Card with 3 rows */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 mb-4 divide-y divide-slate-100 shadow-xs">
        {/* Row 1: Calendar */}
        <div className="flex items-start gap-3.5 pb-3.5">
          <div className="mt-0.5 text-primary-orange shrink-0" aria-hidden="true">
            <Calendar className="w-5 h-5 text-primary-orange stroke-[2]" />
          </div>
          <div className="min-w-0">
            <h4 className="font-bold text-sm text-slate-900 leading-tight">
              Booking Confirmed
            </h4>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              After partial payment.
            </p>
          </div>
        </div>

        {/* Row 2: Remaining Payment */}
        <div className="flex items-start gap-3.5 py-3.5">
          <div className="mt-0.5 text-primary-orange shrink-0" aria-hidden="true">
            <CreditCard className="w-5 h-5 text-primary-orange stroke-[2]" />
          </div>
          <div className="min-w-0">
            <h4 className="font-bold text-sm text-slate-900 leading-tight">
              Remaining Payment
            </h4>
            <p className="text-xs text-slate-500 mt-0.5 font-medium leading-relaxed">
              Pay the balance directly at the workshop via Cash or UPI.
            </p>
          </div>
        </div>

        {/* Row 3: Platform Fee */}
        <div className="flex items-start gap-3.5 pt-3.5">
          <div className="mt-0.5 text-[#16A34A] shrink-0" aria-hidden="true">
            <CheckCircle2 className="w-5 h-5 text-[#16A34A] stroke-[2]" />
          </div>
          <div className="min-w-0">
            <h4 className="font-bold text-sm text-slate-900 leading-tight">
              Platform Fee
            </h4>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              No platform fee if you complete the service.
            </p>
          </div>
        </div>
      </div>

    

      {/* 7. Full-width Large Orange Gradient Rounded Button */}
      <Button
        type="button"
        onClick={onPay}
        disabled={isLoading || advanceAmount <= 0}
        isLoading={isLoading}
        className="w-full bg-gradient-to-r from-[#FF5500] via-[#FF6600] to-[#FF7700] hover:from-[#EA4C00] hover:to-[#FF6600] active:scale-[0.99] text-white font-black text-base sm:text-lg h-14 rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 border-0"
      >
        <span>Pay ₹{formatCurrency(advanceAmount)} to Confirm Booking</span>
        <ArrowRight className="w-5 h-5 text-white stroke-[2.5]" aria-hidden="true" />
      </Button>

      {/* 8. Preserved Existing Secondary Options (Unobtrusively below CTA) */}
      {(onShareLink || onPayFull) && (
        <div className="mt-4 pt-3 border-t border-slate-100 space-y-3">
          {/* Shareable Advance Payment Link */}
          {onShareLink && (
            <div className="bg-slate-50 border border-slate-200/80 p-3 rounded-2xl space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                <Share2 className="w-3.5 h-3.5 text-primary-orange" />
                <span>Need someone else to pay? (Forward Link)</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Share this link with anyone. They can pay the advance via UPI / Google Pay / Card without logging in.
              </p>
              <div className="grid grid-cols-2 gap-2 pt-0.5">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onShareLink("whatsapp")}
                  isLoading={isSharingLink === "ADVANCE_whatsapp"}
                  className="border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs py-2 rounded-xl flex items-center justify-center gap-1.5 shadow-xs h-9"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                  <span>WhatsApp</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onShareLink("copy")}
                  isLoading={isSharingLink === "ADVANCE_copy"}
                  className="border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs py-2 rounded-xl flex items-center justify-center gap-1.5 shadow-xs h-9"
                >
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>{copiedType === "ADVANCE" ? "Copied! ✓" : "Copy Link"}</span>
                </Button>
              </div>
            </div>
          )}

          {/* Pay Full Upfront Alternative */}
          {onPayFull && remainingAmount && remainingAmount > advanceAmount && (
            <div className="text-center pt-1">
              <button
                type="button"
                onClick={onPayFull}
                className="text-xs font-bold text-slate-600 hover:text-primary-navy hover:underline inline-flex items-center gap-1 transition-colors"
              >
                <span>Want to pay full ₹{formatCurrency(remainingAmount)} upfront instead?</span>
                <span className="text-primary-orange">Click here &rarr;</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
