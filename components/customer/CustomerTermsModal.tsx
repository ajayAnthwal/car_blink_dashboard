"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, ShieldCheck, Loader2, ArrowRight } from "lucide-react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useAcceptTermsMutation } from "@/features/customer/hooks/useCustomerQueries";
import { isPlaceholderCustomerName } from "@/components/customer/CustomerNamePromptModal";
import { 
  TERMS_VERSION, 
  TERMS_METADATA, 
  TERMS_SECTIONS 
} from "@/content/termsAndConditionsContent";
import toast from "react-hot-toast";

const SESSION_DISMISSED_KEY = "cb_customer_terms_dismissed_session";
const BROADCAST_TERMS_ACCEPTED = "cb_customer_terms_accepted_broadcast";

export default function CustomerTermsModal() {
  const { user, isLoading, refreshUser } = useAuth();
  const acceptTermsMutation = useAcceptTermsMutation();

  const [hasAgreed, setHasAgreed] = useState(false);
  const [isDismissedThisSession, setIsDismissedThisSession] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  // Check sessionStorage for temporary dismissal in current browser session
  useEffect(() => {
    try {
      if (typeof window !== "undefined" && window.sessionStorage) {
        const dismissed = window.sessionStorage.getItem(SESSION_DISMISSED_KEY);
        if (dismissed === "true") {
          setIsDismissedThisSession(true);
        }
      }
    } catch {
      // Gracefully ignore sessionStorage access errors (e.g. private mode restrictions)
    }
  }, []);

  // Cross-tab synchronization: if accepted in another tab, instantly dismiss here
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === BROADCAST_TERMS_ACCEPTED) {
        refreshUser();
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [refreshUser]);

  // Determine modal visibility:
  // - User must be loaded and authenticated
  // - Role must be CUSTOMER only
  // - User has NOT accepted terms yet (isTermsAccepted === false or !termsAcceptedAt)
  // - Name modal is NOT active (name modal has higher priority)
  // - Not dismissed for the current browser session
  const isNameModalActive = isPlaceholderCustomerName(user?.fullName);
  const hasAccepted = Boolean(user?.isTermsAccepted || (user?.termsAcceptedAt && user?.termsVersion));

  const shouldShow =
    !isLoading &&
    !!user &&
    user.role === "CUSTOMER" &&
    !hasAccepted &&
    !isNameModalActive &&
    !isDismissedThisSession;

  // Manage Body Scroll Lock & Focus Management
  useEffect(() => {
    if (shouldShow) {
      previousActiveElementRef.current = document.activeElement as HTMLElement | null;
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";

      // Focus modal after opening
      const timer = setTimeout(() => {
        closeButtonRef.current?.focus();
      }, 100);

      return () => {
        document.body.style.overflow = originalOverflow;
        clearTimeout(timer);
        if (previousActiveElementRef.current && typeof previousActiveElementRef.current.focus === "function") {
          previousActiveElementRef.current.focus();
        }
      };
    }
  }, [shouldShow]);

  // Keyboard navigation: Escape to dismiss, Tab trap
  useEffect(() => {
    if (!shouldShow) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleClose();
        return;
      }

      if (e.key === "Tab" && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [shouldShow]);

  // Dismiss for current browser session
  const handleClose = () => {
    try {
      if (typeof window !== "undefined" && window.sessionStorage) {
        window.sessionStorage.setItem(SESSION_DISMISSED_KEY, "true");
      }
    } catch {}
    setIsDismissedThisSession(true);
  };

  // Submit Terms Acceptance to Server
  const handleAccept = async () => {
    if (!hasAgreed || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await acceptTermsMutation.mutateAsync(TERMS_VERSION);

      // Refresh auth context user state immediately
      await refreshUser();

      // Broadcast to other open browser tabs
      try {
        if (typeof window !== "undefined" && window.localStorage) {
          window.localStorage.setItem(BROADCAST_TERMS_ACCEPTED, Date.now().toString());
        }
      } catch {}

      toast.success("Terms & Conditions accepted. Thank you!");
    } catch (err: any) {
      console.error("Failed to accept terms:", err);
      const apiMessage =
        err?.response?.data?.message ||
        err?.message ||
        "Could not save acceptance. Please check your internet connection and try again.";
      setErrorMessage(apiMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!shouldShow) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex sm:items-center justify-center p-0 sm:p-4 overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-labelledby="terms-modal-title"
      ref={modalRef}
    >
      {/* Modal Dialog Card */}
      <div className="w-full sm:max-w-[700px] max-h-[92vh] sm:max-h-[85vh] h-full sm:h-auto bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col border border-slate-200 mt-auto sm:mt-0 animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
        
        {/* Mobile Pull Indicator */}
        <div className="sm:hidden flex justify-center pt-2 pb-1 bg-white">
          <div className="w-10 h-1 bg-slate-300 rounded-full" />
        </div>

        {/* 1. Header (Fixed top) */}
        <div className="px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-2.5 min-w-0 pr-2">
            <div className="w-9 h-9 rounded-xl bg-primary-orange/10 text-primary-orange flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-primary-orange stroke-[2.2]" />
            </div>
            <div className="min-w-0">
              <h2
                id="terms-modal-title"
                className="text-base sm:text-lg font-heading font-black text-slate-900 tracking-tight truncate"
              >
                Terms &amp; Conditions
              </h2>
              <p className="text-[11px] text-slate-500 font-medium">
                CarBlink Services Private Limited • v{TERMS_VERSION}
              </p>
            </div>
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            onClick={handleClose}
            aria-label="Close Terms and Conditions"
            className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full hover:bg-slate-100 active:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-primary-orange shrink-0"
          >
            <X className="w-5 h-5 stroke-[2.2]" />
          </button>
        </div>

        {/* 2. Scrollable Terms Body */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-7 py-5 space-y-6 text-slate-700 text-xs sm:text-[13px] leading-relaxed overscroll-contain">
          
          {/* Document Header & Preamble */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 sm:p-5 space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-1">
              <span className="font-mono text-[11px] font-bold text-primary-orange uppercase tracking-wider">
                {TERMS_METADATA.platform}
              </span>
              <span className="text-[10px] text-slate-500 font-semibold bg-white px-2 py-0.5 rounded border border-slate-200">
                {TERMS_METADATA.status}
              </span>
            </div>
            <h3 className="font-heading font-black text-base sm:text-lg text-slate-900">
              {TERMS_METADATA.documentTitle}
            </h3>
            <p className="text-xs text-slate-600">
              <strong>Platform Operator:</strong> {TERMS_METADATA.platformOperator} (
              <a
                href={TERMS_METADATA.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-orange underline"
              >
                {TERMS_METADATA.website}
              </a>
              )
            </p>
            <p className="text-xs text-slate-600 pt-1 border-t border-slate-200/70 italic">
              {TERMS_METADATA.preamble}
            </p>
          </div>

          {/* 27 Sections Content */}
          <div className="space-y-6 divide-y divide-slate-100">
            {TERMS_SECTIONS.map((sec) => (
              <section key={sec.number} className={sec.number > 1 ? "pt-5 space-y-2.5" : "space-y-2.5"}>
                <h4 className="font-heading font-black text-sm sm:text-base text-slate-900 tracking-tight">
                  {sec.number}. {sec.title}
                </h4>

                {sec.paragraphs.map((p, idx) => (
                  <p key={idx} className="whitespace-pre-line text-slate-600">
                    {p}
                  </p>
                ))}

                {sec.bullets && sec.bullets.length > 0 && (
                  <ul className="list-disc pl-5 space-y-1 text-slate-600">
                    {sec.bullets.map((b, bIdx) => (
                      <li key={bIdx}>{b}</li>
                    ))}
                  </ul>
                )}

                {sec.subsections && sec.subsections.map((sub, sIdx) => (
                  <div key={sIdx} className="space-y-2 pt-1">
                    {sub.subtitle && (
                      <h5 className="font-bold text-xs text-slate-800">{sub.subtitle}</h5>
                    )}
                    {sub.paragraphs?.map((sp, spIdx) => (
                      <p key={spIdx} className="text-slate-600">{sp}</p>
                    ))}
                    {sub.bullets && (
                      <ul className="list-disc pl-5 space-y-1 text-slate-600">
                        {sub.bullets.map((sb, sbIdx) => (
                          <li key={sbIdx}>{sb}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </section>
            ))}
          </div>

          <div className="text-center text-[11px] text-slate-400 py-2 border-t border-slate-100">
            End of CarBlink Customer Terms &amp; Conditions (v{TERMS_VERSION})
          </div>
        </div>

        {/* 3. Sticky Footer with Checkbox & Accept Button */}
        <div className="border-t border-slate-200 bg-white/95 backdrop-blur-xs p-4 sm:p-6 pb-[calc(1rem+env(safe-area-inset-bottom))] space-y-3 shrink-0 shadow-lg">
          
          {/* Error Banner if Accept Fails */}
          {errorMessage && (
            <div className="bg-red-50 border border-red-200 text-red-800 text-xs font-medium px-3.5 py-2.5 rounded-xl flex items-start gap-2">
              <span className="font-bold shrink-0">⚠️</span>
              <p className="flex-1">{errorMessage}</p>
            </div>
          )}

          {/* Interactive Checkbox (Large Tap Target >= 44px) */}
          <label
            htmlFor="terms-agree-checkbox"
            className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-50 cursor-pointer select-none transition-colors group min-h-[44px]"
          >
            <div className="pt-0.5 shrink-0">
              <input
                id="terms-agree-checkbox"
                type="checkbox"
                checked={hasAgreed}
                onChange={(e) => setHasAgreed(e.target.checked)}
                className="w-5 h-5 rounded-md border-2 border-slate-300 text-primary-orange focus:ring-primary-orange focus:ring-offset-1 transition-all cursor-pointer accent-[#FF5500]"
              />
            </div>
            <span className="text-xs sm:text-sm font-bold text-slate-800 group-hover:text-slate-900 leading-snug">
              I have read and agree to the Terms &amp; Conditions
            </span>
          </label>

          {/* Action Buttons Row */}
          <div className="flex flex-col-reverse sm:flex-row items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="w-full sm:w-auto px-5 h-12 min-h-[44px] rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-bold text-xs sm:text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300"
            >
              Remind Me Later
            </button>

            <button
              type="button"
              onClick={handleAccept}
              disabled={!hasAgreed || isSubmitting}
              aria-busy={isSubmitting}
              className={`w-full sm:flex-1 h-12 sm:h-13 min-h-[44px] rounded-2xl font-black text-sm sm:text-base transition-all flex items-center justify-center gap-2 shadow-md ${
                hasAgreed && !isSubmitting
                  ? "bg-gradient-to-r from-[#FF5500] via-[#FF6600] to-[#FF7700] hover:from-[#EA4C00] hover:to-[#FF6600] text-white active:scale-[0.99] cursor-pointer"
                  : "bg-slate-200 text-slate-400 cursor-not-allowed opacity-70"
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Saving Acceptance...</span>
                </>
              ) : (
                <>
                  <span>Accept &amp; Continue</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
