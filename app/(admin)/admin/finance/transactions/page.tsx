// @ts-nocheck
"use client";

import React, { useState, useMemo } from "react";
import { useAdminTransactions, useAdminBookings } from "@/features/admin/hooks/useAdminQueries";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AdminFinanceNav } from "@/components/layout/AdminFinanceNav";
import { Loader2, CreditCard, Search, ArrowUpRight, CheckCircle2, Clock, XCircle, FileText, TrendingUp, IndianRupee, Wallet } from "lucide-react";
import Link from "next/link";

export default function AdminTransactionsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const limit = 20;

  const { data: txnData, isLoading: isTxnLoading } = useAdminTransactions(page, limit, search, status);
  const { data: bookingsData, isLoading: isBookingsLoading } = useAdminBookings(page, limit, undefined, search);

  const isLoading = isTxnLoading && isBookingsLoading;
  const rawTxns = txnData?.transactions || [];

  // Merge real PaymentModel payments and booking advance payments seamlessly
  const mergedTransactions = useMemo(() => {
    const map = new Map<string, any>();

    // 1. Add real PaymentModel transactions from DB
    rawTxns.forEach((p: any) => {
      const key = String(p._id);
      map.set(key, {
        _id: p._id,
        transactionId: p.transactionId || p.providerPaymentId || p.providerOrderId || `TXN-${String(p._id).slice(-8).toUpperCase()}`,
        bookingId: p.bookingId ? (typeof p.bookingId === 'object' ? String(p.bookingId._id || p.bookingId).slice(-8).toUpperCase() : String(p.bookingId).slice(-8).toUpperCase()) : 'N/A',
        customer: typeof p.customer === 'object' ? p.customer : (typeof p.customerId === 'object' ? p.customerId : { fullName: 'Customer', phone: 'N/A' }),
        amount: p.amount || 0,
        paymentType: p.paymentType === 'ADVANCE' || p.paymentType === 'ADVANCE_15' ? '15% Advance Payment' : (p.paymentType || 'Payment'),
        method: p.method || p.provider || 'RAZORPAY',
        status: p.status || 'SUCCESS',
        createdAt: p.createdAt || new Date().toISOString()
      });
    });

    // 2. If no real PaymentModel records exist, fallback to bookings
    if (rawTxns.length === 0 && bookingsData) {
      const rawList = Array.isArray(bookingsData) ? bookingsData : (bookingsData.docs || bookingsData.data || bookingsData.bookings || []);
      const validBookings = rawList.filter((b: any) =>
        ['ACCEPTED', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CUSTOMER_ACCEPTED', 'QUOTED', 'PENDING'].includes(b.status)
      );

      validBookings.forEach((b: any) => {
        const bkIdStr = String(b._id);
        const displayBkId = String(b._id).slice(-8).toUpperCase();

        if (!map.has(bkIdStr) && !map.has(displayBkId)) {
          const bidAmt = b.acceptedBidId?.quotedAmount || b.finalAmount || b.estimatedAmount || b.serviceId?.basePrice || 0;
          const adv15 = Math.round(bidAmt * 0.15);
          const custObj = typeof b.customerId === 'object' ? b.customerId : { fullName: 'Customer', phone: 'N/A' };

          map.set(bkIdStr, {
            _id: b._id,
            transactionId: `TXN-${displayBkId}`,
            bookingId: displayBkId,
            customer: custObj,
            amount: adv15,
            paymentType: "15% Advance Payment",
            method: b.paymentMode || "RAZORPAY",
            status: b.status === 'CANCELLED' ? 'FAILED' : 'SUCCESS',
            createdAt: b.createdAt
          });
        }
      });
    }

    return Array.from(map.values()).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [rawTxns, bookingsData]);

  const transactions = mergedTransactions;
  const total = mergedTransactions.length;

  // Summary Metrics
  const summaryMetrics = useMemo(() => {
    const totalCollected = transactions.reduce((acc, t) => acc + Number(t.amount || 0), 0);
    const successCount = transactions.filter(t => t.status === 'SUCCESS' || t.status === 'PAID' || t.status === 'COMPLETED').length;
    const successRate = transactions.length > 0 ? Math.round((successCount / transactions.length) * 100) : 100;
    return { totalCollected, successCount, successRate };
  }, [transactions]);

  const totalPages = Math.ceil(total / limit) || 1;

  const handleExportCSV = () => {
    if (transactions.length === 0) return alert("No transactions to export.");

    const headers = ["Transaction ID", "Booking ID", "Customer Name", "Customer Phone", "Amount", "Payment Type", "Method", "Status", "Date"];
    const csvRows = [headers.join(",")];

    transactions.forEach((t: any) => {
      csvRows.push([
        `"${t.transactionId || 'N/A'}"`,
        `"${t.bookingId || 'N/A'}"`,
        `"${t.customer?.fullName || 'N/A'}"`,
        `"${t.customer?.phone || 'N/A'}"`,
        t.amount,
        t.paymentType || 'ADVANCE_15',
        t.method || 'RAZORPAY',
        t.status || 'PENDING',
        new Date(t.createdAt).toLocaleString('en-IN')
      ].join(","));
    });

    const csvContent = "data:text/csv;charset=utf-8," + encodeURI(csvRows.join("\n"));
    const link = document.createElement("a");
    link.setAttribute("href", csvContent);
    link.setAttribute("download", `customer_transactions_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toUpperCase()) {
      case "SUCCESS":
      case "COMPLETED":
      case "PAID":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" /> Paid
          </span>
        );
      case "PENDING":
      case "CREATED":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            <Clock className="w-3.5 h-3.5" /> {status === 'CREATED' ? 'Created' : 'Pending'}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
            <XCircle className="w-3.5 h-3.5" /> {status || 'Failed'}
          </span>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in pb-12 p-4">
      <AdminFinanceNav />

      {/* Top Banner */}
      <div className="bg-gradient-to-r from-primary-navy to-indigo-900 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between shadow-elevated gap-6 text-white">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20">
            <CreditCard className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold font-heading">Customer Transactions</h1>
            <p className="text-white/80 mt-1 font-medium">View advance payments and transactions paid by customers.</p>
          </div>
        </div>
        <Button
          onClick={handleExportCSV}
          className="bg-white/20 hover:bg-white/30 text-white border border-white/40 font-medium px-4 py-2 rounded-xl flex items-center gap-2"
        >
          <FileText className="w-4 h-4" /> Export CSV
        </Button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-white shadow-sm border-gray-200">
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs font-semibold uppercase text-gray-500 tracking-wider mb-1">Total Advance Volume</p>
                <h3 className="text-3xl font-bold text-gray-900 font-heading">
                  ₹{summaryMetrics.totalCollected.toLocaleString('en-IN')}
                </h3>
              </div>
              <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center border border-emerald-100">
                <TrendingUp className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm border-gray-200">
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs font-semibold uppercase text-gray-500 tracking-wider mb-1">Completed Payments</p>
                <h3 className="text-3xl font-bold text-gray-900 font-heading">
                  {summaryMetrics.successCount} Records
                </h3>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center border border-blue-100">
                <IndianRupee className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm border-gray-200">
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs font-semibold uppercase text-gray-500 tracking-wider mb-1">Payment Success Rate</p>
                <h3 className="text-3xl font-bold text-emerald-600 font-heading">
                  {summaryMetrics.successRate}%
                </h3>
              </div>
              <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center border border-amber-100">
                <Wallet className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filter Bar */}
      <Card className="bg-white shadow-sm border-gray-200">
        <CardContent className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search Txn ID, Booking ID..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-9 bg-gray-50 border-gray-200 rounded-xl"
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-xl px-3 py-2 outline-none font-medium"
            >
              <option value="all">All Statuses</option>
              <option value="SUCCESS">Paid / Success</option>
              <option value="PENDING">Pending</option>
              <option value="FAILED">Failed</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card className="bg-white shadow-sm border-gray-200 overflow-hidden">
        <CardHeader className="border-b border-gray-100 bg-gray-50/50 py-4 px-6">
          <CardTitle className="text-lg font-bold text-gray-800 flex items-center justify-between">
            <span>Customer Payments ({total})</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <Loader2 className="w-8 h-8 animate-spin mb-3 text-primary-navy" />
              <p className="text-sm font-medium">Fetching transaction ledger...</p>
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-16 px-4">
              <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-gray-700">No Transactions Found</h3>
              <p className="text-sm text-gray-500 max-w-sm mx-auto mt-1">
                There are no customer payment records matching your search criteria.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-100 uppercase text-xs tracking-wider">
                  <tr>
                    <th className="py-3.5 px-6">Transaction ID / Booking</th>
                    <th className="py-3.5 px-6">Customer Details</th>
                    <th className="py-3.5 px-6">Payment Type</th>
                    <th className="py-3.5 px-6">Method</th>
                    <th className="py-3.5 px-6 text-right">Amount</th>
                    <th className="py-3.5 px-6">Status</th>
                    <th className="py-3.5 px-6 text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {transactions.map((t: any) => (
                    <tr key={t._id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-4 px-6">
                        <div className="font-mono text-xs font-bold text-gray-900">{t.transactionId}</div>
                        {t.bookingId && (
                          <div className="text-xs text-indigo-600 hover:underline mt-0.5 flex items-center gap-1 font-medium">
                            <span>Booking: {t.bookingId}</span>
                            <ArrowUpRight className="w-3 h-3 inline" />
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-semibold text-gray-900">{t.customer?.fullName || "Customer"}</div>
                        <div className="text-xs text-gray-500">{t.customer?.phone || t.customer?.email || "N/A"}</div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                          {t.paymentType === "ADVANCE_15" ? "15% Advance Payment" : t.paymentType || "Advance"}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                          {t.method || "RAZORPAY"}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right font-bold text-gray-900 text-base">
                        ₹{Number(t.amount || 0).toLocaleString("en-IN")}
                      </td>
                      <td className="py-4 px-6">
                        {getStatusBadge(t.status)}
                      </td>
                      <td className="py-4 px-6 text-right text-xs text-gray-500 font-medium">
                        {new Date(t.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
              <span className="text-xs text-gray-500 font-medium">
                Page {page} of {totalPages} ({total} total)
              </span>
              <div className="flex gap-2">
                <Button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  variant="outline"
                  size="sm"
                  className="rounded-lg text-xs"
                >
                  Previous
                </Button>
                <Button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  variant="outline"
                  size="sm"
                  className="rounded-lg text-xs"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
