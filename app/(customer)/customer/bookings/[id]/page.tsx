// @ts-nocheck
"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSocket } from "@/lib/SocketContext";
import { useQueryClient } from "@tanstack/react-query";
import { 
  useBookingDetails, 
  useBookingQuotes, 
  useCanReviewBooking,
  useSelectQuote,
  useCancelBooking,
  useRespondToExtension,
  useApplyCouponMutation,
  useInitiatePayment,
  useCreateReviewMutation
} from "@/features/customer/hooks/useCustomerQueries";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Loader2, 
  ArrowLeft, 
  ArrowRight, 
  Calendar, 
  MapPin, 
  Car, 
  IndianRupee, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Phone, 
  Mail, 
  FileText, 
  Star, 
  ShieldCheck, 
  ChevronRight, 
  MessageSquareQuote, 
  Tag, 
  ExternalLink, 
  ThumbsUp, 
  ThumbsDown, 
  HeartHandshake, 
  Sparkles, 
  Check, 
  X, 
  HelpCircle,
  Wrench,
  Camera,
  Compass
} from "lucide-react";
import { loadRazorpayScript } from "@/lib/razorpay";
import { verifyPayment } from "@/lib/services";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { format } from "date-fns";
import toast from "react-hot-toast";

function advanceFor(totalRupees: number) {
  const safeTotal = Math.max(0, Number(totalRupees) || 0);
  const totalPaise = Math.round(safeTotal * 100);
  if (totalPaise === 0) {
    return { totalAmount: 0, advanceAmount: 0, balanceAmount: 0, advancePaise: 0, balancePaise: 0, totalPaise: 0 };
  }
  let advancePaise = Math.round((totalPaise * 15) / 100);
  if (advancePaise > totalPaise) advancePaise = totalPaise;
  const balancePaise = totalPaise - advancePaise;
  return {
    totalAmount: Number((totalPaise / 100).toFixed(2)),
    advanceAmount: Number((advancePaise / 100).toFixed(2)),
    balanceAmount: Number((balancePaise / 100).toFixed(2)),
    advancePaise,
    balancePaise,
    totalPaise,
  };
}

