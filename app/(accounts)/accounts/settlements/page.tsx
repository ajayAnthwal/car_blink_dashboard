// @ts-nocheck
"use client";

import React, { useState } from "react";
import { uploadBankReconciliation } from "@/lib/services";
import { 
  useSettlements, 
  useProcessSettlementMutation,
  usePlatformRevenueStats,
  useAccountsTransactions,
  useAccountsWithdrawalRequests,
  useProcessWithdrawalMutation,
  useRejectWithdrawalMutation
} from "@/features/accounts/hooks/useAccountsQueries";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { BadgeIndianRupee, Loader2, ArrowRightCircle, UploadCloud, FileText, Search, ChevronLeft, ChevronRight, Eye, TrendingUp, Calendar, Clock, File, CreditCard, Wallet, CheckCircle, XCircle } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function SettlementsPage() {
  const [activeTab, setActiveTab] = useState<"SETTLEMENTS" | "PAYMENTS" | "WITHDRAWALS">("WITHDRAWALS");
  const [page, setPage] = useState(1);
  const limit = 10;
  
  const [searchTerm, setSearchTerm] = useState("");
  const { data: settlementsData, isLoading: isLoadingSettlements, refetch: refetchSettlements } = useSettlements({ page, limit, search: searchTerm });
  const allSettlements = settlementsData?.settlements || [];
  const total = settlementsData?.total || 0;
  
  const { data: revenueStats, isLoading: isLoadingStats } = usePlatformRevenueStats();
  const { data: txData, isLoading: isLoadingTx } = useAccountsTransactions({ page: 1, limit: 50, search: searchTerm });
  const rawTxList = txData?.transactions || txData?.data?.transactions || (Array.isArray(txData) ? txData : []);

  const { data: withdrawalsData, isLoading: isLoadingWithdrawals, refetch: refetchWithdrawals } = useAccountsWithdrawalRequests({ page: 1, limit: 50, search: searchTerm });
  const withdrawalList = withdrawalsData?.withdrawals || [];

  const computedRevenueStats = React.useMemo(() => {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    let weeklyComm = revenueStats?.weekly?.totalCommission || 0;
    let monthlyComm = revenueStats?.monthly?.totalCommission || 0;
    let yearlyComm = revenueStats?.yearly?.totalCommission || 0;

    const successTx = (rawTxList || []).filter((p: any) => p.status === 'SUCCESS');
    const targetTx = successTx.length > 0 ? successTx : (rawTxList || []);

    if (weeklyComm === 0 && targetTx.length > 0) {
      const weeklyTx = targetTx.filter((p: any) => new Date(p.createdAt || p.paidAt || Date.now()) >= sevenDaysAgo);
      const totalWeeklyAmount = weeklyTx.reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0);
      weeklyComm = Math.round(totalWeeklyAmount * 0.15);
    }

    if (monthlyComm === 0 && targetTx.length > 0) {
      const monthlyTx = targetTx.filter((p: any) => new Date(p.createdAt || p.paidAt || Date.now()) >= thirtyDaysAgo);
      const totalMonthlyAmount = monthlyTx.reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0);
      monthlyComm = Math.round(totalMonthlyAmount * 0.15);
    }

    if (yearlyComm === 0 && (targetTx.length > 0 || (allSettlements || []).length > 0)) {
      const settlementCommSum = (allSettlements || []).reduce((sum: number, s: any) => sum + (Number(s.platformCommission) || 0), 0);
      const totalAmountSum = targetTx.reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0);
      yearlyComm = settlementCommSum || Math.round(totalAmountSum * 0.15);
    }

    return {
      weekly: { totalCommission: weeklyComm },
      monthly: { totalCommission: monthlyComm },
      yearly: { totalCommission: yearlyComm }
    };
  }, [revenueStats, rawTxList, allSettlements]);

  const processWithdrawalMut = useProcessWithdrawalMutation();
  const rejectWithdrawalMut = useRejectWithdrawalMutation();

  const [actionId, setActionId] = useState<string | null>(null);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [securityPin, setSecurityPin] = useState("");
  const [showProcessFor, setShowProcessFor] = useState<string | null>(null);
  const [processItem, setProcessItem] = useState<any>(null);
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
      if (processItem?.isWithdrawal) {
        await processWithdrawalMut.mutateAsync({ id: showProcessFor, pin: securityPin });
        setMessage({ type: "success", text: "Partner withdrawal request approved & paid out successfully!" });
        refetchWithdrawals();
      } else {
        await processMutation.mutateAsync({ id: showProcessFor, transactionReference: "", pin: securityPin });
        setMessage({ type: "success", text: "Settlement processed successfully." });
        refetchSettlements();
      }
      setShowProcessFor(null);
      setSecurityPin("");
      setProcessItem(null);
    } catch (err: unknown) {
      setMessage({ type: "error", text: err?.message || `Failed to process payout.` });
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
                {isLoadingStats && isLoadingTx ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <h3 className="text-3xl font-bold text-indigo-700">₹{(computedRevenueStats?.weekly?.totalCommission || 0).toLocaleString('en-IN')}</h3>
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
                {isLoadingStats && isLoadingTx ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <h3 className="text-3xl font-bold text-emerald-700">₹{(computedRevenueStats?.monthly?.totalCommission || 0).toLocaleString('en-IN')}</h3>
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
                {isLoadingStats && isLoadingTx ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <h3 className="text-3xl font-bold text-primary-orange">₹{(computedRevenueStats?.yearly?.totalCommission || 0).toLocaleString('en-IN')}</h3>
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
      {/* Existing Settlements / Customer Payments Section */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0 pb-4 border-b border-gray-100">
          <div className="flex items-center bg-gray-100 p-1 rounded-xl w-full sm:w-auto flex-wrap gap-1">
            <button
              onClick={() => setActiveTab("WITHDRAWALS")}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === "WITHDRAWALS" ? "bg-primary-orange text-white shadow-sm" : "text-orange-700 hover:bg-orange-50"
              }`}
            >
              <Wallet className="w-4 h-4" />
              Partner Wallet Withdrawals ({withdrawalList.length})
            </button>
            <button
              onClick={() => setActiveTab("SETTLEMENTS")}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === "SETTLEMENTS" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <BadgeIndianRupee className="w-4 h-4 text-primary-orange" />
              Partner Job Settlements ({total})
            </button>
            <button
              onClick={() => setActiveTab("PAYMENTS")}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === "PAYMENTS" ? "bg-emerald-600 text-white shadow-sm" : "text-emerald-700 hover:bg-emerald-50"
              }`}
            >
              <CreditCard className="w-4 h-4" />
              Customer Payments ({rawTxList.length})
            </button>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={activeTab === "WITHDRAWALS" ? "Search partner or bank..." : activeTab === "PAYMENTS" ? "Search customer or payment ID..." : "Search by ID or Partner Name..."}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-navy/20"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>

        <CardContent className="pt-4">
          {activeTab === "WITHDRAWALS" ? (
            isLoadingWithdrawals ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="w-8 h-8 text-primary-orange animate-spin" />
              </div>
            ) : withdrawalList.length === 0 ? (
              <div className="text-center py-10 text-neutral-muted">
                <p>No wallet withdrawal requests found.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-neutral-muted uppercase bg-neutral-bg">
                    <tr>
                      <th className="px-4 py-3 rounded-l-lg">ID / Partner Name</th>
                      <th className="px-4 py-3">Bank Account Details</th>
                      <th className="px-4 py-3">Amount</th>
                      <th className="px-4 py-3">Requested Date</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 rounded-r-lg text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-muted/10">
                    {withdrawalList.map((w: any) => {
                      const pName = w.partnerId?.businessName || w.bankDetails?.accountHolderName || 'Partner Workshop';
                      const pPhone = w.partnerId?.phone || '';
                      const bank = w.bankDetails || {};
                      const isPending = w.status === 'PENDING';
                      const isCompleted = w.status === 'COMPLETED';

                      return (
                        <tr key={w._id} className="hover:bg-neutral-bg/50 transition-colors">
                          <td className="px-4 py-3 font-medium text-primary-navy">
                            <div className="font-bold text-gray-900">{pName}</div>
                            {pPhone && <div className="text-xs text-gray-500">Phone: {pPhone}</div>}
                            <div className="text-[10px] text-gray-400">Ref: #{String(w._id).slice(-8)}</div>
                          </td>
                          <td className="px-4 py-3 text-xs">
                            <div className="font-semibold text-gray-800">A/C: {bank.accountNumber || 'N/A'}</div>
                            <div className="text-gray-500">IFSC: {bank.ifscCode || 'N/A'}</div>
                            <div className="text-gray-500 font-medium">Holder: {bank.accountHolderName || pName}</div>
                          </td>
                          <td className="px-4 py-3 font-extrabold text-base text-orange-600">
                            ₹{w.amount?.toLocaleString('en-IN') || 0}
                          </td>
                          <td className="px-4 py-3 text-xs text-neutral-dark whitespace-nowrap">
                            {new Date(w.createdAt).toLocaleString()}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                              isCompleted ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                              w.status === 'FAILED' ? 'bg-red-100 text-red-800 border border-red-300' :
                              'bg-amber-100 text-amber-800 border border-amber-300 animate-pulse'
                            }`}>
                              {isCompleted ? 'PAID / COMPLETED ✓' : w.status === 'FAILED' ? 'REJECTED / REFUNDED' : 'PENDING PAYOUT ⏳'}
                            </span>
                            {w.referenceId && <div className="text-[10px] text-gray-500 mt-1 font-mono">UTR: {w.referenceId}</div>}
                          </td>
                          <td className="px-4 py-3 text-right whitespace-nowrap">
                            {isPending ? (
                              <div className="flex items-center justify-end space-x-2">
                                <Button
                                  size="sm"
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-8 px-3 shadow-sm"
                                  onClick={() => {
                                    setShowProcessFor(w._id);
                                    setProcessItem({ ...w, isWithdrawal: true });
                                    setSecurityPin("");
                                  }}
                                >
                                  <CheckCircle className="w-3.5 h-3.5 mr-1" /> Approve & Pay
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-red-300 text-red-700 hover:bg-red-50 font-bold text-xs h-8 px-2"
                                  onClick={async () => {
                                    const pin = prompt("Enter 4-digit Security PIN to Reject & Refund to Partner Wallet:");
                                    if (!pin) return;
                                    try {
                                      await rejectWithdrawalMut.mutateAsync({ id: w._id, pin, reason: "Rejected by Accounts" });
                                      setMessage({ type: "success", text: "Withdrawal request rejected and amount refunded to partner wallet!" });
                                      refetchWithdrawals();
                                    } catch (err: any) {
                                      setMessage({ type: "error", text: err?.message || "Failed to reject withdrawal" });
                                    }
                                  }}
                                >
                                  <XCircle className="w-3.5 h-3.5 mr-1" /> Reject
                                </Button>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400 font-medium">No actions</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )
          ) : activeTab === "PAYMENTS" ? (
            isLoadingTx ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
              </div>
            ) : rawTxList.length === 0 ? (
              <div className="text-center py-10 text-neutral-muted">
                <p>No customer payments found.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-neutral-muted uppercase bg-neutral-bg">
                    <tr>
                      <th className="px-4 py-3 rounded-l-lg">Txn / Booking ID</th>
                      <th className="px-4 py-3">Customer Details</th>
                      <th className="px-4 py-3">Payment Type</th>
                      <th className="px-4 py-3">Amount</th>
                      <th className="px-4 py-3">Date & Time</th>
                      <th className="px-4 py-3 rounded-r-lg text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-muted/10">
                    {rawTxList.map((p: any) => {
                      const custName = p.customer?.fullName || p.customerId?.fullName || 'Customer';
                      const custPhone = p.customer?.phone || p.customerId?.phone || '';
                      const bId = p.bookingId?._id || p.bookingId || p._id;
                      const isAdvance = p.paymentType === 'ADVANCE';

                      return (
                        <tr key={p._id} className="hover:bg-neutral-bg/50 transition-colors">
                          <td className="px-4 py-3 font-medium text-primary-navy">
                            <div>#{String(p.transactionId || p._id).slice(-8)}</div>
                            <div className="text-xs text-neutral-muted">Booking: #{String(bId).slice(-6)}</div>
                          </td>
                          <td className="px-4 py-3 text-neutral-dark">
                            <div className="font-bold">{custName}</div>
                            {custPhone && <div className="text-xs text-neutral-muted">{custPhone}</div>}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 text-xs font-extrabold rounded-full ${
                              isAdvance ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-blue-100 text-blue-800 border border-blue-200'
                            }`}>
                              {isAdvance ? '15% ADVANCE ⏳' : (p.paymentType || 'FULL')}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-extrabold text-base text-gray-900">
                            ₹{p.amount?.toLocaleString('en-IN') || 0}
                          </td>
                          <td className="px-4 py-3 text-xs text-neutral-dark whitespace-nowrap">
                            {new Date(p.createdAt || p.paidAt || Date.now()).toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                              p.status === 'SUCCESS'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : p.status === 'CREATED' || p.status === 'PENDING'
                                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                : 'bg-red-100 text-red-800 border border-red-300'
                            }`}>
                              {p.status === 'SUCCESS' ? 'SUCCESS ✓' : p.status === 'CREATED' ? 'ORDER CREATED ⏳' : (p.status || 'PENDING')}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )
          ) : isLoadingSettlements ? (
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
                              onClick={() => { setShowProcessFor(settlement._id); setProcessItem(settlement); }}
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
          <Card className="w-full max-w-lg shadow-xl bg-white rounded-2xl overflow-hidden">
            <CardHeader className="border-b pb-4 bg-gray-50/50">
              <CardTitle className="text-lg font-bold text-gray-900">Settlement & Partner Bank Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm border-b pb-2">
                  <span className="text-gray-500">Partner Business</span>
                  <span className="font-semibold text-gray-900">{selectedSettlement.partnerId?.businessName || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center text-sm border-b pb-2">
                  <span className="text-gray-500">Customer Name</span>
                  <span className="font-semibold text-gray-900">{selectedSettlement.jobId?.bookingId?.customerId?.fullName || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center text-sm border-b pb-2">
                  <span className="text-gray-500">Final Booking Amount</span>
                  <span className="font-bold text-primary-navy">₹{selectedSettlement.jobId?.finalAmount || selectedSettlement.grossAmount || 0}</span>
                </div>
                <div className="flex justify-between items-center text-sm border-b pb-2">
                  <span className="text-gray-500">Net Partner Payout</span>
                  <span className="font-extrabold text-emerald-600 text-base">₹{selectedSettlement.netPayoutAmount || 0}</span>
                </div>
                <div className="flex justify-between items-center text-sm border-b pb-2">
                  <span className="text-gray-500">Payment Mode</span>
                  <span className={`font-semibold px-2 py-0.5 rounded text-xs ${selectedSettlement.jobId?.bookingId?.paymentMode === 'CASH' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                    {selectedSettlement.jobId?.bookingId?.paymentMode || 'ONLINE'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm border-b pb-2">
                  <span className="text-gray-500">Status</span>
                  <span className="font-bold text-amber-600">{selectedSettlement.status}</span>
                </div>
              </div>

              {/* Partner Registered Bank Details */}
              <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-2">
                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Registered Partner Bank Account</h4>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500">A/C Holder:</span>
                  <span className="font-semibold text-gray-900">{selectedSettlement.partnerId?.bankDetails?.accountHolderName || selectedSettlement.partnerId?.businessName || 'Not Updated'}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500">Account Number:</span>
                  <span className="font-mono font-bold text-gray-900">{selectedSettlement.partnerId?.bankDetails?.accountNumber || 'Not Updated'}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500">IFSC Code:</span>
                  <span className="font-mono font-bold text-gray-900">{selectedSettlement.partnerId?.bankDetails?.ifscCode || 'Not Updated'}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500">Bank Name:</span>
                  <span className="font-semibold text-gray-900">{selectedSettlement.partnerId?.bankDetails?.bankName || 'N/A'}</span>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button onClick={() => setSelectedSettlement(null)}>Close</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Process Modal Overlay */}
      {showProcessFor && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg shadow-xl bg-white rounded-2xl overflow-hidden">
            <CardHeader className="border-b bg-gray-50/50 pb-4">
              <CardTitle className="text-lg font-bold text-gray-900">Process Settlement (RazorpayX Payout)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl text-xs text-blue-800 leading-relaxed">
                Review the partner's bank details and payout amount below before entering your Security PIN to initiate automatic transfer.
              </div>

              {/* Bank Details & Payout Summary */}
              {processItem && (
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-2.5">
                  <div className="flex justify-between items-center text-xs pb-1 border-b border-gray-200">
                    <span className="text-gray-500 font-medium">Partner Name:</span>
                    <span className="font-bold text-gray-900">{processItem.partnerId?.businessName || 'Partner'}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs pb-1 border-b border-gray-200">
                    <span className="text-gray-500 font-medium">Net Payout Amount:</span>
                    <span className="font-extrabold text-emerald-600 text-base">₹{Number(processItem.netPayoutAmount || 0).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500 font-medium">A/C Holder Name:</span>
                    <span className="font-semibold text-gray-900">{processItem.partnerId?.bankDetails?.accountHolderName || processItem.partnerId?.businessName || 'Not Updated'}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500 font-medium">Account Number:</span>
                    <span className="font-mono font-bold text-gray-900">{processItem.partnerId?.bankDetails?.accountNumber || 'Not Updated'}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500 font-medium">IFSC Code:</span>
                    <span className="font-mono font-bold text-gray-900">{processItem.partnerId?.bankDetails?.ifscCode || 'Not Updated'}</span>
                  </div>
                  {processItem.partnerId?.bankDetails?.bankName && (
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-500 font-medium">Bank Name:</span>
                      <span className="font-semibold text-gray-900">{processItem.partnerId?.bankDetails?.bankName}</span>
                    </div>
                  )}
                </div>
              )}

              <Input
                label="Security PIN"
                type="password"
                placeholder="Enter 4-digit PIN"
                value={securityPin}
                onChange={(e) => setSecurityPin(e.target.value)}
                maxLength={6}
                required
              />
              <div className="flex justify-end space-x-3 pt-2">
                <Button variant="outline" onClick={() => { setShowProcessFor(null); setProcessItem(null); setSecurityPin(""); }}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleProcess}
                  isLoading={actionId === showProcessFor}
                  disabled={!securityPin || securityPin.length < 4}
                  className="bg-primary-navy hover:bg-primary-navy/90 text-white font-bold"
                >
                  Initiate Automatic Payout
                </Button>
              </div></CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
