"use client";

import React, { useState, useEffect, useRef } from "react";
import { User, Loader2, Sparkles } from "lucide-react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { updateUserProfile } from "@/lib/services";
import { useQueryClient } from "@tanstack/react-query";

/**
 * Reusable helper to detect whether a user still has an auto-generated
 * placeholder name (e.g. "Customer", "Customer 343", "Customer7561", "Customer 7991", "User").
 */
export function isPlaceholderCustomerName(name?: string | null): boolean {
  if (!name) return true;
  const trimmed = name.trim();
  if (!trimmed) return true;
  // Matches "customer" followed by optional spaces and digits, or "user" followed by optional digits
  return /^customer(\s*\d+)?$/i.test(trimmed) || /^user(\s*\d+)?$/i.test(trimmed);
}

/**
 * Validates the full name according to business rules:
 * - trim spaces
 * - minimum 2 characters
 * - maximum 60 characters
 * - Unicode letters, spaces, dots, hyphens, and apostrophes (supports Hindi / regional scripts)
 * - cannot match placeholder pattern again
 */
export function validateCustomerName(input: string): { isValid: boolean; error?: string; cleanName: string } {
  const cleanName = (input || "").trim().replace(/\s+/g, " ");

  if (!cleanName) {
    return { isValid: false, error: "Please enter your full name.", cleanName };
  }

  if (cleanName.length < 2) {
    return { isValid: false, error: "Full name must be at least 2 characters.", cleanName };
  }

  if (cleanName.length > 60) {
    return { isValid: false, error: "Full name cannot exceed 60 characters.", cleanName };
  }

  // Letters (Unicode \p{L}), Combining marks/diacritics (\p{M} for Indic/Hindi matras), spaces, dots, hyphens, and apostrophes. First char must be a letter.
  const validCharsRegex = new RegExp("^[\\p{L}][\\p{L}\\p{M}\\s.\\-']{1,}$", "u");
  if (!validCharsRegex.test(cleanName)) {
    return {
      isValid: false,
      error: "Name can only contain letters, spaces, dots, and hyphens.",
      cleanName,
    };
  }

  if (isPlaceholderCustomerName(cleanName)) {
    return {
      isValid: false,
      error: "Please enter your real full name, not a placeholder.",
      cleanName,
    };
  }

  return { isValid: true, cleanName };
}

export default function CustomerNamePromptModal() {
  const { user, isLoading, refreshUser } = useAuth();
  const queryClient = useQueryClient();

  const [fullName, setFullName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasCompleted, setHasCompleted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Determine if the modal should be shown
  const shouldShow =
    !isLoading &&
    !hasCompleted &&
    !!user &&
    user.role === "CUSTOMER" &&
    isPlaceholderCustomerName(user.fullName);

  // Focus input automatically when modal opens
  useEffect(() => {
    if (shouldShow) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [shouldShow]);

  // Prevent Escape key from dismissing the required modal
  useEffect(() => {
    if (!shouldShow) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [shouldShow]);

  if (!shouldShow) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setError(null);

    const validation = validateCustomerName(fullName);
    if (!validation.isValid) {
      setError(validation.error || "Please enter a valid full name.");
      inputRef.current?.focus();
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Update profile in database via existing API
      await updateUserProfile({ fullName: validation.cleanName });

      // 2. Refresh auth context user state immediately
      await refreshUser();

      // 3. Invalidate React Query caches for customer profile & user
      await queryClient.invalidateQueries({ queryKey: ["customer", "profile"] });
      await queryClient.invalidateQueries({ queryKey: ["user"] });

      // 4. Mark completed to immediately close modal
      setHasCompleted(true);
    } catch (err: any) {
      console.error("Failed to update customer name:", err);
      const apiMessage =
        err?.response?.data?.message ||
        err?.message ||
        "Could not save your name. Please check your connection and try again.";
      setError(apiMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="name-modal-title"
      onClick={(e) => e.stopPropagation()}
    >
      <div
        className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-8 flex flex-col border border-gray-100 my-auto animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Icon & Title */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center text-[#FF6B00] mb-4 shadow-sm">
            <User className="w-7 h-7" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 text-[#FF6B00] text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Profile Setup</span>
          </div>
          <h2
            id="name-modal-title"
            className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight"
          >
            Complete your profile
          </h2>
          <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">
            Please enter your full name so our service partners and team know who you are.
          </p>
        </div>

        {/* Single Input Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="customer-full-name-input"
              className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5"
            >
              Full Name
            </label>
            <div className="relative">
              <input
                ref={inputRef}
                id="customer-full-name-input"
                type="text"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  if (error) setError(null);
                }}
                disabled={isSubmitting}
                placeholder="e.g. Gaurav Sharma"
                autoComplete="name"
                className={`w-full h-12 px-4 rounded-xl border text-base font-medium text-gray-900 placeholder:text-gray-400 bg-white transition-colors focus:outline-none focus:ring-2 disabled:bg-gray-50 disabled:cursor-not-allowed ${
                  error
                    ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                    : "border-gray-200 focus:border-[#FF6B00] focus:ring-orange-100"
                }`}
              />
            </div>
            {error && (
              <p className="mt-2 text-xs font-medium text-red-600 flex items-center gap-1 animate-in fade-in">
                <span>•</span> {error}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || !fullName.trim()}
            className="w-full h-12 mt-2 rounded-xl bg-[#FF6B00] hover:bg-[#e66000] text-white font-semibold text-sm sm:text-base shadow-md shadow-orange-500/20 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <span>Submit</span>
            )}
          </button>
        </form>

        <p className="text-[11px] text-gray-400 text-center mt-4">
          This is required once so we can personalize your bookings & receipts.
        </p>
      </div>
    </div>
  );
}
