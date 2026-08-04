"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { getBookingById, getBookingQuotes, selectBookingQuote, cancelBooking, canReviewBooking, createReview, respondToJobExtension, initiatePayment, applyCouponToBooking } from "@/lib/services";
import { useSocket } from "@/lib/SocketContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Loader2, ArrowLeft, Calendar, MapPin, Car, IndianRupee, Clock, CheckCircle2, AlertCircle, Phone, Mail, FileText, Star, ShieldCheck, ChevronRight, MessageSquareQuote, Tag } from "lucide-react";
import { PaymentCard } from "@/components/payment/PaymentCard";
import { format } from "date-fns";

export default function CustomerBookingDetailsPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { socket } = useSocket();

  const [booking, setBooking] = useState<any | null>(null);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isAccepting, setIsAccepting] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [showCancel, setShowCancel] = useState(false);
  const [isExtensionProcessing, setIsExtensionProcessing] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [useRewardPoints, setUseRewardPoints] = useState(false);

  const [message, setMessage] = useState({ type: "", text: "" });

  // Review states
  const [canReview, setCanReview] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewMessage, setReviewMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    if (id) {
      fetchBookingDetails();
      fetchQuotes();
    }
  }, [id]);

  useEffect(() => {
    if (booking?.status === 'COMPLETED') {
      checkReviewStatus();
    }
  }, [booking?.status]);

  useEffect(() => {
    if (!socket || !id) return;

    const handleUpdate = (payload: any) => {
      if (payload?.bookingId === id || payload?._id === id) {
        fetchBookingDetails();
        fetchQuotes();
      } else {
        fetchBookingDetails();
        fetchQuotes();
      }
    };

    socket.on("booking_updated", handleUpdate);
    socket.on("quote_received", handleUpdate);
    socket.on("booking_confirmed", handleUpdate);
    socket.on("booking_status_update", handleUpdate);

    return () => {
      socket.off("booking_updated", handleUpdate);
      socket.off("quote_received", handleUpdate);
      socket.off("booking_confirmed", handleUpdate);
      socket.off("booking_status_update", handleUpdate);
    };
  }, [socket, id]);

  const fetchBookingDetails = async () => {
    try {
      const res = await getBookingById(id);
      let actualBooking;
      if (res?._id) {
        actualBooking = res;
      } else if (res?.data?._id) {
        actualBooking = res.data;
      } else {
        actualBooking = res?.data?.booking || res?.data?.data || res?.data || res;
      }
      setBooking(actualBooking);
    } catch (err) {
      console.error("Failed to load booking details", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchQuotes = async () => {
    try {
      const res = await getBookingQuotes(id);
      const quotesArray = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
      setQuotes(quotesArray);
    } catch (err) {
      console.error("Failed to load quotes", err);
    }
  };

  const checkReviewStatus = async () => {
    try {
      const res = await canReviewBooking(id);
      setCanReview(res?.canReview || res?.data?.canReview || false);
    } catch (error) {
      console.error("Failed to check review status", error);
    }
  };

  const handleSelectQuote = async (bidId: string) => {
    setIsAccepting(bidId);
    setMessage({ type: "", text: "" });
    try {
      await selectBookingQuote(id, { bidId });
      setMessage({ type: "success", text: "Quote accepted successfully! Your booking is now assigned." });
      await fetchBookingDetails();
      await fetchQuotes();
    } catch (err: any) {
      setMessage({ type: "error", text: err?.message || "Failed to accept quote" });
    } finally {
      setIsAccepting(null);
    }
  };

  const handleCancelBooking = async () => {
    if (!cancelReason.trim()) {
      setMessage({ type: "error", text: "Please provide a reason for cancellation" });
      return;
    }
    setIsCancelling(true);
    setMessage({ type: "", text: "" });
    try {
      await cancelBooking(id, { reason: cancelReason });
      setMessage({ type: "success", text: "Booking cancelled successfully" });
      setShowCancel(false);
      await fetchBookingDetails();
    } catch (err: any) {
      setMessage({ type: "error", text: err?.message || "Failed to cancel booking" });
    } finally {
      setIsCancelling(false);
    }
  };

  const handleExtensionResponse = async (extensionId: string, status: 'APPROVED' | 'REJECTED') => {
    setIsExtensionProcessing(true);
    try {
      await respondToJobExtension(id, extensionId, { status });
      setMessage({ type: "success", text: `Extension ${status.toLowerCase()} successfully.` });
      await fetchBookingDetails();
    } catch (err: any) {
      setMessage({ type: "error", text: err?.message || "Failed to respond to extension." });
    } finally {
      setIsExtensionProcessing(false);
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setIsApplyingCoupon(true);
    setMessage({ type: "", text: "" });
    try {
      await applyCouponToBooking(id, { couponCode: couponCode.trim() });
      setMessage({ type: "success", text: "Coupon applied successfully!" });
      setCouponCode("");
      await fetchBookingDetails();
    } catch (err: any) {
      setMessage({ type: "error", text: err?.message || "Failed to apply coupon." });
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleInitiatePayment = async (amount: number, type: string = "PARTIAL") => {
    if (!booking) return;
    setIsExtensionProcessing(true);
    try {
      const payload: any = {
        bookingId: booking._id || booking.id,
        amount: amount,
        paymentType: type,
        useRewardPoints: useRewardPoints,
      };
      // Note: We no longer send couponCode here because it is applied to the booking directly.
      const response = await initiatePayment(payload);
      setMessage({ type: "success", text: "Payment initiated successfully! Redirecting to payment gateway..." });
    } catch (err: any) {
      setMessage({ type: "error", text: err?.message || "Failed to initiate payment." });
    } finally {
      setIsExtensionProcessing(false);
    }
  };

  const handleSubmitReview = async () => {
    if (reviewRating === 0) {
      setReviewMessage({ type: "error", text: "Please select a rating." });
      return;
    }
    setIsSubmittingReview(true);
    setReviewMessage({ type: "", text: "" });
    try {
      await createReview({ bookingId: id, rating: reviewRating, comment: reviewComment });
      setReviewMessage({ type: "success", text: "Thank you! Your review has been submitted." });
      setCanReview(false);
    } catch (error: any) {
      setReviewMessage({ type: "error", text: error?.message || "Failed to submit review" });
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'PENDING':
        return <Badge className="bg-primary-navy/20 text-primary-navy hover:bg-primary-navy/30 border-none px-3 py-1">Pending</Badge>;
      case 'QUOTED':
        return <Badge className="bg-primary-orange/20 text-primary-orange hover:bg-primary-orange/30 border-none px-3 py-1">Quotes Available</Badge>;
      case 'ASSIGNED':
        return <Badge className="bg-secondary-blue/20 text-secondary-blue hover:bg-secondary-blue/30 border-none px-3 py-1">Assigned</Badge>;
      case 'IN_PROGRESS':
        return <Badge className="bg-yellow-500/20 text-yellow-700 hover:bg-yellow-500/30 border-none px-3 py-1">In Progress</Badge>;
      case 'COMPLETED':
        return <Badge className="bg-success/20 text-success hover:bg-success/30 border-none px-3 py-1">Completed</Badge>;
      case 'CANCELLED':
        return <Badge className="bg-danger/20 text-danger hover:bg-danger/30 border-none px-3 py-1">Cancelled</Badge>;
      default:
        return <Badge className="bg-neutral-muted/20 text-neutral-dark hover:bg-neutral-muted/30 border-none px-3 py-1">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-12 h-12 text-secondary-blue animate-spin mb-4" />
        <p className="text-neutral-muted font-medium">Fetching premium details...</p>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] bg-white rounded-3xl border border-neutral-muted/10 shadow-sm">
        <AlertCircle className="w-16 h-16 text-neutral-muted/30 mb-6" />
        <h2 className="text-2xl font-bold text-primary-navy mb-2">Booking Not Found</h2>
        <p className="text-neutral-muted mb-8 text-center max-w-sm">The booking you are looking for does not exist or you don't have access.</p>
        <Button onClick={() => router.push('/customer/bookings')} className="bg-secondary-blue hover:bg-secondary-blue/90 rounded-xl px-8">
          Back to Bookings
        </Button>
      </div>
    );
  }

  const vehicleName = typeof booking.vehicleId === 'object'
    ? `${booking.vehicleId?.brand || 'Premium'} ${booking.vehicleId?.model || 'Vehicle'}`
    : "Vehicle Requested";

  const isAdvancePaid = booking.payments?.some((p: any) => p.paymentType === 'ADVANCE' && p.status === 'SUCCESS');
  const isAdvancePending = booking.payments?.some((p: any) => p.paymentType === 'ADVANCE' && p.status === 'PENDING');
  const isFinalPaid = booking.payments?.some((p: any) => p.paymentType === 'FINAL' && p.status === 'SUCCESS');
  const isFinalPending = booking.payments?.some((p: any) => p.paymentType === 'FINAL' && p.status === 'PENDING');
  const isFullPaid = booking.payments?.some((p: any) => p.paymentType === 'FULL' && p.status === 'SUCCESS');
  const hasPaidAdvance = isAdvancePaid || isFullPaid;
  const hasPaidFinal = isFinalPaid || isFullPaid;

  const acceptedQuoteAmount = quotes.find(q => q._id === booking.acceptedBidId || q._id === (booking.acceptedBidId as any)?._id)?.quotedAmount || (booking.acceptedBidId as any)?.quotedAmount || 0;
  const baseAmount = booking.jobDetails?.finalAmount || acceptedQuoteAmount || 1500;

  const totalPaidAmount = booking.payments?.filter((p: any) => p.status === 'SUCCESS').reduce((sum: number, p: any) => sum + p.amount, 0) || 0;

  const approvedExtensions = booking.jobDetails?.jobExtensions?.filter((e: any) => e.status === 'APPROVED') || [];
  const approvedExtensionsCost = approvedExtensions.reduce((sum: number, ext: any) => sum + ext.cost, 0);

  const calculatedTotalAmount = baseAmount + approvedExtensionsCost;
  const couponDiscountAmount = booking.couponDiscountAmount || 0;
  const revisedTotalAmount = Math.max(0, calculatedTotalAmount - couponDiscountAmount);
  
  const remainingAmount = Math.max(0, revisedTotalAmount - totalPaidAmount);

  const advanceAmount = Math.round(revisedTotalAmount * 0.1);
  const remainingForAdvance = advanceAmount - totalPaidAmount;
  const needsAdvance = (booking.status === 'ASSIGNED' || booking.status === 'IN_PROGRESS' || booking.status === 'COMPLETED') && baseAmount > 0 && remainingForAdvance > 0;
  const needsFinal = booking.status === 'COMPLETED' && remainingAmount > 0;

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Premium Hero Header */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-primary-navy via-primary-navy/90 to-secondary-blue/80 p-8 md:p-12 text-white shadow-xl">
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-secondary-blue/20 rounded-full blur-3xl"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <Button variant="ghost" size="sm" onClick={() => router.back()} className="text-white/70 hover:text-white hover:bg-white/10 mb-6 -ml-2">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to List
            </Button>
            <div className="flex items-center space-x-4 mb-4">
              {getStatusBadge(booking.status)}
              <span className="text-sm text-white/50 font-mono">ID: {booking._id || booking.id}</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-2">
              {booking.serviceId?.name || "Service Request"}
            </h1>
            <p className="text-lg text-white/80 flex items-center">
              <Car className="w-5 h-5 mr-2 opacity-70" /> {vehicleName}
            </p>
          </div>

          {(booking.status !== 'COMPLETED' && booking.status !== 'CANCELLED') && !showCancel && (
            <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 hover:text-white rounded-xl backdrop-blur-sm" onClick={() => setShowCancel(true)}>
              Cancel & Request Refund
            </Button>
          )}
        </div>
      </div>

      {message.text && (
        <div className={`p-4 rounded-xl text-sm font-medium border shadow-sm ${message.type === "success"
          ? "bg-success/5 text-success-dark border-success/20"
          : "bg-danger/5 text-danger-dark border-danger/20"
          }`}>
          {message.text}
        </div>
      )}

      {showCancel && (
        <Card className="border-danger/20 shadow-lg rounded-2xl overflow-hidden">
          <div className="h-1 bg-danger w-full"></div>
          <CardContent className="p-8">
            <h3 className="text-xl font-bold text-primary-navy mb-2">Cancel Booking Request</h3>
            <p className="text-sm text-neutral-muted mb-6">Are you sure you want to cancel? If you have made any payments, a refund request will be automatically initiated.</p>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Please tell us why you are cancelling..."
              className="w-full p-4 border border-neutral-muted/20 rounded-xl focus:ring-2 focus:ring-danger/20 focus:border-danger outline-none text-sm mb-6 bg-neutral-bg"
              rows={3}
            />
            <div className="flex space-x-3">
              <Button variant="outline" className="rounded-xl border-neutral-muted/20" onClick={() => setShowCancel(false)} disabled={isCancelling}>
                Keep Booking
              </Button>
              <Button className="bg-danger hover:bg-danger/90 text-white rounded-xl px-6" onClick={handleCancelBooking} isLoading={isCancelling}>
                Confirm Cancellation
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Details */}
        <div className="lg:col-span-2 space-y-8">

          {/* Main Details Card */}
          <Card className="shadow-sm border-neutral-muted/10 rounded-3xl overflow-hidden">
            <CardContent className="p-0">
              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-neutral-muted/10">
                <div className="p-8">
                  <div className="w-12 h-12 bg-secondary-blue/10 rounded-2xl flex items-center justify-center mb-6">
                    <Calendar className="w-6 h-6 text-secondary-blue" />
                  </div>
                  <h4 className="text-sm font-semibold text-neutral-muted uppercase tracking-widest mb-1">Schedule</h4>
                  <p className="text-lg font-bold text-primary-navy">
                    {booking.preferredDate && !isNaN(new Date(booking.preferredDate).getTime())
                      ? format(new Date(booking.preferredDate), 'EEEE, MMMM do, yyyy')
                      : 'Not specified'}
                  </p>
                </div>

                <div className="p-8">
                  <div className="w-12 h-12 bg-primary-orange/10 rounded-2xl flex items-center justify-center mb-6">
                    <MapPin className="w-6 h-6 text-primary-orange" />
                  </div>
                  <h4 className="text-sm font-semibold text-neutral-muted uppercase tracking-widest mb-1">Location</h4>
                  <p className="text-lg font-bold text-primary-navy">
                    {typeof booking.cityId === 'object' ? booking.cityId?.name : "Location not provided"}
                  </p>
                </div>
              </div>

              {booking.description && (
                <div className="p-8 border-t border-neutral-muted/10 bg-neutral-bg/50">
                  <h4 className="text-sm font-semibold text-neutral-muted uppercase tracking-widest mb-3">Service Notes</h4>
                  <p className="text-neutral-dark leading-relaxed">{booking.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Billing section moved to right column */}

          {/* Review Section */}
          {canReview && booking.status === 'COMPLETED' && (
            <Card className="shadow-lg border-secondary-blue/30 rounded-3xl overflow-hidden bg-gradient-to-b from-white to-secondary-blue/5">
              <div className="h-1.5 bg-gradient-to-r from-secondary-blue to-primary-orange w-full"></div>
              <CardContent className="p-8">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="w-14 h-14 bg-white shadow-sm rounded-full flex items-center justify-center border border-neutral-muted/10">
                    <Star className="w-7 h-7 text-yellow-500 fill-yellow-500" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-primary-navy">Rate Your Experience</h3>
                    <p className="text-neutral-muted">How was the service provided by the partner?</p>
                  </div>
                </div>

                {reviewMessage.text && (
                  <div className={`p-4 rounded-xl text-sm font-medium border mb-6 ${reviewMessage.type === "success" ? "bg-success/10 text-success border-success/20" : "bg-danger/10 text-danger border-danger/20"
                    }`}>
                    {reviewMessage.text}
                  </div>
                )}

                <div className="space-y-6">
                  <div className="flex space-x-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setReviewRating(star)}
                        className={`transition-all hover:scale-110 focus:outline-none ${reviewRating >= star ? 'text-yellow-500' : 'text-neutral-300'}`}
                      >
                        <Star className={`w-10 h-10 ${reviewRating >= star ? 'fill-yellow-500' : ''}`} />
                      </button>
                    ))}
                  </div>

                  <textarea
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Write a review about the service quality, timeline, and professionalism..."
                    className="w-full p-4 border border-neutral-muted/20 rounded-xl focus:ring-2 focus:ring-secondary-blue/30 focus:border-secondary-blue outline-none text-sm bg-white shadow-inner min-h-[120px]"
                  />

                  <Button
                    className="w-full md:w-auto bg-primary-navy hover:bg-primary-navy/90 text-white rounded-xl px-8 py-6 text-md font-bold"
                    onClick={handleSubmitReview}
                    isLoading={isSubmittingReview}
                  >
                    Submit Review <ChevronRight className="w-5 h-5 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Service Photos */}
          {booking.jobDetails && (booking.jobDetails.beforePhotos?.length > 0 || booking.jobDetails.afterPhotos?.length > 0) && (
            <Card className="shadow-sm border-neutral-muted/10 rounded-3xl overflow-hidden">
              <CardHeader className="bg-primary-navy/5 border-b border-neutral-muted/10 pb-4">
                <CardTitle className="text-lg font-bold text-primary-navy flex items-center">
                  <ShieldCheck className="w-5 h-5 mr-2 text-primary-orange" />
                  Service Inspection Photos
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                {booking.jobDetails.beforePhotos?.length > 0 && (
                  <div>
                    <h5 className="text-sm font-bold text-neutral-dark uppercase tracking-wider mb-4 flex items-center">
                      <span className="w-2.5 h-2.5 rounded-full bg-warning mr-3"></span> Before Service
                    </h5>
                    <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
                      {booking.jobDetails.beforePhotos.map((url: string, index: number) => (
                        <a href={url} target="_blank" rel="noopener noreferrer" key={index} className="relative flex-shrink-0 w-40 h-40 rounded-2xl overflow-hidden border-4 border-white shadow-md hover:shadow-lg hover:scale-[1.02] transition-all group">
                          <img src={url} alt={`Before ${index + 1}`} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-sm font-medium">View Full</div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {booking.jobDetails.afterPhotos?.length > 0 && (
                  <div>
                    <h5 className="text-sm font-bold text-neutral-dark uppercase tracking-wider mb-4 flex items-center">
                      <span className="w-2.5 h-2.5 rounded-full bg-success mr-3"></span> After Service
                    </h5>
                    <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
                      {booking.jobDetails.afterPhotos.map((url: string, index: number) => (
                        <a href={url} target="_blank" rel="noopener noreferrer" key={index} className="relative flex-shrink-0 w-40 h-40 rounded-2xl overflow-hidden border-4 border-white shadow-md hover:shadow-lg hover:scale-[1.02] transition-all group">
                          <img src={url} alt={`After ${index + 1}`} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-sm font-medium">View Full</div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Job Extensions Section */}
          {booking.jobDetails?.jobExtensions?.length > 0 && (
            <Card className="shadow-sm border-neutral-muted/10 rounded-3xl overflow-hidden">
              <CardHeader className="bg-primary-navy/5 border-b border-neutral-muted/10 pb-4">
                <CardTitle className="text-lg font-bold text-primary-navy flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-secondary-blue" />
                  Additional Parts / Services
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <div className="space-y-4">
                  {booking.jobDetails.jobExtensions.map((ext: any, idx: number) => (
                    <div key={idx} className="bg-white p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between border border-neutral-muted/20 shadow-sm hover:border-secondary-blue/30 transition-colors">
                      <div className="flex-1">
                        <p className="font-bold text-primary-navy text-lg">{ext.partName}</p>
                        <div className="flex items-center mt-2">
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${ext.status === 'APPROVED' ? 'bg-success/10 text-success' :
                            ext.status === 'REJECTED' ? 'bg-danger/10 text-danger' :
                              'bg-warning/10 text-warning-dark'
                            }`}>{ext.status || 'PENDING'}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end mt-4 sm:mt-0">
                        <p className="font-extrabold text-primary-orange text-2xl mb-2">₹{ext.cost}</p>
                        {ext.status === 'PENDING' && (
                          <div className="flex space-x-2">
                            <Button size="sm" variant="outline" className="border-danger/30 text-danger hover:bg-danger/10 bg-white" onClick={() => handleExtensionResponse(ext._id, 'REJECTED')} disabled={isExtensionProcessing}>
                              Reject
                            </Button>
                            <Button size="sm" className="bg-success hover:bg-success/90 text-white" onClick={() => handleExtensionResponse(ext._id, 'APPROVED')} isLoading={isExtensionProcessing}>
                              Approve
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Forwarded Quotes Section */}
          {(booking.status === 'PENDING' || booking.status === 'QUOTED') && quotes.length > 0 && (
            <div>
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 bg-primary-orange/10 rounded-full flex items-center justify-center mr-3">
                  <IndianRupee className="w-5 h-5 text-primary-orange" />
                </div>
                <h2 className="text-2xl font-bold text-primary-navy">
                  Available Quotes ({quotes.length})
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {quotes.map((quote: any) => (
                  <Card key={quote._id} className="border-secondary-blue/20 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group overflow-hidden rounded-3xl relative">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-secondary-blue/5 rounded-bl-full -z-10 transition-transform group-hover:scale-150"></div>
                    <div className="bg-gradient-to-r from-secondary-blue/10 to-transparent p-6 border-b border-secondary-blue/10">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-extrabold text-primary-navy text-lg">{quote.partnerId?.businessName || "Partner"}</h4>
                          <div className="flex items-center text-xs font-semibold text-success mt-1">
                            <CheckCircle2 className="w-3 h-3 mr-1" /> Verified Partner
                          </div>
                        </div>
                        <div className="text-right bg-white px-3 py-1 rounded-xl shadow-sm border border-neutral-muted/10">
                          <span className="text-2xl font-extrabold text-primary-orange tracking-tight">₹{quote.quotedAmount}</span>
                        </div>
                      </div>
                    </div>
                    <CardContent className="p-6 space-y-5">
                      {quote.estimatedDuration && (
                        <div className="flex items-center text-sm text-neutral-dark font-medium bg-neutral-bg p-3 rounded-xl">
                          <Clock className="w-4 h-4 mr-3 text-secondary-blue" />
                          <span>Est. Time: <span className="font-bold text-primary-navy">{quote.estimatedDuration}</span></span>
                        </div>
                      )}

                      {quote.notes && (
                        <div className="bg-white p-4 rounded-xl text-sm text-neutral-dark border border-neutral-muted/10 shadow-inner italic relative">
                          <MessageSquareQuote className="w-6 h-6 text-neutral-muted/20 absolute top-2 left-2" />
                          <span className="relative z-10 pl-4">{quote.notes}</span>
                        </div>
                      )}

                      <Button
                        className="w-full bg-primary-navy hover:bg-secondary-blue text-white rounded-xl py-6 font-bold shadow-md transition-colors"
                        onClick={() => handleSelectQuote(quote._id)}
                        isLoading={isAccepting === quote._id}
                        disabled={isAccepting !== null && isAccepting !== quote._id}
                      >
                        Accept & Assign <ChevronRight className="w-5 h-5 ml-2" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {booking.status === 'PENDING' && quotes.length === 0 && (
            <div className="rounded-3xl border-2 border-dashed border-secondary-blue/20 bg-secondary-blue/5 p-12 text-center">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                <Loader2 className="w-8 h-8 text-secondary-blue animate-spin" />
              </div>
              <h3 className="text-2xl font-bold text-primary-navy mb-2">Analyzing Request</h3>
              <p className="text-neutral-muted max-w-md mx-auto">Our verified service partners are reviewing your request. We will notify you immediately once quotes are available.</p>
            </div>
          )}
        </div>

        {/* Right Column: Support & Summary */}
        <div className="space-y-6">
          {booking.status === 'ASSIGNED' && booking.assignedPartnerId && (
            <Card className="shadow-lg border-success/30 overflow-hidden rounded-3xl relative bg-gradient-to-br from-white to-success/5">
              <div className="absolute top-0 right-0 w-32 h-32 bg-success/10 rounded-bl-full -z-10"></div>
              <div className="bg-success/10 px-6 py-4 border-b border-success/20">
                <h3 className="font-extrabold text-success-dark flex items-center text-lg">
                  <CheckCircle2 className="w-5 h-5 mr-2" /> Assigned Partner
                </h3>
              </div>
              <CardContent className="p-6">
                <div className="mb-6 text-center pt-2">
                  <div className="w-20 h-20 bg-white rounded-full mx-auto mb-3 border-4 border-success/20 flex items-center justify-center shadow-md">
                    <Car className="w-8 h-8 text-success" />
                  </div>
                  <p className="font-extrabold text-primary-navy text-xl">{booking.assignedPartnerId.businessName || "Service Partner"}</p>
                  <p className="text-sm text-neutral-muted font-medium mt-1">Verified Expert</p>
                </div>

                <div className="space-y-3">
                  {booking.assignedPartnerId.phone && (
                    <div className="flex items-center text-sm font-medium text-neutral-dark bg-white p-3 rounded-xl border border-neutral-muted/10 shadow-sm">
                      <Phone className="w-4 h-4 mr-3 text-secondary-blue" />
                      {booking.assignedPartnerId.phone}
                    </div>
                  )}
                  {booking.assignedPartnerId.email && (
                    <div className="flex items-center text-sm font-medium text-neutral-dark bg-white p-3 rounded-xl border border-neutral-muted/10 shadow-sm">
                      <Mail className="w-4 h-4 mr-3 text-secondary-blue" />
                      {booking.assignedPartnerId.email}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Billing & Payments Section */}
          {(booking.status !== 'PENDING' && booking.status !== 'QUOTED') && (
            <Card className="shadow-lg border-neutral-muted/10 overflow-hidden rounded-3xl relative">
              <CardHeader className="bg-primary-navy/5 border-b border-neutral-muted/10 pb-4">
                <CardTitle className="font-bold text-primary-navy flex items-center text-lg">
                  <IndianRupee className="w-5 h-5 mr-2 text-primary-orange" /> Billing & Payments
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-3 mb-6 text-sm">
                  <div className="flex justify-between text-neutral-dark">
                    <span>Base Service Quote</span>
                    <span className="font-medium">₹{baseAmount}</span>
                  </div>

                  {approvedExtensions.map((ext: any, idx: number) => (
                    <div key={idx} className="flex justify-between text-neutral-dark">
                      <span>{ext.partName} (Extra)</span>
                      <span className="font-medium">₹{ext.cost}</span>
                    </div>
                  ))}

                  <div className="pt-3 border-t border-neutral-muted/10 flex justify-between font-bold text-primary-navy text-base">
                    <span>Total Amount</span>
                    <span>₹{calculatedTotalAmount}</span>
                  </div>
                  
                  {couponDiscountAmount > 0 && (
                    <div className="flex justify-between text-success font-medium">
                      <span className="flex items-center"><Tag className="w-4 h-4 mr-1" /> Discount ({booking.appliedCoupon})</span>
                      <span>- ₹{couponDiscountAmount}</span>
                    </div>
                  )}
                  
                  {couponDiscountAmount > 0 && (
                    <div className="flex justify-between font-bold text-primary-navy text-base">
                      <span>Revised Total</span>
                      <span>₹{revisedTotalAmount}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-success font-medium">
                    <span>Amount Paid</span>
                    <span>- ₹{totalPaidAmount}</span>
                  </div>
                  <div className="pt-3 border-t border-neutral-muted/10 flex justify-between font-extrabold text-primary-orange text-lg">
                    <span>Remaining Balance</span>
                    <span>₹{remainingAmount}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-4">
                  {booking.appliedCoupon ? (
                    <div className="mb-4 bg-success/10 p-3 rounded-lg border border-success/20 flex items-center justify-between">
                      <div className="flex items-center text-success-dark font-medium">
                        <Tag className="w-4 h-4 mr-2" /> Coupon Applied: {booking.appliedCoupon}
                      </div>
                    </div>
                  ) : (
                    (needsAdvance || (remainingAmount > 0 && !needsAdvance && !needsFinal && booking.status !== 'COMPLETED') || needsFinal) && (
                      <div className="mb-4">
                        <label className="text-sm font-medium text-neutral-dark mb-1.5 block">Promo / Coupon Code</label>
                        <div className="flex gap-2">
                          <Input
                            value={couponCode}
                            onChange={(e) => setCouponCode(e.target.value)}
                            placeholder="Enter coupon code here"
                            className="flex-1 bg-white border-neutral-muted/20"
                          />
                          <Button 
                            onClick={handleApplyCoupon} 
                            disabled={!couponCode.trim() || isApplyingCoupon}
                            isLoading={isApplyingCoupon}
                            className="bg-primary-navy hover:bg-primary-navy/90 text-white"
                          >
                            Apply
                          </Button>
                        </div>
                      </div>
                    )
                  )}

                  {(needsAdvance || remainingAmount > 0) && booking.status !== 'COMPLETED' && (
                    <div className="flex items-center space-x-2 py-2 border-b border-gray-100">
                      <input 
                        type="checkbox" 
                        id="useRewardPoints" 
                        className="w-4 h-4 text-primary-navy"
                        checked={useRewardPoints}
                        onChange={(e) => setUseRewardPoints(e.target.checked)}
                      />
                      <label htmlFor="useRewardPoints" className="text-sm font-medium text-gray-700 cursor-pointer">
                        Use my Reward Points for discount
                      </label>
                    </div>
                  )}

                  {needsAdvance && (
                    <Button className="w-full bg-primary-navy hover:bg-secondary-blue text-white rounded-xl py-6 font-bold" onClick={() => handleInitiatePayment(remainingForAdvance, "ADVANCE")} isLoading={isExtensionProcessing}>
                      Pay Advance (₹{remainingForAdvance})
                    </Button>
                  )}

                  {remainingAmount > 0 && !needsAdvance && !needsFinal && booking.status !== 'COMPLETED' && (
                    <Button className="w-full bg-primary-orange hover:bg-primary-orange/90 text-white rounded-xl py-6 font-bold" onClick={() => handleInitiatePayment(remainingAmount, "PARTIAL")} isLoading={isExtensionProcessing}>
                      Pay Additional Charges (₹{remainingAmount})
                    </Button>
                  )}

                  {needsFinal && (
                    <Button className="w-full bg-success hover:bg-success/90 text-white rounded-xl py-6 font-bold" onClick={() => handleInitiatePayment(remainingAmount, "FINAL")} isLoading={isExtensionProcessing}>
                      Pay Final Bill (₹{remainingAmount})
                    </Button>
                  )}

                  {remainingAmount === 0 && (
                    <div className="bg-success/10 text-success text-center py-3 rounded-xl font-bold flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 mr-2" /> Fully Paid
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {booking.jobDetails?.invoiceUrl && (
            <Card className="shadow-md border-primary-orange/20 overflow-hidden rounded-3xl bg-gradient-to-b from-white to-primary-orange/5">
              <CardContent className="p-6 text-center pt-8">
                <div className="w-16 h-16 bg-primary-orange/10 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <FileText className="w-8 h-8 text-primary-orange" />
                </div>
                <h3 className="font-bold text-primary-navy text-lg mb-2">Service Invoice</h3>
                <p className="text-sm text-neutral-muted mb-6">Your official invoice for the service is ready.</p>
                <a href={booking.jobDetails.invoiceUrl} target="_blank" rel="noopener noreferrer" className="block">
                  <Button className="w-full bg-primary-orange hover:bg-primary-orange/90 text-white rounded-xl font-bold py-6">
                    Download Invoice
                  </Button>
                </a>
              </CardContent>
            </Card>
          )}

          <Card className="shadow-sm border-neutral-muted/10 bg-primary-navy rounded-3xl text-white">
            <CardContent className="p-8">
              <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mb-6">
                <AlertCircle className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-bold text-xl mb-3">Need Help?</h3>
              <p className="text-sm text-white/70 mb-8 leading-relaxed">If you have any questions or need to make changes to your booking, please contact our support team immediately.</p>
              <Button variant="outline" className="w-full bg-white/10 border-white/20 hover:bg-white text-white hover:text-primary-navy rounded-xl py-6 font-bold transition-colors" onClick={() => router.push('/customer/support')}>
                Contact Support <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
