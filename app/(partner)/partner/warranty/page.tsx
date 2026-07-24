"use client";

import React, { useState, useEffect } from "react";
import { getPartnerJobs, issueJobWarranty, uploadFile } from "@/lib/services";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/Select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { FileUpload } from "@/components/ui/FileUpload";
import { ShieldCheck, Loader2, Wrench, CheckCircle } from "lucide-react";

export default function PartnerWarrantyPage() {
  const [completedJobs, setCompletedJobs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const [jobId, setJobId] = useState("");
  const [warrantyPeriodMonths, setWarrantyPeriodMonths] = useState("6");
  const [warrantyUrl, setWarrantyUrl] = useState<string>("");

  useEffect(() => {
    fetchCompletedJobs();
  }, []);

  const fetchCompletedJobs = async () => {
    try {
      setIsLoading(true);
      // Fetch only completed jobs
      const res = await getPartnerJobs("COMPLETED");
      const dataArray = res?.data?.docs || res?.data || res?.docs || [];
      setCompletedJobs(Array.isArray(dataArray) ? dataArray : []);
    } catch (err) {
      console.error("Failed to load completed jobs", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleIssueWarranty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobId) {
      setMessage({ type: "error", text: "Please select a job." });
      return;
    }
    if (!warrantyUrl) {
      setMessage({ type: "error", text: "Please upload a warranty document." });
      return;
    }

    setIsSubmitting(true);
    setMessage({ type: "", text: "" });

    try {
      // 2. Issue the warranty
      await issueJobWarranty(jobId, {
        warrantyPeriodMonths: parseInt(warrantyPeriodMonths),
        warrantyDocumentUrl: warrantyUrl
      });

      setMessage({ type: "success", text: "Warranty issued successfully!" });
      setJobId("");
      setWarrantyPeriodMonths("6");
      setWarrantyUrl("");
      
      // Refresh list to potentially remove the job if it already has a warranty (handled by backend ideally)
      fetchCompletedJobs();
    } catch (err: any) {
      setMessage({ type: "error", text: err?.message || "Failed to issue warranty." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-primary-navy">Issue Warranty</h2>
      
      <p className="text-neutral-muted text-sm mb-6">
        Provide warranties for completed services. Select a completed job and upload the warranty certificate.
      </p>

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
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <ShieldCheck className="w-5 h-5 text-primary-orange" />
              <span>New Warranty Document</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleIssueWarranty} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Select
                    label="Completed Job"
                    value={jobId}
                    onChange={(e) => setJobId(e.target.value)}
                    options={completedJobs.map(job => ({ 
                      value: job._id, 
                      label: `${job.bookingId?.vehicleId?.brand} ${job.bookingId?.vehicleId?.model} - ${job.bookingId?.serviceId?.name}` 
                    }))}
                    disabled={completedJobs.length === 0}
                    required
                  />
                  {completedJobs.length === 0 && (
                    <p className="text-xs text-neutral-muted mt-1">You have no completed jobs available.</p>
                  )}
                </div>
                
                <Select
                  label="Warranty Period"
                  value={warrantyPeriodMonths}
                  onChange={(e) => setWarrantyPeriodMonths(e.target.value)}
                  options={[
                    { value: "3", label: "3 Months" },
                    { value: "6", label: "6 Months" },
                    { value: "12", label: "12 Months (1 Year)" },
                    { value: "24", label: "24 Months (2 Years)" },
                  ]}
                  required
                />
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-neutral-dark mb-1.5">Warranty Certificate (PDF/Image)</label>
                  <FileUpload
                    folder="warranties"
                    onUploadSuccess={setWarrantyUrl}
                    currentValue={warrantyUrl}
                  />
                </div>
              </div>
              
              <div className="flex justify-end pt-4 border-t border-neutral-muted/10">
                <Button type="submit" isLoading={isSubmitting} disabled={completedJobs.length === 0 || !warrantyUrl}>
                  Issue Warranty
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* List of recent completed jobs for reference */}
      <div className="pt-6">
        <h3 className="text-xl font-bold text-primary-navy mb-4">Completed Jobs Reference</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {!isLoading && completedJobs.length === 0 ? (
             <div className="md:col-span-2 p-6 text-center border border-dashed rounded-lg border-neutral-muted/30">
               <p className="text-neutral-muted text-sm">No completed jobs found.</p>
             </div>
          ) : (
            completedJobs.slice(0, 4).map((job) => (
              <div key={job._id} className="bg-neutral-white p-4 rounded-xl border border-neutral-muted/20 flex items-start space-x-3">
                <div className="bg-success/10 p-2 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-success" />
                </div>
                <div>
                  <h4 className="font-semibold text-primary-navy text-sm">{job.bookingId?.serviceId?.name}</h4>
                  <p className="text-xs text-neutral-muted mt-0.5">{job.bookingId?.vehicleId?.brand} {job.bookingId?.vehicleId?.model}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
