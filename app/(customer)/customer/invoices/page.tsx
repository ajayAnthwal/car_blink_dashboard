// @ts-nocheck
"use client";

import React, { useState, useEffect } from "react";
import { useCustomerInvoicesQuery } from "@/features/customer/hooks/useCustomerQueries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Receipt, FileText, Printer, Download, X, Car, Calendar, CheckCircle2, Building2, Search, ChevronLeft, ChevronRight } from "lucide-react";

export default function CustomerInvoicesPage() {
  const { data: invoicesData, isLoading } = useCustomerInvoicesQuery();
  const invoices = invoicesData?.invoices || [];
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

  // Search & Pagination state
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 6;

  const filteredInvoices = invoices.filter((inv: any) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const bInfo = inv.bookingId || {};
    const vInfo = bInfo.vehicleId || {};
    const pInfo = inv.partnerId || {};
    const serviceName = typeof bInfo.serviceId === 'object' ? bInfo.serviceId.name || '' : 'Car Service Invoice';
    const vehicleStr = `${vInfo.brand || ''} ${vInfo.model || ''} ${vInfo.registrationNumber || ''}`;
    const workshop = pInfo.businessName || '';
    const status = inv.status || '';
    const invId = inv._id || inv.id || '';
    const formattedInvId = `inv-${invId.slice(-8)}`;

    return (
      serviceName.toLowerCase().includes(q) ||
      vehicleStr.toLowerCase().includes(q) ||
      workshop.toLowerCase().includes(q) ||
      status.toLowerCase().includes(q) ||
      invId.toLowerCase().includes(q) ||
      formattedInvId.toLowerCase().includes(q)
    );
  });

  const totalPages = Math.ceil(filteredInvoices.length / ITEMS_PER_PAGE) || 1;

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [filteredInvoices.length, totalPages, currentPage]);

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedInvoices = filteredInvoices.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (!invoices || invoices.length === 0) return;
    
    const headers = ["Invoice ID", "Date", "Service Name", "Vehicle", "Workshop", "Status", "Total Amount (INR)"];
    const rows = invoices.map((inv: any) => {
      const invId = inv._id || inv.id || "";
      const formattedInvId = `INV-${invId.slice(-8)}`;
      const invDate = new Date(inv.createdAt).toLocaleDateString("en-IN");
      const bInfo = inv.bookingId || {};
      const vInfo = bInfo.vehicleId || {};
      const pInfo = inv.partnerId || {};
      const serviceName = typeof bInfo.serviceId === "object" ? bInfo.serviceId.name || "" : "Car Service";
      const vehicleStr = `${vInfo.brand || ""} ${vInfo.model || ""} (${vInfo.registrationNumber || ""})`.trim();
      const workshop = pInfo.businessName || "CarBlink Workshop";
      const status = inv.status || "PAID";
      const amount = inv.grandTotal || 0;

      return [
        `"${formattedInvId}"`,
        `"${invDate}"`,
        `"${serviceName.replace(/"/g, '""')}"`,
        `"${vehicleStr.replace(/"/g, '""')}"`,
        `"${workshop.replace(/"/g, '""')}"`,
        `"${status}"`,
        `"${amount}"`
      ].join(",");
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `carblink_invoices_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto pb-12 px-4 sm:px-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 px-4 sm:px-6 md:px-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-primary-navy via-slate-900 to-slate-800 p-6 md:p-8 rounded-3xl text-white shadow-xl">
        <div>
          <span className="text-xs font-extrabold uppercase tracking-widest text-primary-orange bg-primary-orange/20 px-3 py-1 rounded-full border border-primary-orange/30 inline-block mb-2">
            Finance & Billing
          </span>
          <h1 className="text-2xl sm:text-3xl font-black font-heading tracking-tight">My Invoices</h1>
          <p className="text-slate-300 text-sm font-medium mt-1">
            Access, view, download, and print all verified service invoices from your workshops.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {invoices.length > 0 && (
            <Button
              onClick={handleExportCSV}
              variant="outline"
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 rounded-2xl font-bold text-xs px-4 py-3 h-auto backdrop-blur-md flex items-center gap-2"
            >
              <Download className="w-4 h-4 text-primary-orange" />
              Export All Invoices (CSV)
            </Button>
          )}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 px-4 py-3 rounded-2xl flex items-center gap-3">
            <Receipt className="w-8 h-8 text-primary-orange" />
            <div>
              <div className="text-2xl font-black">{invoices.length}</div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-300">Total Invoices</div>
            </div>
          </div>
        </div>
      </div>

      {/* Search Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <h3 className="font-bold text-gray-900 font-heading">Invoice Records ({filteredInvoices.length})</h3>
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            placeholder="Search service, vehicle, workshop..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-9 h-10 rounded-xl bg-gray-50/50 border-gray-200 text-sm"
          />
        </div>
      </div>

      {/* Invoices List */}
      {filteredInvoices.length === 0 ? (
        <Card className="bg-white/80 backdrop-blur-md shadow-sm border border-gray-100 text-center py-16">
          <CardContent className="flex flex-col items-center justify-center space-y-3">
            <div className="w-16 h-16 bg-orange-50 text-primary-orange rounded-full flex items-center justify-center border border-orange-100 mb-2">
              <Receipt className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 font-heading">
              {searchQuery ? "No Matching Invoices Found" : "No Invoices Available Yet"}
            </h3>
            <p className="text-gray-500 text-sm max-w-md">
              {searchQuery ? `No invoices found matching "${searchQuery}".` : "Once your service is completed or an invoice is generated by your partner workshop, it will appear here for download and printing."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedInvoices.map((inv: any) => {
              const invDate = new Date(inv.createdAt).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              });
              const bInfo = inv.bookingId || {};
              const vInfo = bInfo.vehicleId || {};
              const pInfo = inv.partnerId || {};

              return (
                <Card key={inv._id} className="bg-white shadow-sm border-gray-200 hover:border-primary-orange/50 hover:shadow-lg transition-all duration-300 flex flex-col justify-between rounded-2xl overflow-hidden group">
                  <CardContent className="p-6 flex flex-col justify-between h-full space-y-4">
                    <div>
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 block">INVOICE DATE</span>
                          <span className="text-xs font-bold text-gray-700">{invDate}</span>
                        </div>
                        <Badge className={`text-xs font-extrabold px-3 py-1 rounded-full border-none ${inv.status === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                          {inv.status === 'PAID' ? 'PAID ✓' : 'READY FOR PAYMENT'}
                        </Badge>
                      </div>

                      <h3 className="font-bold text-gray-900 text-lg font-heading group-hover:text-primary-orange transition-colors line-clamp-1">
                        {typeof bInfo.serviceId === 'object' ? bInfo.serviceId.name : 'Car Service Invoice'}
                      </h3>
                      <p className="text-xs text-gray-600 font-medium flex items-center gap-1.5 mt-1">
                        <Car className="w-3.5 h-3.5 text-primary-orange shrink-0" />
                        <span>{vInfo.brand} {vInfo.model} • {vInfo.registrationNumber || 'Vehicle'}</span>
                      </p>
                      <p className="text-xs text-gray-500 font-medium flex items-center gap-1.5 mt-1">
                        <Building2 className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span>Workshop: {pInfo.businessName || 'Verified Service Partner'}</span>
                      </p>

                      <div className="mt-5 pt-4 border-t border-gray-100 flex justify-between items-baseline bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                        <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">Total Payable Amount</span>
                        <span className="text-2xl font-black text-gray-900 font-heading">
                          ₹{(inv.grandTotal || 0).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 flex flex-col gap-2">
                      <Button
                        onClick={() => setSelectedInvoice(inv)}
                        className="w-full bg-primary-orange hover:bg-orange-600 text-white font-bold text-xs py-3 rounded-xl shadow-sm flex items-center justify-center gap-2"
                      >
                        <Printer className="w-4 h-4" /> View & Print Invoice
                      </Button>
                      {(inv.pdfUrl || inv.pdf || inv.pdfDocument || inv.invoiceUrl) && (
                        <Button
                          asChild
                          variant="outline"
                          className="w-full border-gray-200 text-gray-700 hover:bg-gray-50 text-xs py-2.5 rounded-xl font-bold flex items-center justify-center gap-2"
                        >
                          <a
                            href={inv.pdfUrl || inv.pdf || inv.pdfDocument || inv.invoiceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <FileText className="w-4 h-4 text-primary-orange" /> {(inv.pdfUrl || inv.pdf || inv.pdfDocument || inv.invoiceUrl)?.toLowerCase().endsWith('.pdf') ? 'Download / View PDF' : 'View Invoice'}
                          </a>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Pagination Controls */}
          {filteredInvoices.length > ITEMS_PER_PAGE && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-100 bg-white p-4 rounded-2xl shadow-sm border">
              <p className="text-xs text-gray-500">
                Showing <span className="font-semibold text-gray-900">{startIndex + 1}</span> to{" "}
                <span className="font-semibold text-gray-900">
                  {Math.min(startIndex + ITEMS_PER_PAGE, filteredInvoices.length)}
                </span>{" "}
                of <span className="font-semibold text-gray-900">{filteredInvoices.length}</span> invoices
              </p>

              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="h-8 px-3 text-xs flex items-center gap-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Previous
                </Button>

                <div className="flex items-center space-x-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`h-8 w-8 rounded-lg text-xs font-semibold transition-all ${
                        currentPage === page
                          ? "bg-primary-orange text-white shadow-sm"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="h-8 px-3 text-xs flex items-center gap-1"
                >
                  Next <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Printable Invoice Modal Dialog */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-gray-100 my-auto animate-in zoom-in-95">
            {/* Modal Header Controls (Hidden during print) */}
            <div className="p-4 bg-slate-900 text-white flex justify-between items-center border-b border-slate-800 print:hidden shrink-0">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-primary-orange" />
                <span className="font-bold text-base font-heading">Official Service Invoice</span>
              </div>
              <div className="flex items-center gap-3">
                <Button onClick={handlePrint} size="sm" className="bg-primary-orange hover:bg-orange-600 text-white font-bold text-xs gap-1.5 rounded-xl">
                  <Printer className="w-4 h-4" /> Print / Save PDF
                </Button>
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Invoice Printable Document Body */}
            <div className="p-6 md:p-10 overflow-y-auto flex-1 font-body text-gray-800 bg-white" id="printable-invoice">
              {/* Top Branding & Invoice No */}
              <div className="flex justify-between items-start pb-6 border-b-2 border-gray-200 gap-4">
                <div>
                  <h1 className="text-3xl font-black font-heading text-primary-navy tracking-tight">CarBlink</h1>
                  <p className="text-xs text-gray-500 font-medium">India's Premier Auto Service & Care Network</p>
                  <p className="text-xs text-gray-400 mt-1">GSTIN: 07AAAAC1234F1Z9 • Support: help@carblink.in</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-primary-orange bg-orange-50 px-3 py-1 rounded-full border border-orange-100 inline-block mb-1">
                    INVOICE
                  </span>
                  <div className="text-xs font-mono font-bold text-gray-700">#INV-{(selectedInvoice._id || '0000').slice(-8).toUpperCase()}</div>
                  <div className="text-xs text-gray-500 mt-1">Date: {new Date(selectedInvoice.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                </div>
              </div>

              {/* Billed To & Service Partner Grid */}
              <div className="grid grid-cols-2 gap-6 my-6 p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs">
                <div>
                  <span className="font-extrabold text-gray-400 uppercase tracking-wider block mb-1">CUSTOMER DETAILS</span>
                  <div className="font-bold text-gray-900 text-sm">{selectedInvoice.bookingId?.customerId?.fullName || 'Valued Customer'}</div>
                  <div className="text-gray-600 font-medium mt-0.5">{selectedInvoice.bookingId?.customerId?.phone || ''}</div>
                  <div className="text-gray-600 font-medium mt-0.5">Vehicle: {selectedInvoice.bookingId?.vehicleId?.brand} {selectedInvoice.bookingId?.vehicleId?.model}</div>
                  <div className="text-gray-500 text-[11px] mt-0.5 font-mono">{selectedInvoice.bookingId?.vehicleId?.registrationNumber || 'Reg: N/A'}</div>
                </div>
                <div className="text-right">
                  <span className="font-extrabold text-gray-400 uppercase tracking-wider block mb-1">SERVICE WORKSHOP</span>
                  <div className="font-bold text-gray-900 text-sm">{selectedInvoice.partnerId?.businessName || 'Verified Partner Workshop'}</div>
                  <div className="text-gray-600 font-medium mt-0.5">{selectedInvoice.partnerId?.address || 'Verified Workshop Facility'}</div>
                  <div className="text-gray-600 font-medium mt-0.5">Service: {selectedInvoice.bookingId?.serviceId?.name || 'Car Maintenance Service'}</div>
                </div>
              </div>

              {/* Itemized Services & Parts Table */}
              <div className="my-6">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-gray-700 font-extrabold border-y border-gray-200">
                      <th className="py-3 px-4">#</th>
                      <th className="py-3 px-4">Description / Part Name</th>
                      <th className="py-3 px-4 text-center">Qty</th>
                      <th className="py-3 px-4 text-right">Unit Price (₹)</th>
                      <th className="py-3 px-4 text-right">Total (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {Array.isArray(selectedInvoice.items) && selectedInvoice.items.length > 0 ? (
                      selectedInvoice.items.map((item: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="py-3 px-4 font-bold text-gray-400">{idx + 1}</td>
                          <td className="py-3 px-4 font-semibold text-gray-800">{item.description}</td>
                          <td className="py-3 px-4 text-center font-bold text-gray-700">{item.quantity || 1}</td>
                          <td className="py-3 px-4 text-right text-gray-600">₹{(item.unitPrice || 0).toLocaleString('en-IN')}</td>
                          <td className="py-3 px-4 text-right font-bold text-gray-900">₹{((item.quantity || 1) * (item.unitPrice || 0)).toLocaleString('en-IN')}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td className="py-3 px-4 font-bold text-gray-400">1</td>
                        <td className="py-3 px-4 font-semibold text-gray-800">{selectedInvoice.bookingId?.serviceId?.name || 'Car Repair & Maintenance Service'}</td>
                        <td className="py-3 px-4 text-center font-bold text-gray-700">1</td>
                        <td className="py-3 px-4 text-right text-gray-600">₹{(selectedInvoice.subtotal || selectedInvoice.grandTotal || 0).toLocaleString('en-IN')}</td>
                        <td className="py-3 px-4 text-right font-bold text-gray-900">₹{(selectedInvoice.subtotal || selectedInvoice.grandTotal || 0).toLocaleString('en-IN')}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Price Calculation Summary Box */}
              <div className="flex justify-end my-6">
                <div className="w-full sm:w-72 bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
                  <div className="flex justify-between text-gray-600 font-medium">
                    <span>Taxable Base Value:</span>
                    <span>₹{(selectedInvoice.subtotal || Number(((selectedInvoice.grandTotal || 0) / 1.18).toFixed(2))).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-blue-700 font-medium">
                    <span>GST (18% Included):</span>
                    <span>₹{(selectedInvoice.taxAmount || Number(((selectedInvoice.grandTotal || 0) - ((selectedInvoice.grandTotal || 0) / 1.18)).toFixed(2))).toLocaleString('en-IN')}</span>
                  </div>
                  {Number(selectedInvoice.discount) > 0 && (
                    <div className="flex justify-between text-emerald-700 font-bold">
                      <span>Discount:</span>
                      <span>- ₹{(selectedInvoice.discount).toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-gray-300 flex justify-between font-black text-gray-900 text-sm">
                    <div>
                      <span>Grand Total:</span>
                      <span className="block text-[10px] text-gray-400 font-normal">All-Inclusive of 18% GST</span>
                    </div>
                    <span className="text-primary-orange">₹{(selectedInvoice.grandTotal || 0).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              {/* Footer Note */}
              <div className="mt-8 pt-4 border-t border-gray-200 text-center text-[11px] text-gray-400 font-medium">
                Thank you for choosing CarBlink! Computer-generated invoice; no signature required.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
