"use client";

import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useSocket } from "@/lib/SocketContext";
import { registerDeviceToken } from "@/lib/services";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { useRouter, usePathname } from "next/navigation";
import { ROLE_ROUTES } from "@/lib/constants";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  Lock, 
  LogOut, 
  Building2, 
  RefreshCw, 
  Sparkles, 
  Radio,
  XCircle,
  X,
  ArrowRight
} from "lucide-react";
import toast from "react-hot-toast";

export default function PartnerLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user, logout, isLoading, refreshUser } = useAuth();
  const { socket, isConnected } = useSocket();
  const router = useRouter();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isCheckingLive, setIsCheckingLive] = useState(false);
  const [statusModal, setStatusModal] = useState<{
    isOpen: boolean;
    status: "Pending" | "Approved" | "Rejected";
    rawStatus: string;
    reason?: string;
  } | null>(null);

  const prevStatusRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.replace("/login");
      } else if (user.role !== "PARTNER") {
        const correctRoute = ROLE_ROUTES[user.role] || "/login";
        router.replace(correctRoute);
      }
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    const setupPushNotifications = async () => {
      if (isAuthenticated) {
        try {
          const mockFcmToken = "fcm_partner_token_" + Math.random().toString(36).substring(7);
          await registerDeviceToken({ deviceToken: mockFcmToken });
        } catch (error) {}
      }
    };
    setupPushNotifications();
  }, [isAuthenticated]);

  const pathname = usePathname();
  const partnerInfo = (user as any)?.partnerInfo || {};
  const status = partnerInfo.verificationStatus || (user as any)?.verificationStatus || "PENDING";
  const executiveStatus = partnerInfo.executiveVerificationStatus || (user as any)?.executiveVerificationStatus || "PENDING";
  const isExecutiveVerified = executiveStatus === "APPROVED";
  const isActive = partnerInfo.isActive !== false && (user as any)?.isActive !== false;
  const isVerified = Boolean(partnerInfo.isVerified || (user as any)?.isVerified);
  const rejectionReason = partnerInfo.rejectionReason || (user as any)?.rejectionReason;

  // Normalized Clear Status: Pending, Approved, or Rejected
  const clearStatus: "Pending" | "Approved" | "Rejected" = useMemo(() => {
    if (status === "APPROVED_VERIFIED" || status === "APPROVED") {
      return "Approved";
    }
    if (status === "REJECTED" || executiveStatus === "REJECTED") {
      return "Rejected";
    }
    return "Pending";
  }, [status, executiveStatus]);

  const isFullyApproved = clearStatus === "Approved" && isVerified && isActive;
  const isSuspended = status === "SUSPENDED" || !isActive;
  const isRejected = clearStatus === "Rejected";
  const isManualReview = status === "MANUAL_VERIFICATION_REQUIRED";

  // Watch for status changes to trigger popup ONLY on dynamic status transitions during an active session
  // Never show on initial page load or login for already approved partners
  useEffect(() => {
    if (!isLoading && user && user.role === "PARTNER" && clearStatus) {
      if (prevStatusRef.current && prevStatusRef.current !== clearStatus && clearStatus !== "Pending") {
        setStatusModal({
          isOpen: true,
          status: clearStatus,
          rawStatus: status,
          reason: rejectionReason,
        });
      }
      prevStatusRef.current = clearStatus;
    }
  }, [clearStatus, isLoading, user, status, rejectionReason]);

  // Redirect unapproved partner away from operational dashboard pages to /partner/kyc
  useEffect(() => {
    if (!isLoading && user && user.role === "PARTNER" && !isFullyApproved) {
      if (pathname !== "/partner/kyc") {
        router.replace("/partner/kyc");
      }
    }
  }, [isLoading, user, isFullyApproved, pathname, router]);

  // Manual Live Check
  const handleManualCheck = useCallback(async () => {
    setIsCheckingLive(true);
    try {
      await refreshUser();
      toast.success("Verification status refreshed.");
    } catch (err) {
      console.error("[PartnerLayout] Error refreshing status:", err);
    } finally {
      setIsCheckingLive(false);
    }
  }, [refreshUser]);

  // Real-Time Socket Listeners for Live Status Transition without reload
  useEffect(() => {
    if (!socket) return;

    const handleLiveEvent = async (payload: any) => {
      console.log("[PartnerLayout] Live verification event received:", payload);
      try {
        await refreshUser();
        const raw = payload?.status || payload?.verificationStatus;
        if (!raw && !payload?.isVerified) return; // Only process actual verification payload

        let norm: "Pending" | "Approved" | "Rejected" | null = null;
        if (raw === "APPROVED" || raw === "APPROVED_VERIFIED" || payload?.isVerified) {
          norm = "Approved";
        } else if (raw === "REJECTED") {
          norm = "Rejected";
        } else if (raw === "PENDING" || raw === "UNDER_REVIEW") {
          norm = "Pending";
        }

        if (!norm) return;

        // Never trigger Pending popup for an already approved partner
        if (clearStatus === "Approved" && norm === "Pending") return;
        // Never trigger Approved popup if partner is already approved
        if (clearStatus === "Approved" && norm === "Approved") return;

        const reason = payload?.rejectionReason || payload?.notes || rejectionReason;

        setStatusModal({
          isOpen: true,
          status: norm,
          rawStatus: raw,
          reason,
        });

        if (norm === "Approved") {
          toast.success("🎉 Congratulations! Your CarBlink Partner Account is Approved!", { duration: 6000 });
        } else if (norm === "Rejected") {
          toast.error(`Application Rejected: ${reason || "Requirements not met"}`, { duration: 8000 });
        }
      } catch (err) {
        console.error("[PartnerLayout] Error handling live socket event:", err);
      }
    };

    socket.on("partner_verified", handleLiveEvent);
    socket.on("partner_status_updated", handleLiveEvent);
    socket.on("kyc_status_changed", handleLiveEvent);

    return () => {
      socket.off("partner_verified", handleLiveEvent);
      socket.off("partner_status_updated", handleLiveEvent);
      socket.off("kyc_status_changed", handleLiveEvent);
    };
  }, [socket, status, rejectionReason, refreshUser, clearStatus]);

  const renderStatusModal = () => {
    if (!statusModal?.isOpen) return null;
    // Safety guard: If partner is already approved, NEVER show "Pending Review" modal
    if (clearStatus === "Approved" && statusModal.status === "Pending") return null;

    const isApp = statusModal.status === "Approved";
    const isRej = statusModal.status === "Rejected";
    const isPen = statusModal.status === "Pending";

    const handleClose = () => {
      setStatusModal(null);
    };

    return (
      <div 
        id="partner-status-modal-backdrop"
        className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200"
      >
        <div 
          id="partner-status-modal"
          className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative text-white animate-in zoom-in-95 duration-200 space-y-5"
        >
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${
              isApp 
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                : isRej
                ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
            }`}>
              {isApp && <CheckCircle2 className="w-8 h-8" />}
              {isRej && <XCircle className="w-8 h-8" />}
              {isPen && <Clock className="w-8 h-8" />}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full tracking-wider ${
                  isApp
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                    : isRej
                    ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                    : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                }`}>
                  Status: {statusModal.status}
                </span>
              </div>
              <h3 className="text-xl font-bold text-white mt-1">
                {isApp && "Application Approved! 🎉"}
                {isRej && "Application Rejected"}
                {isPen && "Application Pending Review"}
              </h3>
            </div>
          </div>

          <div className="text-sm text-slate-300 space-y-3">
            {isApp && (
              <p>
                Congratulations! Your CarBlink Partner workshop application has been approved by the CarBlink Team. You now have full operational access to incoming customer leads, live quotation requests, and job tracking.
              </p>
            )}

            {isRej && (
              <>
                <p>
                  Your workshop application was reviewed by the CarBlink Team and has been rejected.
                </p>
                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-200 space-y-1">
                  <p className="font-semibold text-rose-300 text-xs uppercase tracking-wider">Rejection Reason</p>
                  <p className="text-sm font-medium">
                    &quot;{statusModal.reason || "Requirements or business verification criteria were not met."}&quot;
                  </p>
                </div>
                <p className="text-xs text-slate-400">
                  Please update your verification documents or contact CarBlink Operations at <span className="text-slate-200 font-mono">support@carblink.com</span> to request a re-review.
                </p>
              </>
            )}

            {isPen && (
              <p>
                Your workshop registration and KYC documents are under review. Our operations team is verifying your physical address and credentials. We will update you as soon as review is completed.
              </p>
            )}
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
            {isApp ? (
              <Button
                onClick={() => {
                  handleClose();
                  router.push("/partner/dashboard");
                }}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl shadow-lg shadow-emerald-900/30"
              >
                Go to Dashboard <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            ) : (
              <Button
                onClick={handleClose}
                className={`w-full font-bold py-2.5 rounded-xl text-white ${
                  isRej ? "bg-rose-600 hover:bg-rose-500" : "bg-amber-600 hover:bg-amber-500"
                }`}
              >
                {isRej ? "Understood / Acknowledge" : "Close"}
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Heartbeat Polling: Ensures screen updates automatically within 6 seconds even if socket is disconnected
  useEffect(() => {
    if (isFullyApproved || !isAuthenticated || isLoading) return;

    const interval = setInterval(async () => {
      try {
        await refreshUser();
      } catch (err) {
        // silent polling catch
      }
    }, 6000);

    return () => clearInterval(interval);
  }, [isFullyApproved, isAuthenticated, isLoading, refreshUser]);

  if (isLoading || !user || user.role !== "PARTNER") {
    return (
      <div className="flex h-screen items-center justify-center bg-neutral-bg">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-orange"></div>
      </div>
    );
  }

  // Before APPROVED_VERIFIED + isActive: Partner can see ONLY registration/KYC and pending checklist
  if (!isFullyApproved) {
    if (pathname !== "/partner/kyc") {
      return (
        <div className="flex h-screen items-center justify-center bg-slate-900 text-slate-200">
          <div className="text-center space-y-4 max-w-md p-8 bg-slate-800/90 rounded-3xl border border-slate-700/80 shadow-2xl">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-orange mx-auto"></div>
            <h3 className="font-bold text-lg text-white">Partner Dashboard Gated</h3>
            <p className="text-xs text-slate-400">
              Operational dashboard access (leads, quotes, jobs) is locked until account verification is approved.
              Redirecting to Partner KYC &amp; Verification checklist...
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-slate-950 flex flex-col text-slate-100 w-full min-w-0 max-w-full overflow-x-hidden">
        {/* Onboarding Top Navigation Shell */}
        <header className="bg-slate-900/95 border-b border-slate-800 px-4 md:px-8 py-3.5 sticky top-0 z-40 backdrop-blur-md shadow-lg">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center space-x-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-bold text-white font-heading">
                    {partnerInfo.businessName || user.fullName || "Partner Workshop"}
                  </h2>
                  <span
                    id="partner-top-status-badge"
                    className={`text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                      clearStatus === "Approved"
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        : clearStatus === "Rejected"
                        ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                        : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${
                      clearStatus === "Approved" ? "bg-emerald-400" : clearStatus === "Rejected" ? "bg-rose-400" : "bg-amber-400 animate-pulse"
                    }`} />
                    Status: {clearStatus}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Phone: <span className="font-mono text-slate-200">+91 {user.phone}</span> • Email: {user.email || "N/A"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <span className="hidden md:flex items-center gap-1 text-[11px] bg-slate-800 text-slate-300 px-2.5 py-1 rounded-lg border border-slate-700 font-mono">
                <Radio className={`w-3 h-3 ${isConnected ? "text-emerald-400 animate-pulse" : "text-amber-400"}`} />
                {isConnected ? "LIVE SYNC ON" : "CONNECTING..."}
              </span>

              <Button
                variant="outline"
                size="sm"
                onClick={handleManualCheck}
                disabled={isCheckingLive}
                className="border-slate-700 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-xl text-xs font-semibold"
              >
                <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isCheckingLive ? "animate-spin text-amber-400" : ""}`} />
                {isCheckingLive ? "Checking..." : "Check Status"}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => logout()}
                className="border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
              >
                <LogOut className="w-4 h-4 mr-1.5" /> Logout
              </Button>
            </div>
          </div>
        </header>

        {/* Clear Status Callout Banners with Reasons */}
        <div className="max-w-7xl mx-auto w-full px-4 pt-4">
          {clearStatus === "Rejected" && (
            <div id="partner-status-banner-rejected" className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-300 shadow-sm flex items-start gap-3.5 mb-2">
              <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="text-xs sm:text-sm">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-rose-300 text-base">Application Status: Rejected</p>
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-rose-500/20 text-rose-300 rounded-md border border-rose-500/30">
                    Action Required
                  </span>
                </div>
                <p className="text-rose-200 mt-1 font-medium">
                  <strong>Rejection Reason:</strong> &quot;{rejectionReason || "Requirements or business verification criteria were not met."}&quot;
                </p>
                <p className="text-slate-400 text-xs mt-1">
                  Your application has been rejected by the CarBlink Team. Please review the reason above and contact CarBlink Support at support@carblink.com to update your details or re-apply.
                </p>
              </div>
            </div>
          )}

          {clearStatus === "Pending" && (
            <div id="partner-status-banner-pending" className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-200 shadow-sm flex items-start gap-3.5 mb-2">
              <Clock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs sm:text-sm">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-amber-300 text-base">Application Status: Pending</p>
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded-md border border-amber-500/30">
                    Awaiting Review
                  </span>
                </div>
                <p className="text-amber-200/90 mt-1">
                  Your workshop application and documents have been submitted and are under review by our operations team.
                </p>
                <p className="text-slate-400 text-xs mt-1">
                  You will be notified immediately when the CarBlink Team approves or rejects your application.
                </p>
              </div>
            </div>
          )}

          {clearStatus === "Approved" && (
            <div id="partner-status-banner-approved" className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-200 shadow-sm flex items-start gap-3.5 mb-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-xs sm:text-sm">
                <p className="font-bold text-emerald-300 text-base">Application Status: Approved</p>
                <p className="text-emerald-200/90 mt-1">
                  Congratulations! Your application has been approved by the CarBlink Team.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* KYC Content & Upload Pending Checklist */}
        <main className="flex-1 max-w-7xl mx-auto w-full min-w-0 px-4 py-4 overflow-x-hidden">
          {children}
        </main>

        {/* Status Change Modal Popup */}
        {renderStatusModal()}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-bg flex w-full min-w-0 max-w-full overflow-x-hidden">
      {/* Fixed Sidebar */}
      <Sidebar 
        isCollapsed={isSidebarCollapsed} 
        toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
      />
      
      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col min-h-screen min-w-0 w-full max-w-full overflow-x-hidden transition-all duration-300 ${isSidebarCollapsed ? 'md:ml-20' : 'md:ml-64'}`}>
        <Header />
        
        {/* Approved Status Banner */}
        <div className="max-w-7xl mx-auto w-full px-4 pt-4">
          <div id="partner-status-banner-approved" className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-800 flex items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <p className="text-xs font-bold text-emerald-900">Application Status: Approved</p>
                <p className="text-[11px] text-emerald-700">Your CarBlink Partner account is active and verified. You have full operational access.</p>
              </div>
            </div>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 bg-emerald-600 text-white rounded-full">
              Status: Approved
            </span>
          </div>
        </div>

        <main className="flex-1 min-w-0 w-full max-w-full p-3 sm:p-4 md:p-6 overflow-x-hidden">
          {children}
        </main>
      </div>

      {/* Status Change Modal Popup */}
      {renderStatusModal()}
    </div>
  );
}
