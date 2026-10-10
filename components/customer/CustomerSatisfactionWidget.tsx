// @ts-nocheck
"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { Star, MessageSquare, CheckCircle2, ChevronRight, Sparkles, ThumbsUp, Send, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useQueryClient } from "@tanstack/react-query";
import { useCustomerBookings, useCustomerReviews, useCreateReviewMutation } from "@/features/customer/hooks/useCustomerQueries";
import { respondSatisfactionTemplate } from "@/lib/services";

const QUICK_TAGS = [
  "On-Time Service",
  "Transparent Pricing",
  "Polite & Skilled Staff",
  "Clean Workshop",
  "Genuine Spare Parts",
  "Great Communication"
];

export default function CustomerSatisfactionWidget() {
  const queryClient = useQueryClient();
  const { data: bookingsData, isLoading: loadingBookings } = useCustomerBookings();
  const { data: reviewsData, isLoading: loadingReviews } = useCustomerReviews();
  const createReviewMutation = useCreateReviewMutation();

  const [selectedRating, setSelectedRating] = useState<number>(5);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [commentText, setCommentText] = useState<string>("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [activeBookingIndex, setActiveBookingIndex] = useState<number>(0);
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isDismissed, setIsDismissed] = useState<boolean>(false);
  const [dismissedBookingIds, setDismissedBookingIds] = useState<string[]>([]);

  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("carblink_dismissed_satisfaction_bookings");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            setDismissedBookingIds(parsed);
          }
        }
      }
    } catch (e) {}
  }, []);

  const bookings = bookingsData?.bookings || [];
  const reviews = Array.isArray(reviewsData) ? reviewsData : (reviewsData?.docs || reviewsData?.data || []);

  // Compute completed bookings that haven't been reviewed, responded to satisfaction, or dismissed
  const unreviewedCompletedBookings = useMemo(() => {
    const reviewedBookingIds = new Set(
      reviews.map((r: any) => String(r.bookingId?._id || r.bookingId || ""))
    );
    const safeDismissed = Array.isArray(dismissedBookingIds) ? dismissedBookingIds : [];

    return bookings.filter((b: any) => {
      if (!b) return false;
      const bookingIdStr = String(b._id || b.id || "");
      const isCompleted = String(b.status || "").toUpperCase() === "COMPLETED";
      const notReviewed = !reviewedBookingIds.has(bookingIdStr);
      const notSatisfiedResponded = b.satisfactionStatus !== 'SATISFIED' && b.satisfactionStatus !== 'DISSATISFIED';
      const notDismissed = !safeDismissed.includes(bookingIdStr);
      return isCompleted && notReviewed && notSatisfiedResponded && notDismissed;
    });
  }, [bookings, reviews, dismissedBookingIds]);

  if (loadingBookings || loadingReviews) {
    return null;
  }

  // If dismissed or no unreviewed completed booking, don't display
  if (isDismissed || unreviewedCompletedBookings.length === 0) {
    return null;
  }

  const currentBooking = unreviewedCompletedBookings[activeBookingIndex] || unreviewedCompletedBookings[0];
  const vehicleName = currentBooking?.vehicleId?.brand 
    ? `${currentBooking.vehicleId.brand} ${currentBooking.vehicleId.model || ""}`
    : currentBooking?.vehicleDetails?.makeModel || "Your Vehicle";
  const serviceName = currentBooking?.serviceId?.name || currentBooking?.serviceName || "Car Service";
  const bookingCode = currentBooking?.bookingId || currentBooking?._id?.slice(-6).toUpperCase() || "";

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleQuickSubmit = async () => {
    if (!currentBooking?._id) return;
    setErrorMessage("");

    const fullComment = [
      selectedTags.join(", "),
      commentText.trim()
    ].filter(Boolean).join(" - ") || "Satisfied with CarBlink service!";

    try {
      // 1. Submit official satisfaction response (updates DB booking.satisfactionStatus & emits real-time sockets)
      await respondSatisfactionTemplate(currentBooking._id, {
        isSatisfied: selectedRating >= 3,
        rating: selectedRating,
        feedback: fullComment,
      });

      // 2. Also register public review
      try {
        await createReviewMutation.mutateAsync({
          bookingId: currentBooking._id,
          rating: selectedRating,
          comment: fullComment,
        });
      } catch (reviewErr) {
        console.warn("Review submission note:", reviewErr);
      }

      // 3. Immediately invalidate queries across customer & executive for live refresh
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["customer", "bookings"] }),
        queryClient.invalidateQueries({ queryKey: ["customer", "booking", currentBooking._id] }),
        queryClient.invalidateQueries({ queryKey: ["customer", "reviews"] }),
        queryClient.invalidateQueries({ queryKey: ["executive"] }),
      ]);

      setSubmitSuccess(true);
      setTimeout(() => {
        setSubmitSuccess(false);
        setCommentText("");
        setSelectedTags([]);
        if (activeBookingIndex >= unreviewedCompletedBookings.length - 1) {
          setActiveBookingIndex(0);
        }
      }, 3000);
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.message || err?.message || "Failed to submit review. Please try again.");
    }
  };

  if (submitSuccess) {
    return (
      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-md border border-emerald-400 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in duration-300">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-7 h-7 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-lg sm:text-xl">Thank You for Your Feedback!</h3>
            <p className="text-emerald-100 text-xs sm:text-sm">Your satisfaction rating helps us maintain top-quality workshop standards.</p>
          </div>
        </div>
        <Button asChild variant="outline" className="bg-white/10 hover:bg-white/20 text-white border-white/30 rounded-xl">
          <Link href="/customer/reviews">View All Reviews</Link>
        </Button>
      </div>
    );
  }

  const getRatingLabel = (stars: number) => {
    switch (stars) {
      case 1: return "Needs Improvement 😞";
      case 2: return "Fair Experience 😐";
      case 3: return "Good Service 👍";
      case 4: return "Very Good! 😊";
      case 5: return "Excellent & Superb! ⭐⭐⭐⭐⭐";
      default: return "Select Rating";
    }
  };

  const displayRating = hoveredRating || selectedRating;

  return (
    <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-lg border border-amber-400/40 text-white relative overflow-hidden transition-all duration-300">
      {/* Background Decorative Accent */}
      <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute top-2 right-4 text-white/20 text-xs font-semibold tracking-widest uppercase pointer-events-none">
        Customer Satisfaction Survey
      </div>

      <div className="relative z-10 space-y-4">
        {/* Header Title & Service Info */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/20 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shrink-0 shadow-inner">
              <Star className="w-6 h-6 text-amber-200 fill-amber-200 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base sm:text-lg tracking-tight font-heading">
                  How was your recent CarBlink service?
                </h3>
                <span className="bg-white/20 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Pending Feedback
                </span>
              </div>
              <p className="text-amber-100 text-xs sm:text-sm font-medium mt-0.5">
                <span className="font-semibold text-white">{serviceName}</span> for <span className="underline decoration-amber-300/60">{vehicleName}</span> (Booking ID: #{bookingCode})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {unreviewedCompletedBookings.length > 1 && (
              <div className="text-xs bg-black/20 px-3 py-1 rounded-full font-medium">
                Service {activeBookingIndex + 1} of {unreviewedCompletedBookings.length}
              </div>
            )}
            <button
              type="button"
              onClick={() => {
                setIsDismissed(true);
                try {
                  const pendingIds = (unreviewedCompletedBookings || []).map((b: any) => String(b?._id || b?.id || ""));
                  let existing: string[] = [];
                  try {
                    const raw = localStorage.getItem("carblink_dismissed_satisfaction_bookings");
                    if (raw) {
                      const p = JSON.parse(raw);
                      if (Array.isArray(p)) existing = p;
                    }
                  } catch (e) {}
                  const updated = Array.from(new Set([...existing, ...pendingIds]));
                  localStorage.setItem("carblink_dismissed_satisfaction_bookings", JSON.stringify(updated));
                  setDismissedBookingIds(updated);
                } catch (e) {}
              }}
              className="p-1.5 rounded-full text-white/80 hover:text-white hover:bg-black/20 transition-all cursor-pointer"
              title="Close feedback"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Interactive 5-Star Selection */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl sm:rounded-2xl p-3.5 sm:p-4 border border-white/15 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center space-x-1.5 sm:space-x-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setSelectedRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="p-1 sm:p-1.5 transition-transform hover:scale-125 focus:outline-none"
                  title={`Rate ${star} Star`}
                >
                  <Star
                    className={`w-7 h-7 sm:w-8 sm:h-8 transition-colors ${
                      star <= displayRating
                        ? "text-yellow-300 fill-yellow-300 drop-shadow-md"
                        : "text-white/30 fill-transparent"
                    }`}
                  />
                </button>
              ))}
            </div>
            <span className="text-xs sm:text-sm font-bold text-amber-100 bg-black/20 px-3 py-1 rounded-lg self-start sm:self-auto">
              {getRatingLabel(displayRating)}
            </span>
          </div>

          {/* Quick Compliment Tags */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {QUICK_TAGS.map((tag) => {
              const isSelected = selectedTags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`text-xs px-2.5 py-1 rounded-full transition-all duration-200 font-medium ${
                    isSelected
                      ? "bg-white text-orange-600 font-bold shadow-sm"
                      : "bg-white/15 text-white hover:bg-white/25 border border-white/10"
                  }`}
                >
                  {isSelected ? "✓ " : "+ "}{tag}
                </button>
              );
            })}
          </div>

          {/* Optional Comment Input */}
          <div className="pt-1">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Add optional notes / feedback for workshop..."
              className="w-full bg-white/20 border border-white/30 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white placeholder-amber-100/70 focus:outline-none focus:ring-2 focus:ring-white/50"
            />
          </div>
        </div>

        {errorMessage && (
          <p className="text-xs text-red-200 font-semibold bg-red-900/40 px-3 py-1.5 rounded-lg border border-red-400/30">
            {errorMessage}
          </p>
        )}

        {/* Actions Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
          <Link
            href="/customer/reviews"
            className="text-xs font-semibold text-amber-100 hover:text-white underline underline-offset-4 flex items-center gap-1 self-start sm:self-auto"
          >
            Go to Full Reviews Page <ChevronRight className="w-3.5 h-3.5" />
          </Link>

          <Button
            onClick={handleQuickSubmit}
            disabled={createReviewMutation.isPending}
            className="w-full sm:w-auto bg-white text-orange-600 hover:bg-amber-50 font-bold shadow-md rounded-xl px-6"
          >
            {createReviewMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin text-orange-600" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Submit Satisfaction Rating
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
