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

  const handleStartJob = async (id: string) => {
    setMessage({ type: "", text: "" });
    try {
      await startJobMutation.mutateAsync(id);
      setMessage({ type: "success", text: "Job started successfully!" });
    } catch (err: unknown) {
      setMessage({ type: "error", text: err?.message || "Failed to start job." });
    }
  };

  const handleCompleteJob = async (job: unknown) => {
    if (!job.invoiceUrl && !invoiceUrl) {
      setMessage({ type: "error", text: "Please upload an invoice document before completing the job." });
      return;
    }
    setMessage({ type: "", text: "" });
    try {
      const payload: unknown = {};
      if (finalAmount) payload.finalAmount = parseFloat(finalAmount);
      if (invoiceUrl) payload.invoiceUrl = invoiceUrl;

      await completeJobMutation.mutateAsync({ jobId: job._id || job.id, payload });
      setMessage({ type: "success", text: "Job marked as complete!" });
      setFinalAmount("");
    } catch (err: unknown) {
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

                        <div className="grid grid-cols-1 mt-6">
                          <div className="space-y-3 border border-neutral-muted/20 p-4 rounded-xl">
                            <h4 className="font-semibold text-primary-navy flex items-center">
                              <FileText className="w-4 h-4 mr-2 text-primary-navy" /> Upload Invoice
                            </h4>
                            <FileUpload
                              folder="invoices"
                              onUploadSuccess={(url) => setInvoiceUrl(url)}
                              currentValue={invoiceUrl || job.invoiceUrl}
                            />
                            <Button
                              variant="outline"
                              className="w-full"
                              disabled={!invoiceUrl}
                              isLoading={uploadInvoiceMutation.isPending}
                              onClick={() => handleUploadInvoice(jobId)}
                            >
                              {invoiceUrl ? "Save Invoice to Job" : job.invoiceUrl ? "✓ Invoice Saved" : "Save Invoice to Job"}
                            </Button>
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
