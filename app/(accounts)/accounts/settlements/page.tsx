// @ts-nocheck
"use client";

import React, { useState } from "react";
import { uploadBankReconciliation } from "@/lib/services";
import { 
  useSettlements, 
  useEligibleJobsForSettlement, 
  useGenerateSettlementMutation, 
  useProcessSettlementMutation 
} from "@/features/accounts/hooks/useAccountsQueries";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { BadgeIndianRupee, Loader2, ArrowRightCircle, PlusCircle, CheckCircle2, UploadCloud, FileText } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function SettlementsPage() {
  const { data: settlementsData, isLoading: isLoadingSettlements, refetch: refetchSettlements } = useSettlements({ page: 1, limit: 50 });
  const settlements = settlementsData?.settlements || [];
  
  const { data: eligibleJobsData, isLoading: isJobsLoading, refetch: refetchJobs } = useEligibleJobsForSettlement();
  const eligibleJobs = eligibleJobsData || [];
  
  const [actionId, setActionId] = useState<string | null>(null);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [transactionRef, setTransactionRef] = useState("");
  const [showProcessFor, setShowProcessFor] = useState<string | null>(null);

  const [showGenerateFor, setShowGenerateFor] = useState<unknown | null>(null);
  const [commissionPercent, setCommissionPercent] = useState<number>(15);

  const [reconFile, setReconFile] = useState<File | null>(null);
  const [isUploadingRecon, setIsUploadingRecon] = useState(false);

  const processMutation = useProcessSettlementMutation();
  const generateMutation = useGenerateSettlementMutation();

  const handleProcess = async () => {
    if (!showProcessFor || !transactionRef) return;
    
    setActionId(showProcessFor);
    setMessage({ type: "", text: "" });
    try {
      await processMutation.mutateAsync({ id: showProcessFor, transactionReference: transactionRef });
      setMessage({ type: "success", text: "Settlement processed successfully." });
      setShowProcessFor(null);
      setTransactionRef("");
    } catch (err: unknown) {
      setMessage({ type: "error", text: err?.message || `Failed to process settlement.` });
    } finally {
      setActionId(null);
    }
  };

  const handleGenerate = async () => {
    if (!showGenerateFor) return;
    
    setActionId(showGenerateFor._id);
    setMessage({ type: "", text: "" });
    try {
      await generateMutation.mutateAsync({ jobId: showGenerateFor._id, commissionPercent });
      setMessage({ type: "success", text: "Settlement generated successfully." });
      setShowGenerateFor(null);
    } catch (err: unknown) {
      setMessage({ type: "error", text: err?.message || `Failed to generate settlement.` });
    } finally {
      setActionId(null);
    }
  };

  const handleUploadRecon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reconFile) return;

    setIsUploadingRecon(true);
    setMessage({ type: "", text: "" });
    try {
      const formData = new FormData();
      formData.append("file", reconFile);
      
      const res = await uploadBankReconciliation(formData);
      setMessage({ type: "success", text: `Bank reconciliation uploaded successfully! Found ${res.data?.totalProcessed || 0} records.` });
      setReconFile(null);
      refetchSettlements();
      refetchJobs();
    } catch (err: unknown) {
      setMessage({ type: "error", text: err?.message || "Failed to upload bank reconciliation." });
    } finally {
      setIsUploadingRecon(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-primary-navy">Settlement Management</h2>
      </div>

      {message.text && (
        <div className={`p-3 rounded-lg text-sm border ${
          message.type === "success" 
            ? "bg-success/10 text-success border-success/20" 
            : "bg-danger/10 text-danger border-danger/20"
        }`}>
          {message.text}
        </div>
      )}

      {/* Bank Reconciliation Upload Section */}
      <Card className="bg-primary-navy text-white shadow-lg overflow-hidden border-none">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <FileText className="w-32 h-32" />
        </div>
        <CardContent className="p-8 relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex-1">
            <h3 className="text-xl font-bold mb-2 flex items-center">
              <UploadCloud className="w-6 h-6 mr-2 text-primary-orange" /> Bulk Bank Reconciliation
            </h3>
            <p className="text-neutral-muted text-sm max-w-lg">
              Upload a CSV from the bank to automatically mark multiple pending settlements as processed. The file must contain a UTR or Reference Number column.
            </p>
          </div>
          <form onSubmit={handleUploadRecon} className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto bg-white/10 p-4 rounded-xl border border-white/20">
            <input 
              type="file"
              accept=".csv"
              onChange={(e) => setReconFile(e.target.files ? e.target.files[0] : null)}
              className="w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-orange file:text-white hover:file:bg-orange-600 cursor-pointer"
            />
            <Button type="submit" isLoading={isUploadingRecon} disabled={!reconFile} className="bg-white text-primary-navy hover:bg-gray-100 whitespace-nowrap">
              Upload CSV
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Eligible Jobs Section */}
      <Card className="border-l-4 border-l-secondary-blue">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-lg">
            <CheckCircle2 className="w-5 h-5 text-secondary-blue" />
            <span>Eligible Jobs for Settlement</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isJobsLoading ? (
            <div className="flex items-center justify-center py-5">
              <Loader2 className="w-6 h-6 text-secondary-blue animate-spin" />
            </div>
          ) : eligibleJobs.length === 0 ? (
            <div className="text-center py-5 text-neutral-muted">
              <p>No new eligible jobs found for settlement.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-neutral-muted uppercase bg-neutral-bg">
                  <tr>
                    <th className="px-4 py-2 rounded-l-lg">Job ID</th>
                    <th className="px-4 py-2">Partner</th>
                    <th className="px-4 py-2">Job Amount</th>
                    <th className="px-4 py-2">Cash Collected</th>
                    <th className="px-4 py-2">Online Paid</th>
                    <th className="px-4 py-2 rounded-r-lg text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-muted/10">
                  {eligibleJobs.map((job) => (
                    <tr key={job._id} className="hover:bg-neutral-bg/50 transition-colors">
                      <td className="px-4 py-2 font-medium">#{job._id?.slice(-6).toUpperCase()}</td>
                      <td className="px-4 py-2">{job.partnerId?.businessName || "Unknown Partner"}</td>
                      <td className="px-4 py-2 font-bold text-primary-navy">₹{job.finalAmount || job.amount}</td>
                      <td className="px-4 py-2 text-warning font-semibold">₹{job.cashCollected || 0}</td>
                      <td className="px-4 py-2 text-success font-semibold">₹{job.onlinePaid || 0}</td>
                      <td className="px-4 py-2 text-right">
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="border-primary-orange text-primary-orange hover:bg-primary-orange/10"
                          onClick={() => setShowGenerateFor(job)}
                        >
                          <PlusCircle className="w-4 h-4 mr-1" /> Generate
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Existing Settlements Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BadgeIndianRupee className="w-5 h-5 text-primary-orange" />
            <span>Settlements History</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingSettlements ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-8 h-8 text-primary-orange animate-spin" />
            </div>
          ) : settlements.length === 0 ? (
            <div className="text-center py-10 text-neutral-muted">
              <p>No settlements found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-neutral-muted uppercase bg-neutral-bg">
                  <tr>
                    <th className="px-4 py-3 rounded-l-lg">ID / Partner</th>
                    <th className="px-4 py-3">Date Generated</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 rounded-r-lg text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-muted/10">
                  {settlements.map((settlement) => (
                    <tr key={settlement._id} className="hover:bg-neutral-bg/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-primary-navy">
                        #{settlement._id?.slice(-6).toUpperCase()}
                        <div className="text-xs text-neutral-muted mt-1">Partner: {settlement.partnerId?.businessName || "Unknown Partner"}</div>
                      </td>
                      <td className="px-4 py-3 text-neutral-dark">
                        {new Date(settlement.createdAt || new Date()).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 font-bold text-primary-navy">₹{settlement.netPayoutAmount}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          settlement.status === 'PROCESSED' ? 'bg-green-100 text-green-700' :
                          'bg-warning/20 text-warning'
                        }`}>
                          {settlement.status || 'PENDING'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {settlement.status === 'PENDING' ? (
                          <Button 
                            size="sm" 
                            className="bg-primary-navy hover:bg-primary-navy-light"
                            onClick={() => setShowProcessFor(settlement._id)}
                          >
                            <ArrowRightCircle className="w-4 h-4 mr-1" /> Process
                          </Button>
                        ) : (
                          <span className="text-xs text-neutral-muted">Ref: {settlement.transactionReference}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Generate Modal Overlay */}
      {showGenerateFor && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md shadow-xl">
            <CardHeader>
              <CardTitle>Generate Settlement</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 bg-neutral-bg rounded-lg text-sm mb-2">
                <p><strong>Job ID:</strong> {showGenerateFor._id}</p>
                <p><strong>Job Amount:</strong> ₹{showGenerateFor.finalAmount || showGenerateFor.amount}</p>
              </div>
              <Input
                label="Commission Percentage (%)"
                type="number"
                min={0}
                max={100}
                step={0.1}
                value={commissionPercent}
                onChange={(e) => setCommissionPercent(Number(e.target.value))}
                required
              />
              <div className="flex justify-end space-x-3 pt-2">
                <Button variant="outline" onClick={() => setShowGenerateFor(null)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleGenerate}
                  isLoading={actionId === showGenerateFor._id}
                >
                  Generate
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Process Modal Overlay */}
      {showProcessFor && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md shadow-xl">
            <CardHeader>
              <CardTitle>Process Settlement</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Transaction Reference"
                placeholder="e.g. UTR1234567890"
                value={transactionRef}
                onChange={(e) => setTransactionRef(e.target.value)}
                required
              />
              <div className="flex justify-end space-x-3 pt-2">
                <Button variant="outline" onClick={() => { setShowProcessFor(null); setTransactionRef(""); }}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleProcess}
                  isLoading={actionId === showProcessFor}
                  disabled={!transactionRef}
                >
                  Mark as Processed
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
