// @ts-nocheck
"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { 
  Car, 
  Clock, 
  MapPin, 
  Phone, 
  CheckCircle2, 
  Wrench, 
  ShieldCheck, 
  ChevronDown, 
  ChevronUp, 
  ExternalLink, 
  Copy, 
  Check, 
  X, 
  Navigation, 
  Sparkles,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useSocket } from "@/lib/SocketContext";
import { useQueryClient } from "@tanstack/react-query";
import { useCustomerBookings } from "@/features/customer/hooks/useCustomerQueries";

interface LiveBookingStatusTrackerProps {
  bookings?: any[];
  onDismiss?: () => void;
}

interface StageConfig {
  id: number;
  label: string;
  shortName: string;
  icon: any;
  description: string;
  vehicleStatus: string;
}

const STAGES: StageConfig[] = [
  {
    id: 1,
    label: "Booking Requested",
    shortName: "Requested",
    icon: Clock,
    description: "Request submitted & matching workshops",
    vehicleStatus: "Vehicle at Customer Location — Awaiting quotes & partner allocation",
  },
  {
    id: 2,
    label: "Partner Confirmed",
    shortName: "Confirmed",
    icon: ShieldCheck,
    description: "Workshop assigned & schedule locked",
    vehicleStatus: "Vehicle Ready for Workshop Visit / Drop-off — Share PIN upon arrival",
  },
  {
    id: 3,
    label: "Vehicle Checked In",
    shortName: "Checked In",
    icon: MapPin,
    description: "Vehicle received & PIN verified",
    vehicleStatus: "Vehicle Received at Workshop — Initial check-in & inspection commenced",
  },
  {
    id: 4,
    label: "Service in Progress",
    shortName: "In Service",
    icon: Wrench,
    description: "Active repairs & quality check",
    vehicleStatus: "Vehicle on Service Bay — Active repairs & multi-point diagnostics underway",
  },
  {
    id: 5,
    label: "Service Completed",
    shortName: "Completed",
    icon: CheckCircle2,
    description: "Vehicle inspected & ready for delivery",
    vehicleStatus: "Vehicle Ready for Pickup / Delivery — All repairs completed & verified",
  },
];

