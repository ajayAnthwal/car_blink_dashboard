// @ts-nocheck
"use client";

import React, { useState, useMemo } from "react";
import {
  useExecutiveCancellations,
  useLogCancellationCallMutation,
  useRetainCancellationMutation,
  useForwardCancellationToAccountsMutation,
  useClickToCallMutation,
} from "@/features/executive/hooks/useExecutiveQueries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  PhoneCall,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowRightCircle,
  Sparkles,
  Search,
  Filter,
  DollarSign,
  User,
  Car,
  Calendar,
  Phone,
  FileText,
  Tag,
  ShieldAlert,
  X,
  ExternalLink,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";

const REASON_LABELS: Record<string, { label: string; color: string }> = {
  SLOW_RESPONSE: { label: "Slow Response / Late Quotes", color: "bg-amber-100 text-amber-800 border-amber-200" },
  HIGH_PRICING: { label: "High Pricing / Quote Too Expensive", color: "bg-red-100 text-red-800 border-red-200" },
  ALTERNATE_FOUND: { label: "Found Alternate Workshop", color: "bg-purple-100 text-purple-800 border-purple-200" },
  PICKUP_DELAY: { label: "Pickup / Schedule Delay", color: "bg-orange-100 text-orange-800 border-orange-200" },
  PARTNER_CONCERNS: { label: "Assigned Partner Concerns", color: "bg-rose-100 text-rose-800 border-rose-200" },
  EMERGENCY_CANCEL: { label: "Personal Emergency / Trip Postponed", color: "bg-blue-100 text-blue-800 border-blue-200" },
  NO_LONGER_NEEDED: { label: "Vehicle Sold / Service Not Needed", color: "bg-slate-100 text-slate-800 border-slate-200" },
  OTHER: { label: "Other Feedback", color: "bg-neutral-100 text-neutral-800 border-neutral-200" },
};

