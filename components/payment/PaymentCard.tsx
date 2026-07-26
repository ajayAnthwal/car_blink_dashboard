"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, IndianRupee, HandCoins, AlertCircle, Loader2 } from "lucide-react";
import { initiatePayment, verifyPayment, markOfflinePayment } from "@/lib/services";
import { loadRazorpayScript } from "@/lib/razorpay";

interface PaymentCardProps {
  bookingId: string;
  amount: number;
  paymentType: "ADVANCE" | "FINAL" | "FULL";
  title: string;
  description: string;
  isPaid: boolean;
  isPendingVerification?: boolean;
  onSuccess?: () => void;
}

export function PaymentCard({ bookingId, amount, paymentType, title, description, isPaid, isPendingVerification = false, onSuccess }: PaymentCardProps) {
  const [isProcessingOnline, setIsProcessingOnline] = useState(false);
  const [isProcessingOffline, setIsProcessingOffline] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const handleOnlinePayment = async () => {
    setIsProcessingOnline(true);
    setMessage({ type: "", text: "" });

    try {
      const isScriptLoaded = await loadRazorpayScript();
      if (!isScriptLoaded) {
        throw new Error("Razorpay SDK failed to load. Are you online?");
      }

      const initRes = await initiatePayment({ bookingId, amount, paymentType });
      const { orderId, amount: payAmount, currency, key } = initRes.data || initRes;

      const options = {
        key,
        amount: payAmount,
        currency,
        name: "CarBlink Services",
        description: `${paymentType} Payment for Booking ${bookingId}`,
        order_id: orderId,
        handler: async function (response: any) {
          try {
            await verifyPayment({
              paymentId: response.razorpay_payment_id,
              orderId: response.razorpay_order_id,
              signature: response.razorpay_signature,
            });
            setMessage({ type: "success", text: "Payment successful!" });
            if (onSuccess) onSuccess();
          } catch (err: any) {
            setMessage({ type: "error", text: "Payment verification failed." });
          }
        },
        prefill: {
          name: "CarBlink Customer",
          email: "customer@carblink.com",
        },
        theme: {
          color: "#0a2540",
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on("payment.failed", function (response: any) {
        setMessage({ type: "error", text: response.error.description || "Payment failed" });
      });
      rzp.open();
    } catch (error: any) {
      setMessage({ type: "error", text: error.message || "Failed to initiate payment." });
    } finally {
      setIsProcessingOnline(false);
    }
  };

  const handleOfflinePayment = async () => {
    setIsProcessingOffline(true);
    setMessage({ type: "", text: "" });
    try {
      await markOfflinePayment({ bookingId, amount, paymentType });
      setMessage({ type: "success", text: "Offline payment marked successfully! Waiting for partner to verify." });
      if (onSuccess) onSuccess();
    } catch (error: any) {
      setMessage({ type: "error", text: error.message || "Failed to mark offline payment." });
    } finally {
      setIsProcessingOffline(false);
    }
  };

  if (isPaid) {
    return (
      <Card className="border-success/20 bg-success/5 shadow-sm mt-8">
        <CardContent className="pt-6 pb-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-success-dark flex items-center">
              <CheckCircle2 className="w-5 h-5 mr-2" />
              {paymentType} Payment Paid
            </p>
            <p className="text-xs text-neutral-muted mt-1">Thank you for your payment.</p>
          </div>
          <div className="text-xl font-bold text-success-dark">₹{amount}</div>
        </CardContent>
      </Card>
    );
  }

  if (isPendingVerification) {
    return (
      <Card className="border-warning/20 bg-warning/5 shadow-sm mt-8">
        <CardContent className="pt-6 pb-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-warning-dark flex items-center">
              <AlertCircle className="w-5 h-5 mr-2" />
              Verification Pending
            </p>
            <p className="text-xs text-neutral-muted mt-1">Waiting for partner to verify cash payment.</p>
          </div>
          <div className="text-xl font-bold text-warning-dark">₹{amount}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg border-primary-navy/10 rounded-3xl overflow-hidden bg-white mt-8">
      <CardHeader className="bg-primary-navy/5 border-b border-primary-navy/5 pb-4">
        <CardTitle className="flex items-center text-primary-navy text-xl font-bold">
          <IndianRupee className="w-6 h-6 mr-2 text-primary-orange" />
          {title} Required
        </CardTitle>
      </CardHeader>
      <CardContent className="p-8">
        <div className="mb-8">
          <p className="text-neutral-muted mb-3 font-medium">{description}</p>
          <div className="text-4xl font-extrabold text-primary-orange">₹{amount}</div>
        </div>

        {message.text && (
          <div className={`p-4 rounded-xl text-sm font-medium mb-6 flex items-start ${
            message.type === "success" ? "bg-success/10 text-success border border-success/20" : "bg-danger/10 text-danger border border-danger/20"
          }`}>
            <AlertCircle className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" /> 
            <span>{message.text}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Button 
            className="w-full bg-primary-navy hover:bg-primary-navy/90 text-white rounded-xl py-6 font-bold flex items-center justify-center shadow-md transition-transform hover:scale-[1.02] text-md"
            onClick={handleOnlinePayment}
            disabled={isProcessingOnline || isProcessingOffline}
          >
            {isProcessingOnline ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <IndianRupee className="w-5 h-5 mr-2" />}
            Pay Online Securely
          </Button>

          <Button 
            variant="outline"
            className="w-full border-neutral-muted/20 hover:bg-neutral-bg text-primary-navy rounded-xl py-6 font-bold flex items-center justify-center transition-transform hover:scale-[1.02] text-md"
            onClick={handleOfflinePayment}
            disabled={isProcessingOnline || isProcessingOffline}
          >
            {isProcessingOffline ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <HandCoins className="w-5 h-5 mr-2" />}
            Pay with Cash
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
