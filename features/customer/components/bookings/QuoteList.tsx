import React from "react";
import { Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Quote, BookingDetails } from "./BookingDetailsModal";

interface QuoteListProps {
  quotes: Quote[];
  isLoading: boolean;
  selectedBooking: BookingDetails;
  onSelectQuote: (quoteId: string) => void;
  isSelecting: boolean;
  selectedQuoteId: string;
}

export function QuoteList({
  quotes,
  isLoading,
  selectedBooking,
  onSelectQuote,
  isSelecting,
  selectedQuoteId,
}: QuoteListProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="w-5 h-5 text-primary-orange animate-spin" />
      </div>
    );
  }

  if (quotes.length === 0) {
    return <p className="text-sm text-neutral-muted">No quotes received yet.</p>;
  }

  return (
    <div className="space-y-3">
      {quotes.map((quote) => {
        const isAccepted = 
          selectedBooking.acceptedBidId === quote._id || 
          (selectedBooking.acceptedBidId as unknown as { _id: string })?._id === quote._id || 
          (quote as any).status === 'ACCEPTED';

        const canSelect = 
          selectedBooking.status !== "CANCELLED" && 
          selectedBooking.status !== "COMPLETED" && 
          selectedBooking.status !== "ACCEPTED" && 
          !selectedBooking.acceptedBidId && 
          !quotes.some(q => q.status === "ACCEPTED");

        return (
          <div
            key={quote._id}
            className={`p-4 rounded-xl border ${
              isAccepted
                ? "border-success bg-success/5"
                : "border-neutral-muted/20 bg-neutral-bg"
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-neutral-dark">
                  Partner: {quote.partnerId?.businessName || (quote.partnerId as any)?.fullName || "Service Partner"}
                </p>
                <p className="text-sm text-neutral-muted">
                  Estimated: {quote.estimatedDuration || "N/A"}
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-primary-navy">₹{quote.quotedAmount}</p>
                {isAccepted && (
                  <span className="text-xs text-success font-medium">Selected</span>
                )}
              </div>
            </div>
            {canSelect && (
              <div className="mt-3 flex justify-end">
                <Button
                  size="sm"
                  onClick={() => onSelectQuote(quote._id)}
                  isLoading={isSelecting && selectedQuoteId === quote._id}
                >
                  <Check className="w-4 h-4 mr-1" /> Select Quote
                </Button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
