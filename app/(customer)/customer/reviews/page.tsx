"use client";

import React, { useState, useEffect } from "react";
import { getMyReviews, createReview, getBookings } from "@/lib/services";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/Select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Star, Loader2, MessageSquare } from "lucide-react";

interface Review {
  _id: string;
  bookingId: {
    _id: string;
    serviceId: { name: string };
    vehicleId: { brand: string; model: string };
  };
  rating: number;
  comment: string;
  createdAt: string;
}

interface Booking {
  _id: string;
  vehicleId: { brand: string; model: string };
  serviceId: { name: string };
  status: string;
}

export default function MyReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [bookingId, setBookingId] = useState("");
  const [rating, setRating] = useState("5");
  const [comment, setComment] = useState("");
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [reviewsRes, bookingsRes] = await Promise.all([
        getMyReviews(),
        getBookings(),
      ]);
      
      setReviews((Array.isArray(reviewsRes) ? reviewsRes : (reviewsRes?.docs || reviewsRes?.data || [])));
      
      // Filter bookings that are COMPLETED to allow reviewing them
      const completedBookings = ((Array.isArray(bookingsRes) ? bookingsRes : (bookingsRes?.docs || bookingsRes?.data || []))).filter(
        (b: Booking) => b.status === "COMPLETED"
      );
      setBookings(completedBookings);
    } catch (error) {
      console.error("Error fetching reviews data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingId) {
      setMessage({ type: "error", text: "Please select a booking to review." });
      return;
    }
    
    setIsSubmitting(true);
    setMessage({ type: "", text: "" });
    
    try {
      await createReview({
        bookingId,
        rating: parseInt(rating),
        comment,
      });
      
      setMessage({ type: "success", text: "Review submitted successfully!" });
      setBookingId("");
      setRating("5");
      setComment("");
      
      // Refresh the reviews list
      fetchData();
    } catch (err: any) {
      setMessage({ type: "error", text: err?.message || "Failed to submit review. You may have already reviewed this booking." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star 
            key={star} 
            className={`w-4 h-4 ${star <= rating ? "text-yellow-400 fill-yellow-400" : "text-neutral-muted/30"}`} 
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
      <h2 className="text-3xl font-bold text-gray-900 font-heading tracking-tight">My Reviews</h2>

      {message.text && (
        <div className={`p-3 rounded-lg text-sm border ${
          message.type === "success" 
            ? "bg-success/10 text-success border-success/20" 
            : "bg-danger/10 text-danger border-danger/20"
        }`}>
          {message.text}
        </div>
      )}

      {/* Review Submission Form */}
      <Card className="bg-white/90 backdrop-blur-md shadow-subtle border-white/40">
        <CardHeader>
          <CardTitle className="flex items-center space-x-3 text-xl">
            <div className="bg-orange-50 p-2 rounded-xl text-primary-orange">
              <Star className="w-5 h-5" />
            </div>
            <span>Write a Review</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmitReview} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Select Completed Booking"
                value={bookingId}
                onChange={(e) => setBookingId(e.target.value)}
                options={bookings.map(b => ({ 
                  value: b._id, 
                  label: `${b.vehicleId?.brand} ${b.vehicleId?.model} - ${b.serviceId?.name}` 
                }))}
                disabled={bookings.length === 0}
                required
              />
              <Select
                label="Rating"
                value={rating}
                onChange={(e) => setRating(e.target.value)}
                options={[
                  { value: "5", label: "5 - Excellent" },
                  { value: "4", label: "4 - Very Good" },
                  { value: "3", label: "3 - Good" },
                  { value: "2", label: "2 - Fair" },
                  { value: "1", label: "1 - Poor" },
                ]}
                required
              />
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-neutral-dark mb-1.5">Comment</label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Tell us about your experience..."
                  rows={3}
                  className="flex w-full rounded-lg border border-neutral-muted/40 bg-neutral-white px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:border-primary-orange focus:ring-primary-orange/20"
                  required
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button type="submit" isLoading={isSubmitting} disabled={bookings.length === 0}>
                Submit Review
              </Button>
            </div>
            {bookings.length === 0 && (
              <p className="text-xs text-neutral-muted">You have no completed bookings available to review.</p>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Reviews List */}
      <div>
        <h3 className="text-2xl font-bold text-gray-900 font-heading tracking-tight mb-5">Past Reviews ({reviews.length})</h3>
        {isLoading ? (
          <div className="bg-white/80 backdrop-blur-md p-12 rounded-3xl shadow-sm border border-white/40 text-center">
            <Loader2 className="w-8 h-8 text-primary-orange animate-spin mx-auto mb-3" />
            <p className="text-gray-500 font-medium">Loading reviews...</p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-md p-12 rounded-3xl shadow-sm border border-white/40 text-center flex flex-col items-center justify-center">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4 border border-gray-100">
              <MessageSquare className="w-10 h-10 text-gray-300" />
            </div>
            <p className="text-gray-500 font-medium">You haven&apos;t written any reviews yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <Card key={review._id} className="bg-white/90 backdrop-blur-md shadow-subtle border-white/40 hover:shadow-elevated hover:-translate-y-1 transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-heading font-bold text-gray-900 text-lg">
                        {review.bookingId?.serviceId?.name || "Service"}
                      </h4>
                      <p className="text-xs text-neutral-muted">
                        Vehicle: {review.bookingId?.vehicleId?.brand} {review.bookingId?.vehicleId?.model}
                      </p>
                    </div>
                    <div>
                      {renderStars(review.rating)}
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 bg-gray-50/50 p-4 rounded-xl border border-gray-100 mt-2 font-medium">
                    &quot;{review.comment}&quot;
                  </p>
                  <p className="text-xs text-neutral-muted mt-3 text-right">
                    Posted on {new Date(review.createdAt).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
