// @ts-nocheck
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  GitCompareArrows,
  Star,
  Check,
  Loader2,
  ChevronDown,
  ChevronUp,
  Clock,
  Car,
  Wrench,
  ShieldCheck,
  ArrowRight,
  Plus,
  AlertCircle
} from "lucide-react";
import {
  useCustomerBookings,
  useBookingQuotes,
  useSelectQuote
} from "@/features/customer/hooks/useCustomerQueries";

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
  forwardedBidIds?: string[];
  createdAt: string;
  payments?: any[];
  hasPaidAdvance?: boolean;
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

function BookingQuoteCard({
  booking,
  actionable,
  defaultExpanded,
  onSelectQuote,
  selectingBidId
}: {
  booking: Booking;
  actionable: boolean;
  defaultExpanded: boolean;
  onSelectQuote: (booking: Booking, bid: Bid) => void;
  selectingBidId: string | null;
}) {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const { data: quotesData, isLoading: isLoadingQuotes } = useBookingQuotes(booking._id);
  const quotes: Bid[] = quotesData || [];

  const lowestAmount =
    quotes.length > 0 ? Math.min(...quotes.map((q: Bid) => q.quotedAmount)) : null;

  const getStatusBadge = (status: string) => {
    switch (status?.toUpperCase()) {
      case "PENDING":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "QUOTED":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "CUSTOMER_ACCEPTED":
      case "ACCEPTED":
      case "IN_PROGRESS":
        return "bg-green-100 text-green-800 border-green-200";
      case "COMPLETED":
        return "bg-slate-100 text-slate-800 border-slate-200";
      case "CANCELLED":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <Card className="bg-white rounded-2xl shadow-subtle border border-gray-100 overflow-hidden hover:shadow-md transition-all">
      <CardContent className="p-5 sm:p-6">
        <div
          className="flex items-start justify-between cursor-pointer select-none"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-1.5 flex-wrap gap-y-1">
              <h4 className="font-heading font-bold text-gray-900 text-lg flex items-center gap-2">
                <Car className="w-5 h-5 text-primary-orange" />
                {booking.vehicleId?.brand} {booking.vehicleId?.model}
              </h4>
              {booking.vehicleId?.registrationNumber && (
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-mono font-medium">
                  {booking.vehicleId.registrationNumber}
                </span>
              )}
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${getStatusBadge(
                  booking.status
                )}`}
              >
                {booking.status === "QUOTED"
                  ? "Quotes Ready"
                  : booking.status.replace(/_/g, " ")}
              </span>
            </div>

            <div className="flex items-center gap-4 text-xs sm:text-sm text-gray-500 mt-1">
              <span className="font-medium text-gray-700">
                {booking.serviceId?.name || "Car Service"}
              </span>
              {booking.cityId?.name && (
                <span>• {booking.cityId?.name}, {booking.cityId?.state}</span>
              )}
              {quotes.length > 0 && (
                <span className="text-primary-orange font-bold">
                  • {quotes.length} {quotes.length === 1 ? "Quote" : "Quotes"} Received
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-500 hover:text-gray-900 rounded-lg p-2"
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
            >
              {isExpanded ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>

        {isExpanded && (
          <div className="mt-5 pt-5 border-t border-gray-100">
            {isLoadingQuotes ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 text-primary-orange animate-spin" />
                <span className="ml-2 text-sm text-gray-500 font-medium">
                  Loading quotes from workshops...
                </span>
              </div>
            ) : quotes.length === 0 ? (
              <div className="py-6 text-center bg-gray-50/70 rounded-xl p-4 border border-dashed border-gray-200">
                <Clock className="w-8 h-8 text-amber-500 mx-auto mb-2 opacity-80" />
                <p className="text-sm font-semibold text-gray-700">
                  Quotes are being prepared
                </p>
                <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                  Our certified workshop partners are inspecting your service details. Quotes will appear here automatically.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Received Quotes ({quotes.length})
                  </p>
                  <span className="text-xs text-gray-400">
                    Sorted by Best Price
                  </span>
                </div>

                {quotes
                  .slice()
                  .sort((a, b) => a.quotedAmount - b.quotedAmount)
                  .map((bid) => {
                    const isLowest = bid.quotedAmount === lowestAmount;
                    const isWinning =
                      booking.acceptedBidId === bid._id ||
                      bid.status === "WON" ||
                      bid.status === "ACCEPTED";
                    const isUnlocked =
                      booking.payments?.some((p: any) => p.status === "SUCCESS") ||
                      booking.hasPaidAdvance;

                    return (
                      <div
                        key={bid._id}
                        className={`p-5 rounded-2xl border transition-all ${
                          isWinning
                            ? "border-green-300 bg-green-50/50 shadow-sm"
                            : isLowest
                            ? "border-orange-200 bg-orange-50/20 hover:border-orange-300 hover:shadow-sm"
                            : "border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm"
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex-1 space-y-1.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h5 className="font-bold text-gray-900 text-base flex items-center gap-1.5">
                                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                                {isUnlocked && isWinning
                                  ? bid.partnerId?.businessName || "Verified Service Partner"
                                  : "Verified CarBlink Workshop"}
                              </h5>

                              {isLowest && !isWinning && (
                                <span className="text-[10px] uppercase tracking-wide font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                                  Best Price
                                </span>
                              )}

                              {isWinning && (
                                <span className="text-[10px] uppercase tracking-wide font-extrabold px-2.5 py-0.5 rounded-full bg-green-600 text-white shadow-2xs">
                                  Selected ✓
                                </span>
                              )}
                            </div>

                            {typeof bid.partnerId?.rating === "number" && (
                              <div className="flex items-center space-x-1 text-xs text-gray-600">
                                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                                <span className="font-bold text-gray-900">
                                  {bid.partnerId.rating.toFixed(1)}
                                </span>
                                <span className="text-gray-400">
                                  ({bid.partnerId.totalReviews || 0} reviews)
                                </span>
                              </div>
                            )}

                            {bid.estimatedDuration && (
                              <div className="flex items-center space-x-1.5 text-xs text-gray-600">
                                <Clock className="w-3.5 h-3.5 text-gray-400" />
                                <span>Estimated Time: <strong className="text-gray-800">{bid.estimatedDuration} hrs</strong></span>
                              </div>
                            )}

                            {bid.notes && (
                              <p className="text-xs text-gray-600 bg-gray-50 rounded-lg p-2 mt-1 border border-gray-100">
                                <strong>Partner Note:</strong> {bid.notes}
                              </p>
                            )}
                          </div>

                          <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-3 sm:pt-0 border-gray-100 gap-2">
                            <div>
                              <span className="text-[10px] uppercase font-bold text-gray-400 block sm:text-right">
                                Total Estimate
                              </span>
                              <p className="text-2xl font-extrabold text-gray-900 font-heading">
                                ₹{bid.quotedAmount?.toLocaleString()}
                              </p>
                            </div>

                            {actionable && !booking.acceptedBidId && (
                              <Button
                                size="sm"
                                className="bg-primary-orange hover:bg-primary-orange-dark text-white font-bold rounded-xl text-xs h-9 px-4 shadow-sm"
                                onClick={() => onSelectQuote(booking, bid)}
                                isLoading={selectingBidId === bid._id}
                                disabled={selectingBidId !== null}
                              >
                                <Check className="w-4 h-4 mr-1.5" />
                                Select Quote
                              </Button>
                            )}

                            {booking.acceptedBidId && isWinning && (
                              <Button
                                asChild
                                size="sm"
                                variant="outline"
                                className="border-green-300 text-green-700 hover:bg-green-50 rounded-xl text-xs font-bold"
                              >
                                <Link href={`/customer/bookings/${booking._id}#advance-payment-section`}>
                                  View Booking Details <ArrowRight className="w-3.5 h-3.5 ml-1" />
                                </Link>
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}

            <div className="mt-4 pt-3 flex items-center justify-end">
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="text-xs text-primary-orange hover:text-primary-orange-dark hover:bg-orange-50 font-bold"
              >
                <Link href={`/customer/bookings/${booking._id}`}>
                  Go to Full Booking Page <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Link>
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function QuotesPage() {
  const router = useRouter();
  const { data: bookingsData, isLoading } = useCustomerBookings();
  const bookings = (bookingsData?.bookings || []) as Booking[];

  const selectQuoteMutation = useSelectQuote();
  const [selectingBidId, setSelectingBidId] = useState<string | null>(null);
  const [message, setMessage] = useState({ type: "", text: "" });

  const handleSelectQuote = async (booking: Booking, bid: Bid) => {
    setSelectingBidId(bid._id);
    setMessage({ type: "", text: "" });
    try {
      await selectQuoteMutation.mutateAsync({
        bookingId: booking._id,
        bidId: bid._id
      });
      setMessage({
        type: "success",
        text: `Quote of ₹${bid.quotedAmount} selected! Redirecting to booking confirmation...`
      });
      setTimeout(() => {
        router.push(`/customer/bookings/${booking._id}#advance-payment-section`);
      }, 700);
    } catch (err: unknown) {
      setMessage({
        type: "error",
        text: (err as Error)?.message || "Failed to select quote."
      });
    } finally {
      setSelectingBidId(null);
    }
  };

  const awaitingDecision = bookings.filter(
    (b) =>
      (b.status === "QUOTED" ||
        (b.forwardedBidIds && b.forwardedBidIds.length > 0) ||
        b.status === "PENDING") &&
      b.status !== "CANCELLED" &&
      b.status !== "COMPLETED" &&
      !b.acceptedBidId
  );

  const alreadyDecided = bookings.filter(
    (b) =>
      b.acceptedBidId ||
      b.status === "CUSTOMER_ACCEPTED" ||
      b.status === "ACCEPTED" ||
      b.status === "IN_PROGRESS" ||
      b.status === "COMPLETED"
  );

  return (
    <div className="space-y-6 md:space-y-8 container px-4 sm:px-6 md:px-8 mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 font-heading tracking-tight">
            Compare Quotes
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Review live quotes received from verified partner workshops and choose the best offer.
          </p>
        </div>
        <Button
          asChild
          className="bg-primary-orange hover:bg-primary-orange-dark text-white rounded-xl shadow-sm text-sm h-11 px-5 font-semibold"
        >
          <Link href="/customer/bookings/new" className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            <span>Book Service</span>
          </Link>
        </Button>
      </div>

      {message.text && (
        <div
          className={`p-4 rounded-xl text-sm font-medium border flex items-center justify-between ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-red-50 text-red-800 border-red-200"
          }`}
        >
          <span>{message.text}</span>
          <button
            onClick={() => setMessage({ type: "", text: "" })}
            className="text-xs underline font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="bg-white p-16 rounded-3xl shadow-subtle border border-gray-100 text-center">
          <Loader2 className="w-8 h-8 text-primary-orange animate-spin mx-auto mb-3" />
          <p className="text-gray-500 font-medium text-sm">
            Loading your bookings & workshop quotes...
          </p>
        </div>
      ) : (
        <>
          {/* Active Quotes Section */}
          <div>
            <h3 className="text-xl font-bold text-gray-900 font-heading tracking-tight mb-4 flex items-center space-x-2">
              <div className="bg-orange-50 p-2 rounded-xl text-primary-orange">
                <GitCompareArrows className="w-5 h-5" />
              </div>
              <span>Awaiting Your Decision ({awaitingDecision.length})</span>
            </h3>

            {awaitingDecision.length === 0 ? (
              <div className="bg-white p-12 sm:p-16 rounded-3xl shadow-subtle border border-gray-100 text-center flex flex-col items-center justify-center">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4 border border-gray-100">
                  <GitCompareArrows className="w-10 h-10 text-gray-300" />
                </div>
                <h4 className="font-heading font-bold text-gray-900 text-lg mb-1">
                  No Quotes Waiting for Decision
                </h4>
                <p className="text-gray-500 font-medium max-w-sm mb-6 text-sm">
                  {bookings.length === 0
                    ? "You haven't requested any services yet. Book a service to receive competitive quotes."
                    : "All current bookings have either been confirmed or are awaiting initial partner responses."}
                </p>
                <Button
                  asChild
                  className="bg-primary-orange hover:bg-primary-orange-dark text-white font-semibold rounded-xl text-xs h-10 px-6"
                >
                  <Link href="/customer/bookings/new">
                    <Plus className="w-4 h-4 mr-2" /> Book a Service Now
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {awaitingDecision.map((booking, idx) => (
                  <BookingQuoteCard
                    key={booking._id}
                    booking={booking}
                    actionable={true}
                    defaultExpanded={true}
                    onSelectQuote={handleSelectQuote}
                    selectingBidId={selectingBidId}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Decided Quotes Section */}
          {alreadyDecided.length > 0 && (
            <div className="mt-10">
              <h3 className="text-xl font-bold text-gray-900 font-heading tracking-tight mb-4 flex items-center space-x-2">
                <div className="bg-green-50 p-2 rounded-xl text-green-600">
                  <Check className="w-5 h-5" />
                </div>
                <span>Previously Decided ({alreadyDecided.length})</span>
              </h3>
              <div className="space-y-4">
                {alreadyDecided.map((booking) => (
                  <BookingQuoteCard
                    key={booking._id}
                    booking={booking}
                    actionable={false}
                    defaultExpanded={false}
                    onSelectQuote={handleSelectQuote}
                    selectingBidId={selectingBidId}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
