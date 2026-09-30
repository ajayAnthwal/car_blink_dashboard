"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useSocket } from "@/lib/SocketContext";
import { registerDeviceToken } from "@/lib/services";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { useRouter } from "next/navigation";
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

  // Check Approval Status: Partner Dashboard access unlocked ONLY when APPROVED & Verified!
  const partnerInfo = (user as any)?.partnerInfo || {};
  const status = partnerInfo.verificationStatus || (user as any)?.verificationStatus || "PENDING";
  const executiveStatus = partnerInfo.executiveVerificationStatus || (user as any)?.executiveVerificationStatus || "PENDING";
  const isExecutiveVerified = executiveStatus === "APPROVED";
  const isFullyApproved = status === "APPROVED" && (partnerInfo.isVerified || (user as any)?.isVerified);
  const isRejected = status === "REJECTED" || executiveStatus === "REJECTED";

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
        if (payload?.status === "APPROVED" || payload?.isVerified) {
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

  if (!isFullyApproved) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col justify-between p-4 md:p-8 text-slate-100">
        <div className="max-w-4xl mx-auto w-full space-y-8 my-auto">
          {/* Header */}
          <div className="bg-slate-800/80 border border-slate-700/80 p-6 rounded-3xl backdrop-blur-md flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400">
                <Building2 className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white font-heading flex items-center gap-2">
                  {partnerInfo.businessName || user.fullName || "Partner Workshop"}
                  <span className="flex items-center gap-1 text-[10px] bg-slate-700/80 text-slate-300 px-2 py-0.5 rounded-full font-mono">
                    <Radio className={`w-2.5 h-2.5 ${isConnected ? "text-emerald-400 animate-pulse" : "text-amber-400"}`} />
                    {isConnected ? "LIVE SYNC ON" : "CONNECTING..."}
                  </span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Registered Phone: <span className="font-mono text-slate-200">+91 {user.phone}</span> | Email: {user.email || "N/A"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <Button
                variant="outline"
                size="sm"
                onClick={handleManualCheck}
                disabled={isCheckingLive}
                className="border-slate-700 hover:bg-slate-800 text-amber-400 rounded-xl text-xs font-semibold"
              >
                <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isCheckingLive ? "animate-spin text-amber-400" : ""}`} />
                {isCheckingLive ? "Checking..." : "Check Status"}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => logout()}
                className="border-slate-700 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold"
              >
                <LogOut className="w-4 h-4 mr-2" /> Logout
              </Button>
            </div>
          </div>

          {/* Status Tracker Card */}
          <Card className="bg-slate-800/90 border-slate-700/80 shadow-2xl rounded-3xl text-white overflow-hidden">
            <CardHeader className="bg-slate-900/60 border-b border-slate-700/80 pb-5">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-bold text-amber-400 flex items-center gap-2">
                  <ShieldAlert className="w-6 h-6 text-amber-400" />
                  Partner Account Approval Workflow
                </CardTitle>
                <span className={`text-xs px-3.5 py-1 rounded-full font-bold uppercase tracking-wider ${
                  isRejected ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                  isExecutiveVerified ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                  'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                }`}>
                  {isRejected ? 'Application Rejected' : isExecutiveVerified ? 'Stage 2: Super Admin Review' : 'Stage 1: Executive Review'}
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-6 md:p-8 space-y-8">
              {isRejected ? (
                <div className="p-6 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-300 space-y-2">
                  <h4 className="font-bold text-lg text-red-400">Application Status: Rejected</h4>
                  <p className="text-sm">
                    Reason: &quot;{partnerInfo.rejectionReason || "Requirements or business verification criteria were not met."}&quot;
                  </p>
                  <p className="text-xs text-slate-400 pt-2">
                    Please contact your assigned Field Executive or Super Admin support to re-verify your documents.
                  </p>
                </div>
              ) : (
                <div className="p-4 bg-amber-400/10 border border-amber-400/20 rounded-2xl text-amber-200 text-xs sm:text-sm flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <strong>Dashboard Access Locked:</strong> Your partner registration was submitted successfully. As per platform security policy, full partner dashboard access (receiving leads, submitting quotes, managing jobs) unlocks <strong>automatically in real-time</strong> once <strong>Executive Review</strong> and <strong>Super Admin Approval</strong> are complete.
                  </div>
                </div>
              )}

              {/* Progress Steps */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
                {/* Step 1 */}
                <div className="bg-slate-900/80 p-5 rounded-2xl border border-emerald-500/40 relative">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Step 1</span>
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  </div>
                  <h4 className="font-bold text-white text-base mb-1">Signup Details & OTP</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Business details, contact info & OTP verified.
                  </p>
                  <span className="mt-3 text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded inline-block">COMPLETED ✓</span>
                </div>

                {/* Step 2 */}
                <div className={`p-5 rounded-2xl border transition-all duration-300 ${
                  isExecutiveVerified 
                    ? 'bg-slate-900/80 border-emerald-500/40' 
                    : 'bg-slate-900/50 border-amber-500/40'
                }`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-xs font-bold uppercase tracking-wider ${isExecutiveVerified ? 'text-emerald-400' : 'text-amber-400'}`}>Step 2</span>
                    {isExecutiveVerified ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <Clock className="w-5 h-5 text-amber-400 animate-pulse" />}
                  </div>
                  <h4 className="font-bold text-white text-base mb-1">Executive Review</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Field Executive inspection & workshop address verification.
                  </p>
                  <span className={`mt-3 text-[10px] font-bold px-2 py-0.5 rounded inline-block ${
                    isExecutiveVerified ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                  }`}>
                    {isExecutiveVerified ? 'VERIFIED ✓' : 'IN PROGRESS ⏳'}
                  </span>
                </div>

                {/* Step 3 */}
                <div className={`p-5 rounded-2xl border transition-all duration-300 ${
                  isFullyApproved 
                    ? 'bg-slate-900/80 border-emerald-500/40' 
                    : 'bg-slate-900/30 border-slate-700/60 opacity-90'
                }`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-xs font-bold uppercase tracking-wider ${isFullyApproved ? 'text-emerald-400' : 'text-slate-400'}`}>Step 3</span>
                    {isFullyApproved ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <Lock className="w-5 h-5 text-slate-500" />}
                  </div>
                  <h4 className="font-bold text-slate-300 text-base mb-1">Super Admin Authorization</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Final KYC clearance & partner dashboard activation.
                  </p>
                  <span className={`mt-3 text-[10px] font-bold px-2 py-0.5 rounded inline-block ${
                    isFullyApproved ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {isFullyApproved ? 'ACTIVATED ✓' : 'PENDING APPROVAL'}
                  </span>
                </div>
              </div>

              {/* Registered Info Summary */}
              <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-700/80 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Submitted Registration Details</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-slate-500 block">Workshop Name:</span>
                    <span className="font-bold text-slate-200">{partnerInfo.businessName || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Owner / Contact:</span>
                    <span className="font-bold text-slate-200">{partnerInfo.ownerName || user.fullName || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">GST Number:</span>
                    <span className="font-bold text-slate-200 font-mono">{partnerInfo.gstNumber || "Not Provided"}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">MSME / Udyam No:</span>
                    <span className="font-bold text-slate-200 font-mono">{partnerInfo.msmeNumber || "Not Provided"}</span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-slate-500 block">Workshop Address:</span>
                    <span className="font-bold text-slate-200">{partnerInfo.businessAddress || "N/A"}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="text-center text-xs text-slate-500 pt-6">
          Need assistance? Contact CarBlink Partner Support: <span className="text-amber-400 font-medium">support@carblink.com</span>
        </div>
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
