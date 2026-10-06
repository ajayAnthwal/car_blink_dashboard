// @ts-nocheck
"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSocket } from "@/lib/SocketContext";
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
import { Loader2, ArrowLeft, ArrowRight, Calendar, MapPin, Car, IndianRupee, Clock, CheckCircle2, AlertCircle, Phone, Mail, FileText, Star, ShieldCheck, ChevronRight, MessageSquareQuote, Tag, ExternalLink, ThumbsUp, ThumbsDown, HeartHandshake, Sparkles } from "lucide-react";
import { PaymentCard } from "@/components/payment/PaymentCard";
import { loadRazorpayScript } from "@/lib/razorpay";
import { verifyPayment } from "@/lib/services";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { format } from "date-fns";
import toast from "react-hot-toast";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export default function CustomerBookingDetailsPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { socket } = useSocket();
  const { user } = useAuth();

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

  useEffect(() => {
    if (booking?.paymentMode) {
      setSelectedPaymentPreference(booking.paymentMode);
    }
  }, [booking?.paymentMode]);

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
      toast.success("Thank you! Your satisfaction response has been officially recorded.");
      setSatisfactionSubmittedLocally(true);
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

  // Auto-focus directly on Advance Payment Section ONLY when payment is genuinely pending
  useEffect(() => {
    if (typeof window === 'undefined' || !booking || booking.status === 'COMPLETED') return;

    const isAdvPaid = Boolean(
      booking.hasPaidAdvance ||
      booking.isAdvancePaid ||
      booking.payments?.some((p: any) => p.paymentType === 'ADVANCE' && p.status === 'SUCCESS' && p.amount > 0)
    );
    const isFlPaid = Boolean(
      booking.payments?.some((p: any) => p.paymentType === 'FULL' && p.status === 'SUCCESS' && p.amount > 0)
    );
    const totalPaid = booking.payments?.filter((p: any) => p.status === 'SUCCESS').reduce((sum: number, p: any) => sum + p.amount, 0) || 0;
    const isPaid = isAdvPaid || isFlPaid || totalPaid > 0 || ['ACCEPTED', 'CONFIRMED', 'VERIFIED', 'IN_PROGRESS', 'WORK_STARTED', 'IN_SERVICE', 'DIAGNOSIS', 'REPAIRING', 'QUALITY_CHECK', 'JOB_COMPLETED', 'COMPLETED'].includes(booking.status) || (booking.paymentMode === 'CASH' && ['CUSTOMER_ACCEPTED', 'AWAITING_15_PERCENT_ADVANCE', 'ACCEPTED'].includes(booking.status));

    if (!isPaid && (booking.status === 'CUSTOMER_ACCEPTED' || booking.status === 'AWAITING_15_PERCENT_ADVANCE')) {
      const timer = setTimeout(() => {
        const payEl = document.getElementById('advance-payment-section');
        if (payEl) {
          payEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [booking?._id, booking?.status, booking?.hasPaidAdvance, booking?.isAdvancePaid, booking?.payments]);

  useEffect(() => {
    if (!socket || !id) return;

    const handleUpdate = (payload: any) => {
      refetchBooking();
      refetchQuotes();
    };

    socket.on("booking_updated", handleUpdate);
    socket.on("quote_received", handleUpdate);
    socket.on("booking_confirmed", handleUpdate);
    socket.on("booking_status_update", handleUpdate);

    const handleOffline = () => {
      setMessage({ type: "error", text: "📡 Internet disconnected. Please reconnect to complete payment." });
    };

    window.addEventListener("offline", handleOffline);

    return () => {
      socket.off("booking_updated", handleUpdate);
      socket.off("quote_received", handleUpdate);
      socket.off("booking_confirmed", handleUpdate);
      socket.off("booking_status_update", handleUpdate);
      window.removeEventListener("offline", handleOffline);
    };
  }, [socket, id]);

  const handleSelectQuoteWithOption = async (quoteParam: any, payAmount: number, paymentType: "ADVANCE" | "FULL" = "ADVANCE") => {
    const bidId = typeof quoteParam === 'string' ? quoteParam : (quoteParam?._id || quoteParam?.id);
    const quoteAmount = typeof quoteParam === 'object' ? quoteParam?.quotedAmount : 0;
    setIsAccepting(bidId);
    setMessage({ type: "", text: "" });
    try {
      await selectQuoteMutation.mutateAsync({ bookingId: id, bidId });
      const finalPayAmt = Math.round(Number(payAmount || quoteAmount || baseAmount));
      setMessage({ type: "success", text: `Quote selected successfully! Proceeding to pay ₹${finalPayAmt} to confirm booking.` });
      await handleInitiatePayment(finalPayAmt, paymentType);
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
      await cancelBookingMutation.mutateAsync({ id, reason: cancelReason });
      setMessage({ type: "success", text: "Booking cancelled successfully" });
      setShowCancel(false);
    } catch (err: any) {
      setMessage({ type: "error", text: err?.message || "Failed to cancel booking" });
    } finally {
      setIsCancelling(false);
    }
  };

  const handleExtensionResponse = async (extensionId: string, status: 'APPROVED' | 'REJECTED') => {
    setIsExtensionProcessing(true);
    try {
      await respondExtensionMutation.mutateAsync({ bookingId: id, extId: extensionId, status });
      setMessage({ type: "success", text: `Extension ${status.toLowerCase()} successfully.` });
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
      await applyCouponMutation.mutateAsync({ bookingId: id, couponCode: couponCode.trim() });
      setMessage({ type: "success", text: "Coupon applied successfully!" });
      setCouponCode("");
    } catch (err: any) {
      setMessage({ type: "error", text: err?.message || "Failed to apply coupon." });
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
    } catch (e: any) {
      // Local state is updated
    }
  };

  const handlePayAtWorkshop = async (payAmount: number, type: string = "ADVANCE") => {
    if (!booking) return;
    setIsExtensionProcessing(true);
    setMessage({ type: "", text: "" });
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
      setMessage({
        type: "success",
        text: type === "FINAL"
          ? "✓ Cash payment marked! Partner will confirm upon physical cash collection."
          : "✓ Pay at Workshop / Cash selected! Your booking is confirmed."
      });
      refetchBooking();
    } catch (err: any) {
      if (err?.message?.includes("already exists or is pending")) {
        setMessage({
          type: "success",
          text: "✓ Cash payment is already registered and waiting for partner verification."
        });
        refetchBooking();
      } else {
        setMessage({ type: "error", text: err?.message || "Failed to confirm Pay at Workshop." });
      }
    } finally {
      setIsExtensionProcessing(false);
    }
  };

  const handleInitiatePayment = async (amount: number, type: string = "ADVANCE") => {
    if (!booking) return;
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setMessage({ type: "error", text: "📡 Internet disconnected. Please reconnect to complete payment." });
      return;
    }
    setIsExtensionProcessing(true);
    setMessage({ type: "", text: "" });
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

      const isMock = !key || key === "mock_key" || (orderId && String(orderId).startsWith("mock_"));

      if (isMock || !isScriptLoaded) {
        setMessage({ type: "success", text: "Processing payment..." });
        setTimeout(async () => {
          try {
            await verifyPayment({
              paymentId: "pay_sim_" + Date.now(),
              orderId: orderId || "order_sim_" + Date.now(),
              signature: "dummy_signature",
            });
            setMessage({ type: "success", text: "Payment successful! Booking confirmed." });
            refetchBooking();
          } catch (verr: any) {
            setMessage({ type: "error", text: "Payment verification failed." });
          } finally {
            setIsExtensionProcessing(false);
          }
        }, 1000);
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
            setMessage({ type: "success", text: "Payment successful! Booking confirmed." });
            refetchBooking();
          } catch (err: any) {
            setMessage({ type: "error", text: "Payment verification failed." });
          } finally {
            setIsExtensionProcessing(false);
          }
        },
        prefill: {
          name: user?.fullName || (typeof booking.customerId === 'object' ? booking.customerId?.fullName : "") || "CarBlink Customer",
          email: user?.email || (typeof booking.customerId === 'object' ? booking.customerId?.email : "") || "",
          contact: user?.phone || (typeof booking.customerId === 'object' ? booking.customerId?.phone : "") || booking?.phone || "",
        },
        readonly: {
          contact: Boolean(user?.phone || (typeof booking.customerId === 'object' && booking.customerId?.phone) || booking?.phone),
          email: Boolean(user?.email || (typeof booking.customerId === 'object' && booking.customerId?.email)),
          name: Boolean(user?.fullName || (typeof booking.customerId === 'object' && booking.customerId?.fullName)),
        },
        config: {
          display: {
            blocks: {
              upi: {
                name: "Pay via UPI QR / Apps",
                instruments: [
                  {
                    method: "upi",
                    flows: ["qr", "intent", "collect"]
                  }
                ]
              },
              other: {
                name: "Other Payment Modes",
                instruments: [
                  { method: "card" },
                  { method: "netbanking" },
                  { method: "wallet" }
                ]
              }
            },
            sequence: ["block.upi", "block.other"],
            preferences: {
              show_default_blocks: true,
            },
          },
        },
        theme: {
          color: "#0a2540",
        },
        modal: {
          ondismiss: function () {
            setIsExtensionProcessing(false);
            setMessage({
              type: "error",
              text: "⚠️ Payment popup closed. If bank payment was declined or cancelled, you can retry payment below or select 'Pay at Workshop / COD'."
            });
          }
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on("payment.failed", function (response: any) {
        setMessage({ 
          type: "error", 
          text: `❌ Payment Declined (${response.error?.description || "Bank decline"}). Retry online or select Pay at Workshop.` 
        });
        setIsExtensionProcessing(false);
      });
      rzp.open();
    } catch (err: any) {
      setMessage({ type: "error", text: err?.message || "Failed to initiate payment." });
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
      await createReviewMutation.mutateAsync({ bookingId: id, rating: reviewRating, comment: reviewComment });
      setReviewMessage({ type: "success", text: "Thank you! Your review has been submitted." });
      setReviewSubmitted(true);
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
      case 'VERIFIED':
        return <Badge className="bg-emerald-500/20 text-emerald-700 hover:bg-emerald-500/30 border-none px-3 py-1 font-bold">✓ Booking Verified</Badge>;
      case 'WORK_STARTED':
      case 'IN_PROGRESS':
        return <Badge className="bg-yellow-500/20 text-yellow-700 hover:bg-yellow-500/30 border-none px-3 py-1 font-bold">Work Started</Badge>;
      case 'COMPLETED':
        return <Badge className="bg-success/20 text-success hover:bg-success/30 border-none px-3 py-1 font-bold">Completed</Badge>;
      case 'CANCELLED':
        return <Badge className="bg-danger/20 text-danger hover:bg-danger/30 border-none px-3 py-1 font-bold">Cancelled</Badge>;
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


  const isAdvancePaid = Boolean(
    booking?.hasPaidAdvance ||
    booking?.isAdvancePaid ||
    booking.payments?.some((p: any) => p.paymentType === 'ADVANCE' && p.status === 'SUCCESS' && p.amount > 0)
  );
  const isAdvancePending = Boolean(
    booking.payments?.some((p: any) => p.paymentType === 'ADVANCE' && p.status === 'PENDING') ||
    (booking?.paymentMode === 'CASH' && ['CUSTOMER_ACCEPTED', 'AWAITING_15_PERCENT_ADVANCE', 'ACCEPTED'].includes(booking?.status))
  );
  const isFinalPaid = Boolean(
    booking.payments?.some((p: any) => p.paymentType === 'FINAL' && p.status === 'SUCCESS' && p.amount > 0)
  );
  const isFinalPending = Boolean(
    booking.payments?.some((p: any) => p.paymentType === 'FINAL' && p.status === 'PENDING')
  );
  const isFullPaid = Boolean(
    booking.payments?.some((p: any) => p.paymentType === 'FULL' && p.status === 'SUCCESS' && p.amount > 0)
  );
  
  const totalPaidAmount = booking.payments?.filter((p: any) => p.status === 'SUCCESS').reduce((sum: number, p: any) => sum + p.amount, 0) || 0;
  
  // Advance is satisfied if customer has paid advance/full, or DB flags hasPaidAdvance, or booking is already confirmed/in-progress
  const hasPaidAdvance = Boolean(
    booking?.hasPaidAdvance ||
    booking?.isAdvancePaid ||
    isAdvancePaid ||
    isFullPaid ||
    totalPaidAmount > 0 ||
    ['ACCEPTED', 'CONFIRMED', 'VERIFIED', 'IN_PROGRESS', 'WORK_STARTED', 'IN_SERVICE', 'DIAGNOSIS', 'REPAIRING', 'QUALITY_CHECK', 'JOB_COMPLETED', 'COMPLETED'].includes(booking?.status) ||
    (booking?.paymentMode === 'CASH' && ['CUSTOMER_ACCEPTED', 'AWAITING_15_PERCENT_ADVANCE', 'ACCEPTED', 'CONFIRMED'].includes(booking?.status))
  );
  const isConfirmed = hasPaidAdvance || (booking?.status !== 'PENDING' && booking?.status !== 'QUOTED' && booking?.status !== 'CANCELLED');
  const hasPaidFinal = isFinalPaid || isFullPaid;

  const acceptedQuoteAmount = 
    booking.acceptedQuoteAmount ||
    (typeof booking.acceptedBidId === 'object' ? booking.acceptedBidId?.quotedAmount : 0) ||
    quotes.find((q: any) => 
      String(q._id) === String(booking.acceptedBidId?._id || booking.acceptedBidId) ||
      String(q.id) === String(booking.acceptedBidId?._id || booking.acceptedBidId) ||
      q.status === 'ACCEPTED' || q.status === 'CUSTOMER_ACCEPTED'
    )?.quotedAmount ||
    (quotes.length === 1 ? quotes[0]?.quotedAmount : 0) ||
    0;

  const baseAmount = booking.jobDetails?.finalAmount || booking.finalAmount || acceptedQuoteAmount || (booking.serviceId?.basePrice || 0);

  const approvedExtensions = booking.jobDetails?.jobExtensions?.filter((e: any) => e.status === 'APPROVED') || [];
  const approvedExtensionsCost = approvedExtensions.reduce((sum: number, ext: any) => sum + ext.cost, 0);

  const calculatedTotalAmount = baseAmount + approvedExtensionsCost;
  const couponDiscountAmount = booking.couponDiscountAmount || 0;
  const revisedTotalAmount = Math.max(0, calculatedTotalAmount - couponDiscountAmount);
  
  const remainingAmount = Math.max(0, revisedTotalAmount - totalPaidAmount);

  const rawAdv = Math.round(revisedTotalAmount * 0.15);
  const advanceAmount = revisedTotalAmount > 0 ? Math.min(revisedTotalAmount, Math.max(1, rawAdv)) : 0;
  const remainingForAdvance = Math.max(0, advanceAmount - totalPaidAmount);
  const needsAdvance = !hasPaidAdvance && remainingAmount > 0 && !['ACCEPTED', 'CONFIRMED', 'VERIFIED', 'IN_PROGRESS', 'WORK_STARTED', 'IN_SERVICE', 'DIAGNOSIS', 'REPAIRING', 'QUALITY_CHECK', 'JOB_COMPLETED', 'COMPLETED'].includes(booking.status);
  const needsFinal = booking.status === 'COMPLETED' && remainingAmount > 0;
  const effectivePaymentMode = selectedPaymentPreference || booking.paymentMode || "ONLINE";
  const isCashMode = effectivePaymentMode === "CASH";
  const isFinalPendingCash = booking.payments?.some((p: any) => 
    (p.paymentType === 'FINAL' || p.paymentType === 'FULL') && 
    p.status === 'PENDING' && 
    (p.provider === 'CASH' || p.providerOrderId?.startsWith('CASH_'))
  );

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
            <Button variant="outline" className="bg-transparent border-white/20 text-white hover:bg-white/10 hover:text-white rounded-xl backdrop-blur-sm" onClick={() => setShowCancel(true)}>
              {totalPaidAmount > 0 ? "Cancel & Request Refund" : "Cancel Booking"}
            </Button>
          )}
        </div>
      </div>

      {/* Action Required: Satisfaction Template Alert Banner */}
      {isSatisfactionPending && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-orange-500/20 to-amber-500/15 border-2 border-primary-orange/40 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-orange text-white flex items-center justify-center flex-shrink-0 shadow-sm">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-extrabold text-primary-navy text-sm sm:text-base">
                  Action Required: Service Satisfaction Feedback
                </h4>
                <span className="bg-primary-orange text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-full tracking-wide">
                  Pending
                </span>
              </div>
              <p className="text-xs text-neutral-dark/80 mt-0.5">
                Your service is completed! Please confirm if you are satisfied with the workshop service.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => {
              const el = document.getElementById("satisfaction-form-section");
              el?.scrollIntoView({ behavior: "smooth", block: "center" });
            }}
            className="w-full sm:w-auto bg-primary-orange hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow-sm px-4 py-2"
          >
            Fill Satisfaction Form ↓
          </Button>
        </div>
      )}

      {message.text && (
        <div className={`p-4 rounded-xl text-sm font-medium border shadow-sm ${message.type === "success"
          ? "bg-success/5 text-success-dark border-success/20"
          : "bg-danger/5 text-danger-dark border-danger/20"
          }`}>
          {message.text}
        </div>
      )}

      {/* Top Priority Action: 15% Advance Payment Banner & Action Card */}
      {needsAdvance && (
        <Card id="advance-payment-section" className="border-2 border-primary-orange shadow-xl rounded-3xl overflow-hidden bg-gradient-to-br from-orange-50/90 via-white to-amber-50/70 animate-in fade-in slide-in-from-top-4 duration-500 scroll-mt-24">
          <div className="bg-gradient-to-r from-primary-orange to-amber-600 px-6 py-3.5 text-white flex flex-wrap items-center justify-between gap-2 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-full bg-white/20 text-white animate-pulse">
                <Sparkles className="w-4 h-4" />
              </span>
              <span className="font-heading font-black text-sm uppercase tracking-wide">
                Action Required: Confirm Booking with Advance Payment
              </span>
            </div>
            <span className="bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full backdrop-blur-xs">
              Instant Workshop Details Unlock
            </span>
          </div>

          <CardContent className="p-6 sm:p-8 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-orange-200/60">
              <div className="space-y-1.5 max-w-xl">
                <h3 className="font-heading font-black text-xl sm:text-2xl text-slate-900 tracking-tight flex items-center gap-2">
                  <ShieldCheck className="w-6 h-6 text-primary-orange shrink-0" />
                  Confirm Advance Payment to Lock Your Service Slot
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                  Quote accepted! Complete advance payment via <strong className="text-slate-800">Online UPI/Card</strong> or <strong className="text-slate-800">Cash at Workshop</strong> to confirm your booking and immediately view partner workshop name, phone, &amp; Google Maps address.
                </p>
              </div>

              {/* Price Callout */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border-2 border-primary-orange/30 shadow-md min-w-[220px] text-center sm:text-right shrink-0">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">
                  ADVANCE PAYMENT PAYABLE
                </span>
                <p className="text-3xl font-black text-primary-orange font-heading mt-0.5">
                  ₹{(remainingForAdvance > 0 ? remainingForAdvance : Math.min(remainingAmount, advanceAmount || 1)).toLocaleString('en-IN')}
                </p>
                <p className="text-[11px] text-slate-500 font-semibold mt-1">
                  Total Quote: ₹{calculatedTotalAmount.toLocaleString('en-IN')}
                </p>
              </div>
            </div>

            {/* Main Pay Button */}
            <div className="space-y-4">
              <div className="pt-2 max-w-md">
                <Button 
                  className="w-full bg-primary-navy hover:bg-secondary-blue text-white rounded-2xl py-6 font-extrabold text-sm sm:text-base shadow-lg shadow-primary-navy/25 flex items-center justify-center transition-all hover:scale-[1.01]" 
                  onClick={() => handleInitiatePayment(remainingForAdvance > 0 ? remainingForAdvance : Math.min(remainingAmount, advanceAmount || 1), "ADVANCE")} 
                  isLoading={isExtensionProcessing}
                >
                  <IndianRupee className="w-5 h-5 mr-2 text-primary-orange" /> Pay Online Advance (₹{(remainingForAdvance > 0 ? remainingForAdvance : Math.min(remainingAmount, advanceAmount || 1)).toLocaleString('en-IN')})
                </Button>
              </div>

              <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 pt-2 border-t border-orange-100">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" /> 100% Refundable if cancelled before workshop visit
                </span>
                <button
                  type="button"
                  onClick={() => handleInitiatePayment(remainingAmount, "FULL")}
                  className="font-bold text-primary-navy hover:underline flex items-center gap-1"
                >
                  Want to pay full ₹{remainingAmount.toLocaleString('en-IN')} upfront? Click here <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {showCancel && (
        <Card className="border-danger/20 shadow-lg rounded-2xl overflow-hidden">
          <div className="h-1 bg-danger w-full"></div>
          <CardContent className="p-8">
            <h3 className="text-xl font-bold text-primary-navy mb-2">{totalPaidAmount > 0 ? "Cancel Booking & Request Refund" : "Cancel Booking Request"}</h3>
            <p className="text-sm text-neutral-muted mb-4">{totalPaidAmount > 0 ? `Are you sure you want to cancel? Since you have paid ₹${totalPaidAmount}, a refund request will be automatically initiated.` : "Are you sure you want to cancel this booking request?"}</p>
            
            <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-primary-navy font-medium flex items-center gap-2 mb-5">
              <ShieldCheck className="w-4 h-4 text-primary-orange flex-shrink-0" />
              <span>ℹ️ Refunds are credited to original payment source within 3-5 business days as per CarBlink Refund Policy.</span>
            </div>

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

      {/* Customer Verification Code PIN Card */}
      {booking.verificationCode && (
        <Card className="shadow-lg border-2 border-primary-orange/30 rounded-3xl overflow-hidden bg-gradient-to-r from-orange-50 via-white to-amber-50 relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary-orange/10 rounded-bl-full pointer-events-none"></div>
          <CardContent className="p-6 md:p-8 space-y-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-2 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start space-x-2">
                  <ShieldCheck className="w-6 h-6 text-primary-orange" />
                  <span className="text-xs font-bold text-primary-orange uppercase tracking-wider bg-primary-orange/10 px-3 py-1 rounded-full border border-primary-orange/20">
                    Mandatory Customer Verification
                  </span>
                </div>
                <h3 className="text-xl md:text-2xl font-extrabold text-slate-900">
                  Customer Workshop Visit & Handover PIN
                </h3>
                <p className="text-xs md:text-sm text-slate-600 max-w-lg font-medium">
                  When you visit the workshop, show this secret 4-digit PIN to the partner. Partner cannot start work on your car until you provide and verify this PIN.
                </p>
              </div>

              <div className="flex flex-col items-center justify-center bg-white p-5 rounded-2xl border-2 border-primary-orange/30 shadow-md min-w-[220px]">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">
                  4-DIGIT VERIFICATION CODE
                </span>
                <div className="text-4xl font-black font-mono tracking-[0.4em] text-primary-navy pl-2 my-1">
                  {booking.verificationCode}
                </div>
                {booking.isVerifiedByPartner ? (
                  <span className="inline-flex items-center gap-1 mt-2 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Verified by Partner
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 mt-2 text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                    <Clock className="w-3.5 h-3.5" /> Share Upon Workshop Arrival
                  </span>
                )}
              </div>
            </div>

            {/* 3-Step Handover Guide */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-orange-200/60">
              <div className="bg-white/80 p-3.5 rounded-2xl border border-orange-100 flex items-start space-x-3">
                <span className="w-6 h-6 rounded-full bg-primary-orange text-white text-xs font-bold flex items-center justify-center flex-shrink-0">1</span>
                <div>
                  <h5 className="text-xs font-bold text-slate-900">Visit Workshop</h5>
                  <p className="text-[11px] text-slate-500 font-medium">Bring your vehicle to the designated partner workshop.</p>
                </div>
              </div>
              <div className="bg-white/80 p-3.5 rounded-2xl border border-orange-100 flex items-start space-x-3">
                <span className="w-6 h-6 rounded-full bg-primary-orange text-white text-xs font-bold flex items-center justify-center flex-shrink-0">2</span>
                <div>
                  <h5 className="text-xs font-bold text-slate-900">Give Verification PIN</h5>
                  <p className="text-[11px] text-slate-500 font-medium">Show this 4-digit code ({booking.verificationCode}) to the workshop manager.</p>
                </div>
              </div>
              <div className="bg-white/80 p-3.5 rounded-2xl border border-orange-100 flex items-start space-x-3">
                <span className="w-6 h-6 rounded-full bg-primary-orange text-white text-xs font-bold flex items-center justify-center flex-shrink-0">3</span>
                <div>
                  <h5 className="text-xs font-bold text-slate-900">Work Authorization</h5>
                  <p className="text-[11px] text-slate-500 font-medium">Partner verifies PIN to authorize & start service work.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Interactive 5-Stage Service Workflow Progress Tracker */}
      <Card className="shadow-lg border-secondary-blue/20 rounded-3xl overflow-hidden bg-gradient-to-br from-slate-900 via-primary-navy to-slate-900 text-white relative">
        <div className="absolute top-0 right-0 w-80 h-80 bg-secondary-blue/10 rounded-full blur-3xl pointer-events-none"></div>
        <CardContent className="p-6 md:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-white/10">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-primary-orange/20 text-primary-orange border border-primary-orange/30 mb-2">
                <span className="w-2 h-2 rounded-full bg-primary-orange animate-ping" /> LIVE SERVICE STATUS
              </span>
              <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">Active Vehicle Service Tracker</h2>
              <p className="text-sm text-slate-300 mt-1">Real-time status updates from assigned executive & workshop partner</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/10 text-right">
              <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">CURRENT STAGE</span>
              <span className="text-base font-bold text-primary-orange">{booking.status ? booking.status.replace(/_/g, ' ') : 'PENDING'}</span>
            </div>
          </div>

          {/* 8-Stage Workflow Progress Stepper */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 relative z-10">
            {(() => {
              const s = (booking.status || "PENDING").toUpperCase();
              const isPaid = hasPaidAdvance || totalPaidAmount > 0;
              const isFullPaid = remainingAmount === 0 && totalPaidAmount > 0;

              const stages = [
                {
                  stage: 1,
                  title: "1. Booking Requested",
                  sub: "Request submitted & under review",
                  isPassed: true,
                  isActive: s === "PENDING",
                },
                {
                  stage: 2,
                  title: "2. Partner Assigned",
                  sub: "Verified workshop assigned",
                  isPassed: ["ASSIGNED", "PARTNER_ASSIGNED", "QUOTED", "CUSTOMER_ACCEPTED", "AWAITING_15_PERCENT_ADVANCE", "CONFIRMED", "VERIFIED", "INSPECTION", "DIAGNOSIS", "WORK_STARTED", "IN_PROGRESS", "REPAIRING", "QUALITY_CHECK", "COMPLETED"].includes(s) || !!booking.assignedPartnerId,
                  isActive: s === "ASSIGNED" || s === "PARTNER_ASSIGNED",
                },
                {
                  stage: 3,
                  title: "3. Quote / Payment Pending",
                  sub: "Quote review & advance payment",
                  isPassed: ["ACCEPTED", "CONFIRMED", "VERIFIED", "INSPECTION", "DIAGNOSIS", "WORK_STARTED", "IN_PROGRESS", "REPAIRING", "QUALITY_CHECK", "COMPLETED"].includes(s) || isPaid,
                  isActive: ["QUOTED", "CUSTOMER_ACCEPTED", "AWAITING_15_PERCENT_ADVANCE"].includes(s) || (!isPaid && ["ASSIGNED", "CONFIRMED"].includes(s)),
                },
                {
                  stage: 4,
                  title: "4. Booking Verified",
                  sub: "Schedule & booking confirmed",
                  isPassed: ["INSPECTION", "DIAGNOSIS", "WORK_STARTED", "IN_PROGRESS", "REPAIRING", "QUALITY_CHECK", "COMPLETED"].includes(s),
                  isActive: ["CONFIRMED", "VERIFIED"].includes(s),
                },
                {
                  stage: 5,
                  title: "5. Work Started",
                  sub: "Vehicle inspection & diagnosis",
                  isPassed: ["WORK_STARTED", "IN_PROGRESS", "REPAIRING", "QUALITY_CHECK", "COMPLETED"].includes(s),
                  isActive: ["INSPECTION", "DIAGNOSIS", "WORK_STARTED"].includes(s),
                },
                {
                  stage: 6,
                  title: "6. Work in Progress",
                  sub: "Active repairs & quality check",
                  isPassed: ["REPAIRING", "QUALITY_CHECK", "COMPLETED"].includes(s),
                  isActive: ["IN_PROGRESS", "REPAIRING", "QUALITY_CHECK"].includes(s),
                },
                {
                  stage: 7,
                  title: "7. Service Completed",
                  sub: "Vehicle ready for delivery",
                  isPassed: s === "COMPLETED",
                  isActive: s === "COMPLETED" && !isFullPaid,
                },
                {
                  stage: 8,
                  title: "8. Payment / Closure",
                  sub: "Final payment & booking closed",
                  isPassed: s === "COMPLETED" && isFullPaid,
                  isActive: s === "COMPLETED" && isFullPaid,
                }
              ];

              return stages.map((st) => (
                <div
                  key={st.stage}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    st.isActive
                      ? "bg-gradient-to-br from-primary-orange/30 to-primary-orange/10 border-primary-orange shadow-lg shadow-primary-orange/20 ring-2 ring-primary-orange/40"
                      : st.isPassed
                      ? "bg-white/10 border-emerald-500/40 text-emerald-300"
                      : "bg-white/5 border-white/10 text-slate-500 opacity-60"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                      st.isActive
                        ? "bg-primary-orange text-white shadow-md animate-pulse"
                        : st.isPassed
                        ? "bg-emerald-500 text-white"
                        : "bg-white/10 text-slate-400"
                    }`}>
                      {st.isPassed ? "✓" : st.stage}
                    </span>
                    {st.isActive && (
                      <span className="text-[9px] font-extrabold uppercase tracking-widest text-primary-orange bg-primary-orange/20 px-2 py-0.5 rounded-full">
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <h4 className="font-bold text-xs text-white mb-0.5">{st.title}</h4>
                  <p className="text-[10px] text-slate-300 font-medium leading-tight">{st.sub}</p>
                </div>
              ));
            })()}
          </div>
        </CardContent>
      </Card>

      {/* Complete Vehicle Details Card */}
      {booking.vehicleId && typeof booking.vehicleId === 'object' && (
        <Card className="shadow-sm border-neutral-muted/10 rounded-3xl overflow-hidden bg-white">
          <CardHeader className="bg-slate-50 border-b border-gray-100 pb-4">
            <CardTitle className="text-lg font-bold text-gray-900 flex items-center">
              <Car className="w-5 h-5 mr-2.5 text-secondary-blue" />
              Registered Vehicle Information
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-slate-50 p-4 rounded-2xl border border-gray-100">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">BRAND & MODEL</span>
                <span className="text-base font-extrabold text-gray-900">{booking.vehicleId?.brand} {booking.vehicleId?.model}</span>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-gray-100">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">REGISTRATION NO.</span>
                <span className="text-base font-extrabold text-primary-navy font-mono">{booking.vehicleId?.registrationNumber || 'N/A'}</span>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-gray-100">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">FUEL TYPE</span>
                <span className="text-base font-bold text-gray-800">{booking.vehicleId?.fuelType || 'Petrol/Diesel'}</span>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-gray-100">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">TRANSMISSION</span>
                <span className="text-base font-bold text-gray-800">{booking.vehicleId?.transmission || 'Manual'}</span>
              </div>
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

          {/* Official Service Satisfaction Form & Status */}
          <div id="satisfaction-form-section" className="scroll-mt-6">
            {isSatisfactionPending ? (
              <Card className="shadow-lg border-2 border-primary-orange/40 rounded-3xl overflow-hidden bg-gradient-to-b from-orange-50/50 via-white to-amber-50/30">
                <div className="h-2 bg-gradient-to-r from-primary-orange via-amber-500 to-orange-400 w-full" />
                <CardContent className="p-6 sm:p-8 space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-orange-100 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-primary-orange/10 rounded-2xl flex items-center justify-center text-primary-orange shadow-sm border border-primary-orange/20">
                        <HeartHandshake className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-xl sm:text-2xl font-extrabold text-primary-navy font-heading">
                            Service Satisfaction Form
                          </h3>
                          <Badge className="bg-primary-orange text-white text-[10px] font-bold uppercase tracking-wider">
                            Action Required
                          </Badge>
                        </div>
                        <p className="text-xs sm:text-sm text-neutral-muted">
                          Are you satisfied with the service provided for your vehicle?
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Choice Buttons */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => setSatisfactionChoice(true)}
                      className={`p-4 rounded-2xl border-2 text-sm font-bold transition-all flex items-center justify-center gap-2.5 shadow-sm ${
                        satisfactionChoice === true
                          ? "bg-emerald-600 text-white border-emerald-600 shadow-md ring-4 ring-emerald-500/20"
                          : "bg-white text-emerald-800 border-emerald-300 hover:bg-emerald-50 hover:border-emerald-400"
                      }`}
                    >
                      <ThumbsUp className={`w-5 h-5 ${satisfactionChoice === true ? "text-white" : "text-emerald-600"}`} />
                      <span>Yes, I am Fully Satisfied</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSatisfactionChoice(false)}
                      className={`p-4 rounded-2xl border-2 text-sm font-bold transition-all flex items-center justify-center gap-2.5 shadow-sm ${
                        satisfactionChoice === false
                          ? "bg-red-600 text-white border-red-600 shadow-md ring-4 ring-red-500/20"
                          : "bg-white text-red-800 border-red-300 hover:bg-red-50 hover:border-red-400"
                      }`}
                    >
                      <ThumbsDown className={`w-5 h-5 ${satisfactionChoice === false ? "text-white" : "text-red-600"}`} />
                      <span>No, I have Issues / Complaints</span>
                    </button>
                  </div>

                  {/* Rating & Feedback Form once choice is selected */}
                  {satisfactionChoice !== null && (
                    <div className="space-y-4 pt-3 border-t border-orange-200/60 animate-in fade-in duration-200">
                      <div>
                        <label className="block text-xs font-bold text-gray-800 mb-1.5">
                          How would you rate the service quality? ({satisfactionRating} of 5 Stars)
                        </label>
                        <div className="flex items-center space-x-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setSatisfactionRating(star)}
                              className="p-1.5 hover:scale-125 transition-transform"
                            >
                              <Star
                                className={`w-7 h-7 ${
                                  star <= satisfactionRating
                                    ? "text-amber-500 fill-amber-500"
                                    : "text-gray-300"
                                }`}
                              />
                            </button>
                          ))}
                          <span className="text-xs font-semibold text-neutral-dark ml-2">
                            {satisfactionRating === 5
                              ? "Excellent ⭐⭐⭐⭐⭐"
                              : satisfactionRating === 4
                              ? "Very Good ⭐⭐⭐⭐"
                              : satisfactionRating === 3
                              ? "Average ⭐⭐⭐"
                              : satisfactionRating === 2
                              ? "Poor ⭐⭐"
                              : "Terrible ⭐"}
                          </span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-800 mb-1.5">
                          {satisfactionChoice
                            ? "Comments or Praise (Optional)"
                            : "Please describe the issues or dissatisfaction in detail *"}
                        </label>
                        <textarea
                          value={satisfactionFeedback}
                          onChange={(e) => setSatisfactionFeedback(e.target.value)}
                          placeholder={
                            satisfactionChoice
                              ? "Tell us what you liked about the service..."
                              : "Please explain what went wrong so our executive team can resolve it immediately..."
                          }
                          rows={3}
                          className="w-full p-3.5 border border-gray-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-orange focus:border-primary-orange"
                        />
                      </div>

                      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                        <p className="text-xs text-neutral-muted">
                          ℹ️ Submitting this form directly records your feedback with CarBlink Operations.
                        </p>
                        <Button
                          onClick={handleSubmitSatisfaction}
                          isLoading={isSubmittingSatisfaction}
                          className="w-full sm:w-auto bg-primary-orange hover:bg-orange-600 text-white font-bold text-sm px-6 py-2.5 rounded-xl shadow-md"
                        >
                          Submit Satisfaction Response
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : isSatisfactionResponded ? (
              <Card className={`shadow-sm rounded-3xl overflow-hidden border-2 ${
                (booking?.satisfactionStatus === 'SATISFIED' || (satisfactionSubmittedLocally && satisfactionChoice === true))
                  ? "bg-gradient-to-b from-white to-emerald-50/50 border-emerald-300"
                  : "bg-gradient-to-b from-white to-red-50/50 border-red-300"
              }`}>
                <div className={`h-2 w-full ${
                  (booking?.satisfactionStatus === 'SATISFIED' || (satisfactionSubmittedLocally && satisfactionChoice === true))
                    ? "bg-emerald-500"
                    : "bg-red-500"
                }`} />
                <CardContent className="p-6 sm:p-8 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${
                        (booking?.satisfactionStatus === 'SATISFIED' || (satisfactionSubmittedLocally && satisfactionChoice === true))
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-red-100 text-red-700"
                      }`}>
                        {(booking?.satisfactionStatus === 'SATISFIED' || (satisfactionSubmittedLocally && satisfactionChoice === true)) ? (
                          <ThumbsUp className="w-6 h-6" />
                        ) : (
                          <ThumbsDown className="w-6 h-6" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-xl font-extrabold text-primary-navy font-heading">
                            {(booking?.satisfactionStatus === 'SATISFIED' || (satisfactionSubmittedLocally && satisfactionChoice === true))
                              ? "Service Satisfaction: Confirmed Satisfied ✓"
                              : "Service Satisfaction: Issues Reported ⚠️"}
                          </h3>
                        </div>
                        <p className="text-xs sm:text-sm text-neutral-muted">
                          {(booking?.satisfactionStatus === 'SATISFIED' || (satisfactionSubmittedLocally && satisfactionChoice === true))
                            ? "You confirmed that you were fully satisfied with this service."
                            : "You reported issues with this service. Our operations team is reviewing it."}
                        </p>
                      </div>
                    </div>

                    {(booking?.satisfactionRating || (satisfactionSubmittedLocally && satisfactionRating)) && (
                      <div className="flex items-center gap-1.5 bg-white px-3.5 py-1.5 rounded-xl border border-gray-200 shadow-sm self-start sm:self-auto">
                        <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                        <span className="text-sm font-black text-gray-900">
                          {booking?.satisfactionRating || satisfactionRating} / 5 Stars
                        </span>
                      </div>
                    )}
                  </div>

                  {(booking?.satisfactionFeedback || (satisfactionSubmittedLocally && satisfactionFeedback)) && (
                    <div className="p-3.5 bg-white/80 rounded-xl border border-gray-200/80 text-xs sm:text-sm text-gray-700 italic">
                      &quot;{booking?.satisfactionFeedback || satisfactionFeedback}&quot;
                    </div>
                  )}

                  {booking?.satisfactionRespondedAt && !isNaN(new Date(booking.satisfactionRespondedAt).getTime()) && (
                    <p className="text-[11px] text-gray-400">
                      Recorded on {format(new Date(booking.satisfactionRespondedAt), "PPP 'at' p")}
                    </p>
                  )}
                </CardContent>
              </Card>
            ) : null}
          </div>

          {/* Review Section */}
          {booking.status === 'COMPLETED' && (
            (reviewSubmitted || booking.review || !canReview) ? (
              <Card className="shadow-sm border-success/30 rounded-3xl overflow-hidden bg-gradient-to-b from-white to-success/5">
                <div className="h-1.5 bg-success w-full"></div>
                <CardContent className="p-8 text-center space-y-3">
                  <div className="w-14 h-14 bg-success/10 text-success shadow-sm rounded-full flex items-center justify-center mx-auto border border-success/20">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-bold text-primary-navy font-heading">✔ Review Submitted - Thank You!</h3>
                  <p className="text-neutral-muted text-sm max-w-md mx-auto">
                    Your valuable feedback helps us maintain top service quality standards.
                  </p>
                </CardContent>
              </Card>
            ) : canReview ? (
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
            ) : null
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
                {booking.jobDetails?.beforePhotos && booking.jobDetails.beforePhotos.length > 0 && (
                  <div>
                    <h5 className="text-sm font-bold text-neutral-dark uppercase tracking-wider mb-4 flex items-center">
                      <span className="w-2.5 h-2.5 rounded-full bg-warning mr-3"></span> Before Service
                    </h5>
                    <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
                      {booking.jobDetails?.beforePhotos?.map((url: string, index: number) => (
                        <a href={url} target="_blank" rel="noopener noreferrer" key={index} className="relative flex-shrink-0 w-40 h-40 rounded-2xl overflow-hidden border-4 border-white shadow-md hover:shadow-lg hover:scale-[1.02] transition-all group">
                          <img src={url} alt={`Before ${index + 1}`} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-sm font-medium">View Full</div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {booking.jobDetails?.afterPhotos && booking.jobDetails.afterPhotos.length > 0 && (
                  <div>
                    <h5 className="text-sm font-bold text-neutral-dark uppercase tracking-wider mb-4 flex items-center">
                      <span className="w-2.5 h-2.5 rounded-full bg-success mr-3"></span> After Service
                    </h5>
                    <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
                      {booking.jobDetails?.afterPhotos?.map((url: string, index: number) => (
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
          {booking.jobDetails?.jobExtensions && booking.jobDetails.jobExtensions.length > 0 && (
            <Card className="shadow-sm border-neutral-muted/10 rounded-3xl overflow-hidden">
              <CardHeader className="bg-primary-navy/5 border-b border-neutral-muted/10 pb-4">
                <CardTitle className="text-lg font-bold text-primary-navy flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-secondary-blue" />
                  Additional Parts / Services
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <div className="space-y-4">
                  {booking.jobDetails?.jobExtensions?.map((ext: any, idx: number) => (
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
                {quotes.map((quote: any) => {
                  const quoteId = quote._id || quote.id;
                  const quoteTotal = Math.round(Number(quote.quotedAmount || 0));
                  const quotePartial = Math.round(quoteTotal * 0.15);
                  const quoteRemaining = Math.max(0, quoteTotal - quotePartial);
                  const isUnlocked = hasPaidAdvance;

                  return (
                    <Card key={quoteId} className="border-secondary-blue/20 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group overflow-hidden rounded-3xl relative">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-secondary-blue/5 rounded-bl-full -z-10 transition-transform group-hover:scale-150"></div>
                      <div className="bg-gradient-to-r from-secondary-blue/10 to-transparent p-6 border-b border-secondary-blue/10">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-extrabold text-primary-navy text-lg">
                              {isUnlocked
                                ? (quote.partnerId?.businessName || "Verified Service Partner") 
                                : "Verified CarBlink Workshop"}
                            </h4>
                            <div className="flex items-center text-xs font-semibold text-success mt-1">
                              <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> 
                              {isUnlocked
                                ? "Verified Partner Details Unlocked"
                                : "Verified Partner (Shop Name, Address & Contact Unlocked Upon Payment)"}
                            </div>
                          </div>
                          <div className="text-right bg-white px-3 py-1 rounded-xl shadow-sm border border-neutral-muted/10">
                            <span className="text-2xl font-extrabold text-primary-orange tracking-tight">₹{quoteTotal}</span>
                          </div>
                        </div>
                      </div>
                      <CardContent className="p-6 space-y-4">
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

                        <div className="p-3.5 bg-blue-50/90 rounded-2xl border border-blue-200 text-xs space-y-1 text-primary-navy">
                          <div className="flex justify-between items-center font-bold">
                            <span>Advance / Partial Amount:</span>
                            <span className="font-extrabold text-primary-orange text-sm">₹{quotePartial}</span>
                          </div>
                          <p className="text-[11px] text-slate-600">
                            Remaining balance ₹{quoteRemaining} payable at workshop after service completion.
                          </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                          <Button
                            className="w-full bg-primary-navy hover:bg-slate-900 text-white rounded-xl py-5 font-bold shadow-md transition-all text-xs"
                            onClick={() => handleSelectQuoteWithOption(quote, quotePartial, "ADVANCE")}
                            isLoading={isAccepting === quoteId}
                            disabled={isAccepting !== null && isAccepting !== quoteId}
                          >
                            Pay Partial Amount (₹{quotePartial})
                          </Button>

                          <Button
                            className="w-full bg-primary-orange hover:bg-orange-600 text-white rounded-xl py-5 font-bold shadow-md transition-all text-xs"
                            onClick={() => handleSelectQuoteWithOption(quote, quoteTotal, "FULL")}
                            isLoading={isAccepting === quoteId}
                            disabled={isAccepting !== null && isAccepting !== quoteId}
                          >
                            Pay Full Amount (₹{quoteTotal})
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
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
          {booking.assignedPartnerId && typeof booking.assignedPartnerId === 'object' && (
            hasPaidAdvance ? (
              <Card className="shadow-lg border-success/30 overflow-hidden rounded-3xl relative bg-gradient-to-br from-white to-success/5">
                <div className="absolute top-0 right-0 w-32 h-32 bg-success/10 rounded-bl-full -z-10"></div>
                <div className="bg-success/10 px-6 py-4 border-b border-success/20 flex justify-between items-center">
                  <h3 className="font-extrabold text-success-dark flex items-center text-lg">
                    <CheckCircle2 className="w-5 h-5 mr-2" /> Unlocked Partner Details
                  </h3>
                  <span className="text-xs bg-success/20 text-success-dark px-3 py-1 rounded-full font-bold">Payment Confirmed</span>
                </div>
                <CardContent className="p-6">
                  <div className="mb-6 text-center pt-2">
                    <div className="w-20 h-20 bg-white rounded-full mx-auto mb-3 border-4 border-success/20 flex items-center justify-center shadow-md">
                      <Car className="w-8 h-8 text-success" />
                    </div>
                    <p className="font-extrabold text-primary-navy text-2xl">{booking.assignedPartnerId?.businessName || "Verified Service Partner"}</p>
                    <p className="text-sm text-neutral-muted font-medium mt-1">CarBlink Certified Partner</p>
                  </div>

                  <div className="space-y-3">
                    {(booking.assignedPartnerId?.phone || booking.assignedPartnerId?.userId?.phone) && (
                      <a href={`tel:${booking.assignedPartnerId?.phone || booking.assignedPartnerId?.userId?.phone}`} className="flex items-center text-sm font-semibold text-primary-navy bg-white p-3.5 rounded-xl border border-neutral-muted/10 shadow-sm hover:border-secondary-blue/40 transition-all">
                        <Phone className="w-4 h-4 mr-3 text-secondary-blue" />
                        <span>Phone: <span className="font-bold text-base">{booking.assignedPartnerId?.phone || booking.assignedPartnerId?.userId?.phone}</span></span>
                      </a>
                    )}
                    {booking.assignedPartnerId?.businessAddress && (
                      (() => {
                        const coords = booking.assignedPartnerId?.location?.coordinates;
                        const mapsUrl = (coords && Array.isArray(coords) && coords.length === 2 && (coords[0] !== 0 || coords[1] !== 0))
                          ? `https://www.google.com/maps?q=${coords[1]},${coords[0]}`
                          : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${booking.assignedPartnerId?.businessName || ''} ${booking.assignedPartnerId?.businessAddress}`.trim())}`;

                        return (
                          <a
                            href={mapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Click to open exact workshop location on Google Maps"
                            className="flex items-start text-sm font-medium text-neutral-dark bg-white p-3.5 rounded-xl border border-neutral-muted/10 shadow-sm hover:border-primary-orange/50 hover:shadow-md transition-all group"
                          >
                            <MapPin className="w-4 h-4 mr-3 text-primary-orange flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-neutral-muted font-semibold">Workshop Address (Google Maps):</span>
                                <ExternalLink className="w-3.5 h-3.5 text-primary-orange opacity-70 group-hover:opacity-100" />
                              </div>
                              <span className="font-bold text-primary-navy text-sm underline decoration-primary-orange/40 group-hover:decoration-primary-orange">
                                {booking.assignedPartnerId?.businessAddress}
                              </span>
                              <span className="text-[10px] text-emerald-600 block mt-0.5 font-semibold">
                                ✓ Verified Location • Click to open Google Maps
                              </span>
                            </div>
                          </a>
                        );
                      })()
                    )}
                    {(booking.assignedPartnerId?.email || booking.assignedPartnerId?.userId?.email) && (
                      <div className="flex items-center text-sm font-medium text-neutral-dark bg-white p-3.5 rounded-xl border border-neutral-muted/10 shadow-sm">
                        <Mail className="w-4 h-4 mr-3 text-secondary-blue" />
                        <span>{booking.assignedPartnerId?.email || booking.assignedPartnerId?.userId?.email}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="shadow-md border-amber-200 bg-amber-50/50 overflow-hidden rounded-3xl relative">
                <div className="bg-amber-100/80 px-6 py-4 border-b border-amber-200 flex justify-between items-center">
                  <h3 className="font-extrabold text-amber-950 flex items-center text-sm sm:text-base">
                    🔒 Partner Details Locked
                  </h3>
                  <span className="text-[10px] sm:text-xs bg-amber-200 text-amber-900 px-2.5 py-0.5 rounded-full font-bold">
                    Payment Required
                  </span>
                </div>
                <CardContent className="p-6 text-center space-y-3">
                  <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mx-auto text-amber-700">
                    <ShieldCheck className="w-7 h-7" />
                  </div>
                  <h4 className="font-bold text-slate-900 text-base">Workshop Contact & Location Locked</h4>
                  <p className="text-slate-600 text-xs sm:text-sm max-w-sm mx-auto leading-relaxed">
                    Partner workshop name, phone number, and exact address will unlock automatically as soon as you complete advance/partial or full payment.
                  </p>
                </CardContent>
              </Card>
            )
          )}

          {/* Billing & Payments Section */}
          {(booking.status !== 'PENDING' && booking.status !== 'QUOTED' && booking.status !== 'CANCELLED') && (
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

                {booking.jobDetails?.invoiceUrl && (
                  <div className="mb-6 pt-4 border-t border-neutral-muted/10">
                    <a
                      href={booking.jobDetails.invoiceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between bg-primary-navy/5 hover:bg-primary-navy/10 p-4 rounded-xl border border-primary-navy/20 transition-colors group"
                    >
                      <div className="flex items-center">
                        <FileText className="w-6 h-6 text-primary-navy mr-3" />
                        <div>
                          <p className="font-bold text-primary-navy text-sm">Service Invoice</p>
                          <p className="text-xs text-neutral-muted">Generated by Partner</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="text-primary-navy font-semibold group-hover:bg-white/50">
                        View
                      </Button>
                    </a>
                  </div>
                )}

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
                    <div className="flex items-center space-x-2 py-2 border-b border-gray-100 mb-2">
                      <input 
                        type="checkbox" 
                        id="useRewardPoints" 
                        className="w-4 h-4 text-primary-navy cursor-pointer"
                        checked={useRewardPoints}
                        onChange={(e) => setUseRewardPoints(e.target.checked)}
                      />
                      <label htmlFor="useRewardPoints" className="text-xs font-medium text-gray-700 cursor-pointer">
                        Use my Reward Points for discount
                      </label>
                    </div>
                  )}

                  {/* Clear Payment Stage & Customer Preference Notice */}
                  {remainingAmount > 0 && (
                    <div className="space-y-3 mb-4">
                      <div className="p-3 rounded-xl border text-xs font-semibold flex items-center justify-between bg-blue-50/60 border-blue-200 text-primary-navy">
                        <span className="flex items-center gap-1.5">
                          <ShieldCheck className="w-4 h-4 text-primary-orange flex-shrink-0" />
                          {booking.status === 'COMPLETED' 
                            ? (effectivePaymentMode === 'CASH'
                                ? "Job Completed — Pay Cash to Partner at Handover"
                                : "Job Completed — Pay Final Remaining Settlement Online")
                            : hasPaidAdvance 
                              ? "Advance Paid — Balance due after service completion"
                              : "Advance Token required to confirm pickup & start service"}
                        </span>
                      </div>

                      {/* Customer Selected Payment Mode Preference */}
                      <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-800">Payment Method Preference:</span>
                          <span className="text-[10px] font-semibold text-slate-500">
                            {effectivePaymentMode === 'CASH' ? "Handover physical cash" : "Razorpay / UPI / Card"}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => handleTogglePaymentMode("CASH")}
                            className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                              effectivePaymentMode === "CASH"
                                ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                            }`}
                          >
                            💵 Cash to Partner
                          </button>
                          <button
                            type="button"
                            onClick={() => handleTogglePaymentMode("ONLINE")}
                            className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                              effectivePaymentMode === "ONLINE"
                                ? "bg-primary-navy text-white border-primary-navy shadow-sm"
                                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                            }`}
                          >
                            💳 Pay Online
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* If Advance is needed (Before Completion and Not Paid Yet) */}
                  {(!hasPaidAdvance && remainingAmount > 0 && booking.status !== 'COMPLETED') && (
                    <div className="space-y-3">
                      {effectivePaymentMode === 'CASH' ? (
                        <>
                          {/* Featured Primary for Cash Preference */}
                          <Button 
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-6 font-extrabold text-sm shadow-md" 
                            onClick={() => handlePayAtWorkshop(remainingForAdvance > 0 ? remainingForAdvance : Math.min(remainingAmount, advanceAmount || 1), "ADVANCE")} 
                            isLoading={isExtensionProcessing}
                          >
                            <CheckCircle2 className="w-4 h-4 mr-2 text-white" /> Confirm Pay at Workshop / Cash (₹{(remainingForAdvance > 0 ? remainingForAdvance : Math.min(remainingAmount, advanceAmount || 1)).toLocaleString('en-IN')})
                          </Button>
                          <Button 
                            variant="outline"
                            className="w-full border-primary-navy/20 hover:bg-primary-navy/5 text-primary-navy rounded-xl py-5 font-semibold text-xs" 
                            onClick={() => handleInitiatePayment(remainingForAdvance > 0 ? remainingForAdvance : Math.min(remainingAmount, advanceAmount || 1), "ADVANCE")} 
                            isLoading={isExtensionProcessing}
                          >
                            <IndianRupee className="w-4 h-4 mr-1.5" /> Pay Online (Razorpay / UPI)
                          </Button>
                        </>
                      ) : (
                        <>
                          {/* Featured Primary for Online Preference */}
                          <Button 
                            className="w-full bg-primary-navy hover:bg-secondary-blue text-white rounded-xl py-6 font-bold flex items-center justify-center shadow-md transition-all text-sm" 
                            onClick={() => handleInitiatePayment(remainingForAdvance > 0 ? remainingForAdvance : Math.min(remainingAmount, advanceAmount || 1), "ADVANCE")} 
                            isLoading={isExtensionProcessing}
                          >
                            <IndianRupee className="w-4 h-4 mr-1.5" /> Pay Online Partial Amount (₹{(remainingForAdvance > 0 ? remainingForAdvance : Math.min(remainingAmount, advanceAmount || 1)).toLocaleString('en-IN')})
                          </Button>
                          <Button 
                            variant="outline"
                            className="w-full border-emerald-300 bg-emerald-50/50 hover:bg-emerald-100 text-emerald-800 rounded-xl py-5 font-bold text-xs shadow-2xs" 
                            onClick={() => handlePayAtWorkshop(remainingForAdvance > 0 ? remainingForAdvance : Math.min(remainingAmount, advanceAmount || 1), "ADVANCE")} 
                            isLoading={isExtensionProcessing}
                          >
                            <CheckCircle2 className="w-4 h-4 mr-1.5 text-emerald-600" /> Pay at Workshop / Cash (Skip Online Payment)
                          </Button>
                        </>
                      )}

                      <Button 
                        variant="ghost"
                        className="w-full text-slate-500 hover:bg-slate-100 rounded-xl py-3 font-semibold text-xs" 
                        onClick={() => handleInitiatePayment(remainingAmount, "FULL")} 
                        isLoading={isExtensionProcessing}
                      >
                        Pay Full Amount Online (₹{remainingAmount.toLocaleString('en-IN')})
                      </Button>
                    </div>
                  )}

                  {/* If Advance ALREADY paid and service still in progress */}
                  {(hasPaidAdvance && remainingAmount > 0 && booking.status !== 'COMPLETED') && (
                    <div className="space-y-3">
                      <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800 font-medium flex items-center gap-2">
                        <Clock className="w-4 h-4 flex-shrink-0 text-amber-600" />
                        <span>Advance payment received. Remaining ₹{remainingAmount.toLocaleString('en-IN')} is payable after service completion.</span>
                      </div>
                      <Button 
                        variant="outline"
                        className="w-full border-primary-navy/20 hover:bg-primary-navy/5 text-primary-navy rounded-xl py-5 font-semibold text-xs" 
                        onClick={() => handleInitiatePayment(remainingAmount, "FULL")} 
                        isLoading={isExtensionProcessing}
                      >
                        Pay Remaining Balance Now (₹{remainingAmount.toLocaleString('en-IN')})
                      </Button>
                    </div>
                  )}

                  {/* If Job is COMPLETED and Final Bill is pending */}
                  {needsFinal && (
                    <div className="space-y-3">
                      {isCashMode ? (
                        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl space-y-3">
                          <div className="flex items-start gap-2.5">
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="font-extrabold text-sm text-emerald-900">
                                💵 Cash Payment directly to Partner
                              </p>
                              <p className="text-xs text-emerald-700 mt-1 leading-relaxed">
                                Aapko remaining <strong className="text-emerald-950 font-black text-sm">₹{remainingAmount.toLocaleString('en-IN')}</strong> partner ko physical cash me dena hai. Partner cash collect karke system me verify karega.
                              </p>
                            </div>
                          </div>

                          {isFinalPendingCash ? (
                            <div className="bg-white/90 p-3 rounded-xl border border-emerald-300 text-xs font-bold text-emerald-800 flex items-center justify-between shadow-2xs">
                              <span className="flex items-center gap-1.5">
                                <Clock className="w-4 h-4 text-amber-600 animate-pulse" /> Cash Handover Marked (₹{remainingAmount.toLocaleString('en-IN')})
                              </span>
                              <span className="text-[10px] bg-amber-100 text-amber-900 font-extrabold px-2 py-0.5 rounded border border-amber-300">
                                Partner Verification Pending
                              </span>
                            </div>
                          ) : (
                            <Button 
                              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-6 font-extrabold flex items-center justify-center shadow-md text-sm" 
                              onClick={() => handlePayAtWorkshop(remainingAmount, "FINAL")} 
                              isLoading={isExtensionProcessing}
                            >
                              <CheckCircle2 className="w-4 h-4 mr-2" /> Confirm Cash Handed to Partner (₹{remainingAmount.toLocaleString('en-IN')})
                            </Button>
                          )}

                          <div className="text-center pt-1 border-t border-emerald-200/60">
                            <button
                              type="button"
                              onClick={() => handleTogglePaymentMode("ONLINE")}
                              className="text-[11px] text-primary-navy hover:underline font-semibold"
                            >
                              Want to pay online via UPI / QR / Card instead? Click here
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Button 
                            className="w-full bg-success hover:bg-success/90 text-white rounded-xl py-6 font-extrabold flex items-center justify-center shadow-lg text-sm" 
                            onClick={() => handleInitiatePayment(remainingAmount, "FINAL")} 
                            isLoading={isExtensionProcessing}
                          >
                            <CheckCircle2 className="w-4 h-4 mr-2" /> Pay Final Settlement Online (₹{remainingAmount.toLocaleString('en-IN')})
                          </Button>

                          <div className="text-center pt-1">
                            <button
                              type="button"
                              onClick={() => handleTogglePaymentMode("CASH")}
                              className="text-[11px] text-emerald-700 hover:underline font-bold"
                            >
                              Giving Cash directly to Partner? Click here to switch to Cash
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Fully Paid */}
                  {remainingAmount === 0 && (
                    <div className="bg-success/10 text-success text-center py-4 rounded-xl font-extrabold flex items-center justify-center border border-success/20 text-sm">
                      <CheckCircle2 className="w-5 h-5 mr-2" /> All Payments Settled & Completed
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
              <div className="bg-primary-navy rounded-3xl p-8 shadow-elevated relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-16 -mt-16" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary-orange/20 rounded-full blur-xl -ml-12 -mb-12" />
                <h3 className="font-heading font-bold text-xl text-white mb-3">Need Help?</h3>
                <p className="text-sm text-white/70 mb-8 leading-relaxed">If you have any questions or need to make changes to your booking, please raise a query with our team.</p>
                <Button variant="outline" className="w-full bg-white/10 border-white/20 hover:bg-white text-white hover:text-primary-navy rounded-xl py-6 font-bold transition-colors" onClick={() => router.push('/customer/support')}>
                  Raise Query <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
