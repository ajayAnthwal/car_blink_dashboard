"use client";

import React, { useState, useEffect } from "react";
import { getBookings, getBookingQuotes, selectBookingQuote } from "@/lib/services";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
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
      setBookings(res?.docs || res || []);
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
        setQuotesByBooking((prev) => ({ ...prev, [booking._id]: res?.docs || res || [] }));
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
      <Card key={booking._id} className="hover:shadow-md transition-shadow">
        <CardContent className="p-5">
          <div className="flex items-start justify-between cursor-pointer" onClick={() => toggleBooking(booking)}>
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h4 className="font-semibold text-primary-navy">
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
                          className={`p-4 rounded-xl border ${
                            isWinning
                              ? "border-success bg-success/5"
                              : "border-neutral-muted/20 bg-neutral-bg"
                          }`}
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
                              <p className="text-lg font-bold text-primary-navy">
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
    <div className="space-y-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-primary-navy">Compare Quotes</h2>

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
        <div className="bg-neutral-white p-10 rounded-2xl shadow-sm border border-neutral-muted/20 text-center">
          <Loader2 className="w-8 h-8 text-primary-orange animate-spin mx-auto mb-3" />
          <p className="text-neutral-muted">Loading your bookings...</p>
        </div>
      ) : (
        <>
          <div>
            <h3 className="text-lg font-semibold text-primary-navy mb-3 flex items-center space-x-2">
              <GitCompareArrows className="w-5 h-5 text-primary-orange" />
              <span>Awaiting Your Decision ({awaitingDecision.length})</span>
            </h3>
            {awaitingDecision.length === 0 ? (
              <div className="bg-neutral-white p-8 rounded-2xl shadow-sm border border-neutral-muted/20 text-center">
                <p className="text-neutral-muted">
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
            <div>
              <h3 className="text-lg font-semibold text-primary-navy mb-3">Previously Decided</h3>
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
