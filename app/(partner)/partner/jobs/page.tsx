// @ts-nocheck
"use client";

import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/Select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileUpload } from "@/components/ui/FileUpload";
import { Wrench, Loader2, ChevronDown, ChevronUp, Image as ImageIcon, FileText, CheckCircle2, PlayCircle, MapPin, Calendar, Car, UserCheck, PlusCircle, HandCoins, Search, Filter, ChevronLeft, ChevronRight, ShieldAlert, Clock, Sparkles, DollarSign, ShieldCheck, Lock, Plus } from "lucide-react";
import toast from "react-hot-toast";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import {
  usePartnerJobs,
  usePartnerStaff,
  useStartJobMutation,
  useVerifyCustomerCodeMutation,
  useCompleteJobMutation,
  useUploadInvoiceMutation,
  useUploadPhotosMutation,
  useAssignStaffMutation,
  useRequestJobExtensionMutation,
  useDeletePhotoMutation,
  useMarkOfflinePaymentMutation,
  useVerifyOfflinePaymentMutation
} from "@/features/partner/hooks/usePartnerQueries";

export default function PartnerJobsPage() {
  const [activeTab, setActiveTab] = useState<"ALL" | "IN_PROGRESS" | "NOT_STARTED" | "COMPLETED">("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [quickPinCode, setQuickPinCode] = useState("");
  const [verifyStatusResult, setVerifyStatusResult] = useState<{ type: "success" | "error" | ""; text: string }>({ type: "", text: "" });
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Fetch jobs with pagination and status filter from query
  const queryParams = useMemo(() => {
    return {
      page,
      limit,
      status: activeTab !== "ALL" ? activeTab : undefined
    };
  }, [page, limit, activeTab]);

  const { data: jobsData, isLoading: isLoadingJobs, refetch: refetchJobs } = usePartnerJobs(queryParams);
  const { data: staffList = [], isLoading: isLoadingStaff } = usePartnerStaff();

  const allJobsRaw = jobsData?.jobs || [];
  const totalJobsCount = jobsData?.total || allJobsRaw.length;
  const isLoading = isLoadingJobs || isLoadingStaff;

  // Search Filter
  const jobs = useMemo(() => {
    if (!searchTerm.trim()) return allJobsRaw;
    const term = searchTerm.toLowerCase();
    return allJobsRaw.filter((j: any) => {
      const sName = (j.bookingId?.serviceId?.name || "").toLowerCase();
      const brand = (j.bookingId?.vehicleId?.brand || "").toLowerCase();
      const model = (j.bookingId?.vehicleId?.model || "").toLowerCase();
      const reg = (j.bookingId?.vehicleId?.registrationNumber || "").toLowerCase();
      const city = (j.bookingId?.cityId?.name || "").toLowerCase();
      const id = (j._id || j.id || "").toLowerCase();
      return sName.includes(term) || brand.includes(term) || model.includes(term) || reg.includes(term) || city.includes(term) || id.includes(term);
    });
  }, [allJobsRaw, searchTerm]);

  // Statistics Breakdown
  const stats = useMemo(() => {
    return {
      total: totalJobsCount,
      inProgress: allJobsRaw.filter((j: any) => j.status === "IN_PROGRESS").length,
      notStarted: allJobsRaw.filter((j: any) => j.status === "NOT_STARTED").length,
      completed: allJobsRaw.filter((j: any) => j.status === "COMPLETED").length,
    };
  }, [allJobsRaw, totalJobsCount]);

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [message, setMessage] = useState({ type: "", text: "" });

  const [startJobModal, setStartJobModal] = useState<{ open: boolean; jobId: string; pin: string; error: string }>({
    open: false,
    jobId: "",
    pin: "",
    error: ""
  });

  const startJobMutation = useStartJobMutation();
  const verifyCustomerCodeMutation = useVerifyCustomerCodeMutation();
  const completeJobMutation = useCompleteJobMutation();
  const uploadInvoiceMutation = useUploadInvoiceMutation();

  const handleQuickVerifyCode = async () => {
    if (!quickPinCode || quickPinCode.trim().length !== 4) {
      setVerifyStatusResult({ type: "error", text: "Please enter a valid 4-digit Customer Verification PIN." });
      return;
    }
    setVerifyStatusResult({ type: "", text: "" });
    try {
      const res = await verifyCustomerCodeMutation.mutateAsync({ verificationCode: quickPinCode.trim() });
      setVerifyStatusResult({ type: "success", text: res?.message || "✓ Customer Verified! Booking status updated to VERIFIED & IN_PROGRESS." });
      setQuickPinCode("");
    } catch (err: any) {
      setVerifyStatusResult({ type: "error", text: err?.message || "✕ Verification Failed. Invalid, expired, or cancelled code." });
    }
  };
  const uploadPhotosMutation = useUploadPhotosMutation();
  const assignStaffMutation = useAssignStaffMutation();
  const requestExtensionMutation = useRequestJobExtensionMutation();
  const deletePhotoMutation = useDeletePhotoMutation();
  const markOfflinePaymentMutation = useMarkOfflinePaymentMutation();
  const verifyOfflinePaymentMutation = useVerifyOfflinePaymentMutation();

  const [finalAmount, setFinalAmount] = useState("");
  const [invoiceUrl, setInvoiceUrl] = useState<string>("");
  const [beforePhotoFiles, setBeforePhotoFiles] = useState<File[]>([]);
  const [afterPhotoFiles, setAfterPhotoFiles] = useState<File[]>([]);
  const [mechanicId, setMechanicId] = useState("");

  const [extPartName, setExtPartName] = useState("");
  const [extCost, setExtCost] = useState("");
  const [extReason, setExtReason] = useState("");

  const totalPages = Math.ceil(totalJobsCount / limit) || 1;

  const handleStartJob = async (jobId: string, verificationCode: string) => {
    if (!verificationCode || verificationCode.trim().length !== 4) {
      setStartJobModal(prev => ({ ...prev, error: "Please enter a valid 4-digit Customer Verification PIN." }));
      return;
    }
    setMessage({ type: "", text: "" });
    try {
      const res = await verifyCustomerCodeMutation.mutateAsync({ jobId, verificationCode: verificationCode.trim() });
      try {
        await startJobMutation.mutateAsync({ jobId, verificationCode: verificationCode.trim() });
      } catch (startErr) {}
      setMessage({ type: "success", text: res?.message || "✓ Customer Verified & Work Started! Real-time notifications sent to Customer and Executive." });
      setStartJobModal({ open: false, jobId: "", pin: "", error: "" });
    } catch (err: any) {
      setStartJobModal(prev => ({ ...prev, error: err?.message || "Invalid Customer Verification PIN." }));
    }
  };

  const handleStartJobWithPin = handleStartJob;

  const handleStartWorkDirect = async (jobId: string) => {
    setMessage({ type: "", text: "" });
    try {
      await startJobMutation.mutateAsync({ jobId });
      setMessage({ type: "success", text: "🚀 Work Started! Customer and Executive notified in real-time." });
    } catch (err: any) {
      setMessage({ type: "error", text: err?.message || "Failed to start work. Verification PIN required first." });
    }
  };

  const handleCompleteJob = async (job: any) => {
    setMessage({ type: "", text: "" });
    try {
      const hasInvoice = job.invoiceUrl || job.invoice || job.hasInvoice || invoiceUrl;

      if (!hasInvoice && invoiceItems.length > 0 && invoiceItems.some(i => i.description && Number(i.unitPrice) > 0)) {
        await handleSubmitItemizedInvoice(job._id || job.id);
      } else if (!hasInvoice) {
        setMessage({ type: "error", text: "Please submit an itemized bill form or upload an invoice document before completing the job." });
        return;
      }

      const payload: any = {};
      if (finalAmount) payload.finalAmount = parseFloat(finalAmount);
      if (invoiceUrl) payload.invoiceUrl = invoiceUrl;

      await completeJobMutation.mutateAsync({ jobId: job._id || job.id, payload });
      setMessage({ type: "success", text: "Job marked as complete!" });
      setFinalAmount("");
    } catch (err: any) {
      setMessage({ type: "error", text: err?.message || "Failed to complete job." });
    }
  };

  const handleUploadInvoice = async (id: string) => {
    if (!invoiceUrl) return;
    setMessage({ type: "", text: "" });
    try {
      await uploadInvoiceMutation.mutateAsync({ jobId: id, payload: { invoiceUrl } });
      setMessage({ type: "success", text: "Invoice linked successfully!" });
      setInvoiceUrl("");
    } catch (err: any) {
      setMessage({ type: "error", text: err?.message || "Failed to link invoice." });
    }
  };

  const handleUploadPhotos = async (id: string, type: "BEFORE" | "AFTER") => {
    const files = type === "BEFORE" ? beforePhotoFiles : afterPhotoFiles;
    if (files.length === 0) return;

    setMessage({ type: "", text: "" });
    try {
      const formData = new FormData();
      formData.append("type", type);
      files.forEach((file) => formData.append("photos", file));

      await uploadPhotosMutation.mutateAsync({ jobId: id, formData });
      setMessage({ type: "success", text: `${type === "BEFORE" ? "Before" : "After"} service photos uploaded successfully!` });

      if (type === "BEFORE") setBeforePhotoFiles([]);
      else setAfterPhotoFiles([]);
    } catch (err: any) {
      setMessage({ type: "error", text: err?.message || "Failed to upload photos." });
    }
  };

  const handleDeletePhoto = async (id: string, photoUrl: string, type: "BEFORE" | "AFTER") => {
    setMessage({ type: "", text: "" });
    try {
      await deletePhotoMutation.mutateAsync({ jobId: id, photoUrl, type });
      setMessage({ type: "success", text: "Photo deleted successfully!" });
    } catch (err: any) {
      setMessage({ type: "error", text: err?.message || "Failed to delete photo." });
    }
  };

  const handleAssignMechanic = async (id: string) => {
    if (!mechanicId) return;
    setMessage({ type: "", text: "" });
    try {
      await assignStaffMutation.mutateAsync({ jobId: id, mechanicId });
      setMessage({ type: "success", text: "Mechanic assigned successfully!" });
      setMechanicId("");
    } catch (err: any) {
      setMessage({ type: "error", text: err?.message || "Failed to assign mechanic." });
    }
  };

  const handleRequestExtension = async (id: string) => {
    if (!extPartName || !extCost || !extReason) return;
    setMessage({ type: "", text: "" });
    try {
      await requestExtensionMutation.mutateAsync({
        jobId: id,
        payload: { partName: extPartName, cost: Number(extCost), reason: extReason }
      });
      setMessage({ type: "success", text: "Extension requested from customer!" });
      setExtPartName(""); setExtCost(""); setExtReason("");
    } catch (err: any) {
      setMessage({ type: "error", text: err?.message || "Failed to request extension." });
    }
  };

  const handleMarkOfflinePayment = async (bookingId: string, amount: number, paymentType: string) => {
    setMessage({ type: "", text: "" });
    try {
      await markOfflinePaymentMutation.mutateAsync({ bookingId, amount, paymentType });
      setMessage({ type: "success", text: `${paymentType} payment marked as received in cash.` });
    } catch (err: any) {
      setMessage({ type: "error", text: err?.message || "Failed to mark offline payment." });
    }
  };

  const handleVerifyOfflinePayment = async (paymentId: string) => {
    setMessage({ type: "", text: "" });
    try {
      await verifyOfflinePaymentMutation.mutateAsync(paymentId);
      setMessage({ type: "success", text: "Cash payment verified successfully." });
    } catch (err: any) {
      setMessage({ type: "error", text: err?.message || "Failed to verify cash payment." });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toUpperCase()) {
      case "COMPLETED":
        return <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider flex items-center gap-1 shadow-sm"><CheckCircle2 className="w-3.5 h-3.5" /> Completed</span>;
      case "VERIFIED":
        return <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider flex items-center gap-1 shadow-sm"><ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Verified / Work Ready</span>;
      case "IN_PROGRESS":
        return <span className="bg-blue-50 text-blue-700 border border-blue-200 text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider flex items-center gap-1 shadow-sm"><Clock className="w-3.5 h-3.5 animate-spin" /> Work Started</span>;
      case "NOT_STARTED":
        return <span className="bg-amber-50 text-amber-700 border border-amber-200 text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider flex items-center gap-1 shadow-sm"><Clock className="w-3.5 h-3.5" /> Awaiting Verification</span>;
      default:
        return <span className="bg-gray-100 text-gray-700 border border-gray-200 text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider">{status}</span>;
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-primary-navy via-slate-800 to-primary-navy p-6 rounded-2xl text-white shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-primary-orange text-white text-[10px] font-black px-2.5 py-0.5 rounded uppercase tracking-wider">
              PARTNER OPERATIONS
            </span>
            <span className="text-gray-400 text-xs">• Workspace</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight font-heading flex items-center gap-2">
            My Service Jobs <Wrench className="w-6 h-6 text-primary-orange" />
          </h1>
          <p className="text-gray-300 text-xs md:text-sm mt-1 font-medium">
            Manage assigned customer vehicles, mechanics, extra parts, and invoice submissions in real-time.
          </p>
        </div>

        {/* Header Action Summary */}
        <div className="flex items-center gap-3">
          <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/10 text-center min-w-[90px]">
            <span className="text-[10px] text-gray-300 uppercase font-bold block">In Progress</span>
            <span className="text-xl font-extrabold text-blue-400">{stats.inProgress}</span>
          </div>
          <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/10 text-center min-w-[90px]">
            <span className="text-[10px] text-gray-300 uppercase font-bold block">Completed</span>
            <span className="text-xl font-extrabold text-emerald-400">{stats.completed}</span>
          </div>
        </div>
      </div>

      {/* Real-Time Customer Verification Tool */}
      <Card className="shadow-sm border-2 border-primary-orange/30 rounded-2xl overflow-hidden bg-gradient-to-r from-orange-50/80 via-white to-amber-50/80">
        <CardContent className="p-4 md:p-5 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3 w-full md:w-auto">
            <div className="w-10 h-10 rounded-xl bg-orange-100 text-primary-orange flex items-center justify-center font-bold shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-gray-900 flex items-center gap-1.5">
                Real-Time Customer Verification Tool
              </h4>
              <p className="text-[11px] text-gray-600 font-medium">
                Enter Customer 4-digit PIN to verify booking status & authorize service work
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 w-full md:w-auto">
            <input
              type="text"
              maxLength={4}
              placeholder="Enter 4-Digit PIN"
              value={quickPinCode}
              onChange={(e) => setQuickPinCode(e.target.value.replace(/\D/g, ''))}
              className="px-3 py-2 text-sm font-mono tracking-widest font-bold border-2 border-orange-200 rounded-xl focus:outline-none focus:border-primary-orange text-center w-36 bg-white"
            />
            <Button
              onClick={handleQuickVerifyCode}
              isLoading={verifyCustomerCodeMutation.isPending}
              className="bg-primary-orange hover:bg-orange-600 text-white font-bold text-xs py-2.5 px-4 rounded-xl shrink-0"
            >
              Verify Customer
            </Button>
          </div>
        </CardContent>

        {verifyStatusResult.text && (
          <div className={`px-5 py-2.5 text-xs font-bold border-t flex items-center justify-between ${
            verifyStatusResult.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-red-50 text-red-800 border-red-200"
          }`}>
            <div className="flex items-center gap-2">
              {verifyStatusResult.type === "success" ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <ShieldAlert className="w-4 h-4 text-red-600 font-bold" />}
              <span>{verifyStatusResult.text}</span>
            </div>
            <button onClick={() => setVerifyStatusResult({ type: "", text: "" })} className="text-[11px] underline opacity-70 hover:opacity-100">
              Dismiss
            </button>
          </div>
        )}
      </Card>

      {/* Global Alert Message */}
      {message.text && (
        <div className={`p-4 rounded-xl text-sm font-bold border flex items-center justify-between shadow-sm animate-in fade-in ${
          message.type === "success"
            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
            : "bg-red-50 text-red-800 border-red-200"
        }`}>
          <div className="flex items-center gap-2">
            {message.type === "success" ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <ShieldAlert className="w-5 h-5 text-red-600" />}
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage({ type: "", text: "" })} className="text-xs underline font-bold opacity-70 hover:opacity-100">
            Dismiss
          </button>
        </div>
      )}

      {/* Control Bar: Status Tabs + Search + Items per Page */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Status Tabs */}
          <div className="flex items-center bg-gray-100/80 p-1 rounded-xl w-full md:w-auto overflow-x-auto custom-scrollbar">
            <button
              onClick={() => { setActiveTab("ALL"); setPage(1); }}
              className={`px-4 py-2 rounded-lg text-xs font-extrabold transition-all duration-200 shrink-0 ${
                activeTab === "ALL" ? "bg-white text-primary-navy shadow-sm" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              All Jobs ({stats.total})
            </button>
            <button
              onClick={() => { setActiveTab("IN_PROGRESS"); setPage(1); }}
              className={`px-4 py-2 rounded-lg text-xs font-extrabold transition-all duration-200 shrink-0 ${
                activeTab === "IN_PROGRESS" ? "bg-white text-blue-600 shadow-sm" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              In Progress ({stats.inProgress})
            </button>
            <button
              onClick={() => { setActiveTab("NOT_STARTED"); setPage(1); }}
              className={`px-4 py-2 rounded-lg text-xs font-extrabold transition-all duration-200 shrink-0 ${
                activeTab === "NOT_STARTED" ? "bg-white text-amber-600 shadow-sm" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Ready to Start ({stats.notStarted})
            </button>
            <button
              onClick={() => { setActiveTab("COMPLETED"); setPage(1); }}
              className={`px-4 py-2 rounded-lg text-xs font-extrabold transition-all duration-200 shrink-0 ${
                activeTab === "COMPLETED" ? "bg-white text-emerald-600 shadow-sm" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Completed ({stats.completed})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by vehicle, service, city..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-orange/50 bg-gray-50/50 font-medium"
            />
          </div>
        </div>
      </div>

      {/* Main Jobs Cards List */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-16 bg-white rounded-2xl shadow-sm border border-gray-100 space-y-3">
          <Loader2 className="w-9 h-9 text-primary-orange animate-spin" />
          <p className="text-xs text-gray-500 font-bold">Loading assigned jobs...</p>
        </div>
      ) : jobs.length === 0 ? (
        <div className="bg-white p-16 rounded-2xl shadow-sm border border-gray-100 text-center space-y-3">
          <div className="w-14 h-14 bg-orange-50 text-primary-orange rounded-full flex items-center justify-center mx-auto border border-orange-100">
            <Wrench className="w-6 h-6 opacity-60" />
          </div>
          <h3 className="text-base font-bold text-gray-900">No jobs found</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            {searchTerm ? `No service jobs matching "${searchTerm}". Try resetting your search.` : "You don't have any service jobs in this tab right now."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {jobs.map((job: any) => {
            const jobId = job._id || job.id || "";
            const isExpanded = expandedId === jobId;
            const bData = typeof job.bookingId === 'object' && job.bookingId ? job.bookingId : {};
            const vData = typeof bData.vehicleId === 'object' && bData.vehicleId ? bData.vehicleId : {};
            const sData = typeof bData.serviceId === 'object' && bData.serviceId ? bData.serviceId : {};
            const cData = typeof bData.cityId === 'object' && bData.cityId ? bData.cityId : {};

            return (
              <Card key={jobId} className={`transition-all duration-300 border bg-white overflow-hidden shadow-sm hover:shadow-md ${
                isExpanded ? "border-primary-orange ring-1 ring-primary-orange/30" : "border-gray-200/80"
              }`}>
                {/* Top Card Header Bar */}
                <CardContent className="p-0">
                  <div
                    onClick={() => setExpandedId(isExpanded ? null : jobId)}
                    className="p-5 flex items-start justify-between cursor-pointer hover:bg-gray-50/60 transition-colors"
                  >
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center justify-between pr-4">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-extrabold text-gray-900 font-heading">
                            {sData.name || "Car Service Job"}
                          </h3>
                          <span className="text-[10px] font-mono text-gray-400 bg-gray-100 px-2 py-0.5 rounded font-bold">
                            #{(jobId || "").slice(-6).toUpperCase()}
                          </span>
                        </div>
                        {getStatusBadge(job.status)}
                      </div>

                      {/* Info Chips */}
                      <div className="flex flex-wrap gap-4 text-xs text-gray-600 font-medium">
                        <span className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-100">
                          <Car className="w-3.5 h-3.5 text-primary-orange" />
                          <strong className="text-gray-900">{vData.brand || "Vehicle"} {vData.model || ""}</strong> ({vData.registrationNumber || "N/A"})
                        </span>

                        {cData.name && (
                          <span className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-100">
                            <MapPin className="w-3.5 h-3.5 text-blue-500" /> {cData.name}
                          </span>
                        )}

                        <span className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-100">
                          <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                          {bData.preferredDate && !isNaN(new Date(bData.preferredDate).getTime())
                            ? new Date(bData.preferredDate).toLocaleDateString()
                            : "Date N/A"}
                        </span>

                        {job.hasInvoice && (
                          <span className="flex items-center gap-1 bg-emerald-50 text-emerald-700 font-bold px-2.5 py-1 rounded-lg border border-emerald-200 text-[11px]">
                            <FileText className="w-3.5 h-3.5 text-emerald-600" /> Invoice Linked
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="p-2 text-gray-400 group-hover:text-gray-700 transition-colors">
                      {isExpanded ? <ChevronUp className="w-5 h-5 text-primary-orange" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                  </div>

                  {/* Expanded Workstation Panel */}
                  {isExpanded && (
                    <ErrorBoundary>
                    <div className="p-6 border-t border-gray-100 bg-slate-50/50 space-y-6 animate-in fade-in">
                      {/* Section 1: Photos Uploads (Before & After) */}
                      {(job.status === "IN_PROGRESS" || job.status === "COMPLETED") && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Before Photos */}
                          <div className="bg-white border border-gray-200/80 p-5 rounded-2xl shadow-sm space-y-4">
                            <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2 border-b border-gray-100 pb-3">
                              <ImageIcon className="w-4 h-4 text-primary-orange" /> Before Service Inspection Photos
                            </h4>

                            <input
                              type="file"
                              multiple
                              accept="image/*"
                              onChange={(e) => {
                                if (e.target.files) setBeforePhotoFiles(Array.from(e.target.files));
                              }}
                              className="w-full text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-orange-50 file:text-primary-orange hover:file:bg-orange-100 cursor-pointer"
                            />

                            {Array.isArray(job.beforePhotos) && job.beforePhotos.length > 0 && (
                              <div className="flex gap-2 overflow-x-auto py-1">
                                {job.beforePhotos.map((url: string, idx: number) => (
                                  <div key={idx} className="relative flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border border-gray-200 group">
                                    <img src={url} alt={`Before ${idx}`} className="w-full h-full object-cover" />
                                    <button
                                      onClick={() => handleDeletePhoto(jobId, url, "BEFORE")}
                                      className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                      title="Delete Photo"
                                    >
                                      ×
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}

                            <Button
                              className="w-full bg-slate-900 hover:bg-black text-white font-bold text-xs py-2 rounded-xl"
                              disabled={beforePhotoFiles.length === 0}
                              isLoading={uploadPhotosMutation.isPending}
                              onClick={() => handleUploadPhotos(jobId, "BEFORE")}
                            >
                              Upload Before Photos
                            </Button>
                          </div>

                          {/* After Photos */}
                          <div className="bg-white border border-gray-200/80 p-5 rounded-2xl shadow-sm space-y-4">
                            <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2 border-b border-gray-100 pb-3">
                              <ImageIcon className="w-4 h-4 text-emerald-600" /> After Service Photos
                            </h4>

                            <input
                              type="file"
                              multiple
                              accept="image/*"
                              onChange={(e) => {
                                if (e.target.files) setAfterPhotoFiles(Array.from(e.target.files));
                              }}
                              className="w-full text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                            />

                            {Array.isArray(job.afterPhotos) && job.afterPhotos.length > 0 && (
                              <div className="flex gap-2 overflow-x-auto py-1">
                                {job.afterPhotos.map((url: string, idx: number) => (
                                  <div key={idx} className="relative flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border border-gray-200 group">
                                    <img src={url} alt={`After ${idx}`} className="w-full h-full object-cover" />
                                    <button
                                      onClick={() => handleDeletePhoto(jobId, url, "AFTER")}
                                      className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                      title="Delete Photo"
                                    >
                                      ×
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}

                            <Button
                              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 rounded-xl"
                              disabled={afterPhotoFiles.length === 0}
                              isLoading={uploadPhotosMutation.isPending}
                              onClick={() => handleUploadPhotos(jobId, "AFTER")}
                            >
                              Upload After Photos
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Section 2: Mechanic Assignment & Extra Parts */}
                      {job.status === "IN_PROGRESS" && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Assign Mechanic */}
                          <div className="bg-white border border-gray-200/80 p-5 rounded-2xl shadow-sm space-y-4">
                            <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2 border-b border-gray-100 pb-3">
                              <UserCheck className="w-4 h-4 text-blue-600" /> Assign Mechanic / Specialist
                            </h4>

                            <Select
                              value={mechanicId}
                              onChange={(e) => setMechanicId(e.target.value)}
                              options={[
                                { value: "", label: "Select a Staff Mechanic..." },
                                ...(Array.isArray(staffList) ? staffList : []).map((staff: any) => ({
                                  value: staff?._id || staff?.id || "",
                                  label: `${staff?.name || "Staff"} (${staff?.role || "Mechanic"})`
                                }))
                              ]}
                              className="text-xs rounded-xl border-gray-200"
                            />

                            <Button
                              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2 rounded-xl"
                              disabled={!mechanicId}
                              isLoading={assignStaffMutation.isPending}
                              onClick={() => handleAssignMechanic(jobId)}
                            >
                              Assign to Job
                            </Button>
                          </div>

                          {/* Request Job Extension (Extra Part) */}
                          <div className="bg-white border border-orange-200/80 p-5 rounded-2xl shadow-sm space-y-4">
                            <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2 border-b border-gray-100 pb-3">
                              <PlusCircle className="w-4 h-4 text-primary-orange" /> Request Extra Part / Charges
                            </h4>

                            <div className="space-y-2">
                              <Input
                                placeholder="Part Name (e.g. Brake Pads)"
                                value={extPartName}
                                onChange={(e) => setExtPartName(e.target.value)}
                                className="text-xs rounded-xl"
                              />
                              <div className="grid grid-cols-2 gap-2">
                                <Input
                                  type="number"
                                  placeholder="Cost (₹)"
                                  value={extCost}
                                  onChange={(e) => setExtCost(e.target.value)}
                                  className="text-xs rounded-xl"
                                />
                                <Input
                                  placeholder="Reason"
                                  value={extReason}
                                  onChange={(e) => setExtReason(e.target.value)}
                                  className="text-xs rounded-xl"
                                />
                              </div>
                            </div>

                            <Button
                              className="w-full bg-primary-navy hover:bg-slate-900 text-white font-bold text-xs py-2 rounded-xl"
                              disabled={!extPartName || !extCost || !extReason}
                              isLoading={requestExtensionMutation.isPending}
                              onClick={() => handleRequestExtension(jobId)}
                            >
                              Send Extension Request to Customer
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Section 3: Invoice Submission Form */}
                      {(job.status === "IN_PROGRESS" || job.status === "COMPLETED") && (
                        <JobInvoiceSection job={job} onInvoiceSubmitted={() => refetchJobs()} />
                      )}

                      {/* Section 4: Final Job Actions & Cash Verification */}
                      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-md space-y-4">
                        <h4 className="font-bold text-sm text-gray-200 border-b border-gray-800 pb-3 flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Job Status & Work Start Actions
                        </h4>

                        {/* Mandatory Gate: Not Verified yet */}
                        {job.status !== "IN_PROGRESS" && job.status !== "COMPLETED" && !(bData.isVerifiedByPartner || job.status === "VERIFIED") && (
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-amber-500/10 border border-amber-500/30 p-4 rounded-2xl">
                            <div className="space-y-1">
                              <p className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                                <ShieldAlert className="w-4 h-4 text-amber-400" /> Customer Verification Required (Work Start Locked 🔒)
                              </p>
                              <p className="text-[11px] text-gray-300">
                                Enter Customer 4-digit PIN to verify handover. "Start Work" button remains disabled until customer is verified.
                              </p>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <Button
                                onClick={() => setStartJobModal({ open: true, jobId, pin: "", error: "" })}
                                className="bg-primary-orange hover:bg-orange-600 text-white font-bold text-xs rounded-xl"
                              >
                                <ShieldCheck className="w-4 h-4 mr-1.5" /> Verify PIN
                              </Button>
                              <Button
                                disabled={true}
                                className="bg-gray-800 text-gray-500 border border-gray-700 font-bold text-xs rounded-xl cursor-not-allowed opacity-60"
                                title="Verify Customer PIN first to enable Work Start"
                              >
                                <PlayCircle className="w-4 h-4 mr-1.5 text-gray-500" /> Start Work (Locked)
                              </Button>
                            </div>
                          </div>
                        )}

                        {/* Verified / Work Ready State */}
                        {job.status !== "IN_PROGRESS" && job.status !== "COMPLETED" && (bData.isVerifiedByPartner || job.status === "VERIFIED") && (
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-2xl">
                            <div className="space-y-1">
                              <p className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Customer Verified — Status: Verified / Work Ready
                              </p>
                              <p className="text-[11px] text-gray-300">
                                Customer vehicle handover verified. Click "Start Work" below to begin active service.
                              </p>
                            </div>

                            <Button
                              onClick={() => handleStartWorkDirect(jobId)}
                              isLoading={startJobMutation.isPending}
                              className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs px-6 py-3 rounded-xl shadow-lg"
                            >
                              <PlayCircle className="w-4 h-4 mr-1.5" /> Start Work Now 🚀
                            </Button>
                          </div>
                        )}

                        {job.status === "IN_PROGRESS" && (
                          <div className="space-y-4">
                            <div className="flex flex-col sm:flex-row items-end gap-3">
                              <div className="flex-1 w-full">
                                <label className="block text-[11px] font-bold text-gray-300 mb-1">Final Amount (₹) (Optional)</label>
                                <input
                                  type="number"
                                  placeholder="If different from bid"
                                  value={finalAmount}
                                  onChange={(e) => setFinalAmount(e.target.value)}
                                  className="w-full px-3 py-2 text-xs border border-gray-700 rounded-xl bg-slate-800 text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                />
                              </div>
                              <Button
                                onClick={() => handleCompleteJob(job)}
                                isLoading={completeJobMutation.isPending}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2.5 px-6 rounded-xl w-full sm:w-auto shadow-md"
                              >
                                <CheckCircle2 className="w-4 h-4 mr-1.5" /> Complete Service Job
                              </Button>
                            </div>
                          </div>
                        )}

                        {job.status === "COMPLETED" && (
                          <div className="space-y-4">
                            <div className="bg-emerald-500/10 border border-emerald-500/30 p-3.5 rounded-xl text-emerald-300 text-xs font-bold flex items-center justify-between gap-2">
                              <span className="flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Service completed successfully!
                              </span>
                              <a
                                href={`/partner/warranty?jobId=${job._id}`}
                                className="bg-primary-orange hover:bg-orange-600 text-white font-bold text-xs py-1.5 px-3 rounded-lg flex items-center gap-1 transition-colors"
                              >
                                <ShieldCheck className="w-3.5 h-3.5" /> Issue Service Warranty
                              </a>
                            </div>

                            {/* Settlement Breakdown Card as per Specification */}
                            {(() => {
                              const totalVal = (job.advanceAmount || 0) + (job.finalAmount || 0) || job.estimatedCost || 0;
                              const platformFee = Math.round(totalVal * 0.15);
                              const netPayable = totalVal - platformFee;

                              return (
                                <div className="bg-slate-800/90 border border-slate-700/80 p-4 rounded-2xl text-xs space-y-2.5 shadow-md">
                                  <div className="flex justify-between items-center text-gray-300 font-medium pb-2 border-b border-slate-700">
                                    <span>Total Service Value</span>
                                    <span className="font-bold text-white">₹{totalVal.toLocaleString('en-IN')}</span>
                                  </div>
                                  <div className="flex justify-between items-center text-gray-400 font-medium">
                                    <span>CarBlink Platform Fee (15%)</span>
                                    <span className="font-bold text-red-400">- ₹{platformFee.toLocaleString('en-IN')}</span>
                                  </div>
                                  <div className="flex justify-between items-center text-emerald-400 font-bold text-sm pt-2 border-t border-slate-700">
                                    <span>Partner Net Settlement</span>
                                    <span className="text-base font-extrabold">₹{netPayable.toLocaleString('en-IN')}</span>
                                  </div>
                                  <div className="mt-2 bg-blue-500/10 border border-blue-500/20 p-2.5 rounded-xl text-[11px] text-blue-300 font-medium flex items-center justify-between">
                                    <span>Settlement Status:</span>
                                    <span className="font-bold text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30">⏳ 24-Hour Dispute Hold</span>
                                  </div>
                                </div>
                              );
                            })()}

                            {/* Offline Cash Payment Block */}
                            {(() => {
                              const finalPayment = Array.isArray(job.payments)
                                ? job.payments.find((p: any) => (p?.paymentType === 'FINAL' || p?.paymentType === 'FULL'))
                                : null;
                              const isFinalPaid = finalPayment?.status === 'SUCCESS';
                              const isFinalPending = finalPayment?.status === 'PENDING' && finalPayment?.provider === 'CASH';

                              if (isFinalPaid) {
                                return (
                                  <div className="flex items-center justify-between bg-emerald-500/20 p-3 rounded-xl border border-emerald-500/40 text-xs font-bold text-emerald-200">
                                    <span>Payment Status:</span>
                                    <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Full Payment Received</span>
                                  </div>
                                );
                              }

                              if (isFinalPending) {
                                return (
                                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-xl border border-amber-500/40 bg-amber-500/10 text-xs">
                                    <div>
                                      <p className="font-bold text-amber-300">Customer claims cash payment of ₹{finalPayment.amount}.</p>
                                      <p className="text-gray-400 text-[11px]">Please verify upon physical collection.</p>
                                    </div>
                                    <Button
                                      className="bg-primary-orange hover:bg-orange-600 text-white font-bold text-xs py-2 px-4 rounded-xl w-full sm:w-auto"
                                      isLoading={verifyOfflinePaymentMutation.isPending}
                                      onClick={() => handleVerifyOfflinePayment(finalPayment._id)}
                                    >
                                      Verify & Accept Cash
                                    </Button>
                                  </div>
                                );
                              }

                              return (
                                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-800 border border-slate-700">
                                  <div>
                                    <p className="text-xs text-gray-400 font-medium">Final Remaining Due:</p>
                                    <p className="text-xl font-extrabold text-primary-orange">₹{job.finalAmount || 0}</p>
                                  </div>
                                  <Button
                                    className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs py-2 px-4 rounded-xl w-full sm:w-auto"
                                    isLoading={markOfflinePaymentMutation.isPending}
                                    onClick={() => handleMarkOfflinePayment(job.bookingId?._id || job.bookingId, job.finalAmount || 0, 'FINAL')}
                                  >
                                    Mark Received in Cash
                                  </Button>
                                </div>
                              );
                            })()}
                          </div>
                        )}
                      </div>
                    </div>
                    </ErrorBoundary>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="bg-white p-4 rounded-2xl border border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
          <div className="text-xs text-gray-500 font-medium">
            Showing <strong className="text-gray-900">{((page - 1) * limit) + 1}</strong> to <strong className="text-gray-900">{Math.min(page * limit, totalJobsCount)}</strong> of <strong className="text-gray-900">{totalJobsCount}</strong> jobs
          </div>

          {/* Page Controls */}
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className="text-xs font-bold border-gray-200"
            >
              <ChevronLeft className="w-4 h-4 mr-1" /> Previous
            </Button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pNum) => (
              <button
                key={pNum}
                onClick={() => setPage(pNum)}
                className={`w-8 h-8 rounded-lg text-xs font-extrabold transition-colors ${
                  page === pNum ? "bg-primary-orange text-white" : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                }`}
              >
                {pNum}
              </button>
            ))}

            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              className="text-xs font-bold border-gray-200"
            >
              Next <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Customer Verification PIN Modal */}
      {startJobModal.open && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl space-y-6 border border-gray-100 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center space-x-3 text-gray-900">
              <div className="w-12 h-12 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center text-primary-orange">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-extrabold font-heading text-gray-900">Customer Verification PIN</h3>
                <p className="text-xs text-gray-500 font-medium">Enter 4-digit PIN provided by customer</p>
              </div>
            </div>

            <div className="p-4 bg-orange-50/70 border border-orange-200/60 rounded-2xl text-xs text-slate-700">
              <p className="font-bold text-primary-orange mb-1 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> Mandatory Verification System
              </p>
              Customer vehicle service cannot start without verifying the customer's unique 4-digit PIN.
            </div>

            {startJobModal.error && (
              <div className="p-3 bg-red-50 text-red-600 border border-red-200 rounded-xl text-xs font-bold flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                <span>{startJobModal.error}</span>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-extrabold text-gray-500 uppercase tracking-wider mb-2">
                4-DIGIT CUSTOMER PIN
              </label>
              <Input
                type="text"
                maxLength={4}
                placeholder="• • • •"
                value={startJobModal.pin}
                onChange={(e) => setStartJobModal(prev => ({ ...prev, pin: e.target.value.replace(/\D/g, ''), error: "" }))}
                className="text-center text-3xl font-mono tracking-[0.5em] py-4 rounded-2xl border-2 border-gray-200 focus:border-primary-orange font-bold text-gray-900 bg-gray-50/50"
                autoFocus
              />
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <Button
                variant="outline"
                className="rounded-xl border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-bold"
                onClick={() => setStartJobModal({ open: false, jobId: "", pin: "", error: "" })}
              >
                Cancel
              </Button>
              <Button
                className="bg-primary-orange hover:bg-orange-600 text-white font-bold rounded-xl px-6 text-xs"
                isLoading={startJobMutation.isPending || verifyCustomerCodeMutation.isPending}
                onClick={() => handleStartJob(startJobModal.jobId, startJobModal.pin)}
              >
                Verify PIN & Start Work
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Isolated Itemized Invoice Section per Job
 * Ensures Customer's Actual Quoted Amount is auto-populated and LOCKED on Row 1.
 * Partners can add extra parts/charges via additional lines.
 */
function JobInvoiceSection({ job, onInvoiceSubmitted }: { job: any; onInvoiceSubmitted?: () => void }) {
  const jobId = job._id || job.id || "";
  const bData = typeof job.bookingId === 'object' && job.bookingId ? job.bookingId : {};
  const sData = typeof bData.serviceId === 'object' && bData.serviceId ? bData.serviceId : {};

  // 1. Calculate actual customer agreed / quoted amount
  const actualQuotedAmount = useMemo(() => {
    const val = Number(
      job.finalAmount ||
      job.bidId?.quotedAmount ||
      bData.acceptedBidId?.quotedAmount ||
      sData.basePrice ||
      0
    );
    return isNaN(val) ? 0 : val;
  }, [job, bData, sData]);

  const defaultServiceName = sData.name || "Car Service & Maintenance";
  const existingInvoice = job.invoice;
  const uploadInvoiceMutation = useUploadInvoiceMutation();

  const [invoiceType, setInvoiceType] = useState<"PDF" | "ITEMIZED">(
    existingInvoice?.invoiceType || (job.invoiceUrl && !existingInvoice?.items?.length ? "PDF" : "ITEMIZED")
  );

  const [pdfUrl, setPdfUrl] = useState<string>(
    typeof existingInvoice?.pdfUrl === 'string' ? existingInvoice.pdfUrl : (typeof job.invoiceUrl === 'string' ? job.invoiceUrl : "")
  );

  // Initialize line items: Row 0 is ALWAYS the customer's actual quoted amount and is locked!
  const [items, setItems] = useState<{ description: string; quantity: number; unitPrice: number; isBasePackage: boolean }[]>(() => {
    if (Array.isArray(existingInvoice?.items) && existingInvoice.items.length > 0) {
      return existingInvoice.items.map((it: any, idx: number) => ({
        description: it?.description || (idx === 0 ? defaultServiceName : ""),
        quantity: Number(it?.quantity) || 1,
        unitPrice: idx === 0 ? (actualQuotedAmount || Number(it?.unitPrice) || 0) : (Number(it?.unitPrice) || 0),
        isBasePackage: idx === 0
      }));
    }
    return [
      {
        description: defaultServiceName,
        quantity: 1,
        unitPrice: actualQuotedAmount,
        isBasePackage: true
      }
    ];
  });

  const [discount, setDiscount] = useState<number | string>(existingInvoice?.discount ?? 0);
  const [gstMode, setGstMode] = useState<"0" | "5" | "12" | "18" | "custom">(
    existingInvoice?.taxAmount ? "custom" : "0"
  );
  const [tax, setTax] = useState<number | string>(() => {
    if (existingInvoice?.taxAmount !== undefined) return existingInvoice.taxAmount;
    return 0;
  });
  const [notes, setNotes] = useState<string>(existingInvoice?.notes || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Keep Row 0 locked and sync with actualQuotedAmount if it updates
  useEffect(() => {
    if (actualQuotedAmount > 0) {
      setItems(prev => {
        if (prev.length === 0) {
          return [{ description: defaultServiceName, quantity: 1, unitPrice: actualQuotedAmount, isBasePackage: true }];
        }
        if (prev[0].unitPrice !== actualQuotedAmount) {
          const updated = [...prev];
          updated[0] = { ...updated[0], unitPrice: actualQuotedAmount };
          return updated;
        }
        return prev;
      });
    }
  }, [actualQuotedAmount, defaultServiceName]);

  // Recalculate auto tax if in preset mode
  const recalculateTaxForSubtotal = (sub: number, mode: "0" | "5" | "12" | "18" | "custom") => {
    if (mode === "18") setTax(Math.round(sub * 0.18));
    else if (mode === "12") setTax(Math.round(sub * 0.12));
    else if (mode === "5") setTax(Math.round(sub * 0.05));
    else if (mode === "0") setTax(0);
    // if 'custom', partner's manual tax entry is strictly preserved
  };

  // Handle line item changes (protecting row 0)
  const handleItemChange = (index: number, field: string, value: any) => {
    if (index === 0 && (field === "unitPrice" || field === "quantity" || field === "description")) {
      return; // Row 0 is locked
    }
    setItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      const newSubtotal = updated.reduce((sum, it) => sum + ((Number(it.quantity) || 1) * (Number(it.unitPrice) || 0)), 0);
      recalculateTaxForSubtotal(newSubtotal, gstMode);
      return updated;
    });
  };

  const handleAddExtraLine = () => {
    setItems(prev => {
      const updated = [...prev, { description: "", quantity: 1, unitPrice: 0, isBasePackage: false }];
      const newSubtotal = updated.reduce((sum, it) => sum + ((Number(it.quantity) || 1) * (Number(it.unitPrice) || 0)), 0);
      recalculateTaxForSubtotal(newSubtotal, gstMode);
      return updated;
    });
  };

  const handleRemoveExtraLine = (index: number) => {
    if (index === 0) return; // Row 0 is locked
    setItems(prev => {
      const updated = prev.filter((_, i) => i !== index);
      const newSubtotal = updated.reduce((sum, it) => sum + ((Number(it.quantity) || 1) * (Number(it.unitPrice) || 0)), 0);
      recalculateTaxForSubtotal(newSubtotal, gstMode);
      return updated;
    });
  };

  const handleAddExtension = (ext: any) => {
    const alreadyAdded = items.some(it => it.description === ext.partName && it.unitPrice === ext.cost);
    if (alreadyAdded) {
      toast("This extra part is already included in your bill", { icon: "ℹ️" });
      return;
    }
    setItems(prev => {
      const updated = [...prev, { description: ext.partName, quantity: 1, unitPrice: Number(ext.cost) || 0, isBasePackage: false }];
      const newSubtotal = updated.reduce((sum, it) => sum + ((Number(it.quantity) || 1) * (Number(it.unitPrice) || 0)), 0);
      recalculateTaxForSubtotal(newSubtotal, gstMode);
      return updated;
    });
    toast.success(`Added "${ext.partName}" to bill!`);
  };

  const subtotal = useMemo(() => {
    return items.reduce((sum, it) => sum + ((Number(it.quantity) || 1) * (Number(it.unitPrice) || 0)), 0);
  }, [items]);

  const extraCharges = useMemo(() => {
    return items.slice(1).reduce((sum, it) => sum + ((Number(it.quantity) || 1) * (Number(it.unitPrice) || 0)), 0);
  }, [items]);

  const numericTax = tax === "" ? 0 : Math.max(0, Number(tax) || 0);
  const numericDiscount = discount === "" ? 0 : Math.max(0, Number(discount) || 0);
  const grandTotal = Math.max(0, subtotal + numericTax - numericDiscount);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const { submitPartnerInvoice } = await import("@/lib/services");
      await submitPartnerInvoice(jobId, {
        invoiceType,
        pdfUrl: pdfUrl || undefined,
        items: items.map(it => ({
          ...it,
          quantity: Number(it.quantity) || 1,
          unitPrice: Number(it.unitPrice) || 0
        })),
        subtotal,
        taxAmount: numericTax,
        discount: numericDiscount,
        grandTotal,
        notes
      });
      toast.success("Itemized invoice submitted successfully to Executive!");
      onInvoiceSubmitted?.();
    } catch (err: any) {
      toast.error(err?.message || "Failed to submit invoice");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUploadPdf = async () => {
    if (!pdfUrl) return;
    try {
      await uploadInvoiceMutation.mutateAsync({ jobId, payload: { invoiceUrl: pdfUrl } });
      toast.success("PDF invoice uploaded successfully!");
      onInvoiceSubmitted?.();
    } catch (err: any) {
      toast.error(err?.message || "Failed to save PDF invoice");
    }
  };

  return (
    <div className="bg-white border border-gray-200/80 p-6 rounded-2xl shadow-sm space-y-5">
      {/* Header and format switcher */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary-orange" />
          <div>
            <h4 className="font-bold text-gray-900 text-sm">Invoice &amp; Bill Submission</h4>
            <p className="text-[11px] text-gray-500">Agreed customer package is locked. Add any additional parts or labor below.</p>
          </div>
        </div>

        <div className="flex items-center bg-gray-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setInvoiceType("ITEMIZED")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              invoiceType === "ITEMIZED" ? "bg-white text-primary-orange shadow-sm" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Itemized Bill Form
          </button>
          <button
            type="button"
            onClick={() => setInvoiceType("PDF")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              invoiceType === "PDF" ? "bg-white text-primary-orange shadow-sm" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Upload PDF Document
          </button>
        </div>
      </div>

      {/* Invoice Status alert if already submitted */}
      {existingInvoice && (
        <div className={`p-3.5 rounded-xl border flex items-center justify-between text-xs ${
          existingInvoice.status === "PAID"
            ? "bg-emerald-50 border-emerald-200 text-emerald-900"
            : existingInvoice.status === "FORWARDED_TO_CUSTOMER"
            ? "bg-blue-50 border-blue-200 text-blue-900"
            : "bg-amber-50 border-amber-200 text-amber-900"
        }`}>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-bold">
              {existingInvoice.status === "PAID"
                ? "Invoice Paid by Customer 🎉"
                : existingInvoice.status === "FORWARDED_TO_CUSTOMER"
                ? "Invoice Approved & Forwarded to Customer"
                : "Invoice Submitted — Pending Executive Review"}
            </span>
          </div>
          <span className="font-extrabold text-sm">₹{existingInvoice.grandTotal?.toLocaleString("en-IN")}</span>
        </div>
      )}

      {invoiceType === "ITEMIZED" ? (
        <div className="space-y-4">
          {/* Customer Quoted Amount Protection Banner */}
          <div className="bg-amber-50/70 border border-amber-200/80 p-3 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <span className="font-extrabold text-amber-950">Customer Quoted Protection:</span> The base service package amount (<strong>₹{actualQuotedAmount}</strong>) is fixed to the customer&apos;s accepted quote and <u>cannot be modified</u>. If additional work or parts were required, use <strong>&quot;+ Add Item Line&quot;</strong> below.
            </div>
          </div>

          {/* Line Items List */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 text-[11px] font-bold text-gray-500 uppercase px-1">
              <span className="flex-1">Item / Service Description</span>
              <span className="w-16 text-center">Qty</span>
              <span className="w-36 text-left pl-2">Unit Price (₹)</span>
              <span className="w-24 text-right pr-2">Total</span>
              <span className="w-8"></span>
            </div>

            {items.map((item, idx) => {
              const isBase = idx === 0 || item.isBasePackage;

              return (
                <div
                  key={idx}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border transition-all ${
                    isBase
                      ? "bg-slate-50 border-slate-300 shadow-2xs"
                      : "bg-white border-gray-200 hover:border-gray-300"
                  }`}
                >
                  {/* Description */}
                  <div className="flex-1 relative flex items-center">
                    <input
                      type="text"
                      placeholder="Item Description (e.g. Brake Pads, Extra Oil)"
                      value={item.description}
                      readOnly={isBase}
                      disabled={isBase}
                      onChange={(e) => handleItemChange(idx, "description", e.target.value)}
                      className={`w-full px-3 py-2 text-xs border rounded-lg font-medium ${
                        isBase
                          ? "bg-slate-100 text-slate-800 font-bold border-slate-300 cursor-not-allowed select-none"
                          : "bg-white border-gray-200 focus:outline-none focus:ring-1 focus:ring-primary-orange"
                      }`}
                    />
                    {isBase && (
                      <span className="absolute right-2.5 text-[10px] font-bold text-slate-600 bg-slate-200/80 px-2 py-0.5 rounded border border-slate-300 flex items-center gap-1 select-none pointer-events-none">
                        <Lock className="w-2.5 h-2.5" /> Base Service
                      </span>
                    )}
                  </div>

                  {/* Quantity */}
                  <input
                    type="number"
                    min="1"
                    placeholder="Qty"
                    value={item.quantity}
                    readOnly={isBase}
                    disabled={isBase}
                    onChange={(e) => handleItemChange(idx, "quantity", Number(e.target.value) || 1)}
                    className={`w-16 px-2 py-2 text-xs text-center border rounded-lg font-bold ${
                      isBase
                        ? "bg-slate-100 text-slate-800 border-slate-300 cursor-not-allowed select-none"
                        : "bg-white border-gray-200 focus:outline-none focus:ring-1 focus:ring-primary-orange"
                    }`}
                  />

                  {/* Unit Price */}
                  <div className="relative w-36">
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={!isBase && item.unitPrice === 0 ? "" : (item.unitPrice ?? "")}
                      readOnly={isBase}
                      disabled={isBase}
                      onChange={(e) => handleItemChange(idx, "unitPrice", e.target.value === "" ? 0 : Math.max(0, Number(e.target.value)))}
                      className={`w-full pl-7 pr-3 py-2 text-xs border rounded-lg font-extrabold ${
                        isBase
                          ? "bg-slate-100 text-slate-900 border-slate-300 cursor-not-allowed select-none"
                          : "bg-white border-gray-200 focus:outline-none focus:ring-1 focus:ring-primary-orange text-gray-900"
                      }`}
                    />
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs select-none">₹</span>
                    {isBase && (
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-amber-800 bg-amber-100/90 px-1.5 py-0.5 rounded font-extrabold flex items-center gap-0.5 select-none pointer-events-none">
                        <Lock className="w-2.5 h-2.5 text-amber-700" /> Locked
                      </span>
                    )}
                  </div>

                  {/* Total Amount */}
                  <span className="text-xs font-extrabold text-gray-900 w-24 text-right pr-2">
                    ₹{((Number(item.quantity) || 1) * (Number(item.unitPrice) || 0)).toLocaleString("en-IN")}
                  </span>

                  {/* Action Column */}
                  <div className="w-8 flex items-center justify-center">
                    {isBase ? (
                      <span title="Agreed base package cannot be removed">
                        <Lock className="w-3.5 h-3.5 text-slate-400" />
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleRemoveExtraLine(idx)}
                        className="text-red-500 hover:text-red-700 p-1.5 hover:bg-red-50 rounded-lg text-sm font-bold transition-colors"
                        title="Remove extra line item"
                      >
                        ×
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Quick add requested extra parts if available */}
            {Array.isArray(job.jobExtensions) && job.jobExtensions.length > 0 && (
              <div className="bg-amber-50/70 p-3 rounded-xl border border-amber-200/80 space-y-2 mt-2">
                <span className="text-[11px] font-bold text-amber-900 flex items-center gap-1.5">
                  <PlusCircle className="w-3.5 h-3.5 text-primary-orange" /> Quick-Add Requested Parts from this Job:
                </span>
                <div className="flex flex-wrap gap-2">
                  {job.jobExtensions.filter((ext: any) => typeof ext === 'object' && ext?.partName).map((ext: any, extIdx: number) => (
                    <button
                      key={extIdx}
                      type="button"
                      onClick={() => handleAddExtension(ext)}
                      className="text-[11px] font-bold bg-white border border-amber-300 hover:bg-amber-100 text-amber-900 px-3 py-1 rounded-lg flex items-center gap-1.5 transition-colors shadow-2xs"
                    >
                      <Plus className="w-3 h-3 text-primary-orange" /> Add &ldquo;{ext.partName}&rdquo; (+₹{Number(ext.cost) || 0})
                    </button>
                  ))}
                </div>
              </div>
            )}

            <Button
              type="button"
              onClick={handleAddExtraLine}
              size="sm"
              variant="outline"
              className="text-xs font-bold text-primary-orange border-primary-orange/40 hover:bg-orange-50 mt-1 flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> + Add Item Line
            </Button>
          </div>

          {/* Taxes & Discounts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-gray-100">
            {/* Discount */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[11px] font-bold text-gray-700">Discount (₹)</label>
                <span className="text-[10px] text-gray-400">Optional</span>
              </div>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={discount}
                  onChange={(e) => {
                    const raw = e.target.value;
                    setDiscount(raw === "" ? "" : Math.max(0, Number(raw)));
                  }}
                  onBlur={() => {
                    if (discount === "") setDiscount(0);
                  }}
                  className="w-full pl-7 pr-3 py-2 border border-gray-200 rounded-xl text-xs font-bold text-emerald-700 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs select-none">₹</span>
              </div>
              <p className="text-[10px] text-gray-500 mt-1">Direct discount deducted from total.</p>
            </div>

            {/* GST / Tax - Manually Editable */}
            <div>
              <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1">
                <div className="flex items-center gap-1.5">
                  <label className="block text-[11px] font-bold text-gray-700">Tax / GST (₹)</label>
                  <span className="text-[9px] bg-emerald-50 text-emerald-700 font-bold px-1.5 py-0.5 rounded border border-emerald-200">
                    ✍️ Manually Editable
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => { setTax(0); setGstMode("0"); }}
                    className={`text-[10px] px-2 py-0.5 rounded font-bold transition-all ${
                      gstMode === "0" && numericTax === 0
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs font-extrabold"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    0% (No Tax)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const autoTax = Math.round(subtotal * 0.05);
                      setTax(autoTax);
                      setGstMode("5");
                    }}
                    className={`text-[10px] px-1.5 py-0.5 rounded font-bold transition-all ${
                      gstMode === "5"
                        ? "bg-amber-100 text-amber-800 border border-amber-300 shadow-2xs font-extrabold"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    5%
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const autoTax = Math.round(subtotal * 0.12);
                      setTax(autoTax);
                      setGstMode("12");
                    }}
                    className={`text-[10px] px-1.5 py-0.5 rounded font-bold transition-all ${
                      gstMode === "12"
                        ? "bg-indigo-100 text-indigo-800 border border-indigo-300 shadow-2xs font-extrabold"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    12%
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const autoTax = Math.round(subtotal * 0.18);
                      setTax(autoTax);
                      setGstMode("18");
                    }}
                    className={`text-[10px] px-2 py-0.5 rounded font-bold transition-all ${
                      gstMode === "18"
                        ? "bg-blue-100 text-blue-800 border border-blue-300 shadow-2xs font-extrabold"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    18% (₹{Math.round(subtotal * 0.18)})
                  </button>
                </div>
              </div>

              <div className="relative">
                <input
                  type="number"
                  min="0"
                  placeholder="Enter GST in ₹ (e.g. 0, 150, 270)"
                  value={tax}
                  onChange={(e) => {
                    const raw = e.target.value;
                    setTax(raw);
                    setGstMode("custom");
                  }}
                  onBlur={() => {
                    if (tax === "") setTax(0);
                  }}
                  className="w-full pl-7 pr-3 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 bg-white focus:outline-none focus:ring-1 focus:ring-primary-orange"
                />
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs select-none">₹</span>
              </div>
              <p className="text-[10px] text-gray-500 mt-1 flex items-center justify-between">
                <span>Directly type any ₹ amount above, or click a % button.</span>
                {numericTax > 0 && <span className="font-bold text-gray-700">~{((numericTax / (subtotal || 1)) * 100).toFixed(1)}% of subtotal</span>}
              </p>
            </div>
          </div>

          {/* Total Breakdown Bar */}
          <div className="bg-orange-50/70 p-4 rounded-xl border border-orange-200/80 space-y-2">
            <div className="flex flex-wrap items-center justify-between text-xs text-gray-600 border-b border-orange-200/60 pb-2 gap-2">
              <span>Agreed Base Package: <strong className="text-gray-900">₹{actualQuotedAmount.toLocaleString("en-IN")}</strong> <span className="text-[10px] text-amber-700 font-bold">(Locked)</span></span>
              {extraCharges > 0 && <span>Extra Added Parts: <strong className="text-primary-orange">₹{extraCharges.toLocaleString("en-IN")}</strong></span>}
              {numericDiscount > 0 && <span>Discount: <strong className="text-emerald-700">-₹{numericDiscount.toLocaleString("en-IN")}</strong></span>}
              {numericTax > 0 && <span>GST / Tax: <strong className="text-gray-700">+₹{numericTax.toLocaleString("en-IN")}</strong></span>}
            </div>

            <div className="flex justify-between items-center font-extrabold text-gray-900 pt-1">
              <span className="text-sm">Grand Total Itemized Amount:</span>
              <span className="text-primary-orange text-2xl font-black font-heading">
                ₹{grandTotal.toLocaleString("en-IN")}
              </span>
            </div>
          </div>

          <Button
            type="button"
            onClick={handleSubmit}
            isLoading={isSubmitting}
            className="w-full bg-primary-orange hover:bg-orange-600 text-white font-bold text-xs py-3 rounded-xl shadow-sm"
          >
            Submit Itemized Invoice for Executive Review
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <FileUpload
            folder="invoices"
            onUploadSuccess={(url) => setPdfUrl(url)}
            currentValue={pdfUrl}
          />
          <Button
            type="button"
            variant="outline"
            className="w-full text-xs font-bold py-2.5 rounded-xl border-gray-300"
            disabled={!pdfUrl}
            isLoading={uploadInvoiceMutation.isPending}
            onClick={handleUploadPdf}
          >
            {pdfUrl ? "Save & Submit PDF Invoice" : "Upload & Save PDF Invoice"}
          </Button>
        </div>
      )}
    </div>
  );
}
