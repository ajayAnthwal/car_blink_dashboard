// @ts-nocheck
"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  getAllExecutiveInvoices, 
  updateInvoiceByExecutive, 
  approveAndForwardInvoice 
} from "@/lib/services";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Receipt, 
  FileText, 
  CheckCircle2, 
  Edit3, 
  Plus, 
  Trash2, 
  User, 
  Building2, 
  Car, 
  Search, 
  Clock, 
  ShieldCheck, 
  Send,
  Loader2,
  X,
  ExternalLink,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import toast from "react-hot-toast";
import { format } from "date-fns";

export default function ExecutiveInvoicesPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [statusFilter, setStatusFilter] = useState("SUBMITTED_TO_EXECUTIVE");
  const [searchQuery, setSearchQuery] = useState("");

  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Modal Form State
  const [items, setItems] = useState<any[]>([]);
  const [discount, setDiscount] = useState<number>(0);
  const [taxAmount, setTaxAmount] = useState<number>(0);
  const [executiveNotes, setExecutiveNotes] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  // Fetch Invoices
  const { data: invoicesRes, isLoading, refetch } = useQuery({
    queryKey: ["executive", "invoices", page, limit, statusFilter, searchQuery],
    queryFn: () => getAllExecutiveInvoices({ page, limit, status: statusFilter, search: searchQuery }),
    staleTime: 0,
    refetchOnWindowFocus: true
  });

  const rawData = invoicesRes?.data || invoicesRes;
  const invoicesList = Array.isArray(rawData?.invoices) 
    ? rawData.invoices 
    : (Array.isArray(rawData?.docs) 
      ? rawData.docs 
      : (Array.isArray(rawData?.data) 
        ? rawData.data 
        : (Array.isArray(rawData) 
          ? rawData 
          : (Array.isArray(invoicesRes) ? invoicesRes : []))));

  const totalInvoices = rawData?.total || invoicesRes?.total || invoicesList.length;
  const totalPages = Math.ceil(totalInvoices / limit) || 1;

  // Open Edit/Inspect Modal
  const openInspectModal = (inv: any) => {
    setSelectedInvoice(inv);
    const existingItems = Array.isArray(inv.items) && inv.items.length > 0 
      ? inv.items.map((it: any) => ({
          description: it.description || "",
          quantity: Number(it.quantity) || 1,
          unitPrice: Number(it.unitPrice) || 0,
          total: (Number(it.quantity) || 1) * (Number(it.unitPrice) || 0)
        }))
      : [{ description: "Base Service Fee", quantity: 1, unitPrice: inv.grandTotal || 0, total: inv.grandTotal || 0 }];

    setItems(existingItems);
    setDiscount(Number(inv.discount) || 0);
    setTaxAmount(Number(inv.taxAmount) || 0);
    setExecutiveNotes(inv.executiveNotes || "");
    setIsEditModalOpen(true);
  };

  // Itemized Calculations
  const subtotal = items.reduce((sum, item) => sum + ((Number(item.quantity) || 1) * (Number(item.unitPrice) || 0)), 0);
  const grandTotal = Math.max(0, subtotal + Number(taxAmount || 0) - Number(discount || 0));

  // Item Handlers
  const handleItemChange = (index: number, field: string, value: any) => {
    setItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      const qty = Math.max(1, Number(updated[index].quantity) || 1);
      const price = Math.max(0, Number(updated[index].unitPrice) || 0);
      updated[index].total = qty * price;
      return updated;
    });
  };

  const addItemRow = () => {
    setItems(prev => [...prev, { description: "", quantity: 1, unitPrice: 0, total: 0 }]);
  };

  const removeItemRow = (index: number) => {
    if (items.length <= 1) {
      toast.error("At least one item is required in the invoice.");
      return;
    }
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  // Save Modifications
  const handleSaveModifications = async () => {
    if (!selectedInvoice) return;
    setSubmitting(true);
    try {
      await updateInvoiceByExecutive(selectedInvoice._id, {
        items,
        subtotal,
        taxAmount,
        discount,
        grandTotal,
        executiveNotes
      });
      toast.success("Invoice modifications saved successfully!");
      queryClient.invalidateQueries({ queryKey: ["executive", "invoices"] });
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Failed to update invoice.");
    } finally {
      setSubmitting(false);
    }
  };

  // Approve & Forward to Customer
  const handleApproveAndForward = async () => {
    if (!selectedInvoice) return;
    setSubmitting(true);
    try {
      // 1. Save any pending item edits first
      await updateInvoiceByExecutive(selectedInvoice._id, {
        items,
        subtotal,
        taxAmount,
        discount,
        grandTotal,
        executiveNotes
      });

      // 2. Approve and Forward
      await approveAndForwardInvoice(selectedInvoice._id, executiveNotes);

      toast.success("Invoice approved and forwarded to customer successfully! 🚀");
      setIsEditModalOpen(false);
      setSelectedInvoice(null);
      queryClient.invalidateQueries({ queryKey: ["executive", "invoices"] });
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Failed to approve and forward invoice.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 font-heading flex items-center gap-2">
            <Receipt className="w-8 h-8 text-primary-orange" /> Partner Invoice Review Console
          </h1>
          <p className="text-gray-500 mt-1 font-body">
            Inspect, edit itemized bills, apply executive discounts, and approve invoices for customer payment.
          </p>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <Card className="shadow-subtle border-gray-100 p-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="flex items-center space-x-2 overflow-x-auto pb-2 md:pb-0">
            <button
              onClick={() => { setStatusFilter("SUBMITTED_TO_EXECUTIVE"); setPage(1); }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                statusFilter === "SUBMITTED_TO_EXECUTIVE"
                  ? "bg-primary-orange text-white shadow-md shadow-orange-500/20"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <Clock className="w-3.5 h-3.5" /> Pending Review
            </button>

            <button
              onClick={() => { setStatusFilter("FORWARDED_TO_CUSTOMER"); setPage(1); }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                statusFilter === "FORWARDED_TO_CUSTOMER"
                  ? "bg-primary-orange text-white shadow-md shadow-orange-500/20"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <Send className="w-3.5 h-3.5" /> Forwarded to Customer
            </button>

            <button
              onClick={() => { setStatusFilter("PAID"); setPage(1); }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                statusFilter === "PAID"
                  ? "bg-primary-orange text-white shadow-md shadow-orange-500/20"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" /> Paid Invoices
            </button>

            <button
              onClick={() => { setStatusFilter("all"); setPage(1); }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                statusFilter === "all"
                  ? "bg-primary-orange text-white shadow-md shadow-orange-500/20"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              All Invoices
            </button>
          </div>

          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search partner, customer..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-navy/20"
            />
          </div>
        </div>
      </Card>

      {/* Invoices Table */}
      <Card className="shadow-subtle border-gray-100 overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-16 w-full rounded-xl" />
              ))}
            </div>
          ) : invoicesList.length === 0 ? (
            <div className="p-16 text-center flex flex-col items-center justify-center">
              <Receipt className="w-16 h-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-bold text-gray-800 font-heading">No Invoices Found</h3>
              <p className="text-xs text-gray-500 mt-1 max-w-sm">
                There are currently no partner submitted invoices matching the selected criteria.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-gray-50/80">
                <TableRow>
                  <TableHead className="font-semibold text-gray-700">Partner & Workshop</TableHead>
                  <TableHead className="font-semibold text-gray-700">Customer & Vehicle</TableHead>
                  <TableHead className="font-semibold text-gray-700">Type</TableHead>
                  <TableHead className="font-semibold text-gray-700">Grand Total</TableHead>
                  <TableHead className="font-semibold text-gray-700">Status</TableHead>
                  <TableHead className="text-right font-semibold text-gray-700">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoicesList.map((inv) => {
                  const partner = inv.partnerId;
                  const customer = inv.customerId;
                  const booking = inv.bookingId;
                  const vehicle = booking?.vehicleId;

                  return (
                    <TableRow key={inv._id} className="hover:bg-gray-50/60 transition-colors">
                      {/* Partner */}
                      <TableCell>
                        <div className="flex items-center space-x-2.5">
                          <div className="bg-orange-50 p-2 rounded-xl text-primary-orange shrink-0">
                            <Building2 className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 text-sm">{partner?.businessName || "Workshop Partner"}</p>
                            <p className="text-xs text-gray-500">{partner?.phone || "N/A"}</p>
                          </div>
                        </div>
                      </TableCell>

                      {/* Customer */}
                      <TableCell>
                        <div className="flex flex-col space-y-0.5">
                          <span className="font-bold text-gray-900 text-sm flex items-center gap-1">
                            <User className="w-3.5 h-3.5 text-gray-400" /> {customer?.fullName || "Customer"}
                          </span>
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Car className="w-3.5 h-3.5 text-gray-400" /> 
                            {vehicle ? `${vehicle.brand || ''} ${vehicle.model || ''} (${vehicle.registrationNumber || 'N/A'})` : 'Car Details'}
                          </span>
                        </div>
                      </TableCell>

                      {/* Invoice Type */}
                      <TableCell>
                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-wider ${
                          inv.invoiceType === 'PDF' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {inv.invoiceType || 'ITEMIZED'}
                        </span>
                      </TableCell>

                      {/* Amount */}
                      <TableCell>
                        <div>
                          <p className="font-black text-sm text-gray-900">₹{inv.grandTotal || 0}</p>
                          {inv.discount > 0 && (
                            <p className="text-[10px] text-emerald-600 font-bold">Disc: ₹{inv.discount}</p>
                          )}
                        </div>
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit ${
                          inv.status === 'SUBMITTED_TO_EXECUTIVE' ? 'bg-amber-100 text-amber-800' :
                          inv.status === 'FORWARDED_TO_CUSTOMER' ? 'bg-blue-100 text-blue-800' :
                          inv.status === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {inv.status === 'SUBMITTED_TO_EXECUTIVE' && <Clock className="w-3 h-3" />}
                          {inv.status === 'FORWARDED_TO_CUSTOMER' && <Send className="w-3 h-3" />}
                          {inv.status === 'PAID' && <CheckCircle2 className="w-3 h-3" />}
                          {inv.status?.replace(/_/g, ' ')}
                        </span>
                      </TableCell>

                      {/* Action */}
                      <TableCell className="text-right">
                        <Button
                          onClick={() => openInspectModal(inv)}
                          size="sm"
                          className="bg-primary-navy hover:bg-navy-900 text-white font-bold text-xs"
                        >
                          <Edit3 className="w-3.5 h-3.5 mr-1" /> Inspect & Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}

          {/* Pagination Footer */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <span className="text-xs text-gray-500 font-medium">
                Showing page <strong className="text-gray-900">{page}</strong> of <strong className="text-gray-900">{totalPages}</strong> ({totalInvoices} total invoices)
              </span>
              <div className="flex items-center space-x-2">
                <Button
                  disabled={page <= 1}
                  onClick={() => setPage(prev => Math.max(1, prev - 1))}
                  size="sm"
                  variant="outline"
                  className="text-xs"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" /> Previous
                </Button>
                <Button
                  disabled={page >= totalPages}
                  onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                  size="sm"
                  variant="outline"
                  className="text-xs"
                >
                  Next <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Inspect & Edit Modal */}
      {isEditModalOpen && selectedInvoice && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <Card className="w-full max-w-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <CardHeader className="border-b border-gray-100 bg-gray-50/50 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-primary-orange" /> Executive Invoice Inspection & Edit
                  </CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    Inspect bill items submitted by {selectedInvoice.partnerId?.businessName || 'Partner'}, edit line items, or apply executive discounts.
                  </CardDescription>
                </div>
                <button
                  onClick={() => { setIsEditModalOpen(false); setSelectedInvoice(null); }}
                  className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </CardHeader>

            <CardContent className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* Partner & Customer Summary Bar */}
              <div className="bg-orange-50/60 border border-orange-100 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="font-bold text-gray-500 uppercase tracking-wider block text-[10px]">Partner</span>
                  <p className="font-black text-gray-900 mt-0.5">{selectedInvoice.partnerId?.businessName || 'N/A'}</p>
                  <p className="text-gray-600">{selectedInvoice.partnerId?.phone || ''}</p>
                </div>
                <div>
                  <span className="font-bold text-gray-500 uppercase tracking-wider block text-[10px]">Customer</span>
                  <p className="font-black text-gray-900 mt-0.5">{selectedInvoice.customerId?.fullName || 'N/A'}</p>
                  <p className="text-gray-600">{selectedInvoice.customerId?.phone || ''}</p>
                </div>
                <div>
                  <span className="font-bold text-gray-500 uppercase tracking-wider block text-[10px]">Vehicle</span>
                  <p className="font-black text-gray-900 mt-0.5">
                    {selectedInvoice.bookingId?.vehicleId ? `${selectedInvoice.bookingId.vehicleId.brand} ${selectedInvoice.bookingId.vehicleId.model}` : 'Vehicle'}
                  </p>
                  <p className="text-gray-600">{selectedInvoice.bookingId?.vehicleId?.registrationNumber || ''}</p>
                </div>
              </div>

              {/* PDF Document attachment preview if uploaded */}
              {selectedInvoice.pdfUrl && (
                <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 flex items-center justify-between text-xs">
                  <span className="font-bold text-purple-900 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-purple-700" /> Original Partner PDF Invoice Attached
                  </span>
                  <a
                    href={selectedInvoice.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-extrabold text-purple-700 hover:underline flex items-center gap-1"
                  >
                    View Attached PDF <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}

              {/* Itemized Line Items Table */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold text-sm text-gray-900 flex items-center gap-1.5">
                    <Receipt className="w-4 h-4 text-primary-orange" /> Bill Line Items
                  </h4>
                  <Button onClick={addItemRow} size="sm" variant="outline" className="text-xs font-bold text-primary-orange border-primary-orange/30">
                    <Plus className="w-3.5 h-3.5 mr-1" /> Add Line Item
                  </Button>
                </div>

                <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-gray-100 font-bold text-gray-700 border-b border-gray-200">
                      <tr>
                        <th className="p-3 w-1/2">Item / Part Description</th>
                        <th className="p-3 w-20 text-center">Qty</th>
                        <th className="p-3 w-28">Unit Price (₹)</th>
                        <th className="p-3 w-28">Total (₹)</th>
                        <th className="p-3 w-12 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {items.map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50/50">
                          <td className="p-2">
                            <input
                              type="text"
                              value={item.description}
                              onChange={(e) => handleItemChange(index, "description", e.target.value)}
                              placeholder="e.g. Engine Oil Synthetic 4L"
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-orange font-medium"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                              className="w-full px-2 py-2 border border-gray-200 rounded-lg text-center focus:outline-none focus:ring-1 focus:ring-primary-orange font-medium"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              min="0"
                              value={item.unitPrice}
                              onChange={(e) => handleItemChange(index, "unitPrice", e.target.value)}
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-orange font-medium"
                            />
                          </td>
                          <td className="p-2 font-bold text-gray-900">
                            ₹{(Number(item.quantity) || 1) * (Number(item.unitPrice) || 0)}
                          </td>
                          <td className="p-2 text-center">
                            <button
                              onClick={() => removeItemRow(index)}
                              className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Bill Financial Summary */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3">
                <div className="flex justify-between items-center text-xs font-semibold text-gray-600">
                  <span>Subtotal Items:</span>
                  <span className="font-bold text-gray-900">₹{subtotal}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-gray-200">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Executive Discount (₹)</label>
                    <input
                      type="number"
                      min="0"
                      value={discount}
                      onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                      placeholder="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-bold text-emerald-700 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">GST / Tax Amount (₹)</label>
                    <input
                      type="number"
                      min="0"
                      value={taxAmount}
                      onChange={(e) => setTaxAmount(Number(e.target.value) || 0)}
                      placeholder="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-bold text-gray-800 bg-white focus:outline-none focus:ring-1 focus:ring-primary-orange"
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center pt-3 border-t border-gray-300 text-base font-black text-gray-900">
                  <span>Final Grand Total Bill:</span>
                  <span className="text-xl text-primary-orange">₹{grandTotal}</span>
                </div>
              </div>

              {/* Executive Notes */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Executive Review Remarks / Notes</label>
                <textarea
                  value={executiveNotes}
                  onChange={(e) => setExecutiveNotes(e.target.value)}
                  placeholder="Notes for customer or internal audit..."
                  rows={2}
                  className="w-full p-3 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-primary-orange resize-none"
                />
              </div>
            </CardContent>

            {/* Modal Actions */}
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between gap-4">
              <Button
                variant="ghost"
                onClick={() => { setIsEditModalOpen(false); setSelectedInvoice(null); }}
                disabled={submitting}
              >
                Cancel
              </Button>

              <div className="flex items-center space-x-3">
                <Button
                  onClick={handleSaveModifications}
                  disabled={submitting}
                  variant="outline"
                  className="font-bold border-gray-300 text-gray-700"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Edit3 className="w-4 h-4 mr-1" />}
                  Save Modifications
                </Button>

                <Button
                  onClick={handleApproveAndForward}
                  disabled={submitting}
                  className="bg-primary-orange hover:bg-orange-600 text-white font-bold shadow-md shadow-orange-500/20"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-1" />
                  ) : (
                    <Send className="w-4 h-4 mr-1.5" />
                  )}
                  Approve & Forward to Customer
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
