// @ts-nocheck
"use client";

import React, { useState } from "react";
import { useAdminSettlements, useMarkAdminSettlementPaidMutation } from "@/features/admin/hooks/useAdminQueries";
import { 
  useAccountsWithdrawalRequests, 
  useProcessWithdrawalMutation, 
  useRejectWithdrawalMutation 
} from "@/features/accounts/hooks/useAccountsQueries";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Loader2, IndianRupee, CheckCircle, XCircle, FileText, ChevronLeft, ChevronRight, Copy, Check, Wallet, Landmark, AlertCircle } from "lucide-react";
import { AdminFinanceNav } from "@/components/layout/AdminFinanceNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AdminSettlementsPage() {
  const [activeTab, setActiveTab] = useState<"WITHDRAWALS" | "JOB_SETTLEMENTS">("WITHDRAWALS");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const limit = 10;
  
  // Job Settlements query
  const { data: settlementsData, isLoading: isSettlementsLoading } = useAdminSettlements(page, limit, statusFilter);
  const settlements = settlementsData?.docs || settlementsData?.data || settlementsData || [];
  const totalPages = settlementsData?.totalPages || Math.ceil((settlementsData?.totalDocs || settlementsData?.total || 0) / limit) || 1;
  const markPaidMutation = useMarkAdminSettlementPaidMutation();

  // Partner Wallet Withdrawals query
  const { 
    data: withdrawalsData, 
    isLoading: isWithdrawalsLoading, 
    refetch: refetchWithdrawals 
  } = useAccountsWithdrawalRequests({ page, limit, status: statusFilter || undefined });
  const withdrawalList = withdrawalsData?.withdrawals || [];
  const totalWithdrawals = withdrawalsData?.total || withdrawalList.length;
  const withdrawalPages = Math.ceil(totalWithdrawals / limit) || 1;

  const processWithdrawalMut = useProcessWithdrawalMutation();
  const rejectWithdrawalMut = useRejectWithdrawalMutation();

  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);
  const [message, setMessage] = useState({ type: "", text: "" });

  // Modal State for Manual Payout
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<any>(null);
  const [utrNumber, setUtrNumber] = useState("");
  const [securityPin, setSecurityPin] = useState("");
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = (text: string, field: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleProcessManualPayout = async () => {
    if (!selectedWithdrawal) return;
    if (!utrNumber || utrNumber.trim().length < 3) {
      setMessage({ type: "error", text: "Please enter the Bank UTR / Transaction Reference ID from your IMPS/NEFT/UPI transfer." });
      return;
    }
    if (!securityPin || securityPin.length < 4) {
      setMessage({ type: "error", text: "Please enter your 4-digit Security PIN (Default: 1234)." });
      return;
    }

    setActionId(selectedWithdrawal._id);
    setMessage({ type: "", text: "" });
    try {
      await processWithdrawalMut.mutateAsync({
        id: selectedWithdrawal._id,
        pin: securityPin,
        referenceId: utrNumber.trim()
      });
      setMessage({ 
        type: "success", 
        text: `Partner payout of ₹${Number(selectedWithdrawal.amount || 0).toLocaleString()} approved and marked as PAID with UTR: ${utrNumber.trim()}!` 
      });
      setSelectedWithdrawal(null);
      setUtrNumber("");
      setSecurityPin("");
      refetchWithdrawals();
    } catch (err: any) {
      setMessage({ type: "error", text: err?.message || "Failed to process withdrawal." });
    } finally {
      setActionId(null);
    }
  };

  const handleRejectWithdrawal = async (w: any) => {
    const pin = prompt("Enter 4-digit Security PIN to Reject & Refund amount to Partner Wallet (Default: 1234):");
    if (!pin) return;
    const reason = prompt("Enter rejection reason (e.g. Incorrect bank account number):") || "Rejected by Administrator";

    try {
      await rejectWithdrawalMut.mutateAsync({ id: w._id, pin, reason });
      setMessage({ type: "success", text: "Withdrawal rejected and funds refunded to partner wallet!" });
      refetchWithdrawals();
    } catch (err: any) {
      setMessage({ type: "error", text: err?.message || "Failed to reject withdrawal." });
    }
  };

  const handleMarkJobSettlementPaid = async (id: string) => {
    const transactionId = prompt("Enter the Bank Transaction ID or UTR for this payout:");
    if (!transactionId) return;

    setIsUpdating(id);
    try {
      await markPaidMutation.mutateAsync({ id, data: { transactionId } });
      alert("Settlement marked as PAID successfully!");
    } catch {
      alert("Failed to mark as paid.");
    } finally {
      setIsUpdating(null);
    }
  };

  const handleExportCSV = () => {
    if (activeTab === "WITHDRAWALS") {
      if (withdrawalList.length === 0) return alert("No data to export.");
      const headers = ["Partner Name", "Phone", "Account Holder", "Account Number", "IFSC", "Amount", "Status", "Date", "UTR"];
      const csvRows = [headers.join(",")];
      withdrawalList.forEach((w: any) => {
        const bank = w.bankDetails || {};
        csvRows.push([
          `"${w.partnerId?.businessName || bank.accountHolderName || ''}"`,
          `"${w.partnerId?.phone || ''}"`,
          `"${bank.accountHolderName || ''}"`,
          `"${bank.accountNumber || ''}"`,
          `"${bank.ifscCode || ''}"`,
          w.amount || 0,
          w.status || 'PENDING',
          new Date(w.createdAt).toLocaleDateString(),
          `"${w.referenceId || ''}"`
        ].join(","));
      });
      const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `partner_withdrawals_${Date.now()}.csv`;
      link.click();
    } else {
      if (settlements.length === 0) return alert("No data to export.");
      const headers = ["Garage Name", "Amount", "Status", "Period Start", "Period End", "Transaction ID"];
      const csvRows = [headers.join(",")];
      settlements.forEach(s => {
        csvRows.push([
          `"${s.partnerId?.businessName || ''}"`,
          s.amount,
          s.status,
          new Date(s.periodStart).toLocaleDateString(),
          new Date(s.periodEnd).toLocaleDateString(),
          s.transactionId || 'N/A'
        ].join(","));
      });
      const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `settlements_${Date.now()}.csv`;
      link.click();
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in pb-12 p-4">
      <AdminFinanceNav />

      {/* Banner */}
      <div className="bg-gradient-to-r from-primary-navy via-slate-900 to-gray-900 rounded-3xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between shadow-elevated gap-4 text-white">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20 shadow-inner">
            <IndianRupee className="w-8 h-8 text-primary-orange" />
          </div>
          <div>
            <h1 className="text-3xl font-bold font-heading">Partner Payouts & Settlements</h1>
            <p className="text-white/80 mt-1 font-medium text-sm">
              Process manual bank payouts (IMPS/NEFT/UPI) for partner wallet withdrawals and manage settlement records.
            </p>
          </div>
        </div>
        <button 
          onClick={handleExportCSV}
          className="bg-white/20 hover:bg-white/30 text-white border border-white/40 px-4 py-2 rounded-xl flex items-center gap-2 font-medium transition-colors text-sm"
        >
          <FileText className="w-4 h-4" /> Export CSV
        </button>
      </div>

      {/* Alert Messages */}
      {message.text && (
        <div className={`p-4 rounded-xl flex items-center justify-between gap-3 text-sm font-medium ${
          message.type === "success" 
            ? "bg-emerald-50 text-emerald-800 border border-emerald-200" 
            : "bg-red-50 text-red-800 border border-red-200"
        }`}>
          <div className="flex items-center gap-2">
            {message.type === "success" ? <CheckCircle className="w-5 h-5 text-emerald-600" /> : <AlertCircle className="w-5 h-5 text-red-600" />}
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage({ type: "", text: "" })} className="text-xs opacity-60 hover:opacity-100 font-bold">Dismiss</button>
        </div>
      )}

      {/* Main Card with Tabs */}
      <Card className="bg-white/95 backdrop-blur-md shadow-sm border-gray-200 rounded-2xl overflow-hidden">
        <CardHeader className="border-b border-gray-100 bg-gray-50/50 p-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            {/* Tabs */}
            <div className="flex items-center gap-2 p-1 bg-gray-200/60 rounded-xl">
              <button
                onClick={() => { setActiveTab("WITHDRAWALS"); setPage(1); }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  activeTab === "WITHDRAWALS"
                    ? "bg-primary-navy text-white shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <Wallet className="w-4 h-4" />
                Partner Wallet Withdrawals ({withdrawalList.length})
              </button>
              <button
                onClick={() => { setActiveTab("JOB_SETTLEMENTS"); setPage(1); }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  activeTab === "JOB_SETTLEMENTS"
                    ? "bg-primary-navy text-white shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <Landmark className="w-4 h-4" />
                Job Settlements ({settlements.length})
              </button>
            </div>

            {/* Status Filter */}
            <select 
              className="px-3 py-2 rounded-xl border border-gray-200 text-xs font-medium focus:ring-2 focus:ring-primary-navy bg-white"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending Approval</option>
              <option value="COMPLETED">Paid / Completed</option>
              <option value="FAILED">Rejected / Refunded</option>
            </select>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {activeTab === "WITHDRAWALS" ? (
            /* WITHDRAWALS TABLE */
            isWithdrawalsLoading ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <Loader2 className="w-10 h-10 animate-spin mb-4 text-primary-navy" />
                <p className="font-medium">Loading partner withdrawals...</p>
              </div>
            ) : withdrawalList.length === 0 ? (
              <div className="text-center py-16 text-gray-400 font-medium">
                <Wallet className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                <p>No partner wallet withdrawal requests found.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50/70 text-gray-500 text-xs uppercase border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-4 font-bold tracking-wider">Partner Details</th>
                      <th className="px-6 py-4 font-bold tracking-wider">Bank Account Details</th>
                      <th className="px-6 py-4 font-bold tracking-wider">Amount</th>
                      <th className="px-6 py-4 font-bold tracking-wider">Requested Date</th>
                      <th className="px-6 py-4 font-bold tracking-wider text-center">Status</th>
                      <th className="px-6 py-4 font-bold tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {withdrawalList.map((w: any) => {
                      const pName = w.partnerId?.businessName || w.bankDetails?.accountHolderName || 'Partner Workshop';
                      const pPhone = w.partnerId?.phone || '';
                      const bank = w.bankDetails || {};
                      const isPending = w.status === 'PENDING';
                      const isCompleted = w.status === 'COMPLETED';

                      return (
                        <tr key={w._id} className="hover:bg-blue-50/30 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-bold text-gray-900">{pName}</div>
                            {pPhone && <div className="text-xs text-gray-500 mt-0.5">Phone: {pPhone}</div>}
                            <div className="text-[10px] text-gray-400 font-mono mt-0.5">ID: #{String(w._id).slice(-8)}</div>
                          </td>
                          <td className="px-6 py-4 text-xs">
                            <div className="flex items-center gap-1.5 font-semibold text-gray-900">
                              <span>A/C: {bank.accountNumber || 'N/A'}</span>
                              {bank.accountNumber && (
                                <button
                                  type="button"
                                  onClick={() => copyToClipboard(bank.accountNumber, `w-acc-${w._id}`)}
                                  className="p-1 hover:bg-gray-200 rounded text-gray-400 hover:text-gray-700"
                                  title="Copy Account Number"
                                >
                                  {copiedField === `w-acc-${w._id}` ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                                </button>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 text-gray-500 mt-0.5">
                              <span>IFSC: {bank.ifscCode || 'N/A'}</span>
                              {bank.ifscCode && (
                                <button
                                  type="button"
                                  onClick={() => copyToClipboard(bank.ifscCode, `w-ifsc-${w._id}`)}
                                  className="p-1 hover:bg-gray-200 rounded text-gray-400 hover:text-gray-700"
                                  title="Copy IFSC Code"
                                >
                                  {copiedField === `w-ifsc-${w._id}` ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                                </button>
                              )}
                            </div>
                            <div className="text-gray-500 font-medium text-[11px] mt-0.5">Holder: {bank.accountHolderName || pName}</div>
                          </td>
                          <td className="px-6 py-4 font-extrabold text-base text-emerald-600">
                            ₹{Number(w.amount || 0).toLocaleString('en-IN')}
                          </td>
                          <td className="px-6 py-4 text-xs text-gray-600 whitespace-nowrap">
                            {new Date(w.createdAt).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold inline-block ${
                              isCompleted ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                              w.status === 'FAILED' ? 'bg-red-100 text-red-800 border border-red-300' :
                              'bg-amber-100 text-amber-800 border border-amber-300 animate-pulse'
                            }`}>
                              {isCompleted ? 'PAID ✓' : w.status === 'FAILED' ? 'REJECTED' : 'PENDING ⏳'}
                            </span>
                            {w.referenceId && (
                              <div className="text-[10px] text-gray-500 mt-1 font-mono">UTR: {w.referenceId}</div>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right whitespace-nowrap">
                            {isPending ? (
                              <div className="flex items-center justify-end space-x-2">
                                <Button
                                  size="sm"
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-8 px-3 shadow-sm"
                                  onClick={() => {
                                    setSelectedWithdrawal(w);
                                    setUtrNumber("");
                                    setSecurityPin("");
                                    setMessage({ type: "", text: "" });
                                  }}
                                >
                                  <CheckCircle className="w-3.5 h-3.5 mr-1" /> Approve & Pay
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-red-300 text-red-700 hover:bg-red-50 font-bold text-xs h-8 px-2"
                                  onClick={() => handleRejectWithdrawal(w)}
                                >
                                  <XCircle className="w-3.5 h-3.5 mr-1" /> Reject
                                </Button>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400 font-medium">Completed</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            /* JOB SETTLEMENTS TABLE */
            isSettlementsLoading ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <Loader2 className="w-10 h-10 animate-spin mb-4 text-primary-navy" />
                <p className="font-medium">Loading settlements...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50/70 text-gray-500 text-xs uppercase border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-4 font-bold tracking-wider">Garage Partner</th>
                      <th className="px-6 py-4 font-bold tracking-wider">Date</th>
                      <th className="px-6 py-4 font-bold tracking-wider">Breakdown</th>
                      <th className="px-6 py-4 font-bold tracking-wider text-right">Net Payout</th>
                      <th className="px-6 py-4 font-bold tracking-wider text-center">Status</th>
                      <th className="px-6 py-4 font-bold tracking-wider text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {settlements.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-10 text-gray-400 font-medium">No settlements found.</td>
                      </tr>
                    ) : (
                      settlements.map((s: any) => (
                        <tr key={s._id} className="hover:bg-blue-50/30 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-bold text-gray-900">{s.partnerId?.businessName || 'Unknown'}</div>
                            {s.jobId && <div className="text-xs text-gray-500 mt-1">Job: {s.jobId}</div>}
                            {(s.transactionReference || s.transactionId) && <div className="text-xs text-gray-500 font-mono mt-0.5">Txn: {s.transactionReference || s.transactionId}</div>}
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-xs text-gray-600 font-medium">
                              {new Date(s.createdAt || s.periodStart).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-xs space-y-1 text-gray-600 font-medium">
                              <div className="flex justify-between gap-4"><span>Gross:</span> <span className="font-bold text-gray-900">₹{(s.grossAmount || 0).toFixed(2)}</span></div>
                              <div className="flex justify-between gap-4"><span>Comm (15%):</span> <span className="text-red-500">-₹{(s.platformCommission || 0).toFixed(2)}</span></div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="font-bold text-gray-900 text-lg text-emerald-600">₹{(s.netPayoutAmount || s.amount || 0).toFixed(2)}</div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                              ['PAID', 'PROCESSED', 'COMPLETED'].includes(s.status) ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {s.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            {s.status === 'PENDING' ? (
                              <button 
                                onClick={() => handleMarkJobSettlementPaid(s._id)}
                                disabled={isUpdating === s._id}
                                className="text-sm font-medium text-primary-navy hover:text-blue-700 flex items-center justify-end gap-1 ml-auto disabled:opacity-50"
                              >
                                {isUpdating === s._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                                Mark Paid
                              </button>
                            ) : (
                              <span className="text-sm text-emerald-600 font-medium flex items-center justify-end gap-1">
                                <CheckCircle className="w-4 h-4" /> Cleared
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )
          )}

          {/* Pagination */}
          <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/30">
            <span className="text-sm text-gray-500 font-medium">
              Showing Page {page} of {activeTab === "WITHDRAWALS" ? withdrawalPages : totalPages}
            </span>
            <div className="flex gap-2">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center shadow-sm"
              >
                <ChevronLeft className="w-4 h-4 mr-1" /> Prev
              </button>
              <button 
                onClick={() => setPage(p => Math.min(activeTab === "WITHDRAWALS" ? withdrawalPages : totalPages, p + 1))}
                disabled={page >= (activeTab === "WITHDRAWALS" ? withdrawalPages : totalPages)}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center shadow-sm"
              >
                Next <ChevronRight className="w-4 h-4 ml-1" />
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Manual Payout Approval Modal */}
      {selectedWithdrawal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg shadow-2xl bg-white rounded-2xl overflow-hidden border-0">
            <CardHeader className="border-b bg-gray-50/80 pb-4">
              <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <IndianRupee className="w-5 h-5 text-emerald-600" />
                Manual Bank Transfer & Payout Approval
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-xl text-xs text-emerald-900 leading-relaxed space-y-1">
                <p className="font-bold flex items-center gap-1.5 text-emerald-800">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" /> Manual Transfer Steps:
                </p>
                <p>1. Transfer <strong>₹{Number(selectedWithdrawal.amount || 0).toLocaleString()}</strong> to the partner's bank account shown below via Net Banking / UPI / IMPS.</p>
                <p>2. Enter the Bank Transaction Reference / UTR Number below and confirm with your Security PIN.</p>
              </div>

              {/* Bank Details & Payout Summary */}
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-2.5">
                <div className="flex justify-between items-center text-xs pb-1 border-b border-gray-200">
                  <span className="text-gray-500 font-medium">Partner Name:</span>
                  <span className="font-bold text-gray-900">
                    {selectedWithdrawal.partnerId?.businessName || selectedWithdrawal.bankDetails?.accountHolderName || 'Partner'}
                  </span>
                </div>
                {selectedWithdrawal.partnerId?.phone && (
                  <div className="flex justify-between items-center text-xs pb-1 border-b border-gray-200">
                    <span className="text-gray-500 font-medium">Phone Number:</span>
                    <span className="font-medium text-gray-800">{selectedWithdrawal.partnerId.phone}</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-xs pb-1 border-b border-gray-200">
                  <span className="text-gray-500 font-medium">Payout Amount:</span>
                  <span className="font-extrabold text-emerald-600 text-lg">
                    ₹{Number(selectedWithdrawal.amount || 0).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500 font-medium">A/C Holder Name:</span>
                  <span className="font-semibold text-gray-900">
                    {selectedWithdrawal.bankDetails?.accountHolderName || selectedWithdrawal.partnerId?.businessName || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500 font-medium">Account Number:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-gray-900">
                      {selectedWithdrawal.bankDetails?.accountNumber || 'Not Updated'}
                    </span>
                    {selectedWithdrawal.bankDetails?.accountNumber && (
                      <button
                        type="button"
                        onClick={() => copyToClipboard(selectedWithdrawal.bankDetails.accountNumber, "modal-acc")}
                        className="p-1 hover:bg-gray-200 rounded text-gray-500 hover:text-gray-800 transition"
                        title="Copy Account Number"
                      >
                        {copiedField === "modal-acc" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500 font-medium">IFSC Code:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-gray-900">
                      {selectedWithdrawal.bankDetails?.ifscCode || 'Not Updated'}
                    </span>
                    {selectedWithdrawal.bankDetails?.ifscCode && (
                      <button
                        type="button"
                        onClick={() => copyToClipboard(selectedWithdrawal.bankDetails.ifscCode, "modal-ifsc")}
                        className="p-1 hover:bg-gray-200 rounded text-gray-500 hover:text-gray-800 transition"
                        title="Copy IFSC Code"
                      >
                        {copiedField === "modal-ifsc" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* UTR / Transaction Reference */}
              <Input
                label="Bank Reference / UTR Number"
                type="text"
                placeholder="e.g. 428394829381 or AXIS00192837 or UPI Ref"
                value={utrNumber}
                onChange={(e) => setUtrNumber(e.target.value)}
                required
              />

              <Input
                label="Security PIN (Default: 1234)"
                type="password"
                placeholder="Enter 4-digit PIN"
                value={securityPin}
                onChange={(e) => setSecurityPin(e.target.value)}
                maxLength={6}
                required
              />

              <div className="flex justify-end space-x-3 pt-2">
                <Button 
                  variant="outline" 
                  onClick={() => { setSelectedWithdrawal(null); setUtrNumber(""); setSecurityPin(""); }}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleProcessManualPayout}
                  isLoading={actionId === selectedWithdrawal._id}
                  disabled={!securityPin || securityPin.length < 4 || !utrNumber}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  <CheckCircle className="w-4 h-4 mr-1.5" /> Confirm & Mark as Paid
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
