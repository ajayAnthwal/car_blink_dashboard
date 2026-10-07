// @ts-nocheck
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  X, 
  CreditCard, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  IndianRupee, 
  ArrowRight, 
  Printer, 
  Car, 
  Calendar,
  ExternalLink,
  ShieldCheck,
  Receipt
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface CustomerPaymentHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  payments: any[];
  totalSpent?: number;
}

export default function CustomerPaymentHistoryModal({
  isOpen,
  onClose,
  payments = [],
  totalSpent = 0,
}: CustomerPaymentHistoryModalProps) {
  const [filterStatus, setFilterStatus] = useState<string>("ALL");

  if (!isOpen) return null;

  const safePayments = Array.isArray(payments) ? payments : [];

  // Filter payments
  const filteredPayments = safePayments.filter((p: any) => {
    if (filterStatus === "ALL") return true;
    return String(p.status || "").toUpperCase() === filterStatus;
  });

  const successPayments = safePayments.filter((p: any) => String(p.status || "").toUpperCase() === "SUCCESS");
  const computedTotalSpent = successPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const displayTotalSpent = totalSpent > 0 ? totalSpent : computedTotalSpent;

  const getStatusBadge = (status: string) => {
    const s = String(status || "").toUpperCase();
    if (s === "SUCCESS") {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-0.5 rounded-full">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Success
        </span>
      );
    }
    if (s === "FAILED") {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-extrabold bg-rose-100 text-rose-800 border border-rose-300 px-2.5 py-0.5 rounded-full">
          <XCircle className="w-3 h-3 text-rose-600" /> Failed
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-extrabold bg-amber-100 text-amber-800 border border-amber-300 px-2.5 py-0.5 rounded-full">
        <Clock className="w-3 h-3 text-amber-600" /> Pending
      </span>
    );
  };

  const getTypeLabel = (type: string) => {
    switch (String(type || "").toUpperCase()) {
      case "ADVANCE":
        return "15% Booking Advance";
      case "FINAL":
        return "Final Bill Settlement";
      case "FULL":
        return "Full Payment Upfront";
      default:
        return type || "Service Payment";
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-gray-100 my-auto animate-in zoom-in-95">
        
        {/* Modal Header Bar */}
        <div className="p-4 bg-slate-900 text-white flex justify-between items-center border-b border-slate-800 shrink-0 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-orange-500/20 text-primary-orange rounded-xl border border-primary-orange/30">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-base font-heading block leading-none">Payment & Expense History</span>
              <span className="text-[11px] text-slate-400 font-medium">Verified receipts and transactions for all car services</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              onClick={handlePrint} 
              size="sm" 
              className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs gap-1.5 rounded-xl border border-slate-700"
            >
              <Printer className="w-3.5 h-3.5" /> Print
            </Button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Content Body */}
        <div className="p-6 md:p-8 overflow-y-auto flex-1 font-body text-gray-800 bg-white" id="printable-payments">
          
          {/* Top Hero Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-primary-navy to-slate-950 text-white p-6 rounded-3xl shadow-lg mb-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary-orange/10 rounded-full blur-2xl pointer-events-none"></div>
            <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-orange-300 bg-orange-400/20 px-3 py-1 rounded-full border border-orange-400/30 inline-block mb-2">
                  TOTAL VERIFIED SPEND
                </span>
                <div className="text-4xl font-black font-heading text-white tracking-tight flex items-baseline gap-1">
                  ₹{displayTotalSpent.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                </div>
                <p className="text-xs text-slate-300 mt-1 font-medium flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>100% Secure Razorpay & Verified Cash Transactions</span>
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/20 text-center sm:text-right">
                <span className="text-xs text-slate-300 font-bold block">Transactions</span>
                <span className="text-2xl font-black text-white font-heading">{safePayments.length} Total</span>
              </div>
            </div>
          </div>

          {/* Filter Status Tabs */}
          <div className="flex items-center justify-between gap-2 mb-4 pb-2 border-b border-gray-100 overflow-x-auto print:hidden">
            <div className="flex items-center gap-1.5">
              {[
                { label: `All (${safePayments.length})`, value: "ALL" },
                { label: `Successful (${successPayments.length})`, value: "SUCCESS" },
                { label: `Pending / Failed`, value: "PENDING" },
              ].map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => setFilterStatus(tab.value)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                    filterStatus === tab.value
                      ? "bg-primary-navy text-white shadow-xs"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <Button asChild size="sm" variant="ghost" className="text-xs font-bold text-secondary-blue hover:text-blue-800">
              <Link href="/customer/payments" onClick={onClose}>
                <span>Full Page View</span>
                <ExternalLink className="w-3.5 h-3.5 ml-1" />
              </Link>
            </Button>
          </div>

          {/* Payment Records List */}
          <div>
            {filteredPayments.length === 0 ? (
              <div className="p-8 bg-slate-50 rounded-2xl text-center border border-dashed border-slate-200">
                <Receipt className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-bold text-gray-700">No payment records found</p>
                <p className="text-xs text-gray-500 mt-1">Once you make advance or final payments for your bookings, your receipts will appear here.</p>
              </div>
            ) : (
              <div className="space-y-3.5">
                {filteredPayments.map((p: any, idx: number) => {
                  const bObj = typeof p.bookingId === "object" ? p.bookingId : null;
                  const rawBId = bObj?._id || p.bookingId;
                  const bIdStr = rawBId ? String(rawBId) : "N/A";
                  const serviceName = bObj?.serviceId?.name || bObj?.description || "Car Service Appointment";
                  const vehicleName = bObj?.vehicleId ? `${bObj.vehicleId.brand || ''} ${bObj.vehicleId.model || ''}`.trim() : null;
                  const paymentDate = p.createdAt || p.paidAt || Date.now();

                  return (
                    <div 
                      key={p._id || idx} 
                      className="bg-slate-50/90 hover:bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 hover:border-orange-300 hover:shadow-md transition-all space-y-2.5"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-2.5">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-base sm:text-lg font-black text-slate-900 font-heading">
                              ₹{Number(p.amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                            {getStatusBadge(p.status)}
                            <span className="text-xs font-bold text-slate-700 bg-white border border-slate-200 px-2 py-0.5 rounded-md">
                              {getTypeLabel(p.paymentType)}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 font-medium">
                            {serviceName} {vehicleName && `(${vehicleName})`}
                          </p>
                        </div>

                        <div className="sm:text-right">
                          <span className="text-[11px] font-mono text-slate-500 block">
                            Booking #{bIdStr.slice(-8).toUpperCase()}
                          </span>
                          <span className="text-[11px] text-slate-400 font-medium">
                            {new Date(paymentDate).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit"
                            })}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 text-xs text-slate-500">
                        <div className="flex items-center gap-3">
                          {p.paymentId && (
                            <span>Txn Ref: <strong className="font-mono text-slate-700">{p.paymentId}</strong></span>
                          )}
                          <span>Mode: <strong className="text-slate-700 uppercase">{p.provider || "ONLINE"}</strong></span>
                        </div>

                        {rawBId && rawBId !== "N/A" && (
                          <Button asChild size="sm" variant="ghost" className="text-primary-navy hover:text-primary-orange font-bold text-xs h-auto p-0">
                            <Link href={`/customer/bookings/${bIdStr}`} onClick={onClose} className="inline-flex items-center gap-1">
                              <span>View Linked Booking</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer Navigation */}
          <div className="mt-6 pt-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500 print:hidden">
            <span>CarBlink Verified Invoices & Payment Ledger</span>
            <Button asChild className="bg-primary-navy hover:bg-secondary-blue text-white font-bold text-xs rounded-xl px-5 py-2">
              <Link href="/customer/payments" onClick={onClose}>
                <span>Manage Payments & Invoices</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
