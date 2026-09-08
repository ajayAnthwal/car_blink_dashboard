// @ts-nocheck
"use client";

import React, { useState } from "react";
import { useMasterInvoices } from "@/features/accounts/hooks/useAccountsQueries";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, Loader2, ChevronLeft, ChevronRight } from "lucide-react";

export default function AccountsInvoicesPage() {
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data, isLoading } = useMasterInvoices({ page, limit });
  const invoices = data?.invoices || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / limit) || 1;

  const handleExportCSV = () => {
    if (invoices.length === 0) return;

    const headers = ["Invoice No,Partner,Subtotal,CGST (9%),SGST (9%),Grand Total,Status"];
    const rows = invoices.map((inv: any) => [
      `"${inv.invoiceNumber || ''}"`,
      `"${inv.partnerId?.businessName || 'Partner'}"`,
      inv.subtotal || 0,
      inv.cgst || 0,
      inv.sgst || 0,
      inv.grandTotal || 0,
      inv.status || 'FORWARDED_TO_CUSTOMER'
    ].join(','));

    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Master_Invoices_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 font-heading">Master Invoice Register & GST Breakdown</h2>
          <p className="text-gray-500 text-sm mt-1">Audit GST, subtotal, and tax breakdowns across all completed bookings</p>
        </div>
        <Button onClick={handleExportCSV} className="bg-primary-navy hover:bg-primary-navy/90 text-white font-semibold">
          <Download className="w-4 h-4 mr-2" /> Export GST Register CSV
        </Button>
      </div>

      <Card className="shadow-subtle border-gray-100">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center space-x-2 text-xl">
            <FileText className="w-5 h-5 text-secondary-blue" />
            <span>Master Invoices Register</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 text-primary-orange animate-spin" />
            </div>
          ) : invoices.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="font-medium">No invoices found in database.</p>
            </div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-500 uppercase bg-gray-50/80 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-3.5 font-semibold">Invoice No</th>
                  <th className="px-6 py-3.5 font-semibold">Partner</th>
                  <th className="px-6 py-3.5 font-semibold">Subtotal</th>
                  <th className="px-6 py-3.5 font-semibold">CGST (9%)</th>
                  <th className="px-6 py-3.5 font-semibold">SGST (9%)</th>
                  <th className="px-6 py-3.5 font-semibold">Grand Total</th>
                  <th className="px-6 py-3.5 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {invoices.map((inv: any) => (
                  <tr key={inv._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-primary-navy">
                      {inv.invoiceNumber}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {inv.partnerId?.businessName || 'Partner'}
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-700">
                      ₹{Number(inv.subtotal || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-600">
                      ₹{Number(inv.cgst || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-600">
                      ₹{Number(inv.sgst || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-4 font-extrabold text-gray-900 text-md">
                      ₹{Number(inv.grandTotal || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-800">
                        {inv.status || 'APPROVED'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
              <span className="text-xs text-gray-500 font-medium">Page {page} of {totalPages}</span>
              <div className="flex space-x-2">
                <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))} className="h-8 text-xs">
                  <ChevronLeft className="w-3.5 h-3.5 mr-1" /> Previous
                </Button>
                <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="h-8 text-xs">
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
