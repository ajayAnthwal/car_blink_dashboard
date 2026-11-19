// @ts-nocheck
"use client";

import React, { useState } from "react";
import { useCustomerWallet } from "@/features/customer/hooks/useCustomerWalletQueries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Clock,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Info,
  RefreshCw,
} from "lucide-react";

export default function CustomerWalletPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const { data, isLoading, isError, refetch, isFetching } = useCustomerWallet(currentPage, 10);

  const wallet = data?.wallet || (Array.isArray(data) ? null : data?.data?.wallet) || { balance: 0, currency: "INR" };
  const transactions = Array.isArray(data?.transactions)
    ? data.transactions
    : (Array.isArray(data?.docs)
      ? data.docs
      : (Array.isArray(data) ? data : []));
  const pagination = data?.pagination || { total: transactions.length, totalPages: 1 };

  const formatIST = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto w-full min-w-0 pb-16 px-2 sm:px-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-primary-navy flex items-center gap-2.5">
            <Wallet className="w-7 h-7 text-secondary-blue" />
            My Wallet
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            View your promotional credits, discounts, and real-time wallet balance.
          </p>
        </div>

        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition shadow-2xs self-start sm:self-auto disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin text-secondary-blue" : ""}`} />
          Refresh Balance
        </button>
      </div>

      {/* Prominent Balance Card */}
      {isLoading ? (
        <Card className="bg-gradient-to-br from-slate-900 to-primary-navy border-none text-white rounded-3xl p-6 shadow-xl">
          <Skeleton className="h-6 w-32 bg-white/20 mb-4" />
          <Skeleton className="h-12 w-48 bg-white/20 mb-2" />
          <Skeleton className="h-4 w-64 bg-white/10" />
        </Card>
      ) : (
        <Card className="bg-gradient-to-br from-slate-950 via-primary-navy to-slate-900 border-none text-white rounded-3xl overflow-hidden shadow-2xl relative">
          <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-72 h-72 bg-secondary-blue/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute left-1/3 bottom-0 w-48 h-48 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />

          <CardContent className="p-6 sm:p-8 relative z-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-[11px] font-bold uppercase tracking-wider text-amber-300">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Promotional Balance
                </div>

                <div className="flex items-baseline gap-2 pt-1">
                  <span className="text-3xl sm:text-5xl font-black font-mono tracking-tight text-white">
                    ₹{(Number(wallet.balance) || 0).toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                  <span className="text-xs sm:text-sm font-semibold text-slate-400">INR</span>
                </div>

                <p className="text-xs text-slate-300 flex items-center gap-1.5 pt-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  Promotional credits added to your account for future platform rewards & discounts.
                </p>
              </div>

              <div className="sm:text-right flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 border-white/10 pt-4 sm:pt-0">
                <span className="text-xs text-slate-400 font-medium">Status</span>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Active & Verified
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transaction History Section */}
      <Card className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <CardHeader className="bg-slate-50/80 border-b border-slate-100 p-5 sm:p-6 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base sm:text-lg font-bold text-primary-navy flex items-center gap-2">
              <Clock className="w-5 h-5 text-secondary-blue" />
              Transaction History
            </CardTitle>
            <p className="text-xs text-slate-500 mt-0.5">
              Complete chronological audit of your wallet credits and debits.
            </p>
          </div>
          {pagination.total > 0 && (
            <Badge variant="outline" className="text-xs font-bold bg-white text-slate-600 border-slate-200">
              {pagination.total} {pagination.total === 1 ? "Record" : "Records"}
            </Badge>
          )}
        </CardHeader>

        <CardContent className="p-4 sm:p-6">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 bg-slate-50/50">
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-48 bg-slate-200" />
                    <Skeleton className="h-3 w-32 bg-slate-200" />
                  </div>
                  <Skeleton className="h-6 w-20 bg-slate-200" />
                </div>
              ))}
            </div>
          ) : isError ? (
            <div className="py-12 text-center space-y-3">
              <Info className="w-10 h-10 text-red-400 mx-auto" />
              <p className="text-sm font-semibold text-slate-700">Failed to load wallet transactions.</p>
              <button
                onClick={() => refetch()}
                className="text-xs font-bold text-secondary-blue hover:underline"
              >
                Try Again
              </button>
            </div>
          ) : transactions.length === 0 ? (
            /* Empty State */
            <div className="py-16 text-center space-y-4 max-w-md mx-auto">
              <div className="w-16 h-16 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto text-slate-400">
                <Wallet className="w-8 h-8 opacity-50" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-800">No Transactions Yet</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  You have not received any wallet credits or debits yet. When a promotional balance or discount credit is issued by our executive team, it will appear here instantly.
                </p>
              </div>
            </div>
          ) : (
            /* Transaction List */
            <div className="space-y-3">
              {transactions.map((tx: any) => {
                const isCredit = tx.type === "CREDIT";

                return (
                  <div
                    key={tx._id}
                    className="p-4 rounded-2xl border border-slate-100 bg-slate-50/60 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-start gap-3.5">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                          isCredit
                            ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                            : "bg-red-100 text-red-700 border border-red-200"
                        }`}
                      >
                        {isCredit ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                      </div>

                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`text-xs font-extrabold uppercase px-2 py-0.5 rounded-md ${
                              isCredit
                                ? "bg-emerald-100/80 text-emerald-800"
                                : "bg-red-100/80 text-red-800"
                            }`}
                          >
                            {isCredit ? "Credit" : "Debit"}
                          </span>
                          <span className="text-xs text-slate-400">•</span>
                          <span className="text-xs font-medium text-slate-600">
                            Source: <strong className="text-slate-800">{tx.source || "CarBlink Executive"}</strong>
                          </span>
                        </div>

                        <p className="text-xs text-slate-700 font-medium break-words leading-relaxed">
                          {tx.note || "Promotional adjustment"}
                        </p>

                        <p className="text-[11px] text-slate-400 font-mono">
                          {formatIST(tx.createdAt)}
                        </p>
                      </div>
                    </div>

                    <div className="sm:text-right shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 flex sm:flex-col items-center sm:items-end justify-between">
                      <span
                        className={`text-base sm:text-lg font-black font-mono tracking-tight ${
                          isCredit ? "text-emerald-700" : "text-red-600"
                        }`}
                      >
                        {isCredit ? "+" : "-"}₹
                        {Number(tx.amount || 0).toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium font-mono">
                        Bal after: ₹
                        {Number(tx.balanceAfter || 0).toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-6 border-t border-slate-100 mt-4 text-xs">
              <span className="text-slate-500 font-medium">
                Page {currentPage} of {pagination.totalPages}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1 || isLoading}
                  className="p-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={currentPage >= pagination.totalPages || isLoading}
                  className="p-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