export default function LiveBookingStatusTracker({ bookings: propBookings, onDismiss }: LiveBookingStatusTrackerProps) {
  const queryClient = useQueryClient();
  const { socket } = useSocket();
  const { data: bookingsData } = useCustomerBookings();

  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [copiedPin, setCopiedPin] = useState<boolean>(false);
  const [selectedBookingIndex, setSelectedBookingIndex] = useState<number>(0);
  const [isDismissed, setIsDismissed] = useState<boolean>(false);

  // Real-time WebSocket sync to automatically update booking status live
  useEffect(() => {
    if (!socket) return;

    const handleLiveBookingUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ["customer", "bookings"] });
    };

    socket.on("booking_updated", handleLiveBookingUpdate);
    socket.on("job_verified", handleLiveBookingUpdate);
    socket.on("booking_status_update", handleLiveBookingUpdate);
    socket.on("quote_received", handleLiveBookingUpdate);
    socket.on("payment_status_update", handleLiveBookingUpdate);
    socket.on("satisfaction_response", handleLiveBookingUpdate);

    return () => {
      socket.off("booking_updated", handleLiveBookingUpdate);
      socket.off("job_verified", handleLiveBookingUpdate);
      socket.off("booking_status_update", handleLiveBookingUpdate);
      socket.off("quote_received", handleLiveBookingUpdate);
      socket.off("payment_status_update", handleLiveBookingUpdate);
      socket.off("satisfaction_response", handleLiveBookingUpdate);
    };
  }, [socket, queryClient]);

  // Aggregate active bookings
  const activeBookings = useMemo(() => {
    const rawList = propBookings || bookingsData?.bookings || [];
    const list = Array.isArray(rawList) ? rawList : [];

    // Filter out completed and cancelled bookings
    const filtered = list.filter((b: any) => {
      if (!b) return false;
      const st = String(b.status || "").toUpperCase();
      return st !== "COMPLETED" && st !== "CANCELLED";
    });

    // Priority sort: In-Progress / Checked-in first, then Confirmed, then Quoted / Pending
    const priorityWeight: Record<string, number> = {
      IN_PROGRESS: 10,
      WORK_STARTED: 10,
      IN_SERVICE: 10,
      DIAGNOSIS: 10,
      REPAIRING: 10,
      QUALITY_CHECK: 10,
      VERIFIED: 8,
      ACCEPTED: 6,
      CONFIRMED: 6,
      CUSTOMER_ACCEPTED: 4,
      AWAITING_15_PERCENT_ADVANCE: 4,
      QUOTED: 2,
      PENDING: 1
    };

    return filtered.sort((a: any, b: any) => {
      const weightA = priorityWeight[String(a.status || "").toUpperCase()] || 0;
      const weightB = priorityWeight[String(b.status || "").toUpperCase()] || 0;
      return weightB - weightA;
    });
  }, [propBookings, bookingsData]);

  if (isDismissed || activeBookings.length === 0) {
    return null;
  }

  const currentBooking = activeBookings[selectedBookingIndex] || activeBookings[0];
  const bookingStatus = String(currentBooking?.status || "PENDING").toUpperCase();

  // Map status to current stage index (0 to 4)
  const getStageIndex = (status: string, booking: any): number => {
    switch (status) {
      case "PENDING":
      case "QUOTED":
        return 0; // Stage 1: Booking Requested

      case "CUSTOMER_ACCEPTED":
      case "AWAITING_15_PERCENT_ADVANCE":
      case "ACCEPTED":
      case "CONFIRMED":
        return 1; // Stage 2: Partner Confirmed

      case "VERIFIED":
      case "NOT_STARTED":
        return 2; // Stage 3: Vehicle Checked In

      case "WORK_STARTED":
      case "IN_PROGRESS":
      case "IN_SERVICE":
      case "DIAGNOSIS":
      case "REPAIRING":
      case "QUALITY_CHECK":
        return 3; // Stage 4: Service in Progress

      case "JOB_COMPLETED":
      case "COMPLETED":
      case "PAYMENT_PENDING":
        return 4; // Stage 5: Service Completed

      default:
        return 1;
    }
  };

  const currentStageIndex = getStageIndex(bookingStatus, currentBooking);
  const currentStage = STAGES[currentStageIndex];

  // Resolve Vehicle details
  const vehicleName = currentBooking?.vehicleId?.brand
    ? `${currentBooking.vehicleId.brand} ${currentBooking.vehicleId.model || ""}`
    : currentBooking?.vehicleDetails?.makeModel || "Your Vehicle";
  const vehicleReg = currentBooking?.vehicleId?.registrationNumber || "";
  const serviceName = currentBooking?.serviceId?.name || currentBooking?.serviceName || "Car Service";
  const bookingCode = currentBooking?.bookingId || currentBooking?._id?.slice(-6).toUpperCase() || "";

  // Strict verified advance payment check
  const hasPaidAdvanceStrict = Boolean(
    (currentBooking?.hasPaidAdvance && (currentBooking?.isAdvancePaid || (currentBooking?.paidAmount || 0) > 0)) ||
    currentBooking?.isAdvancePaid ||
    currentBooking?.paymentStatus === 'PAID' ||
    currentBooking?.paymentStatus === 'PARTIALLY_PAID' ||
    ['VERIFIED', 'IN_PROGRESS', 'WORK_STARTED', 'IN_SERVICE', 'DIAGNOSIS', 'REPAIRING', 'QUALITY_CHECK', 'JOB_COMPLETED', 'COMPLETED'].includes(bookingStatus)
  );

  // Resolve Partner / Workshop details
  const partnerInfo = useMemo(() => {
    let p = currentBooking?.assignedPartnerId && typeof currentBooking.assignedPartnerId === 'object'
      ? currentBooking.assignedPartnerId
      : null;

    if (!p && currentBooking?.acceptedBidId && typeof currentBooking.acceptedBidId === 'object' && currentBooking.acceptedBidId.partnerId) {
      p = currentBooking.acceptedBidId.partnerId;
    }

    if (!p && currentBooking?.jobDetails?.partnerId && typeof currentBooking.jobDetails.partnerId === 'object') {
      p = currentBooking.jobDetails.partnerId;
    }

    if (!p) return null;

    const name = p.businessName || p.ownerName || p.userId?.fullName || "Verified Partner Workshop";
    const address = p.businessAddress || p.address || "";
    const phone = p.phone || p.userId?.phone || "";
    const email = p.email || p.userId?.email || "";
    const rating = p.rating || 4.8;
    const coordinates = p.location?.coordinates;

    let mapsUrl = "";
    if (hasPaidAdvanceStrict) {
      if (coordinates && Array.isArray(coordinates) && coordinates.length === 2 && (coordinates[0] !== 0 || coordinates[1] !== 0)) {
        mapsUrl = `https://www.google.com/maps?q=${coordinates[1]},${coordinates[0]}`;
      } else if (address) {
        mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${name} ${address}`.trim())}`;
      }
    }

    return {
      name,
      address: hasPaidAdvanceStrict ? address : "Address unlocked after 15% advance confirmation",
      phone: hasPaidAdvanceStrict ? phone : "",
      email: hasPaidAdvanceStrict ? email : "",
      rating,
      mapsUrl,
      isVerified: p.isVerified !== false,
      isUnlocked: hasPaidAdvanceStrict,
    };
  }, [currentBooking, hasPaidAdvanceStrict]);

  const handleCopyPin = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentBooking?.verificationCode) return;
    navigator.clipboard.writeText(currentBooking.verificationCode);
    setCopiedPin(true);
    setTimeout(() => setCopiedPin(false), 2000);
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDismissed(true);
    if (onDismiss) onDismiss();
  };

  return (
    <div className="w-full transition-all duration-300">
      <Card className="bg-slate-900 border border-slate-800 shadow-xl rounded-2xl sm:rounded-3xl overflow-hidden text-white relative">
        {/* Subtle decorative background glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary-orange/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-secondary-blue/10 rounded-full blur-3xl pointer-events-none" />

        <CardContent className="p-3.5 sm:p-5 relative z-10 space-y-3.5">
          {/* Header Row: Live Badge, Service Title, Vehicle, Quick PIN, and Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-white/10 pb-3">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              {/* Pulsing Live Status Dot */}
              <div className="flex items-center gap-1.5 bg-primary-orange/20 border border-primary-orange/40 text-primary-orange text-[10px] sm:text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full shrink-0">
                <span className="w-2 h-2 rounded-full bg-primary-orange animate-ping inline-block" />
                Live Status
              </div>

              {/* Service & Vehicle Info */}
              <div className="min-w-0 flex-1 flex flex-wrap items-center gap-1.5 sm:gap-2">
                <h3 className="font-extrabold text-sm sm:text-base text-white tracking-tight truncate font-heading">
                  {serviceName}
                </h3>
                <span className="text-white/40 text-xs">•</span>
                <span className="inline-flex items-center text-xs font-semibold text-slate-300 bg-white/10 px-2 py-0.5 rounded-md truncate">
                  <Car className="w-3 h-3 mr-1 text-primary-orange shrink-0" />
                  {vehicleName}
                </span>
                {vehicleReg && (
                  <span className="text-[11px] font-mono text-slate-400 bg-white/5 px-1.5 py-0.5 rounded hidden md:inline-block">
                    {vehicleReg}
                  </span>
                )}
                <span className="text-[11px] text-white/50 font-mono hidden sm:inline-block">
                  #{bookingCode}
                </span>
              </div>
            </div>

            {/* Quick Actions & Header Controls */}
            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
              {/* Workshop PIN Pill */}
              {hasPaidAdvanceStrict && currentBooking?.verificationCode && (
                <button
                  type="button"
                  onClick={handleCopyPin}
                  className="flex items-center gap-1.5 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 text-xs font-mono font-bold px-2.5 py-1 rounded-xl transition-all cursor-pointer shadow-xs"
                  title="Click to copy workshop check-in PIN"
                >
                  <span className="text-[10px] uppercase tracking-wider text-amber-200/80 font-sans">PIN:</span>
                  <span className="tracking-widest font-black">{currentBooking.verificationCode}</span>
                  {copiedPin ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 opacity-70" />}
                </button>
              )}

              {/* Expand / Collapse Details Button */}
              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-1 text-xs font-bold bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-xl border border-white/15 transition-all cursor-pointer"
                aria-label={isExpanded ? "Collapse Details" : "View Live Details"}
              >
                <span>{isExpanded ? "Hide" : "Details"}</span>
                {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {/* Close Button */}
              <button
                type="button"
                onClick={handleDismiss}
                className="p-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
                title="Dismiss Tracker"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Multiple Active Bookings Switcher (If customer has >1 active bookings) */}
          {activeBookings.length > 1 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
              <span className="text-white/50 text-[11px] font-medium shrink-0">Active Bookings ({activeBookings.length}):</span>
              {activeBookings.map((b: any, idx: number) => {
                const isSelected = idx === selectedBookingIndex;
                const bCar = b.vehicleId?.brand ? `${b.vehicleId.brand} ${b.vehicleId.model || ""}` : `Vehicle ${idx + 1}`;
                return (
                  <button
                    key={b._id || idx}
                    type="button"
                    onClick={() => setSelectedBookingIndex(idx)}
                    className={`px-2.5 py-0.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                      isSelected
                        ? "bg-primary-orange text-white font-bold shadow-xs"
                        : "bg-white/10 text-white/70 hover:bg-white/15"
                    }`}
                  >
                    {bCar} (#{b.bookingId || b._id?.slice(-4).toUpperCase()})
                  </button>
                );
              })}
            </div>
          )}

          {/* PROGRESS STEPPER SECTION */}

          {/* 1. Desktop Stepper (Visible on sm and larger screens) */}
          <div className="hidden sm:block pt-1 pb-1">
            <div className="relative flex items-center justify-between">
              {/* Connecting background progress track */}
              <div className="absolute top-1/2 left-4 right-4 h-1 -translate-y-1/2 bg-white/15 rounded-full z-0" />
              {/* Active fill line */}
              <div
                className="absolute top-1/2 left-4 h-1 -translate-y-1/2 bg-gradient-to-r from-emerald-500 via-primary-orange to-primary-orange rounded-full transition-all duration-500 z-0"
                style={{
                  width: `${(currentStageIndex / (STAGES.length - 1)) * 92}%`,
                }}
              />

              {/* Stage Nodes */}
              {STAGES.map((stage, idx) => {
                const isPassed = idx < currentStageIndex;
                const isCurrent = idx === currentStageIndex;
                const StageIcon = stage.icon;

                return (
                  <div key={stage.id} className="relative z-10 flex flex-col items-center group cursor-pointer" onClick={() => setIsExpanded(true)}>
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 shadow-sm ${
                        isCurrent
                          ? "bg-primary-orange text-white ring-4 ring-primary-orange/30 scale-110 shadow-lg shadow-primary-orange/30"
                          : isPassed
                          ? "bg-emerald-500 text-white"
                          : "bg-slate-800 text-white/40 border border-white/20"
                      }`}
                    >
                      {isPassed ? (
                        <Check className="w-4 h-4 stroke-[3]" />
                      ) : (
                        <StageIcon className="w-4 h-4" />
                      )}
                    </div>
                    <span
                      className={`text-[11px] font-bold mt-1.5 tracking-tight text-center whitespace-nowrap transition-colors ${
                        isCurrent
                          ? "text-primary-orange font-black"
                          : isPassed
                          ? "text-emerald-400"
                          : "text-white/40"
                      }`}
                    >
                      {stage.shortName}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. Mobile Stepper (Optimized for small mobile viewports) */}
          <div className="block sm:hidden space-y-2">
            {/* Segmented Progress Bar */}
            <div className="flex items-center gap-1.5 w-full">
              {STAGES.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-2 flex-1 rounded-full transition-all duration-300 ${
                    idx < currentStageIndex
                      ? "bg-emerald-500"
                      : idx === currentStageIndex
                      ? "bg-primary-orange ring-2 ring-primary-orange/40"
                      : "bg-white/15"
                  }`}
                />
              ))}
            </div>

            {/* Current Stage Indicator Banner */}
            <div className="flex items-center justify-between text-xs pt-0.5">
              <span className="text-white/60 font-medium text-[11px]">
                Stage {currentStageIndex + 1} of 5
              </span>
              <span className="font-extrabold text-primary-orange text-xs flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-primary-orange animate-pulse" />
                {currentStage.label}
              </span>
            </div>
          </div>

          {/* Compact Vehicle Status Strip */}
          <div 
            onClick={() => setIsExpanded(!isExpanded)}
            className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-3 py-2 flex items-center justify-between gap-2 text-xs text-slate-200 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-primary-orange shrink-0">📍</span>
              <p className="truncate text-xs font-medium">
                <strong className="text-white font-bold">{currentStage.label}:</strong>{" "}
                <span className="text-slate-300">{currentStage.vehicleStatus}</span>
              </p>
            </div>
            <span className="text-[11px] font-bold text-primary-orange shrink-0 flex items-center gap-0.5">
              {isExpanded ? "Close" : "View Details"}
              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </span>
          </div>

          {/* INTERACTIVE EXPANDED DETAILS TRAY (Reveals upon user interaction) */}
          {isExpanded && (
            <div className="pt-2 border-t border-white/10 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* 1. Vehicle Live Status Card */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] uppercase tracking-wider font-extrabold text-amber-300 flex items-center gap-1.5">
                      <Car className="w-3.5 h-3.5" />
                      Vehicle Condition & Check-In
                    </span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-bold">
                      Real-Time Active
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-200 font-medium leading-snug">
                    {currentStage.vehicleStatus}
                  </p>

                  {/* Workshop PIN Card */}
                  {hasPaidAdvanceStrict && currentBooking?.verificationCode ? (
                    <div className="bg-black/30 border border-amber-400/30 rounded-xl p-2.5 flex items-center justify-between gap-3">
                      <div>
                        <span className="text-[10px] text-amber-300/80 uppercase font-bold tracking-wider block">
                          Workshop Drop-Off PIN
                        </span>
                        <span className="text-lg font-black font-mono tracking-widest text-amber-300">
                          {currentBooking.verificationCode}
                        </span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          Share with workshop manager upon arrival
                        </span>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleCopyPin}
                        className="bg-amber-400/10 hover:bg-amber-400/20 text-amber-300 border-amber-400/40 text-xs rounded-xl h-8 shrink-0"
                      >
                        {copiedPin ? (
                          <>
                            <Check className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 mr-1" />
                            Copy PIN
                          </>
                        )}
                      </Button>
                    </div>
                  ) : (
                    <div className="bg-black/20 rounded-xl p-2 text-xs text-slate-400 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>PIN unlocks once 15% advance payment is completed.</span>
                    </div>
                  )}

                  {/* Date & Service Mode */}
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400 pt-1">
                    {currentBooking?.preferredDate && (
                      <span className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded-lg">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {new Date(currentBooking.preferredDate).toLocaleDateString("en-IN", {
                          month: "short",
                          day: "numeric",
                          year: "numeric"
                        })}
                      </span>
                    )}
                    <span className="bg-white/5 px-2 py-1 rounded-lg capitalize">
                      {currentBooking?.serviceMode === "DOORSTEP" ? "Doorstep Pickup" : "Workshop Visit"}
                    </span>
                  </div>
                </div>

                {/* 2. Partner / Workshop Provider Card */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] uppercase tracking-wider font-extrabold text-emerald-300 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5" />
                      Assigned Workshop Details
                    </span>
                    {partnerInfo?.isVerified && (
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-bold">
                        ✓ Verified Partner
                      </span>
                    )}
                  </div>

                  {partnerInfo ? (
                    <div className="space-y-2">
                      <div>
                        <h4 className="font-bold text-sm sm:text-base text-white tracking-tight">
                          {partnerInfo.name}
                        </h4>
                        {partnerInfo.address ? (
                          <p className="text-xs text-slate-300 line-clamp-2 mt-0.5">
                            {partnerInfo.address}
                          </p>
                        ) : (
                          <p className="text-xs text-slate-400 italic">Address provided upon arrival</p>
                        )}
                      </div>

                      {/* Quick Contact & Navigation Buttons */}
                      {partnerInfo.isUnlocked ? (
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          {partnerInfo.phone && (
                            <a
                              href={`tel:${partnerInfo.phone}`}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all"
                            >
                              <Phone className="w-3.5 h-3.5" />
                              <span>Call ({partnerInfo.phone})</span>
                            </a>
                          )}

                          {partnerInfo.mapsUrl && (
                            <a
                              href={partnerInfo.mapsUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-bold shadow-sm transition-all"
                            >
                              <Navigation className="w-3.5 h-3.5 text-primary-orange" />
                              <span>Google Maps</span>
                              <ExternalLink className="w-3 h-3 text-white/50" />
                            </a>
                          )}
                        </div>
                      ) : (
                        <div className="pt-1.5">
                          <span className="inline-flex items-center text-[11px] font-semibold text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-lg">
                            🔒 Workshop phone & GPS navigation unlock after 15% advance payment
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2 py-1">
                      <p className="text-xs text-slate-300 font-medium">
                        Workshops are currently reviewing your service request.
                      </p>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Top-rated partner workshop details and direct phone contact will unlock immediately once a quote is accepted.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Actions Link */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2">
                <span className="text-[11px] text-slate-400">
                  Last updated real-time via CarBlink Live Operations.
                </span>
                <Button
                  asChild
                  className="w-full sm:w-auto bg-primary-orange hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow-md px-5 h-9"
                >
                  <Link href={`/customer/bookings/${currentBooking._id || currentBooking.id}`}>
                    <span>Full Booking Details & Timeline</span>
                    <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
