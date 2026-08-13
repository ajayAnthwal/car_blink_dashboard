"use client";

import React, { useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useWalletStatement, useCreateDuesOrderMutation, useVerifyDuesPaymentMutation, useRequestWithdrawalMutation } from "../../hooks/usePartnerQueries";
import { Loader2, IndianRupee, ArrowDownRight, ArrowUpRight, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

export function WalletDashboard() {
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const { data, isLoading, error } = useWalletStatement();
  
  const duesOrderMutation = useCreateDuesOrderMutation();
  const verifyDuesMutation = useVerifyDuesPaymentMutation();
  const withdrawMutation = useRequestWithdrawalMutation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary-orange" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center text-red-500 p-4">
        Failed to load wallet statement.
      </div>
    );
  }

  const { balance, transactions } = data;
  const isNegative = balance < 0;

  const handlePayDues = async () => {
    try {
      const amount = Math.abs(balance);
      const res = await duesOrderMutation.mutateAsync(amount);
      
      const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
      if (!keyId) {
        // Fallback to mock behavior if no keys configured
        alert("Simulated Razorpay (No Keys Found) for Rs " + amount);
        setTimeout(async () => {
          await verifyDuesMutation.mutateAsync({
            orderId: res.orderId,
            paymentId: "pay_" + Math.random().toString(36).substring(7),
            signature: "dummy_sig",
            amount: amount
          });
          alert("Dues cleared successfully (Mocked)!");
        }, 1500);
        return;
      }

      // Real Razorpay integration
      const options = {
        key: keyId,
        amount: Math.round(amount * 100),
        currency: "INR",
        name: "CarBlink",
        description: "Clear Partner Dues",
        order_id: res.orderId,
        handler: async function (response: any) {
          try {
            await verifyDuesMutation.mutateAsync({
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
              amount: amount
            });
            alert("Payment successful and verified!");
          } catch (err: any) {
            alert("Verification failed: " + (err?.response?.data?.message || err.message));
          }
        },
        prefill: {
          name: "CarBlink Partner",
          email: "partner@carblink.com",
          contact: "9999999999"
        },
        theme: {
          color: "#E25E3E" // CarBlink orange
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();

    } catch (err: any) {
      alert("Error: " + (err?.response?.data?.message || err.message));
    }
  };

  const handleWithdraw = async () => {
    try {
      const amount = prompt("Enter amount to withdraw:");
      if (!amount || isNaN(Number(amount))) return;
      
      await withdrawMutation.mutateAsync(Number(amount));
      alert("Withdrawal requested successfully!");
    } catch (err: any) {
      alert("Error: " + (err?.response?.data?.message || err.message));
    }
  };

  return (
    <div className="space-y-6">
      {/* Wallet Balance Card */}
      <Card className="bg-gradient-to-r from-primary-navy to-blue-900 text-white shadow-elevated">
        <CardContent className="p-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 font-medium mb-1">Current Balance</p>
              <h2 className="text-4xl font-heading font-bold flex items-center">
                <IndianRupee className="w-8 h-8 mr-1 opacity-80" />
                {Math.abs(balance).toLocaleString()} 
                {isNegative && <span className="text-lg ml-2 text-red-300 font-medium">(Due)</span>}
              </h2>
              {isNegative && (
                <p className="text-sm text-red-200 mt-2">
                  Your balance is negative because of cash bookings. Please clear your dues.
                </p>
              )}
            </div>
            <div className="flex flex-col items-end space-y-3">
              <div className="p-4 bg-white/10 rounded-full backdrop-blur-md">
                <Wallet className="w-10 h-10 text-white" />
              </div>
              {isNegative ? (
                <Button 
                  onClick={handlePayDues} 
                  disabled={duesOrderMutation.isPending || verifyDuesMutation.isPending}
                  className="bg-red-500 hover:bg-red-600 text-white border-0"
                >
                  {(duesOrderMutation.isPending || verifyDuesMutation.isPending) ? "Processing..." : "Pay Dues"}
                </Button>
              ) : balance > 0 ? (
                <Button 
                  onClick={handleWithdraw}
                  disabled={withdrawMutation.isPending}
                  className="bg-green-500 hover:bg-green-600 text-white border-0"
                >
                  {withdrawMutation.isPending ? "Processing..." : "Withdraw Funds"}
                </Button>
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ledger History */}
      <Card className="shadow-subtle border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="font-heading text-lg">Transaction History (Passbook)</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              No transactions found in your wallet.
            </div>
          ) : (
            <div className="space-y-4">
              {transactions.map((txn: any) => (
                <div key={txn._id} className="flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center space-x-4">
                    <div className={`p-3 rounded-full ${txn.type === 'CREDIT' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                      {txn.type === 'CREDIT' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{txn.description}</p>
                      <p className="text-xs text-gray-500">{format(new Date(txn.createdAt), "dd MMM yyyy, hh:mm a")}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${txn.type === 'CREDIT' ? 'text-green-600' : 'text-red-600'}`}>
                      {txn.type === 'CREDIT' ? '+' : '-'} ₹{txn.amount}
                    </p>
                    <p className="text-xs text-gray-500 font-medium mt-1">Balance: ₹{txn.balanceAfter}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
