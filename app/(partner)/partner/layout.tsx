"use client";

import React, { useEffect, useState, useCallback } from "react";
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
  Radio 
} from "lucide-react";
import toast from "react-hot-toast";

export default function PartnerLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user, logout, isLoading, refreshUser } = useAuth();
  const { socket, isConnected } = useSocket();
  const router = useRouter();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isCheckingLive, setIsCheckingLive] = useState(false);

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
  const isFullyApproved =
    (status === "APPROVED_VERIFIED" || status === "APPROVED") &&
    isVerified &&
    isActive;
  const isSuspended = status === "SUSPENDED" || !isActive;
  const isRejected = status === "REJECTED" || executiveStatus === "REJECTED";
  const isManualReview = status === "MANUAL_VERIFICATION_REQUIRED";

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
    if (!socket || isFullyApproved) return;

    const handleLiveEvent = async (payload: any) => {
      console.log("[PartnerLayout] Live verification event received:", payload);
      try {
        await refreshUser();
        if (payload?.status === "APPROVED" || payload?.status === "APPROVED_VERIFIED" || payload?.isVerified) {
          toast.success("🎉 Congratulations! Your CarBlink Partner Account is Approved!", { duration: 6000 });
        } else if (payload?.executiveVerificationStatus === "APPROVED" || payload?.status === "UNDER_REVIEW") {
          toast.success("✅ Stage 1 Passed: Executive verified your workshop details. Forwarded to Super Admin!", { duration: 5000 });
        }
      } catch (err) {
        console.error("[PartnerLayout] Error handling live socket event:", err);
      }
    };

    socket.on("partner_verified", handleLiveEvent);
    socket.on("partner_status_updated", handleLiveEvent);
    socket.on("kyc_status_changed", handleLiveEvent);
    socket.on("notification:new", handleLiveEvent);

    return () => {
      socket.off("partner_verified", handleLiveEvent);
      socket.off("partner_status_updated", handleLiveEvent);
      socket.off("kyc_status_changed", handleLiveEvent);
      socket.off("notification:new", handleLiveEvent);
    };
  }, [socket, isFullyApproved, refreshUser]);

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
      <div className="min-h-screen bg-slate-950 flex flex-col text-slate-100">
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
                    className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                      isSuspended
                        ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                        : isRejected
                        ? "bg-red-500/20 text-red-300 border border-red-500/30"
                        : isManualReview
                        ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                        : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                    }`}
                  >
                    {status}
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

        {/* Status Callout Banners with Reasons */}
        <div className="max-w-7xl mx-auto w-full px-4 pt-4">
          {isSuspended && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-300 shadow-sm flex items-start gap-3.5 mb-2">
              <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="text-xs sm:text-sm">
                <p className="font-bold text-rose-300 text-base">Account Suspended</p>
                <p className="text-rose-200 mt-0.5">
                  Reason: &quot;{partnerInfo.rejectionReason || (user as any)?.rejectionReason || "Account suspended by Administrator"}&quot;
                </p>
                <p className="text-slate-400 text-xs mt-1">
                  Access to the Partner Dashboard, receiving leads, and active jobs has been blocked immediately. Please contact CarBlink Support at support@carblink.com.
                </p>
              </div>
            </div>
          )}

          {isRejected && !isSuspended && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-300 shadow-sm flex items-start gap-3.5 mb-2">
              <ShieldAlert className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div className="text-xs sm:text-sm">
                <p className="font-bold text-red-300 text-base">Application Status: Rejected</p>
                <p className="text-red-200 mt-0.5">
                  Reason: &quot;{partnerInfo.rejectionReason || (user as any)?.rejectionReason || "Requirements or business verification criteria were not met."}&quot;
                </p>
                <p className="text-slate-400 text-xs mt-1">
                  Please contact your assigned Field Executive or Super Admin to re-evaluate your application.
                </p>
              </div>
            </div>
          )}

          {isManualReview && (
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-200 shadow-sm flex items-start gap-3.5 mb-2">
              <Clock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs sm:text-sm">
                <p className="font-bold text-amber-300 text-base">Manual Verification Required</p>
                <p className="text-amber-200 mt-0.5">
                  Reason: &quot;{partnerInfo.rejectionReason || (user as any)?.rejectionReason || "Owner name mismatch or authorized representative documents queued for manual review."}&quot;
                </p>
                <p className="text-slate-400 text-xs mt-1">
                  Our operations team is manually reviewing your documents. Dashboard access will be unlocked once approved.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* KYC Content & Upload Pending Checklist */}
        <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-4">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-bg flex">
      {/* Fixed Sidebar */}
      <Sidebar 
        isCollapsed={isSidebarCollapsed} 
        toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
      />
      
      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${isSidebarCollapsed ? 'md:ml-20' : 'md:ml-64'}`}>
        <Header />
        
        <main className="flex-1 p-4 md:p-6 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
