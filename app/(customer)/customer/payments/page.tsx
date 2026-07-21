"use client";

import React, { useState, useEffect } from "react";
import { getBookings, initiatePayment, getPaymentHistory } from "@/lib/services";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { CreditCard, Loader2, CheckCircle, XCircle } from "lucide-react";

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
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  
  const [bookingId, setBookingId] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentType, setPaymentType] = useState("ADVANCE");
  
  const [isLoadingBookings, setIsLoadingBookings] = useState(true);
  const [isLoadingPayments, setIsLoadingPayments] = useState(true);
  const [isInitiating, setIsInitiating] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [bookingsRes, paymentsRes] = await Promise.all([
        getBookings(),
        getPaymentHistory(),
      ]);
      setBookings(bookingsRes?.docs || bookingsRes || []);
      setPayments(paymentsRes?.docs || paymentsRes || []);
    } catch (err) {
      console.error("Failed to load initial data", err);
    } finally {
      setIsLoadingBookings(false);
      setIsLoadingPayments(false);
    }
  };

  const handleInitiatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsInitiating(true);
    setMessage({ type: "", text: "" });

    try {
      const response = await initiatePayment({
        bookingId,
        amount: parseFloat(amount),
        paymentType,
      });
      setMessage({ type: "success", text: "Payment initiated successfully! Redirecting to payment gateway..." });
      
      // In a real integration, you would open Razorpay here with response.data
      // For now, we just show the success message
      console.log("Payment initiation response:", response.data);
      
      setBookingId("");
      setAmount("");
      setPaymentType("ADVANCE");
      fetchInitialData();
    } catch (err: any) {
      setMessage({ type: "error", text: err?.message || "Failed to initiate payment." });
    } finally {
      setIsInitiating(false);
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
      case "FULL": return "Full Payment";
      case "PARTIAL": return "Partial";
      default: return type;
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-primary-navy">Payments & Invoices</h2>

      {message.text && (
        <div className={`p-3 rounded-lg text-sm border ${
          message.type === "success" 
            ? "bg-success/10 text-success border-success/20" 
            : "bg-danger/10 text-danger border-danger/20"
        }`}>
          {message.text}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CreditCard className="w-5 h-5 text-primary-orange" />
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
                options={bookings.map(b => ({ 
                  value: b._id, 
                  label: `${b.vehicleId?.brand} ${b.vehicleId?.model} - ${b.serviceId?.name}` 
                }))}
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
                  { value: "ADVANCE", label: "Advance" },
                  { value: "FULL", label: "Full Payment" },
                  { value: "PARTIAL", label: "Partial" },
                ]}
                required
              />
            </div>
            <div className="flex justify-end">
              <Button type="submit" isLoading={isInitiating} disabled={bookings.length === 0}>
                Pay Now
              </Button>
            </div>
            {bookings.length === 0 && (
              <p className="text-xs text-neutral-muted">You need at least one booking to make a payment.</p>
            )}
          </form>
        </CardContent>
      </Card>

      <div>
        <h3 className="text-xl font-bold text-primary-navy mb-4">Payment History</h3>
        {isLoadingPayments ? (
          <div className="bg-neutral-white p-10 rounded-2xl shadow-sm border border-neutral-muted/20 text-center">
            <Loader2 className="w-8 h-8 text-primary-orange animate-spin mx-auto mb-3" />
            <p className="text-neutral-muted">Loading payment history...</p>
          </div>
        ) : payments.length === 0 ? (
          <div className="bg-neutral-white p-10 rounded-2xl shadow-sm border border-neutral-muted/20 text-center">
            <CreditCard className="w-12 h-12 text-neutral-muted/30 mb-3 mx-auto" />
            <p className="text-neutral-muted">No payment history yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {payments.map((payment) => (
              <Card key={payment._id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="font-semibold text-primary-navy text-lg">₹{payment.amount}</h4>
                        <span className={`text-xs px-2 py-1 rounded-full border ${getStatusColor(payment.status)}`}>
                          {payment.status}
                        </span>
                      </div>
                      <p className="text-sm text-neutral-muted">
                        {getTypeLabel(payment.paymentType)} - Booking: {payment.bookingId}
                      </p>
                      {payment.paymentId && (
                        <p className="text-xs text-neutral-muted mt-1">Payment ID: {payment.paymentId}</p>
                      )}
                      <p className="text-xs text-neutral-muted mt-1">
                        {new Date(payment.createdAt).toLocaleString()}
                      </p>
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
    </div>
  );
}
