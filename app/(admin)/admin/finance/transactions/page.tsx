// @ts-nocheck
"use client";

import React, { useState } from "react";
import { useAdminTransactions } from "@/features/admin/hooks/useAdminQueries";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AdminFinanceNav } from "@/components/layout/AdminFinanceNav";
import { Loader2, CreditCard, Search, ArrowUpRight, CheckCircle2, Clock, XCircle, FileText } from "lucide-react";
import Link from "next/link";

export default function AdminTransactionsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const limit = 20;

  const { data, isLoading } = useAdminTransactions(page, limit, search, status);

  const transactions = data?.transactions || [];
  const total = data?.total || 0;
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
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            <Clock className="w-3.5 h-3.5" /> Pending
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
