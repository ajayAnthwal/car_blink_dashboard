"use client";

import React, { useState, useEffect } from "react";
import { getBookings, getBookingQuotes, selectBookingQuote } from "@/lib/services";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { GitCompareArrows, Star, Check, Loader2, ChevronDown, ChevronUp, Clock } from "lucide-react";

interface Vehicle {
  _id: string;
  brand: string;
  model: string;
  registrationNumber: string;
}

interface Service {
  _id: string;
  name: string;
}

interface City {
  _id: string;
  name: string;
  state: string;
}

interface Booking {
  _id: string;
  vehicleId: Vehicle;
  serviceId: Service;
  cityId: City;
  description: string;
  status: string;
  acceptedBidId?: string | null;
  createdAt: string;
}

interface Partner {
  _id: string;
  businessName: string;
  rating?: number;
  totalReviews?: number;
}

interface Bid {
  _id: string;
  bookingId: string;
  partnerId: Partner;
  quotedAmount: number;
  estimatedDuration?: string;
  notes?: string;
  status: string;
  createdAt: string;
}

export default function QuotesPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedBookingId, setExpandedBookingId] = useState<string | null>(null);
  const [quotesByBooking, setQuotesByBooking] = useState<Record<string, Bid[]>>({});
  const [isLoadingQuotes, setIsLoadingQuotes] = useState(false);
  const [selectingBidId, setSelectingBidId] = useState<string | null>(null);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    setIsLoading(true);
    try {
      const res = await getBookings();
      setBookings((Array.isArray(res?.docs) ? res.docs : (Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []))));
    } catch (err) {
      console.error("Failed to load bookings", err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleBooking = async (booking: Booking) => {
    if (expandedBookingId === booking._id) {
      setExpandedBookingId(null);
      return;
    }

    setExpandedBookingId(booking._id);

    if (!quotesByBooking[booking._id]) {
      setIsLoadingQuotes(true);
      try {
        const res = await getBookingQuotes(booking._id);
        setQuotesByBooking((prev) => ({ ...prev, [booking._id]: (Array.isArray(res?.docs) ? res.docs : (Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []))) }));
      } catch (err) {
        console.error("Failed to load quotes", err);
      } finally {
        setIsLoadingQuotes(false);
      }
    }
  };

  const handleSelectQuote = async (booking: Booking, bid: Bid) => {
    setSelectingBidId(bid._id);
    setMessage({ type: "", text: "" });
    try {
      await selectBookingQuote(booking._id, { bidId: bid._id });
      setMessage({ type: "success", text: `Quote from ${bid.partnerId?.businessName || "partner"} selected successfully!` });
      await fetchBookings();
      setQuotesByBooking((prev) => {
        const updated = { ...prev };
        delete updated[booking._id];
        return updated;
      });
      setExpandedBookingId(null);
    } catch (err: any) {
      setMessage({ type: "error", text: err?.message || "Failed to select quote." });
    } finally {
      setSelectingBidId(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case "PENDING":
        return "bg-warning/10 text-warning border-warning/20";
      case "QUOTED":
        return "bg-secondary-blue/10 text-secondary-blue border-secondary-blue/20";
      case "ACCEPTED":
      case "IN_PROGRESS":
        return "bg-success/10 text-success border-success/20";
      case "COMPLETED":
        return "bg-primary-navy/10 text-primary-navy border-primary-navy/20";
      case "CANCELLED":
        return "bg-danger/10 text-danger border-danger/20";
      default:
        return "bg-neutral-muted/10 text-neutral-muted border-neutral-muted/20";
    }
  };

  const awaitingDecision = bookings.filter((b) => b.status === "QUOTED");
  const alreadyDecided = bookings.filter(
    (b) => b.status === "ACCEPTED" || b.status === "IN_PROGRESS" || b.status === "COMPLETED"
  );

  const renderBookingCard = (booking: Booking, actionable: boolean) => {
    const quotes = quotesByBooking[booking._id] || [];
    const isExpanded = expandedBookingId === booking._id;
    const lowestAmount = quotes.length > 0 ? Math.min(...quotes.map((q) => q.quotedAmount)) : null;

    return (
      <Card key={booking._id} className="bg-white/90 backdrop-blur-md shadow-subtle border-white/40 hover:shadow-elevated hover:-translate-y-1 transition-all duration-300">
        <CardContent className="p-6">
          <div className="flex items-start justify-between cursor-pointer" onClick={() => toggleBooking(booking)}>
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h4 className="font-heading font-bold text-gray-900 text-lg">
                  {booking.vehicleId?.brand} {booking.vehicleId?.model}
                </h4>
                <span className={`text-xs px-2 py-1 rounded-full border ${getStatusColor(booking.status)}`}>
                  {booking.status}
                </span>
              </div>
              <p className="text-sm text-neutral-muted">{booking.serviceId?.name}</p>
              <p className="text-sm text-neutral-muted">
                {booking.cityId?.name}, {booking.cityId?.state}
              </p>
            </div>
            <button className="text-neutral-muted hover:text-neutral-dark p-1">
              {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
          </div>

          {isExpanded && (
            <div className="mt-4 pt-4 border-t border-neutral-muted/20">
              {isLoadingQuotes && !quotesByBooking[booking._id] ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="w-5 h-5 text-primary-orange animate-spin" />
                </div>
              ) : quotes.length === 0 ? (
                <p className="text-sm text-neutral-muted py-2">No quotes received yet for this booking.</p>
              ) : (
                <div className="space-y-3">
                  {quotes
                    .slice()
                    .sort((a, b) => a.quotedAmount - b.quotedAmount)
                    .map((bid) => {
                      const isLowest = bid.quotedAmount === lowestAmount;
                      const isWinning = booking.acceptedBidId === bid._id || bid.status === "ACCEPTED";
                      return (
                        <div
                          key={bid._id}
                          className={`p-5 rounded-2xl border ${
                            isWinning
                              ? "border-success/50 bg-success/5 shadow-sm"
                              : "border-gray-100 bg-white shadow-sm hover:shadow-md transition-shadow"
                          } relative overflow-hidden`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <p className="font-medium text-neutral-dark">
                                  {bid.partnerId?.businessName || "Service Partner"}
                                </p>
                                {isLowest && !isWinning && (
                                  <span className="text-[10px] uppercase tracking-wide font-semibold px-2 py-0.5 rounded-full bg-success/10 text-success">
                                    Best Price
                                  </span>
                                )}
                                {isWinning && (
                                  <span className="text-[10px] uppercase tracking-wide font-semibold px-2 py-0.5 rounded-full bg-success text-neutral-white">
                                    Selected
                                  </span>
                                )}
                              </div>
                              {typeof bid.partnerId?.rating === "number" && (
                                <div className="flex items-center space-x-1 mt-1">
                                  <Star className="w-3.5 h-3.5 text-warning fill-warning" />
                                  <span className="text-xs text-neutral-muted">
                                    {bid.partnerId.rating.toFixed(1)} ({bid.partnerId.totalReviews || 0} reviews)
                                  </span>
                                </div>
                              )}
                              {bid.estimatedDuration && (
                                <div className="flex items-center space-x-1 mt-1 text-xs text-neutral-muted">
                                  <Clock className="w-3.5 h-3.5" />
                                  <span>Estimated: {bid.estimatedDuration}</span>
                                </div>
                              )}
                              {bid.notes && (
                                <p className="text-xs text-neutral-muted mt-1">{bid.notes}</p>
                              )}
                            </div>
                            <div className="text-right ml-4">
                              <p className="text-xl font-bold font-heading text-gray-900">
                                ₹{bid.quotedAmount.toLocaleString()}
                              </p>
                            </div>
                          </div>

                          {actionable && booking.status === "QUOTED" && (
                            <div className="mt-3 flex justify-end">
                              <Button
                                size="sm"
                                onClick={() => handleSelectQuote(booking, bid)}
                                isLoading={selectingBidId === bid._id}
                                disabled={selectingBidId !== null}
                              >
                                <Check className="w-4 h-4 mr-1" /> Select Quote
                              </Button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
      <h2 className="text-3xl font-bold text-gray-900 font-heading tracking-tight">Compare Quotes</h2>

      {message.text && (
        <div
          className={`p-3 rounded-lg text-sm border ${
            message.type === "success"
              ? "bg-success/10 text-success border-success/20"
              : "bg-danger/10 text-danger border-danger/20"
          }`}
        >
          {message.text}
        </div>
      )}

      {isLoading ? (
        <div className="bg-white/80 backdrop-blur-md p-12 rounded-3xl shadow-sm border border-white/40 text-center">
          <Loader2 className="w-8 h-8 text-primary-orange animate-spin mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Loading your bookings...</p>
        </div>
      ) : (
        <>
          <div>
            <h3 className="text-xl font-bold text-gray-900 font-heading tracking-tight mb-5 flex items-center space-x-3">
              <div className="bg-orange-50 p-2 rounded-xl text-primary-orange">
                <GitCompareArrows className="w-5 h-5" />
              </div>
              <span>Awaiting Your Decision ({awaitingDecision.length})</span>
            </h3>
            {awaitingDecision.length === 0 ? (
              <div className="bg-white/80 backdrop-blur-md p-12 rounded-3xl shadow-sm border border-white/40 text-center flex flex-col items-center justify-center">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4 border border-gray-100">
                  <GitCompareArrows className="w-10 h-10 text-gray-300" />
                </div>
                <p className="text-gray-500 font-medium">
                  No bookings currently have quotes waiting for your decision.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {awaitingDecision.map((booking) => renderBookingCard(booking, true))}
              </div>
            )}
          </div>

          {alreadyDecided.length > 0 && (
            <div className="mt-8">
              <h3 className="text-xl font-bold text-gray-900 font-heading tracking-tight mb-5">Previously Decided</h3>
              <div className="space-y-4">
                {alreadyDecided.map((booking) => renderBookingCard(booking, false))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