export default function CustomerBookingDetailsPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { socket } = useSocket();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: booking, isLoading, refetch: refetchBooking } = useBookingDetails(id);
  const { data: quotesData, refetch: refetchQuotes } = useBookingQuotes(id);
  const quotes = Array.isArray(quotesData) 
    ? quotesData 
    : (Array.isArray((quotesData as any)?.bids) 
      ? (quotesData as any).bids 
      : (Array.isArray((quotesData as any)?.data) ? (quotesData as any).data : []));

  const { data: canReviewData } = useCanReviewBooking(booking?.status === 'COMPLETED' ? id : null);
  const canReview = !!canReviewData;

  const selectQuoteMutation = useSelectQuote();
  const cancelBookingMutation = useCancelBooking();
  const respondExtensionMutation = useRespondToExtension();
  const applyCouponMutation = useApplyCouponMutation();
  const initiatePaymentMutation = useInitiatePayment();
  const createReviewMutation = useCreateReviewMutation();

  const [isAccepting, setIsAccepting] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [showCancel, setShowCancel] = useState(false);
  const [isExtensionProcessing, setIsExtensionProcessing] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [useRewardPoints, setUseRewardPoints] = useState(false);
  const [selectedPaymentPreference, setSelectedPaymentPreference] = useState<"CASH" | "ONLINE">("ONLINE");
  const [selectedImageModal, setSelectedImageModal] = useState<string | null>(null);

  useEffect(() => {
    if (booking?.paymentMode) {
      setSelectedPaymentPreference(booking.paymentMode);
    }
  }, [booking?.paymentMode]);

  // Real-time live synchronization for booking, satisfaction & payments
  useEffect(() => {
    if (!socket || !id) return;

    const handleLiveBookingUpdate = () => {
      refetchBooking();
      refetchQuotes();
    };

    socket.on("booking_updated", handleLiveBookingUpdate);
    socket.on("satisfaction_response", handleLiveBookingUpdate);
    socket.on("satisfaction_request", handleLiveBookingUpdate);
    socket.on("payment_status_update", handleLiveBookingUpdate);
    socket.on("quote_received", handleLiveBookingUpdate);
    socket.on("booking_confirmed", handleLiveBookingUpdate);
    socket.on("booking_status_update", handleLiveBookingUpdate);

    return () => {
      socket.off("booking_updated", handleLiveBookingUpdate);
      socket.off("satisfaction_response", handleLiveBookingUpdate);
      socket.off("satisfaction_request", handleLiveBookingUpdate);
      socket.off("payment_status_update", handleLiveBookingUpdate);
      socket.off("quote_received", handleLiveBookingUpdate);
      socket.off("booking_confirmed", handleLiveBookingUpdate);
      socket.off("booking_status_update", handleLiveBookingUpdate);
    };
  }, [socket, id, refetchBooking, refetchQuotes]);

  const [message, setMessage] = useState({ type: "", text: "" });

  // Review states
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewMessage, setReviewMessage] = useState({ type: "", text: "" });
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  // Official Satisfaction Form states
  const [satisfactionChoice, setSatisfactionChoice] = useState<boolean | null>(null);
  const [satisfactionRating, setSatisfactionRating] = useState<number>(5);
  const [satisfactionFeedback, setSatisfactionFeedback] = useState<string>("");
  const [isSubmittingSatisfaction, setIsSubmittingSatisfaction] = useState(false);
  const [satisfactionSubmittedLocally, setSatisfactionSubmittedLocally] = useState(false);

  const handleSubmitSatisfaction = async () => {
    if (!booking || satisfactionChoice === null) {
      toast.error("Please choose whether you are satisfied or have issues.");
      return;
    }
    setIsSubmittingSatisfaction(true);
    try {
      const { respondSatisfactionTemplate } = await import("@/lib/services");
      await respondSatisfactionTemplate(booking._id || id, {
        isSatisfied: satisfactionChoice,
        rating: satisfactionRating,
        feedback: satisfactionFeedback
      });

      if (satisfactionChoice) {
        try {
          await createReviewMutation.mutateAsync({
            bookingId: booking._id || id,
            rating: satisfactionRating,
            comment: satisfactionFeedback || "Satisfied with CarBlink service!",
          });
        } catch (rErr) {
          console.warn("Public review sync note:", rErr);
        }
      }

      toast.success("Thank you! Your satisfaction response has been officially recorded.");
      setSatisfactionSubmittedLocally(true);

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["customer", "bookings"] }),
        queryClient.invalidateQueries({ queryKey: ["customer", "booking", id] }),
        queryClient.invalidateQueries({ queryKey: ["customer", "reviews"] }),
        queryClient.invalidateQueries({ queryKey: ["executive"] }),
      ]);

      refetchBooking();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err.message || "Failed to submit satisfaction feedback.");
    } finally {
      setIsSubmittingSatisfaction(false);
    }
  };

  const isSatisfactionResponded = Boolean(
    satisfactionSubmittedLocally || 
    booking?.satisfactionStatus === 'SATISFIED' || 
    booking?.satisfactionStatus === 'DISSATISFIED'
  );

  const isSatisfactionPending = !isSatisfactionResponded && (
    booking?.satisfactionStatus === 'PENDING_CUSTOMER' || 
    booking?.status === 'COMPLETED'
  );

  const handleSelectQuoteWithOption = async (quoteParam: any, payAmount: number, paymentType: "ADVANCE" | "FULL" = "ADVANCE") => {
    const bidId = typeof quoteParam === 'string' ? quoteParam : (quoteParam?._id || quoteParam?.id);
    const quoteAmount = typeof quoteParam === 'object' ? quoteParam?.quotedAmount : 0;
    setIsAccepting(bidId);
    setMessage({ type: "", text: "" });
    try {
      await selectQuoteMutation.mutateAsync({ bookingId: id, bidId });
      const finalPayAmt = Math.round(Number(payAmount || quoteAmount || baseAmount));
      toast.success("Quote accepted successfully!");
      refetchBooking();
    } catch (err: any) {
      toast.error(err?.message || "Failed to accept quote");
    } finally {
      setIsAccepting(null);
    }
  };

  const handleCancelBooking = async () => {
    if (!cancelReason.trim()) {
      toast.error("Please provide a reason for cancellation");
      return;
    }
    setIsCancelling(true);
    try {
      await cancelBookingMutation.mutateAsync({ id, reason: cancelReason });
      toast.success("Booking cancelled successfully");
      setShowCancel(false);
      refetchBooking();
    } catch (err: any) {
      toast.error(err?.message || "Failed to cancel booking");
    } finally {
      setIsCancelling(false);
    }
  };

  const handleExtensionResponse = async (extensionId: string, status: 'APPROVED' | 'REJECTED') => {
    setIsExtensionProcessing(true);
    try {
      await respondExtensionMutation.mutateAsync({ bookingId: id, extId: extensionId, status });
      toast.success(`Additional item ${status.toLowerCase()} successfully.`);
      refetchBooking();
    } catch (err: any) {
      toast.error(err?.message || "Failed to respond to extension.");
    } finally {
      setIsExtensionProcessing(false);
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setIsApplyingCoupon(true);
    try {
      await applyCouponMutation.mutateAsync({ bookingId: id, couponCode: couponCode.trim() });
      toast.success("Coupon applied successfully!");
      setCouponCode("");
      refetchBooking();
    } catch (err: any) {
      toast.error(err?.message || "Failed to apply coupon.");
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleTogglePaymentMode = async (mode: "CASH" | "ONLINE") => {
    if (!booking) return;
    setSelectedPaymentPreference(mode);
    try {
      const { updateBookingPaymentMode } = await import("@/lib/services");
      await updateBookingPaymentMode(booking._id || booking.id, mode);
      refetchBooking();
      toast.success(mode === "CASH" ? "Payment preference set to Cash to Partner" : "Payment preference set to Online Payment");
    } catch (e: any) {}
  };

  const handlePayAtWorkshop = async (payAmount: number, type: string = "ADVANCE") => {
    if (!booking) return;
    setIsExtensionProcessing(true);
    try {
      const { markOfflinePayment, updateBookingPaymentMode } = await import("@/lib/services");
      try {
        await updateBookingPaymentMode(booking._id || booking.id, "CASH");
      } catch (e) {}

      await markOfflinePayment({
        bookingId: booking._id || booking.id,
        amount: payAmount,
        paymentType: type,
      });

      setSelectedPaymentPreference("CASH");
      toast.success(type === "FINAL" ? "Cash payment marked for collection!" : "Pay at Workshop selected! Booking confirmed.");
      refetchBooking();
    } catch (err: any) {
      if (err?.message?.includes("already exists or is pending")) {
        toast.success("Cash payment is already registered and waiting for partner verification.");
        refetchBooking();
      } else {
        toast.error(err?.message || "Failed to confirm Pay at Workshop.");
      }
    } finally {
      setIsExtensionProcessing(false);
    }
  };

  const handleInitiatePayment = async (amount: number, type: string = "ADVANCE") => {
    if (!booking) return;
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      toast.error("Internet disconnected. Please reconnect to complete payment.");
      return;
    }
    setIsExtensionProcessing(true);
    try {
      const isScriptLoaded = await loadRazorpayScript();

      const payload: any = {
        bookingId: booking._id || booking.id,
        amount: amount,
        paymentType: type,
        useRewardPoints: useRewardPoints,
      };
      if (couponCode.trim()) {
        payload.couponCode = couponCode.trim();
      }

      const res = await initiatePaymentMutation.mutateAsync(payload);
      const paymentData = res?.data || res;
      const { orderId, amount: payAmount, currency, key } = paymentData;

      if (!isScriptLoaded) {
        toast.error("Unable to load secure Razorpay gateway. Please refresh.");
        setIsExtensionProcessing(false);
        return;
      }

      const options = {
        key: key || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: Math.round(Number(payAmount || amount) * 100),
        currency: currency || "INR",
        name: "CarBlink Services",
        description: `${type} Payment for Booking`,
        order_id: orderId,
        handler: async function (response: any) {
          try {
            await verifyPayment({
              paymentId: response.razorpay_payment_id,
              orderId: response.razorpay_order_id,
              signature: response.razorpay_signature,
            });
            toast.success("Payment successful! Booking confirmed.");
            refetchBooking();
          } catch (err: any) {
            toast.error("Payment verification failed.");
          } finally {
            setIsExtensionProcessing(false);
          }
        },
        prefill: {
          name: user?.fullName || (typeof booking.customerId === 'object' ? booking.customerId?.fullName : "") || "CarBlink Customer",
          email: user?.email || (typeof booking.customerId === 'object' ? booking.customerId?.email : "") || "",
          contact: user?.phone || (typeof booking.customerId === 'object' ? booking.customerId?.phone : "") || booking?.phone || "",
        },
        theme: {
          color: "#0a2540",
        },
        modal: {
          ondismiss: function () {
            setIsExtensionProcessing(false);
          }
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on("payment.failed", function (response: any) {
        toast.error(`Payment Declined: ${response.error?.description || "Bank decline"}`);
        setIsExtensionProcessing(false);
      });
      rzp.open();
    } catch (err: any) {
      toast.error(err?.message || "Failed to initiate payment.");
      setIsExtensionProcessing(false);
    }
  };

  const handleSubmitReview = async () => {
    if (reviewRating === 0) {
      toast.error("Please select a rating.");
      return;
    }
    setIsSubmittingReview(true);
    try {
      await createReviewMutation.mutateAsync({ bookingId: id, rating: reviewRating, comment: reviewComment });
      toast.success("Thank you! Your review has been submitted.");
      setReviewSubmitted(true);
      refetchBooking();
    } catch (error: any) {
      toast.error(error?.message || "Failed to submit review");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'PENDING':
        return <Badge className="bg-amber-100 text-amber-800 border-amber-200 px-3 py-1 font-bold">Waiting for Quotes</Badge>;
      case 'QUOTED':
        return <Badge className="bg-primary-orange/20 text-primary-orange border-primary-orange/30 px-3 py-1 font-bold">Quotes Available</Badge>;
      case 'CUSTOMER_ACCEPTED':
      case 'AWAITING_15_PERCENT_ADVANCE':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200 px-3 py-1 font-bold">Advance Payment Pending</Badge>;
      case 'ASSIGNED':
      case 'CONFIRMED':
      case 'VERIFIED':
        return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 px-3 py-1 font-bold">✓ Booking Confirmed</Badge>;
      case 'WORK_STARTED':
      case 'IN_PROGRESS':
      case 'IN_SERVICE':
      case 'DIAGNOSIS':
      case 'REPAIRING':
      case 'QUALITY_CHECK':
        return <Badge className="bg-indigo-100 text-indigo-800 border-indigo-200 px-3 py-1 font-bold">Service Underway</Badge>;
      case 'COMPLETED':
        return <Badge className="bg-emerald-600 text-white border-none px-3 py-1 font-bold">✓ Completed</Badge>;
      case 'CANCELLED':
        return <Badge className="bg-red-100 text-red-800 border-red-200 px-3 py-1 font-bold">Cancelled</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-700 px-3 py-1 font-bold">{status ? status.replace(/_/g, ' ') : 'Pending'}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-12 h-12 text-primary-orange animate-spin mb-4" />
        <p className="text-neutral-muted font-medium">Loading booking journey...</p>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] bg-white rounded-3xl border border-neutral-muted/10 shadow-sm p-8 text-center max-w-lg mx-auto">
        <AlertCircle className="w-16 h-16 text-neutral-muted/40 mb-4" />
        <h2 className="text-2xl font-bold text-primary-navy mb-2">Booking Not Found</h2>
        <p className="text-neutral-muted mb-6 text-sm">The booking you are looking for does not exist or you don&apos;t have access.</p>
        <Button onClick={() => router.push('/customer/bookings')} className="bg-primary-navy text-white rounded-xl px-6">
          Back to Bookings
        </Button>
      </div>
    );
  }

  const vehicleName = typeof booking.vehicleId === 'object'
    ? `${booking.vehicleId?.brand || ''} ${booking.vehicleId?.model || ''}`.trim() || "Vehicle Requested"
    : "Vehicle Requested";

  const totalPaidAmount = booking.payments?.filter((p: any) => p.status === 'SUCCESS').reduce((sum: number, p: any) => sum + p.amount, 0) || 0;

  const isAdvancePaid = Boolean(
    booking?.hasPaidAdvance ||
    booking?.isAdvancePaid ||
    booking.payments?.some((p: any) => p.paymentType === 'ADVANCE' && p.status === 'SUCCESS' && p.amount > 0)
  );

  const hasPaidAdvance = Boolean(
    (booking?.hasPaidAdvance && (booking?.isAdvancePaid || (booking?.paidAmount || 0) > 0)) ||
    isAdvancePaid ||
    totalPaidAmount > 0 ||
    booking?.paymentStatus === 'PAID' ||
    booking?.paymentStatus === 'PARTIALLY_PAID' ||
    ['VERIFIED', 'IN_PROGRESS', 'WORK_STARTED', 'IN_SERVICE', 'DIAGNOSIS', 'REPAIRING', 'QUALITY_CHECK', 'JOB_COMPLETED', 'COMPLETED'].includes(booking?.status)
  );

  const partnerInfo = (booking?.assignedPartnerId && typeof booking.assignedPartnerId === 'object')
    ? booking.assignedPartnerId
    : (booking?.acceptedBidId && typeof booking.acceptedBidId === 'object' && booking.acceptedBidId.partnerId)
      ? booking.acceptedBidId.partnerId
      : null;

  const acceptedQuoteAmount = 
    booking.pricing?.customerGrossQuote ||
    booking.acceptedQuoteAmount ||
    (typeof booking.acceptedBidId === 'object' ? booking.acceptedBidId?.quotedAmount : 0) ||
    quotes.find((q: any) => 
      String(q._id) === String(booking.acceptedBidId?._id || booking.acceptedBidId) ||
      String(q.id) === String(booking.acceptedBidId?._id || booking.acceptedBidId) ||
      q.status === 'ACCEPTED' || q.status === 'CUSTOMER_ACCEPTED'
    )?.quotedAmount ||
    (quotes.length === 1 ? quotes[0]?.quotedAmount : 0) ||
    0;

  const approvedExtensions = booking.jobDetails?.jobExtensions?.filter((e: any) => e.status === 'APPROVED') || [];
  const approvedExtensionsCost = approvedExtensions.reduce((sum: number, ext: any) => sum + ext.cost, 0);

  // Option A: Base package is the agreed customer gross quote (All-Inclusive 18% GST)
  const baseAmount = booking.pricing?.customerGrossQuote || booking.acceptedQuoteAmount || acceptedQuoteAmount || booking.jobDetails?.finalAmount || booking.finalAmount || (booking.serviceId?.basePrice || 0);
  const calculatedTotalAmount = baseAmount + approvedExtensionsCost;
  const couponDiscountAmount = booking.couponDiscountAmount || 0;
  const revisedTotalAmount = Math.max(0, calculatedTotalAmount - couponDiscountAmount);
  const remainingAmount = Math.max(0, revisedTotalAmount - totalPaidAmount);

  const rawAdv = Math.round(revisedTotalAmount * 0.15);
  const fallbackAdv = revisedTotalAmount > 0 ? Math.min(revisedTotalAmount, Math.max(1, rawAdv)) : 0;
  const calculatedAdvance = advanceFor(revisedTotalAmount);
  const advanceAmount = typeof booking.advanceAmount === 'number' && booking.advanceAmount > 0
    ? booking.advanceAmount
    : (calculatedAdvance.advanceAmount || fallbackAdv);
  const remainingForAdvance = Math.max(0, advanceAmount - totalPaidAmount);

  const needsAdvance = !hasPaidAdvance && remainingAmount > 0 && !['ACCEPTED', 'CONFIRMED', 'VERIFIED', 'IN_PROGRESS', 'WORK_STARTED', 'IN_SERVICE', 'DIAGNOSIS', 'REPAIRING', 'QUALITY_CHECK', 'JOB_COMPLETED', 'COMPLETED'].includes(booking.status);
  const needsFinal = booking.status === 'COMPLETED' && remainingAmount > 0;
  const effectivePaymentMode = selectedPaymentPreference || booking.paymentMode || "ONLINE";
  const isCashMode = effectivePaymentMode === "CASH";

  // ==========================================
  // 🎯 OPTION 1: PROGRESSIVE STAGE CALCULATOR
  // ==========================================
  // Stage 1: Quotes & Workshop Selection (PENDING / QUOTED)
  // Stage 2: Advance Payment to Lock Slot (Quote selected, 15% pending)
  // Stage 3: Workshop Handover & PIN (Advance paid, visit workshop)
  // Stage 4: Service Underway & Photos (Car in workshop, repairs live)
  // Stage 5: Completed, Delivery & Bill (Service done, final payment & rating)
  const isStage5 = booking.status === 'COMPLETED';
  const isStage4 = ['WORK_STARTED', 'IN_PROGRESS', 'IN_SERVICE', 'DIAGNOSIS', 'REPAIRING', 'QUALITY_CHECK', 'JOB_COMPLETED'].includes(booking.status) && !isStage5;
  const isStage3 = (hasPaidAdvance || ['CONFIRMED', 'VERIFIED'].includes(booking.status)) && !isStage4 && !isStage5;
  const isStage2 = (Boolean(booking.acceptedBidId) || ['CUSTOMER_ACCEPTED', 'AWAITING_15_PERCENT_ADVANCE'].includes(booking.status) || needsAdvance) && !isStage3 && !isStage4 && !isStage5;
  const isStage1 = !isStage2 && !isStage3 && !isStage4 && !isStage5;

  const currentStageNum = isStage5 ? 5 : isStage4 ? 4 : isStage3 ? 3 : isStage2 ? 2 : 1;

  const milestones = [
    { num: 1, label: "Quotes", desc: "Select Partner" },
    { num: 2, label: "Advance", desc: "Lock Slot" },
    { num: 3, label: "Handover", desc: "Workshop PIN" },
    { num: 4, label: "Underway", desc: "Live Repairs" },
    { num: 5, label: "Completed", desc: "Bill & Delivery" }
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16 px-3 sm:px-6">
      
      {/* ======================================================== */}
      {/* 1. TOP HEADER: Clean Navigation, Reference & Support     */}
      {/* ======================================================== */}
      <div className="bg-white border border-gray-200/90 rounded-3xl p-5 sm:p-7 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <button 
                onClick={() => router.push('/customer/bookings')}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-gray-900 bg-gray-100 hover:bg-gray-200/80 px-2.5 py-1 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Bookings
              </button>
              <span className="text-xs text-gray-400 font-mono font-semibold">
                #BK-{(booking._id || id).slice(-8).toUpperCase()}
              </span>
              {getStatusBadge(booking.status)}
            </div>
            <h1 className="text-2xl sm:text-3xl font-heading font-black text-primary-navy tracking-tight">
              {booking.serviceId?.name || "Car Service Booking"}
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 font-medium flex items-center gap-1.5">
              <Car className="w-4 h-4 text-primary-orange shrink-0" />
              <span>{vehicleName}</span>
              {booking.vehicleId?.registrationNumber && (
                <span className="bg-gray-100 text-gray-800 font-mono text-[11px] font-bold px-2 py-0.5 rounded border border-gray-200">
                  {booking.vehicleId.registrationNumber}
                </span>
              )}
            </p>
          </div>

          {/* Quick Header Actions: Support & Cancel */}
          <div className="flex items-center gap-2.5 self-start sm:self-auto shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/customer/support?bookingId=${id}`)}
              className="border-gray-200 hover:border-primary-orange text-gray-700 hover:text-primary-orange text-xs font-bold rounded-xl h-10 px-3.5 gap-1.5 shadow-2xs"
            >
              <HelpCircle className="w-4 h-4 text-primary-orange" />
              <span>Need Help?</span>
            </Button>

            {!isStage5 && booking.status !== 'CANCELLED' && !showCancel && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCancel(true)}
                className="text-gray-400 hover:text-red-600 hover:bg-red-50 text-xs font-bold rounded-xl h-10 px-3 transition-colors"
              >
                Cancel
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. PROGRESS TRACKER: Clean 5-Step Milestones Stepper     */}
      {/* ======================================================== */}
      <div className="bg-slate-900 rounded-3xl p-5 sm:p-7 text-white shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-orange/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-primary-orange animate-ping" />
              <span className="text-xs font-black uppercase tracking-wider text-primary-orange">
                Live Service Progress
              </span>
            </div>
            <span className="text-xs text-slate-300 font-semibold bg-white/10 px-3 py-1 rounded-full border border-white/10">
              Stage {currentStageNum} of 5: {milestones[currentStageNum - 1].label}
            </span>
          </div>

          {/* 5-Step Progress Stepper */}
          <div className="grid grid-cols-5 gap-2 pt-1">
            {milestones.map((m) => {
              const isPassed = m.num < currentStageNum;
              const isCurrent = m.num === currentStageNum;
              return (
                <div key={m.num} className="space-y-2 text-center">
                  <div className={`h-2 rounded-full transition-all ${
                    isPassed 
                      ? "bg-emerald-500" 
                      : isCurrent 
                      ? "bg-primary-orange ring-2 ring-primary-orange/40" 
                      : "bg-white/15"
                  }`} />
                  <div className="hidden sm:block">
                    <p className={`text-xs font-bold ${
                      isCurrent ? "text-primary-orange" : isPassed ? "text-emerald-400" : "text-slate-400"
                    }`}>
                      {m.label}
                    </p>
                    <p className="text-[10px] text-slate-400 leading-tight">
                      {m.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. HERO ACTION CARD: Stage-Based Focus Card              */}
      {/* ======================================================== */}

      {/* -------------------------------------------------------- */}
      {/* STAGE 1: QUOTES PENDING / SELECTION                      */}
      {/* -------------------------------------------------------- */}
      {isStage1 && (
        <Card className="border-2 border-primary-orange/30 shadow-md rounded-3xl overflow-hidden bg-white">
          <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-3.5 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              <span className="font-heading font-black text-sm uppercase tracking-wide">
                Step 1: Review &amp; Accept Workshop Quote
              </span>
            </div>
            <span className="bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full">
              {quotes.length} Quotes Available
            </span>
          </div>

          <CardContent className="p-6 sm:p-8 space-y-6">
            {quotes.length === 0 ? (
              <div className="text-center py-10 space-y-3">
                <div className="w-14 h-14 rounded-full bg-amber-50 text-primary-orange mx-auto flex items-center justify-center border border-amber-200">
                  <Clock className="w-7 h-7 animate-spin" />
                </div>
                <h3 className="font-heading font-black text-xl text-primary-navy">
                  Workshops Preparing Your Quotes
                </h3>
                <p className="text-xs sm:text-sm text-gray-500 max-w-md mx-auto">
                  Partner workshops in your area are evaluating your car model &amp; requirements. Quotes will appear here shortly with price &amp; duration.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs sm:text-sm text-gray-600 font-medium">
                  Compare verified workshops and select your preferred package. You will only pay <strong>15% advance</strong> to confirm your slot.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {quotes.map((quote: any) => {
                    const quoteId = quote._id || quote.id;
                    const quoteTotal = Math.round(Number(quote.quotedAmount || 0));
                    const quoteAdvance = Math.round(quoteTotal * 0.15);
                    const quoteRemaining = quoteTotal - quoteAdvance;
                    const isAcceptingThis = isAccepting === quoteId;

                    return (
                      <div 
                        key={quoteId}
                        className="bg-slate-50/70 border border-slate-200 hover:border-primary-orange/60 rounded-2xl p-5 space-y-4 transition-all hover:shadow-md"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h4 className="font-heading font-black text-base text-primary-navy">
                              {quote.partnerId?.businessName || "Verified CarBlink Workshop"}
                            </h4>
                            <p className="text-xs text-emerald-700 font-bold flex items-center gap-1 mt-0.5">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Verified Partner Workshop
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider block">Total Quote</span>
                            <span className="text-2xl font-black text-primary-orange font-heading">
                              ₹{quoteTotal.toLocaleString("en-IN")}
                            </span>
                          </div>
                        </div>

                        <div className="bg-white p-3 rounded-xl border border-gray-100 flex items-center justify-between text-xs">
                          <span className="text-gray-600 font-medium">15% Advance Payable Now:</span>
                          <span className="font-black text-slate-900 font-mono">₹{quoteAdvance.toLocaleString("en-IN")}</span>
                        </div>

                        {quote.estimatedDuration && (
                          <p className="text-xs text-gray-500 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-secondary-blue" />
                            <span>Estimated Duration: <strong>{quote.estimatedDuration}</strong></span>
                          </p>
                        )}

                        {quote.notes && (
                          <p className="text-xs text-gray-600 bg-white/80 p-2.5 rounded-lg border border-gray-100 italic">
                            &ldquo;{quote.notes}&rdquo;
                          </p>
                        )}

                        <Button
                          onClick={() => handleSelectQuoteWithOption(quote, quoteTotal, "ADVANCE")}
                          isLoading={isAcceptingThis}
                          className="w-full bg-primary-navy hover:bg-secondary-blue text-white font-extrabold text-xs py-3 rounded-xl shadow-xs"
                        >
                          Accept Quote &amp; Proceed to Advance (₹{quoteAdvance}) &rarr;
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* -------------------------------------------------------- */}
      {/* STAGE 2: ADVANCE PAYMENT TO LOCK SERVICE SLOT            */}
      {/* -------------------------------------------------------- */}
      {isStage2 && (
        <Card className="border-2 border-primary-orange shadow-lg rounded-3xl overflow-hidden bg-gradient-to-br from-orange-50/70 via-white to-amber-50/40">
          <div className="bg-gradient-to-r from-primary-orange to-amber-600 px-6 py-3.5 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5" />
              <span className="font-heading font-black text-sm uppercase tracking-wide">
                Step 2: Pay 15% Advance to Lock Service Slot
              </span>
            </div>
            <span className="bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full">
              Instant Workshop Unlock
            </span>
          </div>

          <CardContent className="p-6 sm:p-8 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-orange-200/60">
              <div className="space-y-1.5 max-w-xl">
                <h3 className="font-heading font-black text-xl sm:text-2xl text-slate-900 tracking-tight">
                  Quote Accepted! Complete 15% Advance Payment
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
                  To guarantee your workshop booking slot and activate CarBlink warranty, complete the 15% token advance. Direct workshop contact, phone, and Google Maps location will unlock immediately.
                </p>
                <div className="flex items-center gap-2 pt-1 text-xs text-emerald-700 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>100% Refundable if cancelled before workshop visit</span>
                </div>
              </div>

              {/* Price Callout */}
              <div className="bg-white p-5 rounded-2xl border-2 border-primary-orange/40 shadow-sm text-center md:text-right shrink-0 min-w-[220px]">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">
                  15% ADVANCE PAYABLE
                </span>
                <p className="text-3xl font-black text-primary-orange font-heading mt-0.5">
                  ₹{(remainingForAdvance > 0 ? remainingForAdvance : Math.min(remainingAmount, advanceAmount || 1)).toLocaleString('en-IN')}
                </p>
                <p className="text-[11px] text-slate-500 font-semibold mt-1">
                  Total Quote: ₹{calculatedTotalAmount.toLocaleString('en-IN')}
                </p>
              </div>
            </div>

            {/* Payment Action Buttons */}
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl">
                <Button 
                  className="w-full bg-primary-navy hover:bg-secondary-blue text-white rounded-xl py-6 font-extrabold text-sm shadow-md flex items-center justify-center gap-2" 
                  onClick={() => handleInitiatePayment(remainingForAdvance > 0 ? remainingForAdvance : Math.min(remainingAmount, advanceAmount || 1), "ADVANCE")} 
                  isLoading={isExtensionProcessing}
                >
                  <IndianRupee className="w-4 h-4 text-primary-orange" />
                  <span>Pay Online Advance (₹{(remainingForAdvance > 0 ? remainingForAdvance : Math.min(remainingAmount, advanceAmount || 1)).toLocaleString('en-IN')})</span>
                </Button>

                <Button 
                  variant="outline"
                  className="w-full border-emerald-300 bg-emerald-50/60 hover:bg-emerald-100 text-emerald-900 rounded-xl py-6 font-extrabold text-sm shadow-2xs flex items-center justify-center gap-2" 
                  onClick={() => handlePayAtWorkshop(remainingForAdvance > 0 ? remainingForAdvance : Math.min(remainingAmount, advanceAmount || 1), "ADVANCE")} 
                  isLoading={isExtensionProcessing}
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Pay at Workshop (Cash)</span>
                </Button>
              </div>

              <div className="pt-2 text-xs text-slate-500">
                <button
                  type="button"
                  onClick={() => handleInitiatePayment(remainingAmount, "FULL")}
                  className="font-bold text-primary-navy hover:underline inline-flex items-center gap-1"
                >
                  Want to pay full ₹{remainingAmount.toLocaleString('en-IN')} upfront instead? Click here &rarr;
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* -------------------------------------------------------- */}
      {/* STAGE 3: WORKSHOP VISIT & HANDOVER PIN                   */}
      {/* -------------------------------------------------------- */}
      {isStage3 && (
        <div className="space-y-6">
          {/* Workshop Details Card */}
          <Card className="border-2 border-emerald-500/40 shadow-lg rounded-3xl overflow-hidden bg-gradient-to-br from-emerald-50/80 via-white to-teal-50/50">
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-3.5 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-heading font-black text-sm uppercase tracking-wide">
                  Step 3: Booking Confirmed • Workshop Details Unlocked
                </span>
              </div>
              <span className="bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full">
                ✓ Verified Partner
              </span>
            </div>

            <CardContent className="p-6 sm:p-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1.5">
                  <p className="text-[11px] uppercase tracking-wider font-extrabold text-emerald-700">Assigned Service Workshop</p>
                  <h3 className="font-heading font-black text-2xl sm:text-3xl text-slate-900 tracking-tight flex items-center gap-2">
                    <Car className="w-7 h-7 text-emerald-600 shrink-0" />
                    {partnerInfo?.businessName || "Verified Service Partner"}
                  </h3>
                  {partnerInfo?.businessAddress && (
                    <p className="text-sm text-slate-600 font-medium flex items-center gap-1.5 pt-1">
                      <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{partnerInfo.businessAddress}</span>
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3 shrink-0">
                  {(partnerInfo?.phone || partnerInfo?.userId?.phone) && (
                    <a
                      href={`tel:${partnerInfo.phone || partnerInfo.userId?.phone}`}
                      className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm shadow-sm transition-all hover:scale-[1.02]"
                    >
                      <Phone className="w-4 h-4" />
                      <span>Call Workshop</span>
                    </a>
                  )}
                  {partnerInfo?.businessAddress && (() => {
                    const coords = partnerInfo.location?.coordinates;
                    const mapsUrl = (coords && Array.isArray(coords) && coords.length === 2 && (coords[0] !== 0 || coords[1] !== 0))
                      ? `https://www.google.com/maps?q=${coords[1]},${coords[0]}`
                      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${partnerInfo.businessName || ''} ${partnerInfo.businessAddress}`.trim())}`;
                    return (
                      <a
                        href={mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-900 border-2 border-slate-200 font-extrabold text-sm shadow-xs transition-all hover:scale-[1.02]"
                      >
                        <Compass className="w-4 h-4 text-primary-orange" />
                        <span>Open Google Maps</span>
                        <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                      </a>
                    );
                  })()}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 4-Digit Check-in PIN Card */}
          {booking.verificationCode && (
            <Card className="border-2 border-primary-orange/40 shadow-md rounded-3xl overflow-hidden bg-white">
              <CardContent className="p-6 sm:p-8">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="space-y-2 text-center md:text-left">
                    <span className="text-[10px] font-black text-primary-orange uppercase tracking-wider bg-orange-100 px-3 py-1 rounded-full border border-orange-200">
                      Vehicle Drop-off Authorization
                    </span>
                    <h3 className="text-xl sm:text-2xl font-black text-slate-900 font-heading">
                      Customer Handover PIN: Show to Workshop
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 max-w-lg font-medium">
                      When you visit the workshop, show this 4-digit PIN to the partner. Partner cannot start service work on your car until you provide this PIN.
                    </p>
                  </div>

                  <div className="flex flex-col items-center justify-center bg-orange-50/60 p-5 rounded-2xl border-2 border-primary-orange/40 shadow-xs min-w-[200px]">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">
                      VERIFICATION PIN
                    </span>
                    <div className="text-4xl font-black font-mono tracking-[0.3em] text-primary-navy pl-2 my-1">
                      {booking.verificationCode}
                    </div>
                    {booking.isVerifiedByPartner ? (
                      <span className="inline-flex items-center gap-1 mt-2 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Verified by Partner
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 mt-2 text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                        <Clock className="w-3.5 h-3.5" /> Share at Handover
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* -------------------------------------------------------- */}
      {/* STAGE 4: SERVICE IN PROGRESS & APPROVALS                 */}
      {/* -------------------------------------------------------- */}
      {isStage4 && (
        <div className="space-y-6">
          <Card className="border-2 border-indigo-500/30 shadow-md rounded-3xl overflow-hidden bg-white">
            <div className="bg-gradient-to-r from-indigo-600 to-primary-navy px-6 py-3.5 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wrench className="w-5 h-5 text-primary-orange" />
                <span className="font-heading font-black text-sm uppercase tracking-wide">
                  Step 4: Service Underway at Workshop
                </span>
              </div>
              <span className="bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" /> Work in Progress
              </span>
            </div>

            <CardContent className="p-6 sm:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
                <div className="space-y-1">
                  <h3 className="font-heading font-black text-xl text-slate-900">
                    Your Vehicle is Being Serviced
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600">
                    Partner workshop <strong>{partnerInfo?.businessName || "CarBlink Workshop"}</strong> is performing diagnostics, repairs, and service.
                  </p>
                </div>
                {partnerInfo?.phone && (
                  <a
                    href={`tel:${partnerInfo.phone}`}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs shrink-0 self-start sm:self-auto"
                  >
                    <Phone className="w-3.5 h-3.5 text-emerald-600" /> Call Partner
                  </a>
                )}
              </div>

              {/* Pending Job Extensions (Additional Parts Approvals) */}
              {booking.jobDetails?.jobExtensions && booking.jobDetails.jobExtensions.length > 0 && (
                <div className="space-y-3 pt-2">
                  <h4 className="text-sm font-black text-primary-navy uppercase tracking-wider flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary-orange" /> Additional Parts Requested by Workshop:
                  </h4>
                  <div className="space-y-2.5">
                    {booking.jobDetails.jobExtensions.map((ext: any, idx: number) => (
                      <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <p className="font-bold text-slate-900 text-sm">{ext.partName}</p>
                          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full inline-block mt-1 ${
                            ext.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
                            ext.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                            'bg-amber-100 text-amber-800'
                          }`}>
                            {ext.status || 'PENDING APPROVAL'}
                          </span>
                        </div>

                        <div className="flex items-center gap-4">
                          <span className="font-black text-base text-primary-orange font-heading">
                            +₹{ext.cost}
                          </span>
                          {ext.status === 'PENDING' && (
                            <div className="flex items-center gap-2">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold" 
                                onClick={() => handleExtensionResponse(ext._id, 'REJECTED')} 
                                disabled={isExtensionProcessing}
                              >
                                Reject
                              </Button>
                              <Button 
                                size="sm" 
                                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold" 
                                onClick={() => handleExtensionResponse(ext._id, 'APPROVED')} 
                                isLoading={isExtensionProcessing}
                              >
                                Approve
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* -------------------------------------------------------- */}
      {/* STAGE 5: SERVICE COMPLETED, INVOICE & FINAL SETTLEMENT   */}
      {/* -------------------------------------------------------- */}
      {isStage5 && (
        <div className="space-y-6">
          <Card className="border-2 border-emerald-500/40 shadow-lg rounded-3xl overflow-hidden bg-white">
            <div className="bg-gradient-to-r from-emerald-600 to-teal-700 px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-6 h-6" />
                <span className="font-heading font-black text-base uppercase tracking-wide">
                  Step 5: Service Completed • Vehicle Ready for Delivery
                </span>
              </div>
              <span className="bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full">
                ✓ Ready for Handover
              </span>
            </div>

            <CardContent className="p-6 sm:p-8 space-y-6">
              {/* Invoice & Final Bill Download Button */}
              {booking.jobDetails?.invoiceUrl ? (
                <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-xl bg-primary-orange/10 text-primary-orange flex items-center justify-center shrink-0">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-heading font-black text-base text-primary-navy">
                        Official Service Invoice Generated
                      </h4>
                      <p className="text-xs text-gray-500">
                        Itemized invoice and bill prepared by partner workshop.
                      </p>
                    </div>
                  </div>
                  <a
                    href={booking.jobDetails.invoiceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0"
                  >
                    <Button className="bg-primary-orange hover:bg-orange-600 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-xs">
                      {booking.jobDetails.invoiceUrl.toLowerCase().endsWith('.pdf') ? 'Download / View PDF Invoice' : 'View Invoice Document'}
                    </Button>
                  </a>
                </div>
              ) : null}

              {/* Remaining Payment Settlement */}
              {remainingAmount > 0 ? (
                <div className="bg-amber-50/70 border-2 border-amber-300 p-5 sm:p-6 rounded-2xl space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-amber-200">
                    <div>
                      <span className="text-[10px] font-extrabold text-amber-800 uppercase tracking-wider block">FINAL SETTLEMENT</span>
                      <h4 className="font-heading font-black text-xl text-amber-950">
                        Remaining Balance Due: ₹{remainingAmount.toLocaleString("en-IN")}
                      </h4>
                      <p className="text-xs text-amber-800">
                        Pay remaining balance online or hand over cash to the partner upon car collection.
                      </p>
                    </div>
                    <span className="text-2xl font-black text-primary-orange font-heading">
                      ₹{remainingAmount.toLocaleString("en-IN")}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <Button
                      onClick={() => handleInitiatePayment(remainingAmount, "FINAL")}
                      isLoading={isExtensionProcessing}
                      className="bg-primary-navy hover:bg-secondary-blue text-white font-extrabold text-xs py-5 rounded-xl shadow-xs"
                    >
                      💳 Pay Final Balance Online (₹{remainingAmount})
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handlePayAtWorkshop(remainingAmount, "FINAL")}
                      isLoading={isExtensionProcessing}
                      className="border-emerald-300 bg-white hover:bg-emerald-50 text-emerald-900 font-extrabold text-xs py-5 rounded-xl shadow-xs"
                    >
                      💵 Confirm Cash Handed to Partner
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-emerald-900 font-bold text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>All payments have been settled and confirmed in full!</span>
                </div>
              )}

              {/* Service Satisfaction Form */}
              <div className="pt-4 border-t border-gray-100">
                {isSatisfactionPending ? (
                  <div className="bg-slate-50 border border-slate-200 p-5 sm:p-6 rounded-2xl space-y-4">
                    <div className="flex items-center gap-2">
                      <HeartHandshake className="w-5 h-5 text-primary-orange" />
                      <h4 className="font-heading font-black text-lg text-primary-navy">
                        Service Satisfaction &amp; Feedback
                      </h4>
                    </div>
                    <p className="text-xs text-gray-600">
                      Are you fully satisfied with the workshop&apos;s service quality?
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setSatisfactionChoice(true)}
                        className={`p-3.5 rounded-xl border-2 text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                          satisfactionChoice === true
                            ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                            : "bg-white text-emerald-800 border-emerald-200 hover:bg-emerald-50"
                        }`}
                      >
                        <ThumbsUp className="w-4 h-4" /> Yes, Fully Satisfied
                      </button>

                      <button
                        type="button"
                        onClick={() => setSatisfactionChoice(false)}
                        className={`p-3.5 rounded-xl border-2 text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                          satisfactionChoice === false
                            ? "bg-red-600 text-white border-red-600 shadow-sm"
                            : "bg-white text-red-800 border-red-200 hover:bg-red-50"
                        }`}
                      >
                        <ThumbsDown className="w-4 h-4" /> No, I have Issues
                      </button>
                    </div>

                    {satisfactionChoice !== null && (
                      <div className="space-y-3 pt-3 border-t border-gray-200">
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1">
                            Rating ({satisfactionRating} of 5 Stars)
                          </label>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                onClick={() => setSatisfactionRating(star)}
                                className="p-1 hover:scale-110 transition-transform"
                              >
                                <Star
                                  className={`w-6 h-6 ${
                                    star <= satisfactionRating
                                      ? "text-amber-500 fill-amber-500"
                                      : "text-gray-300"
                                  }`}
                                />
                              </button>
                            ))}
                          </div>
                        </div>

                        <textarea
                          value={satisfactionFeedback}
                          onChange={(e) => setSatisfactionFeedback(e.target.value)}
                          placeholder={satisfactionChoice ? "What did you like about the service? (Optional)" : "Please describe what went wrong..."}
                          rows={2}
                          className="w-full p-3 border border-gray-300 rounded-xl text-xs bg-white focus:outline-none focus:ring-1 focus:ring-primary-orange"
                        />

                        <Button
                          onClick={handleSubmitSatisfaction}
                          isLoading={isSubmittingSatisfaction}
                          className="bg-primary-orange hover:bg-orange-600 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl"
                        >
                          Submit Satisfaction Response
                        </Button>
                      </div>
                    )}
                  </div>
                ) : isSatisfactionResponded ? (
                  <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-emerald-900 text-xs font-bold flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Service Satisfaction Recorded
                    </span>
                    <span className="text-amber-600 flex items-center gap-1 font-mono">
                      ★ {booking?.satisfactionRating || satisfactionRating || 5}/5
                    </span>
                  </div>
                ) : null}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. REFERENCE SECTION: Clean 2-Column Details Grid        */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
        {/* Left Column: Vehicle Specs, Schedule & Photos */}
        <div className="lg:col-span-2 space-y-6">
          {/* Vehicle Specifications */}
          {booking.vehicleId && typeof booking.vehicleId === 'object' && (
            <Card className="border border-gray-200/90 rounded-3xl overflow-hidden bg-white shadow-2xs">
              <CardHeader className="bg-slate-50 border-b border-gray-100 py-3.5 px-6">
                <CardTitle className="text-sm font-black text-gray-900 uppercase tracking-wide flex items-center gap-2">
                  <Car className="w-4 h-4 text-primary-orange" /> Vehicle Information
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 sm:p-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <span className="text-[10px] text-gray-400 font-bold uppercase block">Brand &amp; Model</span>
                    <span className="font-black text-gray-900 mt-0.5 block">{booking.vehicleId.brand} {booking.vehicleId.model}</span>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <span className="text-[10px] text-gray-400 font-bold uppercase block">Reg Number</span>
                    <span className="font-mono font-bold text-primary-navy mt-0.5 block">{booking.vehicleId.registrationNumber || "N/A"}</span>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <span className="text-[10px] text-gray-400 font-bold uppercase block">Fuel Type</span>
                    <span className="font-bold text-gray-800 mt-0.5 block">{booking.vehicleId.fuelType || "Petrol"}</span>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <span className="text-[10px] text-gray-400 font-bold uppercase block">Transmission</span>
                    <span className="font-bold text-gray-800 mt-0.5 block">{booking.vehicleId.transmission || "Manual"}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Appointment Schedule & Location */}
          <Card className="border border-gray-200/90 rounded-3xl overflow-hidden bg-white shadow-2xs">
            <CardHeader className="bg-slate-50 border-b border-gray-100 py-3.5 px-6">
              <CardTitle className="text-sm font-black text-gray-900 uppercase tracking-wide flex items-center gap-2">
                <Calendar className="w-4 h-4 text-secondary-blue" /> Appointment &amp; Schedule
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 sm:p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-secondary-blue flex items-center justify-center shrink-0">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 font-bold uppercase block">Preferred Date</span>
                    <p className="font-bold text-gray-900 text-sm mt-0.5">
                      {booking.preferredDate && !isNaN(new Date(booking.preferredDate).getTime())
                        ? format(new Date(booking.preferredDate), 'EEE, MMM do, yyyy')
                        : 'Flexible Schedule'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-orange-50 text-primary-orange flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 font-bold uppercase block">Service Location</span>
                    <p className="font-bold text-gray-900 text-sm mt-0.5">
                      {booking.address
                        ? `${booking.address}${booking.landmark ? `, ${booking.landmark}` : ''}`
                        : booking.serviceMode === 'GARAGE_VISIT'
                        ? 'Workshop Visit (Selected Partner)'
                        : 'Customer Address'}
                    </p>
                  </div>
                </div>
              </div>

              {Boolean(booking.description && booking.description.trim()) && (
                <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-100 text-xs">
                  <span className="text-[10px] text-gray-400 font-bold uppercase block mb-1">Customer Service Notes</span>
                  <p className="text-gray-700 leading-relaxed">{booking.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Inspection Photos (Before & After) */}
          {(booking.jobDetails?.beforePhotos?.length > 0 || booking.jobDetails?.afterPhotos?.length > 0) && (
            <Card className="border border-gray-200/90 rounded-3xl overflow-hidden bg-white shadow-2xs">
              <CardHeader className="bg-slate-50 border-b border-gray-100 py-3.5 px-6">
                <CardTitle className="text-sm font-black text-gray-900 uppercase tracking-wide flex items-center gap-2">
                  <Camera className="w-4 h-4 text-emerald-600" /> Inspection Photos
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 sm:p-6 space-y-4">
                {booking.jobDetails?.beforePhotos?.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-500" /> Before Service Photos
                    </span>
                    <div className="flex gap-2.5 overflow-x-auto pb-2">
                      {booking.jobDetails.beforePhotos.map((url: string, idx: number) => (
                        <a 
                          key={idx} 
                          href={url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="relative w-28 h-28 rounded-xl overflow-hidden border border-gray-200 shrink-0 group hover:opacity-90"
                        >
                          <img src={url} alt={`Before ${idx + 1}`} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-bold transition-opacity">
                            View Full
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {booking.jobDetails?.afterPhotos?.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-gray-100">
                    <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" /> After Service Photos
                    </span>
                    <div className="flex gap-2.5 overflow-x-auto pb-2">
                      {booking.jobDetails.afterPhotos.map((url: string, idx: number) => (
                        <a 
                          key={idx} 
                          href={url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="relative w-28 h-28 rounded-xl overflow-hidden border border-gray-200 shrink-0 group hover:opacity-90"
                        >
                          <img src={url} alt={`After ${idx + 1}`} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-bold transition-opacity">
                            View Full
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column: Unified Billing Summary */}
        <div className="space-y-6">
          <Card className="border border-gray-200/90 rounded-3xl overflow-hidden bg-white shadow-2xs">
            <CardHeader className="bg-slate-50 border-b border-gray-100 py-3.5 px-6">
              <CardTitle className="text-sm font-black text-gray-900 uppercase tracking-wide flex items-center gap-2">
                <IndianRupee className="w-4 h-4 text-primary-orange" /> Billing Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 sm:p-6 space-y-4 text-xs">
              <div className="space-y-2.5">
                <div className="flex justify-between text-gray-600">
                  <span>Base Service Package (Incl. 18% GST)</span>
                  <span className="font-mono font-bold text-gray-900">₹{baseAmount.toLocaleString("en-IN")}</span>
                </div>

                {approvedExtensions.map((ext: any, idx: number) => (
                  <div key={idx} className="flex justify-between text-gray-600">
                    <span>{ext.partName} (Added)</span>
                    <span className="font-mono font-bold text-gray-900">+₹{ext.cost.toLocaleString("en-IN")}</span>
                  </div>
                ))}

                {couponDiscountAmount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span>Coupon Discount</span>
                    <span className="font-mono">-₹{couponDiscountAmount.toLocaleString("en-IN")}</span>
                  </div>
                )}

                <div className="pt-2.5 border-t border-gray-100 flex justify-between font-bold text-gray-900 text-sm">
                  <span>Total Amount</span>
                  <span className="font-mono font-black text-base">₹{revisedTotalAmount.toLocaleString("en-IN")}</span>
                </div>

                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>Paid so Far</span>
                  <span className="font-mono">-₹{totalPaidAmount.toLocaleString("en-IN")}</span>
                </div>

                <div className="pt-2.5 border-t border-gray-200 flex justify-between items-center">
                  <span className="font-bold text-gray-700">Remaining Balance:</span>
                  <span className="font-heading font-black text-xl text-primary-orange font-mono">
                    ₹{remainingAmount.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              {/* Promo / Coupon Apply (Only if not already applied and balance exists) */}
              {!booking.appliedCoupon && remainingAmount > 0 && !isStage5 && (
                <div className="pt-3 border-t border-gray-100 space-y-2">
                  <label className="text-[11px] font-bold text-gray-700 block">Have a Coupon Code?</label>
                  <div className="flex gap-2">
                    <Input
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      placeholder="Enter code"
                      className="text-xs h-9 bg-gray-50 uppercase"
                    />
                    <Button
                      size="sm"
                      onClick={handleApplyCoupon}
                      isLoading={isApplyingCoupon}
                      disabled={!couponCode.trim()}
                      className="bg-primary-navy text-white text-xs px-3 h-9 font-bold"
                    >
                      Apply
                    </Button>
                  </div>
                </div>
              )}

              {/* Payment Mode Preference Display */}
              <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
                <span>Selected Mode:</span>
                <span className="font-bold text-gray-800">
                  {effectivePaymentMode === 'CASH' ? '💵 Cash to Partner' : '💳 Online Payment'}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 5. CANCELLATION MODAL                                    */}
      {/* ======================================================== */}
      {showCancel && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <h3 className="font-heading font-black text-xl text-primary-navy">
                Cancel Booking Request
              </h3>
              <button 
                onClick={() => setShowCancel(false)}
                className="text-gray-400 hover:text-gray-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              {totalPaidAmount > 0 
                ? `Since you have paid ₹${totalPaidAmount.toLocaleString("en-IN")}, an automatic refund request will be initiated as per CarBlink Refund Policy.`
                : "Are you sure you want to cancel this booking?"}
            </p>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-primary-navy flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-primary-orange shrink-0" />
              <span>Refunds are credited to original payment source within 3-5 business days.</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Reason for cancellation *
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Please tell us why you are cancelling..."
                rows={3}
                className="w-full p-3 border border-gray-300 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-red-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button 
                variant="outline" 
                onClick={() => setShowCancel(false)}
                className="text-xs font-bold rounded-xl"
              >
                Keep Booking
              </Button>
              <Button 
                onClick={handleCancelBooking}
                isLoading={isCancelling}
                className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl"
              >
                Confirm Cancellation
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
