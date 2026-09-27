// @ts-nocheck
"use client";

import React, { useState } from "react";
import { useAccountsTransactions } from "@/features/accounts/hooks/useAccountsQueries";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CreditCard, Search, Download, Loader2, ChevronLeft, ChevronRight, CheckCircle2, Clock } from "lucide-react";

export default function AccountsTransactionsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const limit = 10;

  const { data, isLoading } = useAccountsTransactions({ page, limit, search });
  const transactions = data?.transactions || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / limit) || 1;

  const handleExportCSV = () => {
    if (transactions.length === 0) return;

    const headers = ["Transaction ID,Booking ID,Customer,Amount,Type,Method,Status,Date"];
    const rows = transactions.map((t: any) => [
      `"${t.transactionId || ''}"`,
      `"${t.bookingId || ''}"`,
      `"${t.customer?.fullName || 'Customer'}"`,
      t.amount || 0,
      t.paymentType || 'ONLINE',
      t.method || 'RAZORPAY',
      t.status || 'PENDING',
      `"${new Date(t.createdAt).toLocaleString()}"`
    ].join(','));

    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Financial_Ledger_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 font-heading">Financial Transactions Ledger</h2>
          <p className="text-gray-500 text-sm mt-1">Audit incoming customer payments & transaction history</p>
        </div>
        <Button onClick={handleExportCSV} className="bg-primary-navy hover:bg-primary-navy/90 text-white font-semibold">
          <Download className="w-4 h-4 mr-2" /> Export to CSV
        </Button>
      </div>

      <Card className="shadow-subtle border-gray-100">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
            <CardTitle className="flex items-center space-x-2 text-xl">
              <CreditCard className="w-5 h-5 text-primary-orange" />
              <span>All Ledger Records</span>
            </CardTitle>
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <Input
                placeholder="Search transaction or ID..."
                className="pl-9 text-xs"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 text-primary-orange animate-spin" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="font-medium">No transactions found.</p>
            </div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-500 uppercase bg-gray-50/80 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-3.5 font-semibold">Txn ID / Ref</th>
                  <th className="px-6 py-3.5 font-semibold">Customer</th>
                  <th className="px-6 py-3.5 font-semibold">Type</th>
                  <th className="px-6 py-3.5 font-semibold">Method</th>
                  <th className="px-6 py-3.5 font-semibold">Amount</th>
                  <th className="px-6 py-3.5 font-semibold">Status</th>
                  <th className="px-6 py-3.5 font-semibold">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {transactions.map((t: any) => (
                  <tr key={t._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-mono font-medium text-xs text-primary-navy">
                      #{t.transactionId}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {t.customer?.fullName || 'Customer'}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-blue-50 text-blue-700">
                        {t.paymentType || 'PAYMENT'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold text-gray-600">
                      {t.method || 'RAZORPAY'}
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-900">
                      ₹{Number(t.amount || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full ${
                        t.status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                        t.status === 'CREATED' || t.status === 'PENDING' ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-red-100 text-red-800 border border-red-300'
                      }`}>
                        {t.status === 'SUCCESS' ? 'SUCCESS ✓' : t.status === 'CREATED' ? 'ORDER CREATED ⏳' : (t.status || 'PENDING')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500">
                      {new Date(t.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
              <span className="text-xs text-gray-500 font-medium">Page {page} of {totalPages}</span>
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page === 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  className="h-8 text-xs"
                >
                  <ChevronLeft className="w-3.5 h-3.5 mr-1" /> Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => p + 1)}
                  className="h-8 text-xs"
                >
                  Next <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
