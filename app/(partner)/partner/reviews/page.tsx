"use client";

import React, { useState, useEffect } from "react";
import { getPartnerReviews, getPartnerProfile } from "@/lib/services";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { Star, MessageSquareQuote, Calendar, Loader2 } from "lucide-react";
import { format } from "date-fns";

export default function PartnerReviewsPage() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const profile = await getPartnerProfile();
        if (profile && profile._id) {
          const data = await getPartnerReviews(profile._id);
          setReviews(data?.data?.reviews || data?.reviews || data?.data || []);
        }
      } catch (error) {
        console.error("Failed to fetch reviews", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAll();
  }, [user]);

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, idx) => (
      <Star
        key={idx}
        className={`w-5 h-5 ${idx < rating ? "text-yellow-500 fill-yellow-500" : "text-neutral-200"}`}
      />
    ));
  };

  // Calculate average rating
  const avgRating = reviews.length > 0 
    ? (reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length).toFixed(1)
    : "0.0";

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[60vh]">
        <Loader2 className="w-12 h-12 animate-spin text-primary-orange mb-4" />
        <p className="text-neutral-muted font-medium text-lg">Loading your reviews...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      {/* Header Section */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-primary-navy via-primary-navy/90 to-primary-orange/80 p-8 md:p-12 text-white shadow-xl">
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-primary-orange/20 rounded-full blur-3xl"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-3">Customer Reviews</h1>
            <p className="text-lg text-white/80 max-w-xl">
              See what your customers are saying about your service. Build trust and grow your business with 5-star experiences.
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-3xl text-center min-w-[200px]">
            <p className="text-sm font-semibold text-white/70 uppercase tracking-widest mb-2">Overall Rating</p>
            <div className="flex items-center justify-center space-x-2">
              <span className="text-5xl font-extrabold">{avgRating}</span>
              <Star className="w-8 h-8 text-yellow-400 fill-yellow-400" />
            </div>
            <p className="text-sm text-white/80 mt-2">Based on {reviews.length} reviews</p>
          </div>
        </div>
      </div>

      {reviews.length === 0 ? (
        <div className="bg-white rounded-3xl p-16 border border-neutral-muted/10 shadow-sm text-center flex flex-col items-center">
          <div className="w-24 h-24 bg-primary-orange/10 rounded-full flex items-center justify-center mb-6">
            <Star className="w-12 h-12 text-primary-orange" />
          </div>
          <h3 className="text-2xl font-bold text-primary-navy mb-3">No Reviews Yet</h3>
          <p className="text-neutral-muted max-w-md text-lg">
            Complete jobs and provide excellent service to start receiving reviews from your customers!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {reviews.map((review) => (
            <div key={review._id} className="bg-white rounded-3xl p-8 border border-neutral-muted/10 shadow-sm hover:shadow-xl transition-all duration-300 relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-primary-orange to-yellow-400 rounded-l-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="flex justify-between items-start mb-6">
                <div className="flex space-x-1">
                  {renderStars(review.rating)}
                </div>
                <span className="text-xs font-semibold text-neutral-muted flex items-center bg-neutral-bg px-3 py-1.5 rounded-full border border-neutral-muted/10">
                  <Calendar className="w-3.5 h-3.5 mr-1.5 text-primary-orange" />
                  {format(new Date(review.createdAt), "MMM d, yyyy")}
                </span>
              </div>
              
              <div className="mb-6 relative">
                <MessageSquareQuote className="absolute -top-3 -left-3 w-8 h-8 text-primary-orange/10 -z-10" />
                <p className="text-primary-navy/80 text-base leading-relaxed italic z-10 relative">
                  "{review.comment}"
                </p>
              </div>
              
              {review.customerId && (
                <div className="pt-5 border-t border-neutral-muted/10 flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary-navy/5 rounded-full flex items-center justify-center text-primary-navy font-bold text-lg">
                    {review.customerId.fullName?.charAt(0) || "C"}
                  </div>
                  <div>
                    <p className="text-xs text-neutral-muted font-bold uppercase tracking-widest mb-0.5">Reviewed By</p>
                    <p className="text-sm font-bold text-primary-navy">{review.customerId.fullName || "CarBlink Customer"}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
