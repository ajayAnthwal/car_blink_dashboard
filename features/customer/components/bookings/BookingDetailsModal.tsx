import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getCustomerBookingInvoice } from "@/lib/services";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { X, AlertCircle, ShieldCheck, FileText, ExternalLink, Receipt, Star, ThumbsUp, ThumbsDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QuoteList } from "./QuoteList";
import toast from "react-hot-toast";

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
  satisfactionStatus?: string;
  satisfactionRating?: number;
  satisfactionFeedback?: string;
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

  const { data: invoiceRes } = useQuery({
    queryKey: ["customer", "invoice", booking?._id],
    queryFn: () => getCustomerBookingInvoice(booking!._id),
    enabled: !!booking?._id
  });

  const invoiceData = invoiceRes?.data || invoiceRes;
  const invoice = invoiceData?.invoice || (invoiceData?._id ? invoiceData : null);

  const [satisfactionChoice, setSatisfactionChoice] = useState<boolean | null>(null);
  const [satisfactionRating, setSatisfactionRating] = useState<number>(5);
  const [satisfactionFeedback, setSatisfactionFeedback] = useState<string>("");
  const [isSubmittingSatisfaction, setIsSubmittingSatisfaction] = useState(false);

  const handleSubmitSatisfaction = async () => {
    if (!booking || satisfactionChoice === null) return;
    setIsSubmittingSatisfaction(true);
    try {
      const { respondSatisfactionTemplate } = await import("@/lib/services");
      await respondSatisfactionTemplate(booking._id, {
        isSatisfied: satisfactionChoice,
        rating: satisfactionRating,
        feedback: satisfactionFeedback
      });
      toast.success("Thank you for your feedback! Your response has been submitted.");
      booking.satisfactionStatus = satisfactionChoice ? 'SATISFIED' : 'DISSATISFIED';
    } catch (err: any) {
      toast.error(err.message || "Failed to submit feedback.");
    } finally {
      setIsSubmittingSatisfaction(false);
    }
  };

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

          {/* Verified Itemized Invoice Section */}
          {invoice && (invoice.status === 'FORWARDED_TO_CUSTOMER' || invoice.status === 'APPROVED_BY_EXECUTIVE' || invoice.status === 'PAID') && (
            <div className="border border-orange-200 bg-orange-50/40 p-4 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-primary-orange" /> Verified Itemized Invoice
                </h4>
                <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                  invoice.status === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                }`}>
                  {invoice.status === 'PAID' ? '✓ Paid' : 'Approved & Ready for Payment'}
                </span>
              </div>

              {/* Items List */}
              {Array.isArray(invoice.items) && invoice.items.length > 0 && (
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-200 font-bold text-gray-700">
                      <tr>
                        <th className="p-2">Item / Part</th>
                        <th className="p-2 text-center">Qty</th>
                        <th className="p-2 text-right">Price</th>
                        <th className="p-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {invoice.items.map((item: any, idx: number) => (
                        <tr key={idx}>
                          <td className="p-2 font-medium">{item.description}</td>
                          <td className="p-2 text-center">{item.quantity}</td>
                          <td className="p-2 text-right">₹{item.unitPrice}</td>
                          <td className="p-2 text-right font-bold text-gray-900">₹{item.total}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Total Breakdown */}
              <div className="bg-white p-3 rounded-lg border border-gray-200 space-y-1.5 text-xs">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal:</span>
                  <span className="font-semibold text-gray-900">₹{invoice.subtotal}</span>
                </div>
                {invoice.discount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-medium">
                    <span>Executive Discount:</span>
                    <span>-₹{invoice.discount}</span>
                  </div>
                )}
                {invoice.taxAmount > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>GST / Tax:</span>
                    <span>+₹{invoice.taxAmount}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-black text-gray-900 pt-1.5 border-t border-gray-200">
                  <span>Grand Total Bill:</span>
                  <span className="text-primary-orange">₹{invoice.grandTotal}</span>
                </div>
              </div>

              {invoice.pdfUrl && (
                <a
                  href={invoice.pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold text-primary-navy hover:underline flex items-center gap-1 pt-1"
                >
                  <FileText className="w-3.5 h-3.5" /> View Attached PDF Bill <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          )}

          {/* Service Satisfaction Template Request Card */}
          {booking.satisfactionStatus === 'PENDING_CUSTOMER' && (
            <div className="border-2 border-primary-orange/30 bg-gradient-to-r from-orange-50 via-amber-50 to-orange-50 p-4 rounded-xl space-y-3 shadow-md animate-in fade-in">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-primary-orange fill-primary-orange" /> Service Satisfaction Feedback
                </h4>
                <span className="bg-primary-orange text-white text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full">
                  Action Required
                </span>
              </div>
              <p className="text-xs text-gray-600 font-medium">
                Please confirm if you are satisfied with the service provided for your vehicle.
              </p>

              <div className="flex items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setSatisfactionChoice(true)}
                  className={`flex-1 py-2.5 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    satisfactionChoice === true
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-md"
                      : "bg-white text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                  }`}
                >
                  <ThumbsUp className="w-4 h-4" /> Yes, I am Satisfied
                </button>
                <button
                  type="button"
                  onClick={() => setSatisfactionChoice(false)}
                  className={`flex-1 py-2.5 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    satisfactionChoice === false
                      ? "bg-red-600 text-white border-red-600 shadow-md"
                      : "bg-white text-red-700 border-red-300 hover:bg-red-50"
                  }`}
                >
                  <ThumbsDown className="w-4 h-4" /> No, I have Issues
                </button>
              </div>

              {satisfactionChoice !== null && (
                <div className="space-y-3 pt-2 border-t border-orange-200/60 animate-in fade-in">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">Rating (1 to 5 Stars)</label>
                    <div className="flex items-center space-x-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setSatisfactionRating(star)}
                          className="p-1 hover:scale-110 transition-transform"
                        >
                          <Star className={`w-5 h-5 ${star <= satisfactionRating ? "text-amber-500 fill-amber-500" : "text-gray-300"}`} />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">Additional Comments / Remarks</label>
                    <textarea
                      value={satisfactionFeedback}
                      onChange={(e) => setSatisfactionFeedback(e.target.value)}
                      placeholder="Share your experience or specify issues..."
                      rows={2}
                      className="w-full p-2.5 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-primary-orange"
                    />
                  </div>

                  <Button
                    onClick={handleSubmitSatisfaction}
                    isLoading={isSubmittingSatisfaction}
                    className="w-full bg-primary-orange hover:bg-orange-600 text-white font-bold text-xs"
                  >
                    Submit Satisfaction Response
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Already Submitted Badge */}
          {booking.satisfactionStatus && booking.satisfactionStatus !== 'NOT_SENT' && booking.satisfactionStatus !== 'PENDING_CUSTOMER' && (
            <div className={`p-3 rounded-xl border flex items-center justify-between text-xs font-bold ${
              booking.satisfactionStatus === 'SATISFIED' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-red-50 text-red-800 border-red-200'
            }`}>
              <span className="flex items-center gap-1.5">
                {booking.satisfactionStatus === 'SATISFIED' ? <ThumbsUp className="w-4 h-4 text-emerald-600" /> : <ThumbsDown className="w-4 h-4 text-red-600" />}
                Satisfaction Status: {booking.satisfactionStatus === 'SATISFIED' ? 'Customer Satisfied (Confirmed)' : 'Customer Reported Issues'}
              </span>
              {booking.satisfactionRating && (
                <span className="flex items-center gap-1 bg-white px-2 py-0.5 rounded shadow-sm">
                  <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" /> {booking.satisfactionRating}/5
                </span>
              )}
            </div>
          )}

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
