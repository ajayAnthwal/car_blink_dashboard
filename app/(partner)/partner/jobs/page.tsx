// @ts-nocheck
"use client";

import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/Select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileUpload } from "@/components/ui/FileUpload";
import { Wrench, Loader2, ChevronDown, ChevronUp, Image as ImageIcon, FileText, CheckCircle2, PlayCircle, MapPin, Calendar, Car, UserCheck, PlusCircle, HandCoins, Search, Filter, ChevronLeft, ChevronRight, ShieldAlert, Clock, Sparkles, DollarSign, ShieldCheck } from "lucide-react";
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

  const { data: jobsData, isLoading: isLoadingJobs } = usePartnerJobs(queryParams);
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

  const [invoiceType, setInvoiceType] = useState<"PDF" | "ITEMIZED">("ITEMIZED");
  const [invoiceItems, setInvoiceItems] = useState<{ description: string; quantity: number; unitPrice: number }[]>([
    { description: "Car Service & Maintenance", quantity: 1, unitPrice: 1500 }
  ]);
  const [invoiceDiscount, setInvoiceDiscount] = useState<number>(0);
  const [invoiceTax, setInvoiceTax] = useState<number>(0);
  const [invoiceNotes, setInvoiceNotes] = useState<string>("");
  const [isSubmittingInvoice, setIsSubmittingInvoice] = useState(false);

  const totalPages = Math.ceil(totalJobsCount / limit) || 1;

  const handleInvoiceItemChange = (index: number, field: string, value: any) => {
    setInvoiceItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      const newSubtotal = updated.reduce((sum, item) => sum + ((Number(item.quantity) || 1) * (Number(item.unitPrice) || 0)), 0);
      setInvoiceTax(Math.round(newSubtotal * 0.18));
      return updated;
    });
  };

  const handleAddInvoiceItem = () => {
    setInvoiceItems(prev => {
      const updated = [...prev, { description: "", quantity: 1, unitPrice: 0 }];
      const newSubtotal = updated.reduce((sum, item) => sum + ((Number(item.quantity) || 1) * (Number(item.unitPrice) || 0)), 0);
      setInvoiceTax(Math.round(newSubtotal * 0.18));
      return updated;
    });
  };

  const handleRemoveInvoiceItem = (index: number) => {
    if (invoiceItems.length <= 1) return;
    setInvoiceItems(prev => {
      const updated = prev.filter((_, i) => i !== index);
      const newSubtotal = updated.reduce((sum, item) => sum + ((Number(item.quantity) || 1) * (Number(item.unitPrice) || 0)), 0);
      setInvoiceTax(Math.round(newSubtotal * 0.18));
      return updated;
    });
  };

  const handleSubmitItemizedInvoice = async (jobId: string) => {
    setIsSubmittingInvoice(true);
    try {
      const { submitPartnerInvoice } = await import("@/lib/services");
      const subtotal = invoiceItems.reduce((sum, item) => sum + ((Number(item.quantity) || 1) * (Number(item.unitPrice) || 0)), 0);
      const grandTotal = Math.max(0, subtotal + Number(invoiceTax || 0) - Number(invoiceDiscount || 0));

      await submitPartnerInvoice(jobId, {
        invoiceType,
        pdfUrl: invoiceUrl || undefined,
        items: invoiceItems,
        subtotal,
        taxAmount: invoiceTax,
        discount: invoiceDiscount,
        grandTotal,
        notes: invoiceNotes
      });

      setMessage({ type: "success", text: "Invoice submitted to Executive for review & customer approval!" });
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to submit invoice." });
    } finally {
      setIsSubmittingInvoice(false);
    }
  };

  const handleStartJobWithPin = async (jobId: string, verificationCode: string) => {
    if (!verificationCode || verificationCode.trim().length !== 4) {
      setStartJobModal(prev => ({ ...prev, error: "Please enter a valid 4-digit Customer Verification PIN." }));
      return;
    }
    setMessage({ type: "", text: "" });
    try {
      const res = await verifyCustomerCodeMutation.mutateAsync({ jobId, verificationCode: verificationCode.trim() });
      setMessage({ type: "success", text: res?.message || "✓ Customer Verified! Status updated to 'Verified / Work Ready'. Click 'Start Work' to begin." });
      setStartJobModal({ open: false, jobId: "", pin: "", error: "" });
    } catch (err: any) {
      setStartJobModal(prev => ({ ...prev, error: err?.message || "Invalid Customer Verification PIN." }));
    }
  };

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
            const jobId = job._id || job.id;
            const isExpanded = expandedId === jobId;
            const bData = job.bookingId || {};
            const vData = bData.vehicleId || {};
            const sData = bData.serviceId || {};
            const cData = bData.cityId || {};

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
                            #{jobId.substring(jobId.length - 6).toUpperCase()}
                          </span>
                        </div>
                        {getStatusBadge(job.status)}
                      </div>

                      {/* Info Chips */}
                      <div className="flex flex-wrap gap-4 text-xs text-gray-600 font-medium">
                        <span className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-100">
                          <Car className="w-3.5 h-3.5 text-primary-orange" />
                          <strong className="text-gray-900">{vData.brand} {vData.model}</strong> ({vData.registrationNumber || "Vehicle"})
                        </span>

                        {cData.name && (
                          <span className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-100">
                            <MapPin className="w-3.5 h-3.5 text-blue-500" /> {cData.name}
                          </span>
                        )}

                        <span className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-100">
                          <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                          {bData.preferredDate ? new Date(bData.preferredDate).toLocaleDateString() : "Date N/A"}
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

                            {job.beforePhotos && job.beforePhotos.length > 0 && (
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

                            {job.afterPhotos && job.afterPhotos.length > 0 && (
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
                                ...staffList.map((staff: any) => ({
                                  value: staff._id || staff.id,
                                  label: `${staff.name} (${staff.role || "Mechanic"})`
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
                        <div className="bg-white border border-gray-200/80 p-6 rounded-2xl shadow-sm space-y-5">
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
                            <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                              <FileText className="w-5 h-5 text-primary-orange" /> Invoice & Bill Submission
                            </h4>

                            {/* Format Toggle */}
                            <div className="flex items-center bg-gray-100 p-1 rounded-xl">
                              <button
                                onClick={() => setInvoiceType("ITEMIZED")}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                  invoiceType === "ITEMIZED" ? "bg-white text-primary-orange shadow-sm" : "text-gray-600 hover:text-gray-900"
                                }`}
                              >
                                Itemized Bill Form
                              </button>
                              <button
                                onClick={() => setInvoiceType("PDF")}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                  invoiceType === "PDF" ? "bg-white text-primary-orange shadow-sm" : "text-gray-600 hover:text-gray-900"
                                }`}
                              >
                                Upload PDF Document
                              </button>
                            </div>
                          </div>

                          {invoiceType === "ITEMIZED" ? (
                            <div className="space-y-4">
                              <p className="text-xs text-gray-500 font-medium">
                                Fill out line items for labor and parts. Your bill will be submitted to the Executive for verification.
                              </p>

                              {/* Line Items */}
                              <div className="space-y-2">
                                {invoiceItems.map((item, idx) => (
                                  <div key={idx} className="flex items-center gap-2 bg-gray-50 p-2.5 rounded-xl border border-gray-200">
                                    <input
                                      type="text"
                                      placeholder="Item Description"
                                      value={item.description}
                                      onChange={(e) => handleInvoiceItemChange(idx, "description", e.target.value)}
                                      className="flex-1 px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-orange bg-white font-medium"
                                    />
                                    <input
                                      type="number"
                                      min="1"
                                      placeholder="Qty"
                                      value={item.quantity}
                                      onChange={(e) => handleInvoiceItemChange(idx, "quantity", e.target.value)}
                                      className="w-16 px-2 py-2 text-xs text-center border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-orange bg-white font-medium"
                                    />
                                    <input
                                      type="number"
                                      min="0"
                                      placeholder="Unit Price (₹)"
                                      value={item.unitPrice}
                                      onChange={(e) => handleInvoiceItemChange(idx, "unitPrice", e.target.value)}
                                      className="w-28 px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-orange bg-white font-medium"
                                    />
                                    <span className="text-xs font-bold text-gray-900 w-24 text-right pr-2">
                                      ₹{(Number(item.quantity) || 1) * (Number(item.unitPrice) || 0)}
                                    </span>
                                    {invoiceItems.length > 1 && (
                                      <button
                                        onClick={() => handleRemoveInvoiceItem(idx)}
                                        className="text-red-500 hover:text-red-700 p-1.5 hover:bg-red-50 rounded-lg text-sm font-bold"
                                      >
                                        ×
                                      </button>
                                    )}
                                  </div>
                                ))}

                                <Button
                                  onClick={handleAddInvoiceItem}
                                  size="sm"
                                  variant="outline"
                                  className="text-xs font-bold text-primary-orange border-primary-orange/30 mt-1"
                                >
                                  + Add Item Line
                                </Button>
                              </div>

                              {/* Taxes & Discounts */}
                              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-100">
                                <div>
                                  <label className="block text-[11px] font-bold text-gray-600 mb-1">Discount (₹)</label>
                                  <input
                                    type="number"
                                    min="0"
                                    value={invoiceDiscount}
                                    onChange={(e) => setInvoiceDiscount(Number(e.target.value) || 0)}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-bold text-emerald-700 bg-white"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[11px] font-bold text-gray-600 mb-1">Tax / GST 18% (Auto-Calculated ₹)</label>
                                  <input
                                    type="number"
                                    min="0"
                                    value={invoiceTax}
                                    onChange={(e) => setInvoiceTax(Number(e.target.value) || 0)}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 bg-white"
                                  />
                                </div>
                              </div>

                              {/* Total Bar */}
                              <div className="flex justify-between items-center bg-orange-50 p-4 rounded-xl border border-orange-100 font-extrabold text-gray-900">
                                <span>Grand Total Itemized Amount:</span>
                                <span className="text-primary-orange text-xl">
                                  ₹{Math.max(0, invoiceItems.reduce((sum, item) => sum + ((Number(item.quantity) || 1) * (Number(item.unitPrice) || 0)), 0) + Number(invoiceTax || 0) - Number(invoiceDiscount || 0))}
                                </span>
                              </div>

                              <Button
                                onClick={() => handleSubmitItemizedInvoice(jobId)}
                                isLoading={isSubmittingInvoice}
                                className="w-full bg-primary-orange hover:bg-orange-600 text-white font-bold text-xs py-3 rounded-xl shadow-sm"
                              >
                                Submit Itemized Invoice for Executive Review
                              </Button>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              <FileUpload
                                folder="invoices"
                                onUploadSuccess={(url) => setInvoiceUrl(url)}
                                currentValue={invoiceUrl || job.invoiceUrl}
                              />
                              <Button
                                variant="outline"
                                className="w-full text-xs font-bold py-2.5 rounded-xl border-gray-300"
                                disabled={!invoiceUrl}
                                isLoading={uploadInvoiceMutation.isPending}
                                onClick={() => handleUploadInvoice(jobId)}
                              >
                                {invoiceUrl ? "Save & Submit PDF Invoice" : job.invoiceUrl ? "✓ PDF Invoice Uploaded" : "Save PDF Invoice"}
                              </Button>
                            </div>
                          )}
                        </div>
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
                              const finalPayment = job.payments?.find((p: any) => (p.paymentType === 'FINAL' || p.paymentType === 'FULL'));
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
                isLoading={startJobMutation.isPending}
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