export default function ExecutiveCancellationsPage() {
  const [activeTab, setActiveTab] = useState<"ALL" | "PENDING" | "FORWARDED" | "RETAINED">("PENDING");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);

  // Queries
  const { data, isLoading, refetch } = useExecutiveCancellations({
    page,
    limit: 50,
    status: activeTab === "ALL" ? undefined : activeTab,
  });

  const cancellations = useMemo(() => {
    const list = data?.cancellations || [];
    return list.filter((item: any) => {
      // Filter by activeTab if needed
      if (activeTab === "PENDING") {
        if (item.status !== "CANCELLATION_REQUESTED" || item.cancellationDetails?.executiveStatus === "FORWARDED_TO_ACCOUNTS" || item.cancellationDetails?.executiveStatus === "RETAINED") {
          return false;
        }
      } else if (activeTab === "FORWARDED") {
        if (item.cancellationDetails?.executiveStatus !== "FORWARDED_TO_ACCOUNTS") return false;
      } else if (activeTab === "RETAINED") {
        if (item.cancellationDetails?.executiveStatus !== "RETAINED") return false;
      }

      // Filter by search
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();
      const cName = item.customerId?.fullName || item.customerId?.name || item.customerName || "";
      const cPhone = item.customerId?.phone || item.customerPhone || "";
      const cBookingId = item._id || "";
      const vReg = item.vehicleId?.registrationNumber || item.vehicleDetails?.regNo || item.vehicleNumber || "";
      return (
        cName.toLowerCase().includes(term) ||
        cPhone.toLowerCase().includes(term) ||
        cBookingId.toLowerCase().includes(term) ||
        vReg.toLowerCase().includes(term)
      );
    });
  }, [data, activeTab, searchTerm]);

  // Mutations
  const clickToCallMutation = useClickToCallMutation();
  const logCallMutation = useLogCancellationCallMutation();
  const retainMutation = useRetainCancellationMutation();
  const forwardMutation = useForwardCancellationToAccountsMutation();

  // Modals state
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [modalType, setModalType] = useState<"CALL_LOG" | "RETAIN" | "FORWARD" | null>(null);

  // Form states
  const [callForm, setCallForm] = useState({ callOutcome: "CONNECTED", notes: "" });
  const [retainForm, setRetainForm] = useState({ notes: "", couponCode: "" });
  const [forwardForm, setForwardForm] = useState({
    authorizedRefundAmount: 0,
    deductionAmount: 0,
    deductionReason: "",
    notes: "",
  });

  const [notification, setNotification] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Quick Stats
  const rawList = data?.cancellations || [];
  const pendingCount = rawList.filter((b: any) => b.status === "CANCELLATION_REQUESTED").length;
  const forwardedCount = rawList.filter((b: any) => b.cancellationDetails?.executiveStatus === "FORWARDED_TO_ACCOUNTS").length;
  const retainedCount = rawList.filter((b: any) => b.cancellationDetails?.executiveStatus === "RETAINED").length;

  const handleOpenModal = (booking: any, type: "CALL_LOG" | "RETAIN" | "FORWARD") => {
    setSelectedBooking(booking);
    setModalType(type);
    setNotification(null);

    const paid = booking.paymentDetails?.advancePaymentAmount || booking.finalAmount || booking.estimatedAmount || 0;
    if (type === "FORWARD") {
      setForwardForm({
        authorizedRefundAmount: paid,
        deductionAmount: 0,
        deductionReason: "",
        notes: "",
      });
    } else if (type === "RETAIN") {
      setRetainForm({ notes: "", couponCode: "" });
    } else if (type === "CALL_LOG") {
      setCallForm({ callOutcome: "CONNECTED", notes: "" });
    }
  };

  const handleQuickCall = async (phone: string, booking: any) => {
    if (!phone) {
      setNotification({ type: "error", text: "Customer phone number not available." });
      return;
    }
    try {
      await clickToCallMutation.mutateAsync({ phoneNumber: phone });
      setNotification({ type: "success", text: `Calling ${phone}... Ringing executive desk.` });
      // Pre-open the log call modal
      handleOpenModal(booking, "CALL_LOG");
    } catch (err: any) {
      setNotification({ type: "error", text: err?.message || "Failed to initiate click-to-call. You can dial manually." });
      handleOpenModal(booking, "CALL_LOG");
    }
  };

  const handleSaveCallLog = async () => {
    if (!selectedBooking) return;
    try {
      await logCallMutation.mutateAsync({
        id: selectedBooking._id,
        callOutcome: callForm.callOutcome,
        notes: callForm.notes,
      });
      setNotification({ type: "success", text: "Call attempt and notes logged successfully." });
      setModalType(null);
      refetch();
    } catch (err: any) {
      setNotification({ type: "error", text: err?.message || "Failed to log call." });
    }
  };

  const handleRetainCustomer = async () => {
    if (!selectedBooking) return;
    if (!retainForm.notes.trim()) {
      setNotification({ type: "error", text: "Please enter retention explanation/notes." });
      return;
    }
    try {
      await retainMutation.mutateAsync({
        id: selectedBooking._id,
        notes: retainForm.notes,
        couponCode: retainForm.couponCode,
      });
      setNotification({ type: "success", text: "Customer retained! Booking reinstated to active operations." });
      setModalType(null);
      refetch();
    } catch (err: any) {
      setNotification({ type: "error", text: err?.message || "Failed to retain customer." });
    }
  };

  const handleForwardToAccounts = async () => {
    if (!selectedBooking) return;
    if (!forwardForm.notes.trim()) {
      setNotification({ type: "error", text: "Please provide executive notes and recommendation for Accounts." });
      return;
    }
    try {
      await forwardMutation.mutateAsync({
        id: selectedBooking._id,
        notes: forwardForm.notes,
        deductionAmount: Number(forwardForm.deductionAmount) || 0,
        deductionReason: forwardForm.deductionReason,
        authorizedRefundAmount: Number(forwardForm.authorizedRefundAmount) || 0,
      });
      setNotification({ type: "success", text: "Cancellation and refund request forwarded to Accounts Desk." });
      setModalType(null);
      refetch();
    } catch (err: any) {
      setNotification({ type: "error", text: err?.message || "Failed to forward to Accounts." });
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-2 sm:px-4 py-4 min-w-0">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-primary-navy tracking-tight flex items-center gap-2">
            <span className="p-2 rounded-xl bg-primary-navy text-white shadow-md">
              <PhoneCall className="w-5 h-5 text-amber-400" />
            </span>
            Cancellation & Retention Desk
          </h1>
          <p className="text-sm text-neutral-muted mt-1">
            Proactively engage customers requesting cancellation, prevent churn, and authorize Accounts refunds.
          </p>
        </div>

        <Button
          variant="outline"
          onClick={() => refetch()}
          className="self-start md:self-auto text-xs font-semibold hover:bg-neutral-bg"
        >
          Refresh Desk
        </Button>
      </div>

      {/* Global Notification Banner */}
      {notification && (
        <div
          className={`p-4 rounded-xl text-sm border flex items-center justify-between shadow-sm animate-in fade-in duration-200 ${
            notification.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-red-50 text-red-800 border-red-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            )}
            <span className="font-medium">{notification.text}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-neutral-400 hover:text-neutral-700 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-amber-500 shadow-sm bg-gradient-to-br from-amber-50/40 to-white">
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider font-bold text-amber-700">Pending Review</p>
              <h3 className="text-2xl sm:text-3xl font-black text-amber-900 mt-1">{pendingCount}</h3>
              <p className="text-xs text-amber-600 mt-0.5">Need immediate phone contact</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-600 shadow-inner">
              <Clock className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500 shadow-sm bg-gradient-to-br from-emerald-50/40 to-white">
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider font-bold text-emerald-700">Customers Retained</p>
              <h3 className="text-2xl sm:text-3xl font-black text-emerald-900 mt-1">{retainedCount}</h3>
              <p className="text-xs text-emerald-600 mt-0.5">Reinstated to active orders</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600 shadow-inner">
              <Sparkles className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500 shadow-sm bg-gradient-to-br from-blue-50/40 to-white">
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider font-bold text-blue-700">Sent to Accounts</p>
              <h3 className="text-2xl sm:text-3xl font-black text-blue-900 mt-1">{forwardedCount}</h3>
              <p className="text-xs text-blue-600 mt-0.5">Authorized for Razorpay refund</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600 shadow-inner">
              <ArrowRightCircle className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-neutral-200/80 shadow-sm">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            onClick={() => setActiveTab("PENDING")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === "PENDING"
                ? "bg-amber-500 text-white shadow-sm"
                : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
            }`}
          >
            Pending Review ({pendingCount})
          </button>
          <button
            onClick={() => setActiveTab("FORWARDED")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === "FORWARDED"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
            }`}
          >
            Forwarded to Accounts
          </button>
          <button
            onClick={() => setActiveTab("RETAINED")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === "RETAINED"
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
            }`}
          >
            Retained
          </button>
          <button
            onClick={() => setActiveTab("ALL")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === "ALL"
                ? "bg-primary-navy text-white shadow-sm"
                : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
            }`}
          >
            All History
          </button>
        </div>

        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Search customer, phone, car..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary-navy/20"
          />
        </div>
      </div>

      {/* Main Content List */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border">
          <Loader2 className="w-10 h-10 text-primary-orange animate-spin" />
          <p className="text-sm text-neutral-muted mt-3 font-medium">Loading cancellation requests...</p>
        </div>
      ) : cancellations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 bg-white rounded-2xl border text-center">
          <div className="w-16 h-16 rounded-3xl bg-neutral-100 flex items-center justify-center text-neutral-400 mb-3">
            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
          </div>
          <h3 className="text-lg font-bold text-neutral-800">No Cancellation Requests Found</h3>
          <p className="text-sm text-neutral-500 max-w-sm mt-1">
            {searchTerm
              ? "No cancellation tickets match your search criteria."
              : activeTab === "PENDING"
              ? "All caught up! There are currently no pending customer cancellation queries."
              : "No records found in this category."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {cancellations.map((booking: any) => {
            const customerName = booking.customerId?.fullName || booking.customerId?.name || booking.customerName || "Customer";
            const customerPhone = booking.customerId?.phone || booking.customerPhone || "";
            const vehicleReg = booking.vehicleId?.registrationNumber || booking.vehicleDetails?.regNo || booking.vehicleNumber || "Vehicle";
            const vehicleModel = `${booking.vehicleId?.brand || booking.vehicleDetails?.make || ""} ${booking.vehicleId?.model || booking.vehicleDetails?.model || ""}`.trim();
            const serviceName = booking.serviceId?.name || booking.serviceType || "Car Service";
            const advancePaid = booking.paymentDetails?.advancePaymentAmount || booking.finalAmount || 0;
            const reasons = booking.cancellationDetails?.reasons || [];
            const remarks = booking.cancellationDetails?.customerRemarks || booking.cancellationReason || "No details provided";
            const requestedAt = booking.cancellationDetails?.requestedAt || booking.updatedAt;
            const callAttempts = booking.cancellationDetails?.callAttempts || 0;
            const lastCallAt = booking.cancellationDetails?.lastCallAt;
            const execStatus = booking.cancellationDetails?.executiveStatus || (booking.status === "CANCELLATION_REQUESTED" ? "PENDING" : booking.status);

            return (
              <Card
                key={booking._id}
                className="overflow-hidden border border-neutral-200/90 shadow-sm hover:shadow-md transition-shadow bg-white rounded-2xl"
              >
                <div className="p-4 sm:p-5 flex flex-col gap-4">
                  {/* Top Row: Header Info & Status Badge */}
                  <div className="flex flex-wrap items-start justify-between gap-3 border-b border-neutral-100 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary-navy/5 border border-primary-navy/10 flex items-center justify-center text-primary-navy font-bold text-sm">
                        <Car className="w-5 h-5 text-primary-navy" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-neutral-900 text-base">
                            {vehicleReg !== "Vehicle" ? vehicleReg : `#${String(booking._id).slice(-6).toUpperCase()}`}
                          </span>
                          {vehicleModel && (
                            <span className="text-xs text-neutral-500 font-medium hidden sm:inline">
                              ({vehicleModel})
                            </span>
                          )}
                          <span className="text-[11px] font-mono bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded-md">
                            #{String(booking._id).slice(-6).toUpperCase()}
                          </span>
                        </div>
                        <p className="text-xs text-neutral-400 mt-0.5 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          Requested: {new Date(requestedAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {booking.status === "CANCELLATION_REQUESTED" ? (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 animate-pulse flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5" />
                          Action Required
                        </span>
                      ) : execStatus === "FORWARDED_TO_ACCOUNTS" ? (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200 flex items-center gap-1.5">
                          <ArrowRightCircle className="w-3.5 h-3.5" />
                          Forwarded to Accounts
                        </span>
                      ) : execStatus === "RETAINED" ? (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5" />
                          Customer Retained
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-neutral-100 text-neutral-700">
                          {booking.status}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Middle Row: Two columns (Customer & Booking on Left, Cancellation Details on Right) */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    {/* Left: Customer & Payment Details */}
                    <div className="md:col-span-5 bg-neutral-50/70 p-3.5 rounded-xl border border-neutral-200/60 flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-neutral-400" />
                            <span className="text-sm font-bold text-neutral-800">{customerName}</span>
                          </div>
                          {customerPhone && (
                            <span className="text-xs font-mono text-neutral-600 bg-white px-2 py-0.5 rounded border">
                              {customerPhone}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between text-xs text-neutral-600 pt-1 border-t border-neutral-200/50">
                          <span>Advance / Paid Amount:</span>
                          <span className="font-bold text-neutral-900 text-sm">
                            ₹{advancePaid ? advancePaid.toLocaleString("en-IN") : 0}
                          </span>
                        </div>

                        {serviceName && (
                          <div className="text-xs text-neutral-500">
                            Service: <span className="font-medium text-neutral-700">{serviceName}</span>
                          </div>
                        )}
                      </div>

                      {/* Phone action buttons */}
                      <div className="pt-3 mt-2 border-t border-neutral-200/50 flex items-center gap-2">
                        <Button
                          size="sm"
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm"
                          onClick={() => handleQuickCall(customerPhone, booking)}
                          disabled={clickToCallMutation.isPending}
                        >
                          <Phone className="w-3.5 h-3.5" />
                          {clickToCallMutation.isPending ? "Connecting..." : `Call Customer (${customerPhone || "N/A"})`}
                        </Button>
                      </div>
                    </div>

                    {/* Right: Cancellation Reason & Remarks */}
                    <div className="md:col-span-7 flex flex-col justify-between space-y-3">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1.5 flex items-center gap-1">
                          <Tag className="w-3.5 h-3.5" /> Customer Feedback & Reasons
                        </p>
                        
                        {/* Reasons Pills */}
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {reasons.length > 0 ? (
                            reasons.map((rKey: string) => {
                              const badge = REASON_LABELS[rKey] || { label: rKey, color: "bg-neutral-100 text-neutral-800 border-neutral-200" };
                              return (
                                <span
                                  key={rKey}
                                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${badge.color}`}
                                >
                                  {badge.label}
                                </span>
                              );
                            })
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-lg text-xs font-medium bg-neutral-100 text-neutral-600">
                              No specific tags selected
                            </span>
                          )}
                        </div>

                        {/* Customer Remarks Box */}
                        <div className="bg-amber-50/50 border border-amber-200/60 p-2.5 rounded-xl text-xs text-neutral-700">
                          <span className="font-bold text-amber-900 block mb-0.5">Customer Note:</span>
                          <p className="italic text-neutral-600 line-clamp-2">"{remarks}"</p>
                        </div>
                      </div>

                      {/* Call Log & Executive Record Summary */}
                      <div className="flex flex-wrap items-center justify-between text-xs text-neutral-500 bg-neutral-50 p-2 rounded-lg">
                        <span className="flex items-center gap-1 font-medium">
                          <PhoneCall className="w-3.5 h-3.5 text-blue-500" />
                          Call Attempts: <strong className="text-neutral-800">{callAttempts}</strong>
                        </span>
                        {lastCallAt && (
                          <span>
                            Last: {new Date(lastCallAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        )}
                        {booking.cancellationDetails?.executiveNotes && (
                          <span className="text-neutral-700 italic max-w-xs truncate" title={booking.cancellationDetails.executiveNotes}>
                            Note: "{booking.cancellationDetails.executiveNotes}"
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Bottom Row: Executive Action Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-neutral-100">
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs font-semibold"
                        onClick={() => handleOpenModal(booking, "CALL_LOG")}
                      >
                        <PhoneCall className="w-3.5 h-3.5 mr-1 text-primary-navy" /> Log Call Record
                      </Button>
                      <Link
                        href={`/executive/leads/${booking._id}`}
                        className="text-xs text-neutral-500 hover:text-primary-navy flex items-center gap-1 font-medium px-2 py-1 rounded hover:bg-neutral-100"
                      >
                        View Full Lead <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>

                    {booking.status === "CANCELLATION_REQUESTED" && (
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm flex items-center gap-1"
                          onClick={() => handleOpenModal(booking, "RETAIN")}
                        >
                          <Sparkles className="w-3.5 h-3.5" /> Retain Customer
                        </Button>
                        <Button
                          size="sm"
                          className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-sm flex items-center gap-1"
                          onClick={() => handleOpenModal(booking, "FORWARD")}
                        >
                          <ArrowRightCircle className="w-3.5 h-3.5" /> Approve & Forward to Accounts
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal 1: Log Call Record */}
      {modalType === "CALL_LOG" && selectedBooking && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md shadow-2xl rounded-2xl border-0 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <CardHeader className="bg-primary-navy text-white p-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <PhoneCall className="w-5 h-5 text-amber-400" />
                  Log Executive Call Record
                </CardTitle>
                <button onClick={() => setModalType(null)} className="text-white/70 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-xs text-white/80 mt-1">
                Customer: {selectedBooking.customerId?.fullName || selectedBooking.customerId?.name || "Customer"} ({selectedBooking.customerId?.phone || selectedBooking.customerPhone || "N/A"})
              </p>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div>
                <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider block mb-1">
                  Call Outcome
                </label>
                <select
                  value={callForm.callOutcome}
                  onChange={(e) => setCallForm({ ...callForm, callOutcome: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary-navy/20"
                >
                  <option value="CONNECTED">Connected - Discussion in progress</option>
                  <option value="NO_ANSWER">No Answer / Ringing</option>
                  <option value="BUSY">Busy / Customer Disconnected</option>
                  <option value="CALLBACK_REQUESTED">Customer requested call back later</option>
                  <option value="SWITCHED_OFF">Switched Off / Out of Coverage</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider block mb-1">
                  Executive Notes & Discussion Summary
                </label>
                <textarea
                  rows={4}
                  placeholder="Summarize customer feedback, why they want to cancel, what was offered, or when to callback..."
                  value={callForm.notes}
                  onChange={(e) => setCallForm({ ...callForm, notes: e.target.value })}
                  className="w-full text-xs p-3 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary-navy/20"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => setModalType(null)}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="bg-primary-navy text-white font-bold"
                  onClick={handleSaveCallLog}
                  disabled={logCallMutation.isPending}
                >
                  {logCallMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                  Save Log
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal 2: Retain Customer */}
      {modalType === "RETAIN" && selectedBooking && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg shadow-2xl rounded-2xl border-0 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <CardHeader className="bg-emerald-700 text-white p-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-300" />
                  Retain Customer & Reinstate Booking
                </CardTitle>
                <button onClick={() => setModalType(null)} className="text-white/70 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-xs text-white/90 mt-1">
                Booking #{String(selectedBooking._id).slice(-6).toUpperCase()} will be returned to active progress.
              </p>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-xs text-emerald-900 leading-relaxed">
                <strong>Retention Playbook:</strong> Confirm that you have addressed customer concerns (e.g. negotiated partner pricing, arranged priority slot, or assigned a trusted garage).
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider block mb-1">
                  Retention Notes / Resolution Details <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="E.g., Customer agreed to continue after partner price revised by ₹500 and assigned priority mechanic..."
                  value={retainForm.notes}
                  onChange={(e) => setRetainForm({ ...retainForm, notes: e.target.value })}
                  className="w-full text-xs p-3 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider block mb-1">
                  Special Retention Coupon / Waiver (Optional)
                </label>
                <Input
                  placeholder="e.g. RETENTION200 or 10%_OFF"
                  value={retainForm.couponCode}
                  onChange={(e) => setRetainForm({ ...retainForm, couponCode: e.target.value })}
                  className="text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => setModalType(null)}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold"
                  onClick={handleRetainCustomer}
                  disabled={retainMutation.isPending || !retainForm.notes.trim()}
                >
                  {retainMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                  Confirm Retention
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal 3: Forward to Accounts */}
      {modalType === "FORWARD" && selectedBooking && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg shadow-2xl rounded-2xl border-0 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <CardHeader className="bg-red-700 text-white p-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <ArrowRightCircle className="w-5 h-5 text-amber-300" />
                  Forward to Accounts for Refund
                </CardTitle>
                <button onClick={() => setModalType(null)} className="text-white/70 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-xs text-white/90 mt-1">
                Booking #{String(selectedBooking._id).slice(-6).toUpperCase()} • Accounts PIN Authorization Required
              </p>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              {/* Financial Breakdown */}
              <div className="bg-neutral-50 p-3.5 rounded-xl border border-neutral-200 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-neutral-600">Total Customer Paid Amount:</span>
                  <span className="font-bold text-neutral-900 text-sm">
                    ₹{(selectedBooking.paymentDetails?.advancePaymentAmount || selectedBooking.finalAmount || 0).toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-neutral-600">Deduction (Inspection / Convenience Fee):</span>
                  <span className="font-semibold text-red-600">
                    -₹{(Number(forwardForm.deductionAmount) || 0).toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs pt-2 border-t border-neutral-200">
                  <span className="font-bold text-neutral-800">Net Refund Authorized to Customer:</span>
                  <span className="font-black text-emerald-700 text-base">
                    ₹{Math.max(0, (Number(forwardForm.authorizedRefundAmount) || 0) - (Number(forwardForm.deductionAmount) || 0)).toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              {/* Authorized Amount Input */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider block mb-1">
                    Gross Refund Base (₹)
                  </label>
                  <Input
                    type="number"
                    value={forwardForm.authorizedRefundAmount}
                    onChange={(e) => setForwardForm({ ...forwardForm, authorizedRefundAmount: Number(e.target.value) })}
                    className="text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider block mb-1">
                    Deduction Amount (₹)
                  </label>
                  <Input
                    type="number"
                    value={forwardForm.deductionAmount}
                    onChange={(e) => setForwardForm({ ...forwardForm, deductionAmount: Number(e.target.value) })}
                    className="text-xs font-bold"
                    placeholder="0"
                  />
                </div>
              </div>

              {Number(forwardForm.deductionAmount) > 0 && (
                <div>
                  <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider block mb-1">
                    Reason for Deduction
                  </label>
                  <Input
                    placeholder="e.g. Diagnostic / Doorstep inspection charge applied"
                    value={forwardForm.deductionReason}
                    onChange={(e) => setForwardForm({ ...forwardForm, deductionReason: e.target.value })}
                    className="text-xs"
                  />
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider block mb-1">
                  Executive Remarks for Accounts Desk <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Explain why customer refused retention and approve refund release via RazorpayX..."
                  value={forwardForm.notes}
                  onChange={(e) => setForwardForm({ ...forwardForm, notes: e.target.value })}
                  className="w-full text-xs p-3 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => setModalType(null)}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="bg-red-700 hover:bg-red-800 text-white font-bold"
                  onClick={handleForwardToAccounts}
                  disabled={forwardMutation.isPending || !forwardForm.notes.trim()}
                >
                  {forwardMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                  Send Packet to Accounts
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
