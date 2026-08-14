// @ts-nocheck
"use client";

import React, { useState } from "react";
import { uploadBankReconciliation } from "@/lib/services";
import { 
  useSettlements, 
  useProcessSettlementMutation,
  usePlatformRevenueStats
} from "@/features/accounts/hooks/useAccountsQueries";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { BadgeIndianRupee, Loader2, ArrowRightCircle, UploadCloud, FileText, Search, ChevronLeft, ChevronRight, Eye, TrendingUp, Calendar, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function SettlementsPage() {
  const [page, setPage] = useState(1);
  const limit = 10;
  
  const [searchTerm, setSearchTerm] = useState("");
  const { data: settlementsData, isLoading: isLoadingSettlements, refetch: refetchSettlements } = useSettlements({ page, limit, search: searchTerm });
  const allSettlements = settlementsData?.settlements || [];
  const total = settlementsData?.total || 0;
  
  const { data: revenueStats, isLoading: isLoadingStats } = usePlatformRevenueStats();

  const [actionId, setActionId] = useState<string | null>(null);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [securityPin, setSecurityPin] = useState("");
  const [showProcessFor, setShowProcessFor] = useState<string | null>(null);
  const [selectedSettlement, setSelectedSettlement] = useState<any>(null); // For details modal

  const [reconFile, setReconFile] = useState<File | null>(null);
  const [isUploadingRecon, setIsUploadingRecon] = useState(false);

  const processMutation = useProcessSettlementMutation();

  const handleProcess = async () => {
    if (!showProcessFor || !securityPin || securityPin.length < 4) {
      setMessage({ type: "error", text: "Please enter a valid 4-digit Security PIN." });
      return;
    }
    
    setActionId(showProcessFor);
    setMessage({ type: "", text: "" });
    try {
      await processMutation.mutateAsync({ id: showProcessFor, transactionReference: "", pin: securityPin });
      setMessage({ type: "success", text: "Settlement processed successfully." });
      setShowProcessFor(null);
      setSecurityPin("");
      refetchSettlements();
    } catch (err: unknown) {
      setMessage({ type: "error", text: err?.message || `Failed to process settlement.` });
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
    } catch (err: unknown) {
      setMessage({ type: "error", text: err?.message || "Failed to upload bank reconciliation." });
    } finally {
      setIsUploadingRecon(false);
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-primary-navy">Settlement & Analytics</h2>
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

      {/* Platform Revenue Analytics Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-indigo-50 to-white border-indigo-100 shadow-sm">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-neutral-muted mb-1">Last 7 Days Comm.</p>
                {isLoadingStats ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <h3 className="text-3xl font-bold text-indigo-700">₹{revenueStats?.weekly?.totalCommission || 0}</h3>
                )}
              </div>
              <div className="p-3 bg-indigo-100 rounded-lg"><Clock className="w-5 h-5 text-indigo-600" /></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-50 to-white border-emerald-100 shadow-sm">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-neutral-muted mb-1">Last 30 Days Comm.</p>
                {isLoadingStats ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <h3 className="text-3xl font-bold text-emerald-700">₹{revenueStats?.monthly?.totalCommission || 0}</h3>
                )}
              </div>
              <div className="p-3 bg-emerald-100 rounded-lg"><Calendar className="w-5 h-5 text-emerald-600" /></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-orange-50 to-white border-orange-100 shadow-sm">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-neutral-muted mb-1">Total Platform Comm.</p>
                {isLoadingStats ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <h3 className="text-3xl font-bold text-primary-orange">₹{revenueStats?.yearly?.totalCommission || 0}</h3>
                )}
              </div>
              <div className="p-3 bg-orange-100 rounded-lg"><TrendingUp className="w-5 h-5 text-primary-orange" /></div>
            </div>
          </CardContent>
        </Card>
      </div>

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

      {/* Existing Settlements Section */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0 pb-4">
          <CardTitle className="flex items-center space-x-2">
            <BadgeIndianRupee className="w-5 h-5 text-primary-orange" />
            <span>Settlements History</span>
          </CardTitle>
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by ID or Partner Name..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-navy/20"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingSettlements ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-8 h-8 text-primary-orange animate-spin" />
            </div>
          ) : allSettlements.length === 0 ? (
            <div className="text-center py-10 text-neutral-muted">
              <p>No settlements found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-neutral-muted uppercase bg-neutral-bg">
                  <tr>
                    <th className="px-4 py-3 rounded-l-lg">ID / Partner</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Financials</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Transaction Ref (UTR)</th>
                    <th className="px-4 py-3 rounded-r-lg text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-muted/10">
                  {allSettlements.map((settlement) => (
                    <tr key={settlement._id} className="hover:bg-neutral-bg/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-primary-navy">
                        #{settlement._id?.slice(-6).toUpperCase()}
                        <div className="text-xs text-neutral-muted mt-1">Partner: {settlement.partnerId?.businessName || "Unknown Partner"}</div>
                      </td>
                      <td className="px-4 py-3 text-neutral-dark whitespace-nowrap">
                        {new Date(settlement.createdAt || new Date()).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col text-xs space-y-0.5">
                          <div className="text-neutral-dark"><span className="text-neutral-muted">Gross:</span> ₹{settlement.grossAmount || 0}</div>
                          <div className="text-danger"><span className="text-neutral-muted">Comm (-):</span> ₹{settlement.platformCommission || 0}</div>
                          <div className="text-success font-bold mt-1"><span className="text-primary-navy">Net:</span> ₹{settlement.netPayoutAmount || 0}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          settlement.status === 'PROCESSED' ? 'bg-green-100 text-green-700 border border-green-200' :
                          'bg-warning/20 text-warning border border-warning/30'
                        }`}>
                          {settlement.status || 'PENDING'}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-600">
                        {settlement.status === 'PROCESSED' ? (
                          <span className="bg-gray-100 px-2 py-1 rounded border border-gray-200 block w-fit">
                            {settlement.transactionReference || 'N/A'}
                          </span>
                        ) : (
                          <span className="text-gray-400 italic">Pending...</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex flex-col items-end space-y-2">
                          {settlement.status === 'PENDING' && (
                            <Button 
                              size="sm" 
                              className="bg-primary-navy hover:bg-primary-navy-light shadow-sm"
                              onClick={() => setShowProcessFor(settlement._id)}
                            >
                              <ArrowRightCircle className="w-4 h-4 mr-1" /> Process
                            </Button>
                          )}
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-primary-orange hover:text-orange-600 hover:bg-orange-50 h-8"
                            onClick={() => setSelectedSettlement(settlement)}
                          >
                            <Eye className="w-4 h-4 mr-1" /> Details
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination Controls */}
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-neutral-muted/10">
                <span className="text-xs text-neutral-muted">
                  Showing page {page} of {totalPages || 1} ({total} total records)
                </span>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" /> Prev
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages || 1, p + 1))}
                    disabled={page >= (totalPages || 1)}
                  >
                    Next <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Details Modal Overlay */}
      {selectedSettlement && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md shadow-xl">
            <CardHeader className="border-b pb-4 mb-4">
              <CardTitle className="text-lg">Settlement Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm border-b pb-2">
                  <span className="text-gray-500">Partner Name</span>
                  <span className="font-semibold">{selectedSettlement.partnerId?.businessName || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center text-sm border-b pb-2">
                  <span className="text-gray-500">Customer Name</span>
                  <span className="font-semibold">{selectedSettlement.jobId?.bookingId?.customerId?.fullName || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center text-sm border-b pb-2">
                  <span className="text-gray-500">Final Booking Amount</span>
                  <span className="font-semibold text-primary-navy">₹{selectedSettlement.jobId?.finalAmount || selectedSettlement.grossAmount || 0}</span>
                </div>
                <div className="flex justify-between items-center text-sm border-b pb-2">
                  <span className="text-gray-500">Payment Mode</span>
                  <span className={`font-semibold px-2 py-0.5 rounded text-xs ${selectedSettlement.jobId?.bookingId?.paymentMode === 'CASH' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                    {selectedSettlement.jobId?.bookingId?.paymentMode || 'ONLINE'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Status</span>
                  <span className="font-semibold">{selectedSettlement.status}</span>
                </div>
              </div>
              <div className="flex justify-end pt-4">
                <Button onClick={() => setSelectedSettlement(null)}>Close</Button>
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
              <CardTitle>Process Settlement (RazorpayX)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-primary-navy/5 border border-primary-navy/10 rounded-lg">
                <p className="text-sm text-primary-navy/80 font-medium leading-relaxed">
                  This will automatically deduct funds from your RazorpayX account and transfer them to the partner's registered bank account.
                </p>
              </div>
              <Input
                label="Security PIN"
                type="password"
                placeholder="Enter 4-digit PIN"
                value={securityPin}
                onChange={(e) => setSecurityPin(e.target.value)}
                maxLength={4}
                required
              />
              <div className="flex justify-end space-x-3 pt-2">
                <Button variant="outline" onClick={() => { setShowProcessFor(null); setSecurityPin(""); }}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleProcess}
                  isLoading={actionId === showProcessFor}
                  disabled={!securityPin || securityPin.length < 4}
                >
                  Initiate Automatic Payout
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
