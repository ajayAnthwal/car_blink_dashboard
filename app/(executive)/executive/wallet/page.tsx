// @ts-nocheck
"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useCustomerStatus } from "@/features/executive/hooks/useExecutiveQueries";
import { useExecutiveCustomerWallet, useAdjustCustomerWalletMutation } from "@/features/executive/hooks/useExecutiveWalletQueries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Wallet,
  Search,
  User,
  Phone,
  Mail,
  ArrowDownLeft,
  ArrowUpRight,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  Clock,
  Sparkles,
  ShieldAlert,
  Zap,
} from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import toast from "react-hot-toast";

export default function ExecutiveWalletManagementPage() {
  const searchParams = useSearchParams();
  const preselectedCustomerId = searchParams.get("customerId");

  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 400);

  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(preselectedCustomerId || "");
  const [adjustmentType, setAdjustmentType] = useState<"CREDIT" | "DEBIT">("CREDIT");
  const [amountStr, setAmountStr] = useState<string>("");
  const [noteStr, setNoteStr] = useState<string>("");
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);

  // Search customer query
  const { data: searchResultsData, isLoading: isSearching } = useCustomerStatus(1, 8, debouncedSearch);
  const foundCustomers = (searchResultsData?.customers || []) as any[];

  // Selected customer wallet query
  const {
    data: walletDetails,
    isLoading: isLoadingWallet,
    refetch: refetchWallet,
  } = useExecutiveCustomerWallet(selectedCustomerId);

  const adjustMutation = useAdjustCustomerWalletMutation();

  const customer = walletDetails?.customer;
  const currentBalance = Number(walletDetails?.wallet?.balance) || 0;
  const recentTransactions = walletDetails?.recentTransactions || [];

  const parsedAmount = parseFloat(amountStr) || 0;
  const computedBalanceAfter =
    adjustmentType === "CREDIT"
      ? currentBalance + parsedAmount
      : Math.max(0, currentBalance - parsedAmount);

  // Quick amount chips
  const quickAmounts = [100, 250, 500, 1000, 2000];

  const handleOpenConfirm = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCustomerId) {
      toast.error("Please search and select a customer first.");
      return;
    }

    if (!parsedAmount || isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error("Please enter a valid positive amount greater than 0.");
      return;
    }

    // Check at most 2 decimals
    const rounded = Math.round(parsedAmount * 100) / 100;
    if (Math.abs(parsedAmount - rounded) > 0.0001) {
      toast.error("Amount can have at most 2 decimal places.");
      return;
    }

    if (parsedAmount > 50000) {
      toast.error("Amount cannot exceed ₹50,000 per transaction.");
      return;
    }

    if (!noteStr.trim()) {
      toast.error("Audit requirement: Mandatory note/reason is required.");
      return;
    }

    if (noteStr.trim().length < 3) {
      toast.error("Note must be at least 3 characters long.");
      return;
    }

    if (adjustmentType === "DEBIT" && parsedAmount > currentBalance) {
      toast.error(`Insufficient balance. Current balance is ₹${currentBalance.toFixed(2)}. Cannot debit ₹${parsedAmount}.`);
      return;
    }

    setShowConfirmModal(true);
  };

  const handleExecuteAdjustment = async () => {
    try {
      const idempotencyKey = `exec_adj_${selectedCustomerId}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      await adjustMutation.mutateAsync({
        customerId: selectedCustomerId,
        type: adjustmentType,
        amount: parsedAmount,
        note: noteStr.trim(),
        idempotencyKey,
      });

      toast.success(
        adjustmentType === "CREDIT"
          ? `✓ ₹${parsedAmount.toLocaleString("en-IN")} credited to customer wallet!`
          : `✓ ₹${parsedAmount.toLocaleString("en-IN")} debited from customer wallet.`
      );

      setShowConfirmModal(false);
      setAmountStr("");
      setNoteStr("");
      refetchWallet();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || "Failed to adjust wallet balance.");
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto w-full min-w-0 pb-16 px-2 sm:px-4">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-primary-navy flex items-center gap-2.5">
          <Wallet className="w-7 h-7 text-blue-500" />
          Customer Promotional Wallet Console
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Credit or adjust promotional customer wallet balances with mandatory audit logs & real-time notifications.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Customer Search & Selection (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50/80 border-b border-slate-100 p-5">
              <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Search className="w-4 h-4 text-blue-500" />
                Find Customer
              </CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">Search by registered mobile, name, or email</p>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <Input
                  type="text"
                  placeholder="e.g. 9876543210 or Customer Name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-11 text-sm rounded-xl border-slate-200"
                />
              </div>

              {/* Search Results Dropdown/List */}
              {isSearching ? (
                <div className="flex items-center justify-center p-6 text-slate-400 gap-2 text-xs">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-500" /> Searching customers...
                </div>
              ) : debouncedSearch && foundCustomers.length === 0 ? (
                <div className="p-4 rounded-xl bg-slate-50 text-center text-xs text-slate-500">
                  No customers found matching &quot;{debouncedSearch}&quot;
                </div>
              ) : foundCustomers.length > 0 ? (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {foundCustomers.map((c: any) => {
                    const isSelected = selectedCustomerId === (c._id || c.id);
                    return (
                      <button
                        key={c._id || c.id}
                        type="button"
                        onClick={() => {
                          setSelectedCustomerId(c._id || c.id);
                          setSearchTerm("");
                        }}
                        className={`w-full text-left p-3 rounded-2xl border transition flex items-center justify-between gap-3 text-xs ${
                          isSelected
                            ? "bg-blue-50 border-blue-400/80 text-blue-900 shadow-2xs"
                            : "bg-slate-50/70 border-slate-200/80 hover:bg-slate-100/80 text-slate-800"
                        }`}
                      >
                        <div className="space-y-0.5 min-w-0">
                          <p className="font-bold truncate text-slate-900">{c.fullName || "Customer"}</p>
                          <p className="text-[11px] text-slate-500 font-mono">{c.phone || "No phone"}</p>
                        </div>
                        {isSelected && (
                          <Badge className="bg-blue-600 text-white text-[10px] shrink-0">Selected</Badge>
                        )}
                      </button>
                    );
                  })}
                </div>
              ) : null}

              {/* Confirmed Selected Customer Card */}
              {selectedCustomerId && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Confirmed Target Account
                  </p>
                  {isLoadingWallet ? (
                    <div className="p-4 rounded-2xl bg-slate-50 space-y-2">
                      <Skeleton className="h-4 w-36 bg-slate-200" />
                      <Skeleton className="h-3 w-28 bg-slate-200" />
                    </div>
                  ) : customer ? (
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-slate-50 border border-blue-200/70 space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-extrabold text-sm text-slate-900">{customer.fullName}</p>
                          <p className="text-xs text-slate-500 font-mono mt-0.5 flex items-center gap-1.5">
                            <Phone className="w-3 h-3 text-slate-400" />
                            {customer.phone || "No Phone"}
                          </p>
                          {customer.email && (
                            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5 truncate">
                              <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate">{customer.email}</span>
                            </p>
                          )}
                        </div>
                        <Badge variant="outline" className="bg-white text-emerald-700 border-emerald-300 font-bold text-[10px]">
                          Customer
                        </Badge>
                      </div>

                      <div className="pt-2 border-t border-blue-100 flex items-center justify-between">
                        <span className="text-xs text-slate-500 font-medium">Live Balance:</span>
                        <span className="text-base font-black font-mono text-slate-900">
                          ₹{currentBalance.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-2xl bg-red-50 text-red-700 text-xs font-semibold">
                      Customer not found with ID {selectedCustomerId}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Adjustment Action Form & Recent Activity (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50/80 border-b border-slate-100 p-5 sm:p-6">
              <CardTitle className="text-base sm:text-lg font-bold text-primary-navy flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-500" />
                Wallet Adjustment Form
              </CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">
                Apply promotional credits or make balance corrections with an immutable audit log.
              </p>
            </CardHeader>

            <CardContent className="p-5 sm:p-6">
              <form onSubmit={handleOpenConfirm} className="space-y-5">
                {/* Type Toggle: CREDIT vs DEBIT */}
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-2">
                    Action Type <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setAdjustmentType("CREDIT")}
                      className={`p-3.5 rounded-2xl border font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                        adjustmentType === "CREDIT"
                          ? "bg-emerald-600 text-white border-emerald-600 shadow-md ring-2 ring-emerald-300/50"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      <ArrowDownLeft className="w-4 h-4" />
                      CREDIT (Add Funds)
                    </button>

                    <button
                      type="button"
                      onClick={() => setAdjustmentType("DEBIT")}
                      className={`p-3.5 rounded-2xl border font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                        adjustmentType === "DEBIT"
                          ? "bg-red-600 text-white border-red-600 shadow-md ring-2 ring-red-300/50"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      <ArrowUpRight className="w-4 h-4" />
                      DEBIT (Correction)
                    </button>
                  </div>
                  {adjustmentType === "DEBIT" && (
                    <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200/80 rounded-xl p-2.5 mt-2 flex items-center gap-1.5 font-medium">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      Safety Rule: Debit cannot exceed current balance (₹{currentBalance.toFixed(2)}) and cannot make balance negative.
                    </p>
                  )}
                </div>

                {/* Amount Input */}
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-2">
                    Amount (₹) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono font-bold text-slate-400 text-base">
                      ₹
                    </span>
                    <Input
                      type="number"
                      step="0.01"
                      min="0.01"
                      max="50000"
                      placeholder="e.g. 500"
                      value={amountStr}
                      onChange={(e) => setAmountStr(e.target.value)}
                      className="pl-8 h-12 text-base font-mono font-bold rounded-xl border-slate-200 focus:ring-blue-500"
                      required
                    />
                  </div>

                  {/* Quick Chips */}
                  <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                    <span className="text-[11px] text-slate-400 font-semibold mr-1">Quick Add:</span>
                    {quickAmounts.map((q) => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => setAmountStr(String(q))}
                        className="text-xs font-mono font-semibold px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                      >
                        +₹{q}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Mandatory Note / Reason */}
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-2">
                    Mandatory Audit Note / Reason <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder={
                      adjustmentType === "CREDIT"
                        ? "State promotional or support reason (e.g. Loyalty welcome bonus, customer satisfaction credit for delay)..."
                        : "State correction reason (e.g. Duplicate credit reversal, goodwill credit correction)..."
                    }
                    value={noteStr}
                    onChange={(e) => setNoteStr(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    maxLength={250}
                  />
                  <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                    <span>Min 3 characters</span>
                    <span>{noteStr.length}/250</span>
                  </div>
                </div>

                {/* Balance Preview Card */}
                {parsedAmount > 0 && selectedCustomerId && (
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                    <div className="flex justify-between items-center text-slate-600">
                      <span>Current Balance:</span>
                      <span className="font-mono font-bold text-slate-800">₹{currentBalance.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-600">
                      <span>Adjustment ({adjustmentType}):</span>
                      <span className={`font-mono font-bold ${adjustmentType === "CREDIT" ? "text-emerald-700" : "text-red-600"}`}>
                        {adjustmentType === "CREDIT" ? "+" : "-"}₹{parsedAmount.toFixed(2)}
                      </span>
                    </div>
                    <div className="pt-1.5 border-t border-slate-200 flex justify-between items-center font-bold text-slate-900">
                      <span>Projected Balance After:</span>
                      <span className="font-mono text-sm text-blue-700">₹{computedBalanceAfter.toFixed(2)}</span>
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <div className="flex justify-end pt-2">
                  <Button
                    type="submit"
                    disabled={adjustMutation.isPending || !selectedCustomerId}
                    className={`font-bold px-8 py-3 rounded-xl shadow-lg transition-all flex items-center gap-2 text-xs uppercase tracking-wider ${
                      adjustmentType === "CREDIT"
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                        : "bg-red-600 hover:bg-red-700 text-white"
                    }`}
                  >
                    {adjustMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Processing...
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4" /> Review & Confirm {adjustmentType}
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Recent Transactions Card */}
          {selectedCustomerId && recentTransactions.length > 0 && (
            <Card className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <CardHeader className="bg-slate-50/80 border-b border-slate-100 p-4">
                <CardTitle className="text-xs font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wider">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  Recent Ledger History for Selected Customer
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-2">
                {recentTransactions.map((tx: any) => {
                  const isCredit = tx.type === "CREDIT";
                  return (
                    <div
                      key={tx._id}
                      className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs gap-3"
                    >
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-black ${
                              isCredit ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
                            }`}
                          >
                            {tx.type}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {new Date(tx.createdAt).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 truncate">{tx.note}</p>
                      </div>

                      <div className="text-right shrink-0">
                        <p className={`font-mono font-bold ${isCredit ? "text-emerald-700" : "text-red-600"}`}>
                          {isCredit ? "+" : "-"}₹{Number(tx.amount || 0).toFixed(2)}
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono">Bal: ₹{Number(tx.balanceAfter || 0).toFixed(2)}</p>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white border border-slate-200 text-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-start gap-4">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                  adjustmentType === "CREDIT"
                    ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                    : "bg-red-100 text-red-700 border border-red-200"
                }`}
              >
                {adjustmentType === "CREDIT" ? <ArrowDownLeft className="w-6 h-6" /> : <ArrowUpRight className="w-6 h-6" />}
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  Confirm Wallet {adjustmentType === "CREDIT" ? "Credit" : "Debit"}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  You are about to adjust this customer&apos;s promotional wallet balance. This action will be permanently recorded in the audit trail.
                </p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-xs space-y-2.5">
              <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                <span className="text-slate-500 font-semibold">Target Customer:</span>
                <span className="font-bold text-slate-900">{customer?.fullName}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                <span className="text-slate-500 font-semibold">Registered Phone:</span>
                <span className="font-mono text-slate-800">{customer?.phone || "N/A"}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                <span className="text-slate-500 font-semibold">Action:</span>
                <span className={`font-bold ${adjustmentType === "CREDIT" ? "text-emerald-700" : "text-red-600"}`}>
                  {adjustmentType === "CREDIT" ? "CREDIT (+)" : "DEBIT (-)"}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                <span className="text-slate-500 font-semibold">Amount:</span>
                <span className="font-mono font-black text-slate-900 text-sm">
                  ₹{parsedAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                <span className="text-slate-500 font-semibold">Balance Transition:</span>
                <span className="font-mono font-bold text-slate-800">
                  ₹{currentBalance.toFixed(2)} → <strong className="text-blue-700">₹{computedBalanceAfter.toFixed(2)}</strong>
                </span>
              </div>
              <div className="pt-1">
                <span className="text-slate-500 font-semibold block mb-1">Audit Reason / Note:</span>
                <p className="text-slate-800 italic bg-white p-2.5 rounded-xl border border-slate-200 break-words">
                  &quot;{noteStr.trim()}&quot;
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                disabled={adjustMutation.isPending}
                onClick={() => setShowConfirmModal(false)}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </Button>
              <Button
                type="button"
                disabled={adjustMutation.isPending}
                onClick={handleExecuteAdjustment}
                className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider text-white shadow-md flex items-center gap-2 ${
                  adjustmentType === "CREDIT"
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {adjustMutation.isPending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" /> Confirm & Execute
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
