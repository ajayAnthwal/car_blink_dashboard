import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QuoteList } from "./QuoteList";

export interface JobExtension {
  _id: string;
  partName: string;
  reason: string;
  cost: number;
  status: string;
}

export interface BookingDetails {
  _id: string;
  vehicleId?: { brand: string; model: string };
  serviceId?: { name: string };
  cityId?: { name: string; state: string };
  preferredDate: string;
  description: string;
  status: string;
  serviceMode?: string;
  address?: string;
  landmark?: string;
  jobExtensions?: JobExtension[];
  acceptedBidId?: any;
}

export interface Quote {
  _id: string;
  partnerId?: { businessName: string; rating?: number; totalReviews?: number };
  quotedAmount: number;
  estimatedDuration?: string;
  notes?: string;
  status?: string;
}

interface BookingDetailsModalProps {
  booking: BookingDetails | null;
  quotes: Quote[];
  isLoadingQuotes: boolean;
  onClose: () => void;
  onCancelBooking: (reason: string) => void;
  isCancelling: boolean;
  onSelectQuote: (quoteId: string) => void;
  isSelectingQuote: boolean;
  onRespondExtension: (extId: string, status: "APPROVED" | "REJECTED") => void;
  isExtensionProcessing: boolean;
  onPayExtension: (ext: JobExtension) => void;
}

export function BookingDetailsModal({
  booking,
  quotes,
  isLoadingQuotes,
  onClose,
  onCancelBooking,
  isCancelling,
  onSelectQuote,
  isSelectingQuote,
  onRespondExtension,
  isExtensionProcessing,
  onPayExtension,
}: BookingDetailsModalProps) {
  const [cancelReason, setCancelReason] = useState("");
  const [selectedQuoteId, setSelectedQuoteId] = useState("");

  if (!booking) return null;

  return (
    <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white/95 backdrop-blur-xl border-white/40 shadow-elevated">
        <CardHeader className="flex flex-row items-center justify-between border-b border-gray-100 pb-4 sticky top-0 bg-white/95 z-10">
          <CardTitle className="font-heading text-xl tracking-tight">Booking Details</CardTitle>
          <button
            onClick={onClose}
            className="text-neutral-muted hover:text-neutral-dark"
          >
            <X className="w-5 h-5" />
          </button>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-neutral-muted">Vehicle</p>
              <p className="font-medium">{booking.vehicleId?.brand} {booking.vehicleId?.model}</p>
            </div>
            <div>
              <p className="text-neutral-muted">Service</p>
              <p className="font-medium">{booking.serviceId?.name}</p>
            </div>
            <div>
              <p className="text-neutral-muted">City</p>
              <p className="font-medium">{booking.cityId?.name}, {booking.cityId?.state}</p>
            </div>
            <div>
              <p className="text-neutral-muted">Preferred Date</p>
              <p className="font-medium">{new Date(booking.preferredDate).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-neutral-muted">Service Mode</p>
              <p className="font-medium">{booking.serviceMode === 'DOORSTEP' ? 'Doorstep Service' : 'Visit Garage'}</p>
            </div>
            {booking.serviceMode === 'DOORSTEP' && (
              <div className="col-span-2 bg-gray-50 p-3 rounded-lg border border-gray-100">
                <p className="text-neutral-muted text-xs uppercase font-bold tracking-wider mb-1">Full Address</p>
                <p className="font-medium">{booking.address}</p>
                {booking.landmark && (
                  <p className="text-sm text-gray-500 mt-1">Landmark: {booking.landmark}</p>
                )}
              </div>
            )}
            <div className="col-span-2">
              <p className="text-neutral-muted">Description</p>
              <p className="font-medium">{booking.description}</p>
            </div>
          </div>

          {booking.status !== "CANCELLED" && booking.status !== "COMPLETED" && (
            <div className="border-t border-neutral-muted/20 pt-4">
              <h4 className="font-semibold text-primary-navy mb-3">Cancel Booking</h4>
              <div className="flex space-x-3">
                <Input
                  placeholder="Reason for cancellation"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  onClick={() => onCancelBooking(cancelReason)}
                  isLoading={isCancelling}
                  disabled={!cancelReason.trim()}
                  className="border-danger text-danger hover:bg-danger/5"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Job Extensions Section */}
          {booking.jobExtensions && booking.jobExtensions.length > 0 && (
            <div className="border-t border-neutral-muted/20 pt-4">
              <h4 className="font-semibold text-primary-navy mb-3 flex items-center">
                <AlertCircle className="w-4 h-4 mr-2 text-warning" /> Extension Requests
              </h4>
              <div className="space-y-3">
                {booking.jobExtensions.map((ext: JobExtension) => (
                  <div key={ext._id} className="p-3 bg-orange-50 border border-orange-100 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-gray-900">{ext.partName}</p>
                        <p className="text-sm text-gray-600">{ext.reason}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-primary-navy">₹{ext.cost}</p>
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${
                          ext.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                          ext.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {ext.status}
                        </span>
                      </div>
                    </div>
                    {ext.status === 'PENDING' && (
                      <div className="flex space-x-2 mt-3 justify-end">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="border-red-200 text-red-600 hover:bg-red-50" 
                          onClick={() => onRespondExtension(ext._id, 'REJECTED')} 
                          disabled={isExtensionProcessing}
                        >
                          Reject
                        </Button>
                        <Button 
                          size="sm" 
                          className="bg-green-600 hover:bg-green-700 text-white" 
                          onClick={() => onRespondExtension(ext._id, 'APPROVED')} 
                          isLoading={isExtensionProcessing}
                        >
                          Approve
                        </Button>
                      </div>
                    )}
                    {ext.status === 'APPROVED' && (
                      <div className="flex space-x-2 mt-3 justify-end">
                        <Button 
                          size="sm" 
                          className="bg-primary-orange hover:bg-primary-orange/90 text-white" 
                          onClick={() => onPayExtension(ext)} 
                          isLoading={isExtensionProcessing}
                        >
                          Pay ₹{ext.cost} Now
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="border-t border-neutral-muted/20 pt-4">
            <h4 className="font-semibold text-primary-navy mb-3">Quotes</h4>
            <QuoteList
              quotes={quotes}
              isLoading={isLoadingQuotes}
              selectedBooking={booking}
              onSelectQuote={(id) => {
                setSelectedQuoteId(id);
                onSelectQuote(id);
              }}
              isSelecting={isSelectingQuote}
              selectedQuoteId={selectedQuoteId}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
