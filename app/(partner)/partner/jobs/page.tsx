"use client";

import React, { useState, useEffect } from "react";
import { getPartnerJobs, startJob, completeJob, uploadJobInvoice, uploadJobPhotos, assignStaffToJob, requestJobExtension } from "@/lib/services";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { FileUpload } from "@/components/ui/FileUpload";
import { Wrench, Loader2, ChevronDown, ChevronUp, Image as ImageIcon, FileText, CheckCircle2, PlayCircle, MapPin, Calendar, Car, UserCheck, PlusCircle } from "lucide-react";

export default function PartnerJobsPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [message, setMessage] = useState({ type: "", text: "" });

  // Action states
  const [isStarting, setIsStarting] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [finalAmount, setFinalAmount] = useState("");
  
  const [invoiceUrl, setInvoiceUrl] = useState<string>("");
  const [isUploadingInvoice, setIsUploadingInvoice] = useState(false);

  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [photoType, setPhotoType] = useState<"BEFORE" | "AFTER">("BEFORE");
  const [isUploadingPhotos, setIsUploadingPhotos] = useState(false);

  // Mechanic Assignment
  const [mechanicId, setMechanicId] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);

  // Job Extension
  const [extPartName, setExtPartName] = useState("");
  const [extCost, setExtCost] = useState("");
  const [extReason, setExtReason] = useState("");
  const [isRequestingExt, setIsRequestingExt] = useState(false);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      setIsLoading(true);
      const res = await getPartnerJobs();
      const dataArray = res?.data?.docs || res?.data || res?.docs || [];
      setJobs(Array.isArray(dataArray) ? dataArray : []);
    } catch (err) {
      console.error("Failed to load jobs", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartJob = async (id: string) => {
    setIsStarting(true);
    setMessage({ type: "", text: "" });
    try {
      await startJob(id);
      setMessage({ type: "success", text: "Job started successfully!" });
      fetchJobs();
    } catch (err: any) {
      setMessage({ type: "error", text: err?.message || "Failed to start job." });
    } finally {
      setIsStarting(false);
    }
  };

  const handleCompleteJob = async (id: string) => {
    setIsCompleting(true);
    setMessage({ type: "", text: "" });
    try {
      const payload = finalAmount ? { finalAmount: parseFloat(finalAmount) } : undefined;
      await completeJob(id, payload);
      setMessage({ type: "success", text: "Job marked as complete!" });
      setFinalAmount("");
      fetchJobs();
    } catch (err: any) {
      setMessage({ type: "error", text: err?.message || "Failed to complete job." });
    } finally {
      setIsCompleting(false);
    }
  };

  const handleUploadInvoice = async (id: string) => {
    if (!invoiceUrl) return;
    setIsUploadingInvoice(true);
    setMessage({ type: "", text: "" });
    try {
      await uploadJobInvoice(id, { invoiceUrl });
      setMessage({ type: "success", text: "Invoice linked successfully!" });
      setInvoiceUrl("");
      fetchJobs();
    } catch (err: any) {
      setMessage({ type: "error", text: err?.message || "Failed to link invoice." });
    } finally {
      setIsUploadingInvoice(false);
    }
  };

  const handleUploadPhotos = async (id: string) => {
    if (photoFiles.length === 0) return;
    setIsUploadingPhotos(true);
    setMessage({ type: "", text: "" });
    try {
      const formData = new FormData();
      formData.append("type", photoType);
      photoFiles.forEach((file) => formData.append("photos", file));

      await uploadJobPhotos(id, formData);
      setMessage({ type: "success", text: `${photoType} photos uploaded successfully!` });
      setPhotoFiles([]);
      fetchJobs();
    } catch (err: any) {
      setMessage({ type: "error", text: err?.message || "Failed to upload photos." });
    } finally {
      setIsUploadingPhotos(false);
    }
  };

  const handleAssignMechanic = async (id: string) => {
    if (!mechanicId) return;
    setIsAssigning(true);
    setMessage({ type: "", text: "" });
    try {
      await assignStaffToJob(id, { staffId: mechanicId });
      setMessage({ type: "success", text: "Mechanic assigned successfully!" });
      setMechanicId("");
      fetchJobs();
    } catch (err: any) {
      setMessage({ type: "error", text: err?.message || "Failed to assign mechanic." });
    } finally {
      setIsAssigning(false);
    }
  };

  const handleRequestExtension = async (id: string) => {
    if (!extPartName || !extCost || !extReason) return;
    setIsRequestingExt(true);
    setMessage({ type: "", text: "" });
    try {
      await requestJobExtension(id, { 
        partName: extPartName, 
        cost: Number(extCost), 
        reason: extReason 
      });
      setMessage({ type: "success", text: "Extension requested from customer!" });
      setExtPartName(""); setExtCost(""); setExtReason("");
      fetchJobs();
    } catch (err: any) {
      setMessage({ type: "error", text: err?.message || "Failed to request extension." });
    } finally {
      setIsRequestingExt(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch(status?.toUpperCase()) {
      case 'COMPLETED': return "bg-success/10 text-success border-success/20";
      case 'STARTED': return "bg-secondary-blue/10 text-secondary-blue border-secondary-blue/20";
      case 'ASSIGNED': return "bg-warning/10 text-warning border-warning/20";
      default: return "bg-neutral-muted/10 text-neutral-muted border-neutral-muted/20";
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-primary-navy">My Jobs</h2>

      {message.text && (
        <div className={`p-3 rounded-lg text-sm border ${
          message.type === "success" 
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
          <p className="text-neutral-muted">You don't have any assigned jobs yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => (
            <Card key={job._id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between cursor-pointer" onClick={() => setExpandedId(expandedId === job._id ? null : job._id)}>
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
                      <span className="flex items-center"><Car className="w-4 h-4 mr-1"/> {job.bookingId?.vehicleId?.brand} {job.bookingId?.vehicleId?.model}</span>
                      <span className="flex items-center"><MapPin className="w-4 h-4 mr-1"/> {job.bookingId?.cityId?.name}</span>
                      <span className="flex items-center"><Calendar className="w-4 h-4 mr-1"/> {new Date(job.bookingId?.preferredDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <button className="text-neutral-muted hover:text-neutral-dark p-1 ml-4">
                    {expandedId === job._id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </button>
                </div>

                {expandedId === job._id && (
                  <div className="mt-4 pt-4 border-t border-neutral-muted/20 space-y-6">
                    {/* Job Actions based on Status */}
                    <div className="bg-neutral-bg p-4 rounded-xl border border-neutral-muted/10">
                      <h4 className="font-semibold text-primary-navy mb-3">Job Actions</h4>
                      
                      {job.status === "ASSIGNED" && (
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-neutral-muted">Customer has approved your bid. Ready to start?</p>
                          <Button onClick={() => handleStartJob(job._id)} isLoading={isStarting}>
                            <PlayCircle className="w-4 h-4 mr-2" /> Start Job
                          </Button>
                        </div>
                      )}

                      {job.status === "STARTED" && (
                        <div className="space-y-4">
                          <div className="flex items-end space-x-3">
                            <Input
                              label="Final Amount (₹) (Optional)"
                              type="number"
                              placeholder="If different from bid"
                              value={finalAmount}
                              onChange={(e) => setFinalAmount(e.target.value)}
                            />
                            <Button onClick={() => handleCompleteJob(job._id)} isLoading={isCompleting} className="bg-success hover:bg-success/90">
                              <CheckCircle2 className="w-4 h-4 mr-2" /> Mark Complete
                            </Button>
                          </div>
                        </div>
                      )}

                      {job.status === "COMPLETED" && (
                        <p className="text-sm text-success font-medium flex items-center">
                          <CheckCircle2 className="w-4 h-4 mr-2" /> This job is completed. Great work!
                        </p>
                      )}
                    </div>

                    {/* File Uploads - Available during STARTED or COMPLETED */}
                    {(job.status === "STARTED" || job.status === "COMPLETED") && (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Photos Upload (Multipart) */}
                        <div className="space-y-3 border border-neutral-muted/20 p-4 rounded-xl">
                          <h4 className="font-semibold text-primary-navy flex items-center">
                            <ImageIcon className="w-4 h-4 mr-2 text-primary-orange" /> Job Photos
                          </h4>
                          <div className="flex space-x-4 mb-2">
                            <label className="flex items-center space-x-2 text-sm cursor-pointer">
                              <input type="radio" checked={photoType === "BEFORE"} onChange={() => setPhotoType("BEFORE")} className="text-primary-orange focus:ring-primary-orange" />
                              <span>Before Service</span>
                            </label>
                            <label className="flex items-center space-x-2 text-sm cursor-pointer">
                              <input type="radio" checked={photoType === "AFTER"} onChange={() => setPhotoType("AFTER")} className="text-primary-orange focus:ring-primary-orange" />
                              <span>After Service</span>
                            </label>
                          </div>
                          <input 
                            type="file" 
                            multiple 
                            accept="image/*"
                            onChange={(e) => {
                              if (e.target.files) setPhotoFiles(Array.from(e.target.files));
                            }}
                            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-primary-orange hover:file:bg-orange-100 cursor-pointer"
                          />
                          <Button 
                            variant="outline" 
                            className="w-full" 
                            disabled={photoFiles.length === 0}
                            isLoading={isUploadingPhotos}
                            onClick={() => handleUploadPhotos(job._id)}
                          >
                            Upload Photos
                          </Button>
                        </div>

                        {/* Assign Mechanic */}
                        <div className="space-y-3 border border-neutral-muted/20 p-4 rounded-xl">
                          <h4 className="font-semibold text-primary-navy flex items-center">
                            <UserCheck className="w-4 h-4 mr-2 text-primary-navy" /> Assign Mechanic
                          </h4>
                          <Input 
                            placeholder="Enter Staff ID..." 
                            value={mechanicId} 
                            onChange={(e) => setMechanicId(e.target.value)} 
                          />
                          <Button 
                            variant="outline" 
                            className="w-full"
                            disabled={!mechanicId}
                            isLoading={isAssigning}
                            onClick={() => handleAssignMechanic(job._id)}
                          >
                            Assign to Job
                          </Button>
                        </div>
                      </div>

                      {/* Request Extension */}
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
                          isLoading={isRequestingExt}
                          onClick={() => handleRequestExtension(job._id)}
                        >
                          Send Extension Request to Customer
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 mt-6">

                        {/* Invoice Upload */}
                        <div className="space-y-3 border border-neutral-muted/20 p-4 rounded-xl">
                          <h4 className="font-semibold text-primary-navy flex items-center">
                            <FileText className="w-4 h-4 mr-2 text-primary-navy" /> Upload Invoice
                          </h4>
                          <FileUpload
                            folder="invoices"
                            onUploadSuccess={(url) => setInvoiceUrl(url)}
                            currentValue={invoiceUrl}
                          />
                          <Button 
                            variant="outline" 
                            className="w-full" 
                            disabled={!invoiceUrl}
                            isLoading={isUploadingInvoice}
                            onClick={() => handleUploadInvoice(job._id)}
                          >
                            Save Invoice to Job
                          </Button>
                        </div>
                      </div>
                      </>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
