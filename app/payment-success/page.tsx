"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, ShieldCheck, ArrowRight, ExternalLink } from "lucide-react";

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get("bookingId");
  const paymentId = searchParams.get("razorpay_payment_id") || searchParams.get("paymentId");
  const amount = searchParams.get("amount");
  const paymentType = searchParams.get("type") || "ADVANCE";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-6 sm:p-8 text-center space-y-6 border border-slate-100">
        {/* Animated Success Badge */}
        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner ring-8 ring-emerald-50">
          <CheckCircle2 className="w-12 h-12" />
        </div>

        <div className="space-y-2">
          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full border border-emerald-200">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Verified Payment
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Payment Successful!
          </h1>
          <p className="text-sm text-slate-500">
            Thank you! Your payment for the CarBlink service has been successfully completed.
          </p>
        </div>

        {/* Payment Summary Box */}
        <div className="bg-slate-50 rounded-2xl p-4 text-left border border-slate-200/80 space-y-2.5">
          {amount && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500 font-medium">Amount Paid</span>
              <span className="text-slate-900 font-extrabold text-base">₹{Number(amount).toLocaleString('en-IN')}</span>
            </div>
          )}
          {paymentType && (
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 font-medium">Payment Type</span>
              <span className="text-slate-800 font-bold uppercase">{paymentType} PAYMENT</span>
            </div>
          )}
          {paymentId && (
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 font-medium">Reference ID</span>
              <span className="font-mono text-slate-700 text-[11px] font-bold">{paymentId}</span>
            </div>
          )}
          {bookingId && (
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 font-medium">Booking ID</span>
              <span className="font-mono text-slate-700 text-[11px] font-bold">#{bookingId.slice(-8).toUpperCase()}</span>
            </div>
          )}
        </div>

        <div className="text-xs text-slate-500 bg-emerald-50/60 p-3 rounded-xl border border-emerald-200/60">
          <p className="text-emerald-900 font-medium">
            ✓ The customer's booking status has been updated in the dashboard and the workshop assignment is confirmed.
          </p>
        </div>

        <div className="space-y-2 pt-2">
          {bookingId ? (
            <Link
              href={`/customer/bookings/${bookingId}`}
              className="w-full bg-primary-orange hover:bg-orange-600 text-white font-bold py-3.5 px-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-sm"
            >
              <span>View Booking in Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <Link
              href="/login"
              className="w-full bg-primary-orange hover:bg-orange-600 text-white font-bold py-3.5 px-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-sm"
            >
              <span>Go to Login</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}

          <a
            href="https://carblink.in"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-1.5 text-xs"
          >
            <span>Visit CarBlink Website</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
          </a>
        </div>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        Loading confirmation...
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}
