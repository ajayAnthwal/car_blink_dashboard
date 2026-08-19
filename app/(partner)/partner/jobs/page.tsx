// @ts-nocheck
"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/Select";
import { Card, CardContent } from "@/components/ui/card";
import { FileUpload } from "@/components/ui/FileUpload";
import { Wrench, Loader2, ChevronDown, ChevronUp, Image as ImageIcon, FileText, CheckCircle2, PlayCircle, MapPin, Calendar, Car, UserCheck, PlusCircle, HandCoins } from "lucide-react";
import { 
  usePartnerJobs, 
  usePartnerStaff, 
  useStartJobMutation, 
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
  const { data: jobsData, isLoading: isLoadingJobs } = usePartnerJobs();
  const { data: staffList = [], isLoading: isLoadingStaff } = usePartnerStaff();

  const jobs = jobsData?.jobs || [];
  const isLoading = isLoadingJobs || isLoadingStaff;

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [message, setMessage] = useState({ type: "", text: "" });

  const startJobMutation = useStartJobMutation();
  const completeJobMutation = useCompleteJobMutation();
  const uploadInvoiceMutation = useUploadInvoiceMutation();
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

  const handleAddInvoiceItem = () => {
    setInvoiceItems(prev => [...prev, { description: "", quantity: 1, unitPrice: 0 }]);
  };

  const handleRemoveInvoiceItem = (index: number) => {
    if (invoiceItems.length <= 1) return;
    setInvoiceItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleInvoiceItemChange = (index: number, field: string, value: any) => {
    setInvoiceItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
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

      setMessage({ type: "success", text: "Invoice submitted to Executive for review and customer approval!" });
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to submit invoice." });
    } finally {
      setIsSubmittingInvoice(false);
    }
  };

  const handleStartJob = async (id: string) => {
    setMessage({ type: "", text: "" });
    try {
      await startJobMutation.mutateAsync(id);
      setMessage({ type: "success", text: "Job started successfully!" });
    } catch (err: unknown) {
      setMessage({ type: "error", text: err?.message || "Failed to start job." });
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
    } catch (err: unknown) {
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
    } catch (err: unknown) {
      setMessage({ type: "error", text: err?.message || "Failed to upload photos." });
    }
  };

  const handleDeletePhoto = async (id: string, photoUrl: string, type: "BEFORE" | "AFTER") => {
    setMessage({ type: "", text: "" });
    try {
      await deletePhotoMutation.mutateAsync({ jobId: id, photoUrl, type });
      setMessage({ type: "success", text: "Photo deleted successfully!" });
    } catch (err: unknown) {
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
    } catch (err: unknown) {
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
    } catch (err: unknown) {
      setMessage({ type: "error", text: err?.message || "Failed to request extension." });
    }
  };

  const handleMarkOfflinePayment = async (bookingId: string, amount: number, paymentType: string) => {
    setMessage({ type: "", text: "" });
    try {
      await markOfflinePaymentMutation.mutateAsync({ bookingId, amount, paymentType });
      setMessage({ type: "success", text: `${paymentType} payment marked as received in cash.` });
    } catch (err: unknown) {
      setMessage({ type: "error", text: err?.message || "Failed to mark offline payment." });
    }
  };

  const handleVerifyOfflinePayment = async (paymentId: string) => {
    setMessage({ type: "", text: "" });
    try {
      await verifyOfflinePaymentMutation.mutateAsync(paymentId);
      setMessage({ type: "success", text: "Cash payment verified successfully." });
    } catch (err: unknown) {
      setMessage({ type: "error", text: err?.message || "Failed to verify cash payment." });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'COMPLETED': return "bg-success/10 text-success border-success/20";
      case 'IN_PROGRESS': return "bg-secondary-blue/10 text-secondary-blue border-secondary-blue/20";
      case 'NOT_STARTED': return "bg-warning/10 text-warning border-warning/20";
      default: return "bg-neutral-muted/10 text-neutral-muted border-neutral-muted/20";
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      <h2 className="text-2xl font-bold text-primary-navy">My Jobs</h2>

      {message.text && (
        <div className={`p-3 rounded-lg text-sm border ${message.type === "success"
          ? "bg-success/10 text-success border-success/20"
          : "bg-danger/10 text-danger border-danger/20"
          }`}>
          {message.text}
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center p-10 bg-neutral-white rounded-2xl shadow-sm border border-neutral-muted/20">
          <Loader2 className="w-8 h-8 text-primary-orange animate-spin" />
        </div>
      ) : jobs.length === 0 ? (
        <div className="bg-neutral-white p-10 rounded-2xl shadow-sm border border-neutral-muted/20 text-center">
          <Wrench className="w-12 h-12 text-neutral-muted/30 mb-3 mx-auto" />
          <p className="text-neutral-muted">You don&apos;t have any assigned jobs yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => {
            const jobId = job._id || job.id;
            return (
            <Card key={jobId} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between cursor-pointer" onClick={() => setExpandedId(expandedId === jobId ? null : jobId)}>
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-bold text-primary-navy">
                        {job.bookingId?.serviceId?.name || "Service Job"}
                      </h3>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${getStatusColor(job.status)}`}>
                        {job.status}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-3 text-sm text-neutral-muted mb-2">
                      <span className="flex items-center"><Car className="w-4 h-4 mr-1" /> {job.bookingId?.vehicleId?.brand} {job.bookingId?.vehicleId?.model}</span>
                      <span className="flex items-center"><MapPin className="w-4 h-4 mr-1" /> {job.bookingId?.cityId?.name}</span>
                      <span className="flex items-center"><Calendar className="w-4 h-4 mr-1" /> {job.bookingId?.preferredDate ? new Date(job.bookingId?.preferredDate).toLocaleDateString() : 'N/A'}</span>
                    </div>
                  </div>
                  <button className="text-neutral-muted hover:text-neutral-dark p-1 ml-4">
                    {expandedId === jobId ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </button>
                </div>

                {expandedId === jobId && (
                  <div className="mt-4 pt-4 border-t border-neutral-muted/20 space-y-6">
                    {/* File Uploads */}
                    {(job.status === "IN_PROGRESS" || job.status === "COMPLETED") && (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <div className="space-y-3 border border-neutral-muted/20 p-4 rounded-xl bg-white">
                              <h4 className="font-semibold text-primary-navy flex items-center">
                                <ImageIcon className="w-4 h-4 mr-2 text-primary-orange" /> Before Service Photos
                              </h4>
                              <input
                                type="file"
                                multiple
                                accept="image/*"
                                onChange={(e) => {
                                  if (e.target.files) setBeforePhotoFiles(Array.from(e.target.files));
                                }}
                                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-primary-orange hover:file:bg-orange-100 cursor-pointer"
                              />
                              {job.beforePhotos && job.beforePhotos.length > 0 && (
                                <div className="flex gap-2 overflow-x-auto py-2">
                                  {job.beforePhotos.map((url: string, idx: number) => (
                                    <div key={idx} className="relative flex-shrink-0 w-24 h-24 rounded-md overflow-hidden border border-neutral-muted/20 group">
                                      {/* eslint-disable-next-line @next/next/no-img-element */}
                                      <img src={url} alt={`Before ${idx}`} className="w-full h-full object-cover" />
                                      <button
                                        onClick={() => handleDeletePhoto(jobId, url, "BEFORE")}
                                        className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                        title="Delete Photo"
                                      >
                                        ×
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                              <Button
                                className="w-full"
                                disabled={beforePhotoFiles.length === 0}
                                isLoading={uploadPhotosMutation.isPending}
                                onClick={() => handleUploadPhotos(jobId, "BEFORE")}
                              >
                                Upload Before Photos
                              </Button>
                            </div>

                            <div className="space-y-3 border border-neutral-muted/20 p-4 rounded-xl bg-white">
                              <h4 className="font-semibold text-primary-navy flex items-center">
                                <ImageIcon className="w-4 h-4 mr-2 text-primary-orange" /> After Service Photos
                              </h4>
                              <input
                                type="file"
                                multiple
                                accept="image/*"
                                onChange={(e) => {
                                  if (e.target.files) setAfterPhotoFiles(Array.from(e.target.files));
                                }}
                                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-primary-orange hover:file:bg-orange-100 cursor-pointer"
                              />
                              {job.afterPhotos && job.afterPhotos.length > 0 && (
                                <div className="flex gap-2 overflow-x-auto py-2">
                                  {job.afterPhotos.map((url: string, idx: number) => (
                                    <div key={idx} className="relative flex-shrink-0 w-24 h-24 rounded-md overflow-hidden border border-neutral-muted/20 group">
                                      {/* eslint-disable-next-line @next/next/no-img-element */}
                                      <img src={url} alt={`After ${idx}`} className="w-full h-full object-cover" />
                                      <button
                                        onClick={() => handleDeletePhoto(jobId, url, "AFTER")}
                                        className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                        title="Delete Photo"
                                      >
                                        ×
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                              <Button
                                className="w-full"
                                disabled={afterPhotoFiles.length === 0}
                                isLoading={uploadPhotosMutation.isPending}
                                onClick={() => handleUploadPhotos(jobId, "AFTER")}
                              >
                                Upload After Photos
                              </Button>
                            </div>
                          </div>

                          <div className="space-y-3 border border-neutral-muted/20 p-4 rounded-xl">
                            <h4 className="font-semibold text-primary-navy flex items-center">
                              <UserCheck className="w-4 h-4 mr-2 text-primary-navy" /> Assign Mechanic
                            </h4>
                            <Select
                              value={mechanicId}
                              onChange={(e) => setMechanicId(e.target.value)}
                              options={[
                                { value: "", label: "Select a Mechanic..." },
                                ...staffList.map((staff: unknown) => ({
                                  value: staff._id,
                                  label: `${staff.name} (${staff.role})`
                                }))
                              ]}
                            />
                            <Button
                              variant="outline"
                              className="w-full"
                              disabled={!mechanicId}
                              isLoading={assignStaffMutation.isPending}
                              onClick={() => handleAssignMechanic(jobId)}
                            >
                              Assign to Job
                            </Button>
                          </div>
                        </div>

                        <div className="mt-6 space-y-3 border border-neutral-muted/20 p-4 rounded-xl bg-orange-50/30">
                          <h4 className="font-semibold text-primary-navy flex items-center">
                            <PlusCircle className="w-4 h-4 mr-2 text-primary-orange" /> Request Job Extension (Extra Part)
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <Input placeholder="Part Name (e.g. Brake Pads)" value={extPartName} onChange={(e) => setExtPartName(e.target.value)} />
                            <Input type="number" placeholder="Cost (₹)" value={extCost} onChange={(e) => setExtCost(e.target.value)} />
                            <Input placeholder="Reason" value={extReason} onChange={(e) => setExtReason(e.target.value)} />
                          </div>
                          <Button
                            className="w-full bg-primary-navy text-white hover:bg-primary-navy-light"
                            disabled={!extPartName || !extCost || !extReason}
                            isLoading={requestExtensionMutation.isPending}
                            onClick={() => handleRequestExtension(jobId)}
                          >
                            Send Extension Request to Customer
                          </Button>
                        </div>

                        {/* Invoice Submission & Review Section */}
                        <div className="grid grid-cols-1 mt-6">
                          <div className="space-y-4 border border-neutral-muted/20 p-5 rounded-2xl bg-white shadow-sm">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
                              <h4 className="font-bold text-primary-navy flex items-center gap-2">
                                <FileText className="w-5 h-5 text-primary-orange" /> Invoice & Bill Submission
                              </h4>
                              {/* Option Toggle */}
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
                                <p className="text-xs text-gray-500">
                                  Fill out the line items for parts and labor. Your invoice will be sent to the Executive for review before customer forwarding.
                                </p>

                                {/* Line Items Table */}
                                <div className="space-y-2">
                                  {invoiceItems.map((item, idx) => (
                                    <div key={idx} className="flex items-center gap-2 bg-gray-50 p-2.5 rounded-xl border border-gray-200">
                                      <input
                                        type="text"
                                        placeholder="Item / Service Description"
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
                                        className="w-24 px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-orange bg-white font-medium"
                                      />
                                      <span className="text-xs font-bold text-gray-900 w-20 text-right pr-2">
                                        ₹{(Number(item.quantity) || 1) * (Number(item.unitPrice) || 0)}
                                      </span>
                                      {invoiceItems.length > 1 && (
                                        <button
                                          onClick={() => handleRemoveInvoiceItem(idx)}
                                          className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded"
                                        >
                                          ×
                                        </button>
                                      )}
                                    </div>
                                  ))}

                                  <Button onClick={handleAddInvoiceItem} size="sm" variant="outline" className="text-xs font-bold text-primary-orange border-primary-orange/30 mt-1">
                                    + Add Item Line
                                  </Button>
                                </div>

                                {/* Financial Summary */}
                                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-100">
                                  <div>
                                    <label className="block text-[11px] font-bold text-gray-600 mb-1">Discount (₹)</label>
                                    <input
                                      type="number"
                                      min="0"
                                      value={invoiceDiscount}
                                      onChange={(e) => setInvoiceDiscount(Number(e.target.value) || 0)}
                                      className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-bold text-emerald-700 bg-white"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[11px] font-bold text-gray-600 mb-1">Tax / GST (₹)</label>
                                    <input
                                      type="number"
                                      min="0"
                                      value={invoiceTax}
                                      onChange={(e) => setInvoiceTax(Number(e.target.value) || 0)}
                                      className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-bold text-gray-800 bg-white"
                                    />
                                  </div>
                                </div>

                                <div className="flex justify-between items-center bg-orange-50 p-3 rounded-xl border border-orange-100 text-sm font-black text-gray-900">
                                  <span>Total Itemized Amount:</span>
                                  <span className="text-primary-orange text-lg">
                                    ₹{Math.max(0, invoiceItems.reduce((sum, item) => sum + ((Number(item.quantity) || 1) * (Number(item.unitPrice) || 0)), 0) + Number(invoiceTax || 0) - Number(invoiceDiscount || 0))}
                                  </span>
                                </div>

                                <Button
                                  onClick={() => handleSubmitItemizedInvoice(jobId)}
                                  isLoading={isSubmittingInvoice}
                                  className="w-full bg-primary-orange hover:bg-orange-600 text-white font-bold text-xs py-3"
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
                                  className="w-full text-xs font-bold"
                                  disabled={!invoiceUrl}
                                  isLoading={uploadInvoiceMutation.isPending}
                                  onClick={() => handleUploadInvoice(jobId)}
                                >
                                  {invoiceUrl ? "Save & Submit PDF Invoice" : job.invoiceUrl ? "✓ PDF Invoice Uploaded" : "Save PDF Invoice"}
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </>
                    )}

                    <div className="bg-neutral-bg p-4 rounded-xl border border-neutral-muted/10 mt-6">
                      <h4 className="font-semibold text-primary-navy mb-3">Job Actions</h4>

                      {job.status === "NOT_STARTED" && (
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-neutral-muted">Customer has approved your bid. Ready to start?</p>
                          <Button onClick={() => handleStartJob(jobId)} isLoading={startJobMutation.isPending}>
                            <PlayCircle className="w-4 h-4 mr-2" /> Start Job
                          </Button>
                        </div>
                      )}

                      {job.status === "IN_PROGRESS" && (
                        <div className="space-y-4">
                          <div className="flex items-end space-x-3">
                            <Input
                              label="Final Amount (₹) (Optional)"
                              type="number"
                              placeholder="If different from bid"
                              value={finalAmount}
                              onChange={(e) => setFinalAmount(e.target.value)}
                            />
                            <Button onClick={() => handleCompleteJob(job)} isLoading={completeJobMutation.isPending} className="bg-success hover:bg-success/90 w-48">
                              <CheckCircle2 className="w-4 h-4 mr-2" /> Complete Job
                            </Button>
                          </div>
                          <p className="text-xs text-neutral-muted">Review all details above (Photos, Invoices, Mechanics) before completing the job.</p>
                        </div>
                      )}

                      {job.status === "COMPLETED" && (
                        <div className="space-y-4">
                          <p className="text-sm text-success font-medium flex items-center justify-center p-3 bg-success/10 rounded-xl">
                            <CheckCircle2 className="w-5 h-5 mr-2" /> This job is completed. Great work!
                          </p>

                          <div className="border border-neutral-muted/20 p-4 rounded-xl mt-4 bg-white">
                            <h4 className="font-semibold text-primary-navy mb-2 flex items-center">
                              <HandCoins className="w-4 h-4 mr-2 text-primary-orange" /> Payment Status
                            </h4>

                            {(() => {
                              const finalPayment = job.payments?.find((p: unknown) => (p.paymentType === 'FINAL' || p.paymentType === 'FULL'));
                              const isFinalPaid = finalPayment?.status === 'SUCCESS';
                              const isFinalPending = finalPayment?.status === 'PENDING' && finalPayment?.provider === 'CASH';

                              if (isFinalPaid) {
                                return (
                                  <div className="mt-4 flex items-center text-success-dark font-medium bg-success/5 p-3 rounded-xl border border-success/20">
                                    <CheckCircle2 className="w-5 h-5 mr-2" /> Final Payment Received
                                  </div>
                                );
                              }

                              if (isFinalPending) {
                                return (
                                  <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4 p-3 rounded-xl border border-warning/30 bg-warning/5">
                                    <div>
                                      <p className="text-sm font-semibold text-warning-dark">Customer claims to have paid ₹{finalPayment.amount} in cash.</p>
                                      <p className="text-xs text-neutral-dark">Verify upon collection.</p>
                                    </div>
                                    <Button
                                      className="bg-primary-orange hover:bg-primary-orange/90 text-white w-full sm:w-auto"
                                      isLoading={verifyOfflinePaymentMutation.isPending}
                                      onClick={() => handleVerifyOfflinePayment(finalPayment._id)}
                                    >
                                      Verify & Accept Cash
                                    </Button>
                                  </div>
                                );
                              }

                              return (
                                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4">
                                  <div>
                                    <p className="text-sm text-neutral-dark">Final Due Amount:</p>
                                    <p className="text-2xl font-extrabold text-primary-orange">₹{job.finalAmount || 0}</p>
                                  </div>
                                  <Button
                                    className="bg-primary-navy hover:bg-primary-navy/90 text-white w-full sm:w-auto"
                                    isLoading={markOfflinePaymentMutation.isPending}
                                    onClick={() => handleMarkOfflinePayment(job.bookingId?._id || job.bookingId, job.finalAmount || 0, 'FINAL')}
                                  >
                                    Mark Received in Cash
                                  </Button>
                                </div>
                              );
                            })()}
                          </div>
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
    </div>
  );
}
