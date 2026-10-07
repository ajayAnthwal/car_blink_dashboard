// @ts-nocheck
"use client";

import React, { useState } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/Select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { CreditCard, Loader2, CheckCircle, XCircle, PiggyBank } from "lucide-react";
import { useCustomerBookings, useCustomerPayments, useInitiatePayment } from "@/features/customer/hooks/useCustomerQueries";
import { verifyPayment } from "@/lib/services";
import { loadRazorpayScript } from "@/lib/razorpay";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";
import CustomerSavingsModal from "@/components/customer/CustomerSavingsModal";

interface Booking {
  _id: string;
  vehicleId: { brand: string; model: string };
  serviceId: { name: string };
}

interface Payment {
  _id: string;
  bookingId: string;
  amount: number;
  paymentType: string;
  status: string;
  paymentId?: string;
  orderId?: string;
  createdAt: string;
}

export default function PaymentsPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { data: bookingsData, isLoading: isLoadingBookings } = useCustomerBookings();
  const { data: paymentsData, isLoading: isLoadingPayments, refetch: refetchPayments } = useCustomerPayments();

  const initiatePaymentMutation = useInitiatePayment();

  const bookings = (bookingsData?.bookings || []) as Booking[];
  const payments = (paymentsData?.payments || []) as Payment[];

  const [bookingId, setBookingId] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentType, setPaymentType] = useState("ADVANCE");
  const [couponCode, setCouponCode] = useState("");
  const [useRewardPoints, setUseRewardPoints] = useState(false);
  const [isSavingsModalOpen, setIsSavingsModalOpen] = useState(false);

  const [message, setMessage] = useState({ type: "", text: "" });

  const handleInitiatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });

    try {
      const isScriptLoaded = await loadRazorpayScript();

      const payload: any = {
        bookingId,
        amount: Number(amount),
        paymentType,
        useRewardPoints
      };
      if (couponCode.trim()) {
        payload.couponCode = couponCode.trim();
      }

      const response = await initiatePaymentMutation.mutateAsync(payload);
      const paymentData = response?.data || response;
      const { orderId, amount: payAmount, currency, key } = paymentData;

      if (!isScriptLoaded) {
        setMessage({ type: "error", text: "Unable to load secure Razorpay gateway. Please check your internet connection." });
        return;
      }

      const options = {
        key: key || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: Math.round(Number(payAmount || amount) * 100),
        currency: currency || "INR",
        name: "CarBlink Services",
        description: `${paymentType} Payment for Booking`,
        order_id: orderId,
        handler: async function (res: any) {
          try {
            await verifyPayment({
              paymentId: res.razorpay_payment_id,
              orderId: res.razorpay_order_id,
              signature: res.razorpay_signature
            });
            setMessage({ type: "success", text: "Payment successful!" });
            refetchPayments();
            queryClient.invalidateQueries({ queryKey: ["customer", "bookings"] });
            setBookingId("");
            setAmount("");
            setCouponCode("");
          } catch (err: any) {
            setMessage({ type: "error", text: "Payment verification failed." });
          }
        },
        prefill: {
          name: user?.fullName || "CarBlink Customer",
          email: user?.email || "",
          contact: user?.phone || ""
        },
        readonly: {
          contact: Boolean(user?.phone),
          email: Boolean(user?.email),
          name: Boolean(user?.fullName),
        },
        config: {
          display: {
            blocks: {
              upi: {
                name: "Pay via UPI QR / Apps",
                instruments: [
                  {
                    method: "upi",
                    flows: ["qr", "intent", "collect"]
                  }
                ]
              },
              other: {
                name: "Other Payment Modes",
                instruments: [
                  { method: "card" },
                  { method: "netbanking" },
                  { method: "wallet" }
                ]
              }
            },
            sequence: ["block.upi", "block.other"],
            preferences: {
              show_default_blocks: true,
            },
          },
        },
        theme: {
          color: "#0a2540"
        },
        modal: {
          ondismiss: function () {
            setMessage({
              type: "error",
              text: "⚠️ Payment popup closed. If payment failed or was declined, you can retry anytime."
            });
          }
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on("payment.failed", function (failRes: any) {
        setMessage({ type: "error", text: failRes.error?.description || "Payment was declined by bank. Please retry." });
      });
      rzp.open();
    } catch (err: any) {
      setMessage({ type: "error", text: err?.message || "Failed to initiate payment." });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case "SUCCESS": return "bg-success/10 text-success border-success/20";
      case "FAILED": return "bg-danger/10 text-danger border-danger/20";
      case "PENDING": return "bg-warning/10 text-warning border-warning/20";
      default: return "bg-neutral-muted/10 text-neutral-muted border-neutral-muted/20";
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type?.toUpperCase()) {
      case "ADVANCE": return "Advance";
      case "FINAL": return "Final Payment";
      case "FULL": return "Full Payment";
      default: return type;
    }
  };

  return (
    <div className="space-y-6 md:space-y-8 container px-4 sm:px-6 md:px-8 mx-auto pb-12">
      <h2 className="text-3xl font-bold text-gray-900 font-heading tracking-tight">Payments & Invoices</h2>

      {message.text && (
        <div className={`p-3 rounded-lg text-sm border ${message.type === "success"
            ? "bg-success/10 text-success border-success/20"
            : "bg-danger/10 text-danger border-danger/20"
          }`}>
          {message.text}
        </div>
      )}

      <Card className="bg-white/90 backdrop-blur-md shadow-subtle border-white/40">
        <CardHeader>
          <CardTitle className="flex items-center space-x-3 text-xl">
            <div className="bg-orange-50 p-2 rounded-xl text-primary-orange">
              <CreditCard className="w-5 h-5" />
            </div>
            <span>Initiate Payment</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleInitiatePayment} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Booking"
                value={bookingId}
                onChange={(e) => setBookingId(e.target.value)}
                options={bookings.map(b => {
                  const bId = String(b._id?._id || b._id || b.id || "");
                  const vName = typeof b.vehicleId === 'object' && b.vehicleId?.brand ? `${b.vehicleId.brand} ${b.vehicleId.model || ''}`.trim() : (b.vehicleDetails?.makeModel || "Your Vehicle");
                  const sName = typeof b.serviceId === 'object' && b.serviceId?.name ? b.serviceId.name : (b.serviceName || "Service");
                  return {
                    value: bId,
                    label: `${vName} — ${sName} (#${bId.slice(-6).toUpperCase()})`
                  };
                })}
                disabled={bookings.length === 0}
                required
              />
              <Input
                label="Amount (₹)"
                type="number"
                min="1"
                step="0.01"
                placeholder="1200"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
              <Select
                label="Payment Type"
                value={paymentType}
                onChange={(e) => setPaymentType(e.target.value)}
                options={[
                  { value: "ADVANCE", label: "Advance Payment" },
                  { value: "FINAL", label: "Final Payment" },
                  { value: "FULL", label: "Full Payment" },
                ]}
                required
              />
              <Input
                label="Promo / Coupon Code (Optional)"
                type="text"
                placeholder="Enter code"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
              />
            </div>

            <div className="flex items-center space-x-2 py-2">
              <input
                type="checkbox"
                id="useRewardPointsGlobal"
                className="w-4 h-4 text-primary-navy"
                checked={useRewardPoints}
                onChange={(e) => setUseRewardPoints(e.target.checked)}
              />
              <label htmlFor="useRewardPointsGlobal" className="text-sm font-medium text-gray-700 cursor-pointer">
                Use my Reward Points for discount
              </label>
            </div>

            <div className="flex justify-end">
              <Button type="submit" isLoading={initiatePaymentMutation.isPending} disabled={bookings.length === 0}>
                Pay Now
              </Button>
            </div>
            {bookings.length === 0 && (
              <p className="text-xs text-neutral-muted">You need at least one booking to make a payment.</p>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Total Savings & Discounts Banner */}
      <Card className="bg-gradient-to-r from-teal-900 via-slate-900 to-teal-950 text-white shadow-md rounded-3xl border border-teal-500/30 overflow-hidden">
        <CardContent className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-teal-500/20 text-teal-400 rounded-2xl border border-teal-500/30">
              <PiggyBank className="w-8 h-8" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-teal-300 bg-teal-400/20 px-2.5 py-0.5 rounded-full border border-teal-400/30 inline-block mb-1">
                TRANSPARENT SAVINGS GUARANTEE
              </span>
              <h3 className="text-xl font-bold font-heading text-white">Service-Linked Savings Breakdown</h3>
              <p className="text-xs text-slate-300 mt-0.5">
                View 10% OEM market discounts, applied promo codes & reward points for every service booking.
              </p>
            </div>
          </div>
          <Button
            onClick={() => setIsSavingsModalOpen(true)}
            className="bg-teal-500 hover:bg-teal-600 text-white font-bold text-xs px-6 py-3 rounded-2xl flex items-center gap-2 shadow-lg shrink-0 w-full sm:w-auto"
          >
            <PiggyBank className="w-4 h-4" />
            View Savings Breakdown
          </Button>
        </CardContent>
      </Card>

      <div>
        <h3 className="text-2xl font-bold text-gray-900 font-heading tracking-tight mb-5">Payment History</h3>
        {isLoadingPayments ? (
          <div className="bg-white/80 backdrop-blur-md p-12 rounded-3xl shadow-sm border border-white/40 text-center">
            <Loader2 className="w-8 h-8 text-primary-orange animate-spin mx-auto mb-3" />
            <p className="text-gray-500 font-medium">Loading payment history...</p>
          </div>
        ) : payments.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-md p-12 rounded-3xl shadow-sm border border-white/40 text-center flex flex-col items-center justify-center">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4 border border-gray-100">
              <CreditCard className="w-10 h-10 text-gray-300" />
            </div>
            <p className="text-gray-500 font-medium">No payment history yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {payments.map((payment) => (
              <Card key={payment._id} className="bg-white/90 backdrop-blur-md shadow-subtle border-white/40 hover:shadow-elevated hover:-translate-y-1 transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="font-heading font-bold text-gray-900 text-xl tracking-tight">
                          ₹{payment.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </h4>
                        <span className={`text-xs px-2 py-1 rounded-full border ${getStatusColor(payment.status)}`}>
                          {payment.status}
                        </span>
                      </div>
                      {(() => {
                        const bObj = typeof payment.bookingId === 'object' ? payment.bookingId : null;
                        const rawBId = bObj?._id || payment.bookingId;
                        const bIdStr = rawBId ? String(rawBId) : "N/A";
                        const serviceName = bObj?.serviceId?.name || bObj?.description || "Car Service";
                        const vehicleName = bObj?.vehicleId ? `${bObj.vehicleId.brand || ''} ${bObj.vehicleId.model || ''}`.trim() : null;

                        return (
                          <div className="space-y-1.5 my-2">
                            <div className="flex flex-wrap items-center gap-2 text-sm text-slate-800">
                              <span className="font-bold text-primary-navy">{getTypeLabel(payment.paymentType)}</span>
                              <span className="text-gray-400">•</span>
                              <span className="font-semibold text-gray-700">{serviceName}</span>
                              {vehicleName && (
                                <>
                                  <span className="text-gray-400">•</span>
                                  <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-semibold">{vehicleName}</span>
                                </>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-muted">
                              <span>Booking ID: <strong className="font-mono text-slate-700">#{bIdStr.slice(-8).toUpperCase()}</strong></span>
                              {payment.paymentId && (
                                <span>Txn ID: <strong className="font-mono text-slate-600">{payment.paymentId}</strong></span>
                              )}
                              <span>Date: {new Date(payment.createdAt || payment.paidAt || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            {rawBId && rawBId !== "N/A" && (
                              <div className="pt-1">
                                <Link href={`/customer/bookings/${bIdStr}`} className="text-xs font-bold text-secondary-blue hover:text-blue-800 hover:underline inline-flex items-center gap-1">
                                  <span>View Linked Service Booking</span>
                                  <span>→</span>
                                </Link>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                    <div>
                      {payment.status === "SUCCESS" ? (
                        <CheckCircle className="w-6 h-6 text-success" />
                      ) : payment.status === "FAILED" ? (
                        <XCircle className="w-6 h-6 text-danger" />
                      ) : (
                        <Loader2 className="w-5 h-5 text-warning animate-spin" />
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Customer Savings Breakdown Modal */}
      <CustomerSavingsModal
        isOpen={isSavingsModalOpen}
        onClose={() => setIsSavingsModalOpen(false)}
        bookings={bookings}
        payments={payments}
      />
    </div>
  );
}
