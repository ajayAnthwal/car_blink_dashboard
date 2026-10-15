// @ts-nocheck
"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useWalletStatement, usePartnerProfile, useCreateDuesOrderMutation, useVerifyDuesPaymentMutation, useRequestWithdrawalMutation } from "../../hooks/usePartnerQueries";
import { Loader2, IndianRupee, ArrowDownRight, ArrowUpRight, Wallet, ArrowUpCircle, CheckCircle2, AlertCircle, Building2, ShieldCheck, X, Clock, Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { useSocket } from "@/lib/SocketContext";
import { useQueryClient } from "@tanstack/react-query";

export function WalletDashboard() {
  const { socket } = useSocket();
  const queryClient = useQueryClient();

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  // Real-time synchronization for wallet updates & payout status changes
  useEffect(() => {
    if (!socket) return;
    const handleWalletRefresh = () => {
      queryClient.invalidateQueries({ queryKey: ["partner", "wallet"] });
      queryClient.invalidateQueries({ queryKey: ["partner", "profile"] });
    };
    socket.on("withdrawal_status_updated", handleWalletRefresh);
    socket.on("wallet_updated", handleWalletRefresh);
    socket.on("new_withdrawal_request", handleWalletRefresh);
    return () => {
      socket.off("withdrawal_status_updated", handleWalletRefresh);
      socket.off("wallet_updated", handleWalletRefresh);
      socket.off("new_withdrawal_request", handleWalletRefresh);
    };
  }, [socket, queryClient]);

  const { data, isLoading, error, refetch } = useWalletStatement();
  const { data: profile } = usePartnerProfile();
  
  const duesOrderMutation = useCreateDuesOrderMutation();
  const verifyDuesMutation = useVerifyDuesPaymentMutation();
  const withdrawMutation = useRequestWithdrawalMutation();

  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState<string>("");
  const [message, setMessage] = useState({ type: "", text: "" });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] space-y-3">
        <Loader2 className="w-9 h-9 animate-spin text-primary-orange" />
        <p className="text-xs text-gray-500 font-bold">Syncing wallet ledger & statement...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center text-red-500 p-8 bg-white rounded-2xl border border-red-100 shadow-sm">
        <AlertCircle className="w-8 h-8 mx-auto mb-2 text-red-500" />
        <p className="font-bold">Failed to load wallet statement.</p>
        <Button onClick={() => refetch()} variant="outline" size="sm" className="mt-3">
          Retry
        </Button>
      </div>
    );
  }

  const walletData = (data && data.balance !== undefined) ? data : ((data as any)?.data || data || {});
  const { 
    balance = 0, 
    transactions = [], 
    bankDetails: rawBankDetails = null, 
    bankVerificationStatus: rawBankVerificationStatus = 'NOT_CONFIGURED', 
    withdrawals = [] 
  } = walletData;

  const withdrawalsList = (Array.isArray(withdrawals) && withdrawals.length > 0)
    ? withdrawals
    : (Array.isArray(walletData?.withdrawals) && walletData.withdrawals.length > 0
        ? walletData.withdrawals
        : (Array.isArray(data) ? data : ((data as any)?.withdrawals || [])));

  const bankDetails = (rawBankDetails && (rawBankDetails.accountNumber || rawBankDetails.acc)) 
    ? rawBankDetails 
    : (profile?.bankDetails?.accountNumber ? profile.bankDetails : (profile?.accountNumber ? {
        accountNumber: profile.accountNumber,
        ifscCode: profile.ifsc,
        accountHolderName: profile.accountHolderName || profile.workshopName
      } : null));

  const bankVerificationStatus = (rawBankVerificationStatus && rawBankVerificationStatus !== 'NOT_CONFIGURED')
    ? rawBankVerificationStatus
    : (profile?.bankVerificationStatus || 'NOT_CONFIGURED');

  const isNegative = balance < 0;

  const handlePayDues = async () => {
    setMessage({ type: "", text: "" });
    try {
      const amount = Math.abs(balance);
      const res = await duesOrderMutation.mutateAsync(amount);
      
      const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
      if (!keyId) {
        // Fallback simulation mode
        setMessage({ type: "success", text: "Simulating Razorpay payment for ₹" + amount });
        setTimeout(async () => {
          await verifyDuesMutation.mutateAsync({
            orderId: res.orderId || "order_sim_" + Date.now(),
            paymentId: "pay_" + Math.random().toString(36).substring(7),
            signature: "dummy_sig",
            amount: amount
          });
          setMessage({ type: "success", text: "Dues cleared successfully!" });
          refetch();
        }, 1200);
        return;
      }

      // Real Razorpay Checkout Modal
      const options = {
        key: keyId,
        amount: Math.round(amount * 100),
        currency: "INR",
        name: "CarBlink Operations",
        description: "Clear Partner Wallet Dues",
        order_id: res.orderId,
        handler: async function (response: any) {
          try {
            await verifyDuesMutation.mutateAsync({
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
              amount: amount
            });
            setMessage({ type: "success", text: "Payment verified successfully!" });
            refetch();
          } catch (err: any) {
            setMessage({ type: "error", text: "Verification failed: " + (err?.response?.data?.message || err.message) });
          }
        },
        prefill: {
          name: "CarBlink Service Partner",
          email: "partner@carblink.com"
        },
        theme: {
          color: "#E25E3E"
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err: any) {
      setMessage({ type: "error", text: err?.response?.data?.message || err.message || "Failed to process dues payment" });
    }
  };

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });

    const num = Number(withdrawAmount);
    if (!num || isNaN(num) || num <= 0) {
      setMessage({ type: "error", text: "Please enter a valid withdrawal amount." });
      return;
    }

    if (num < 100) {
      setMessage({ type: "error", text: "Minimum withdrawal amount is ₹100." });
      return;
    }

    if (num > balance) {
      setMessage({ type: "error", text: `Cannot withdraw ₹${num}. Your available wallet balance is ₹${balance.toLocaleString()}.` });
      return;
    }

    try {
      await withdrawMutation.mutateAsync(num);
      setMessage({ type: "success", text: `Withdrawal request for ₹${num.toLocaleString()} submitted successfully! Operations will process payout to your registered bank account.` });
      setShowWithdrawModal(false);
      setWithdrawAmount("");
      refetch();
    } catch (err: any) {
      setMessage({ type: "error", text: err?.response?.data?.message || err?.message || "Failed to request withdrawal." });
    }
  };

  return (
    <div className="space-y-6 w-full min-w-0">
      {/* Global Message Banner */}
      {message.text && (
        <div className={`p-4 rounded-xl text-sm font-bold border flex items-center justify-between shadow-sm animate-in fade-in ${
          message.type === "success"
            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
            : "bg-red-50 text-red-800 border-red-200"
        }`}>
          <div className="flex items-center gap-2">
            {message.type === "success" ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <AlertCircle className="w-5 h-5 text-red-600" />}
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage({ type: "", text: "" })} className="text-xs underline font-bold opacity-70 hover:opacity-100">
            Dismiss
          </button>
        </div>
      )}

      {/* Main Wallet Balance Card */}
      <Card className="bg-gradient-to-r from-primary-navy via-slate-900 to-primary-navy text-white shadow-xl rounded-2xl border-0 overflow-hidden relative">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-primary-orange/10 rounded-full blur-2xl pointer-events-none"></div>
        <CardContent className="p-5 sm:p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <span className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                <Wallet className="w-4 h-4 text-primary-orange" /> Partner Wallet Balance
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight font-heading flex flex-wrap items-center text-white">
                <IndianRupee className="w-7 h-7 sm:w-9 sm:h-9 mr-1 text-primary-orange" />
                {Math.abs(balance).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                {isNegative && <span className="text-xs sm:text-base ml-2 sm:ml-3 bg-red-500/20 text-red-300 border border-red-500/30 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full font-bold uppercase">(Negative Due)</span>}
              </h2>
              {isNegative ? (
                <p className="text-xs text-red-300 font-medium">
                  Your wallet is negative due to cash collected on bookings. Please clear your dues to keep receiving new job leads.
                </p>
              ) : (
                <p className="text-xs text-gray-300 font-medium flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" /> Available for instant payout to bank account / UPI
                </p>
              )}
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              {isNegative ? (
                <Button 
                  onClick={handlePayDues} 
                  disabled={duesOrderMutation.isPending || verifyDuesMutation.isPending}
                  className="w-full md:w-auto bg-red-500 hover:bg-red-600 text-white font-bold px-6 py-3 rounded-xl shadow-lg border-0 text-xs uppercase tracking-wider"
                >
                  {(duesOrderMutation.isPending || verifyDuesMutation.isPending) ? (
                    <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Processing...</span>
                  ) : "Pay Outstanding Dues"}
                </Button>
              ) : (
                <Button 
                  onClick={() => setShowWithdrawModal(true)}
                  className="w-full md:w-auto bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold px-6 py-3.5 rounded-xl shadow-lg border-0 text-xs uppercase tracking-wider flex items-center justify-center gap-2"
                >
                  <ArrowUpCircle className="w-4 h-4" /> Withdraw Funds
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bank Account Verification & Withdrawal History Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Linked Bank Account Card */}
        <Card className="shadow-sm border border-gray-100 bg-white rounded-2xl overflow-hidden">
          <CardHeader className="bg-gray-50/50 border-b border-gray-100 p-4">
            <CardTitle className="font-bold text-gray-900 text-sm flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-primary-navy" /> Registered Bank Account
              </span>
              {bankVerificationStatus === 'VERIFIED' ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <ShieldCheck className="w-3.5 h-3.5" /> Verified
                </span>
              ) : bankVerificationStatus === 'PENDING' ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                  <Clock className="w-3.5 h-3.5" /> Verification Pending
                </span>
              ) : bankVerificationStatus === 'FAILED' ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                  <Ban className="w-3.5 h-3.5" /> Verification Failed
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200">
                  Active
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-2">
            {bankDetails && (bankDetails.accountNumber || bankDetails.acc) ? (
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500 font-medium">Account Holder:</span>
                  <span className="font-bold text-gray-900">{bankDetails.accountHolderName || bankDetails.name || "Partner Account"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 font-medium">Account Number:</span>
                  <span className="font-mono font-bold text-gray-900">
                    •••• {String(bankDetails.accountNumber || bankDetails.acc).slice(-4)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 font-medium">IFSC Code:</span>
                  <span className="font-mono font-bold text-gray-700">{bankDetails.ifscCode || bankDetails.ifsc || "N/A"}</span>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500 space-y-1">
                <Building2 className="w-7 h-7 mx-auto text-gray-300" />
                <p className="text-xs font-bold text-gray-700">No bank account linked</p>
                <p className="text-[11px] text-gray-400">Please provide bank account details during KYC to enable payouts.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Withdrawal Status Card */}
        <Card className="shadow-sm border border-gray-100 bg-white rounded-2xl overflow-hidden">
          <CardHeader className="bg-gray-50/50 border-b border-gray-100 p-4">
            <CardTitle className="font-bold text-gray-900 text-sm flex items-center justify-between">
              <span className="flex items-center gap-2">
                <ArrowUpCircle className="w-4 h-4 text-emerald-600" /> Recent Payout Requests
              </span>
              <span className="text-[11px] text-gray-400 font-medium">{withdrawalsList.length} request(s)</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            {withdrawalsList.length === 0 ? (
              <div className="text-center py-4 text-gray-500 space-y-1">
                <Wallet className="w-7 h-7 mx-auto text-gray-300" />
                <p className="text-xs font-bold text-gray-700">No withdrawal requests yet</p>
                <p className="text-[11px] text-gray-400">Your requested withdrawals will be listed here with status.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                {withdrawalsList.map((w: any) => (
                  <div key={w._id} className="flex items-center justify-between p-2.5 rounded-lg border border-gray-50 bg-gray-50/40 text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-gray-900">₹{Number(w.amount).toLocaleString("en-IN")}</span>
                        {w.status === 'COMPLETED' ? (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">Paid</span>
                        ) : w.status === 'FAILED' ? (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-rose-100 text-rose-800">Rejected & Refunded</span>
                        ) : (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800">{w.status}</span>
                        )}
                      </div>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {w.createdAt ? format(new Date(w.createdAt), "dd MMM yyyy, hh:mm a") : "Recent"}
                        {w.referenceId && ` • Ref: ${w.referenceId}`}
                      </p>
                      {w.failureReason && (
                        <p className="text-[10px] text-rose-600 font-medium mt-0.5">Reason: {w.failureReason}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Ledger History Passbook */}
      <Card className="shadow-sm border border-gray-100 bg-white rounded-2xl overflow-hidden">
        <CardHeader className="bg-gray-50/50 border-b border-gray-100 p-5">
          <CardTitle className="font-bold text-gray-900 text-base flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary-navy" /> Wallet Passbook & Ledger History
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5">
          {transactions.length === 0 ? (
            <div className="text-center text-gray-500 py-12 space-y-2">
              <Wallet className="w-10 h-10 mx-auto text-gray-300" />
              <p className="font-bold text-sm text-gray-700">No ledger transactions yet</p>
              <p className="text-xs text-gray-400">Transactions will appear here as soon as jobs are completed and settled.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((txn: any) => (
                <div key={txn._id} className="flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-white hover:bg-gray-50/50 transition-colors shadow-2xs">
                  <div className="flex items-center space-x-3.5">
                    <div className={`p-2.5 rounded-xl flex items-center justify-center ${
                      txn.type === 'CREDIT' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'
                    }`}>
                      {txn.type === 'CREDIT' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-xs sm:text-sm">{txn.description}</p>
                      <p className="text-[11px] text-gray-400 font-medium mt-0.5">
                        {txn.createdAt ? format(new Date(txn.createdAt), "dd MMM yyyy, hh:mm a") : "Recent"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-extrabold text-sm ${txn.type === 'CREDIT' ? 'text-emerald-600' : 'text-red-600'}`}>
                      {txn.type === 'CREDIT' ? '+' : '-'} ₹{Number(txn.amount || 0).toLocaleString("en-IN")}
                    </p>
                    <p className="text-[11px] text-gray-400 font-medium mt-0.5">
                      Balance: ₹{Number(txn.balanceAfter || 0).toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modern Withdrawal Request Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-gray-100 relative space-y-5">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
                <ArrowUpCircle className="w-5 h-5 text-emerald-600" /> Withdraw Funds to Bank
              </h3>
              <button
                onClick={() => setShowWithdrawModal(false)}
                className="text-gray-400 hover:text-gray-700 p-1 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Bank Verification Status Warning */}
            {(!bankDetails || (!bankDetails.accountNumber && !bankDetails.acc)) ? (
              <div className="p-3.5 rounded-xl text-xs bg-red-50 text-red-900 border border-red-200 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">No Bank Account Linked</p>
                  <p className="text-[11px] text-red-700 mt-0.5">
                    Please complete your bank account details in KYC & Profile before requesting payouts.
                  </p>
                </div>
              </div>
            ) : (bankVerificationStatus === 'PENDING' || bankVerificationStatus === 'FAILED') ? (
              <div className="p-3.5 rounded-xl text-xs bg-amber-50 text-amber-900 border border-amber-200 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Bank Verification {bankVerificationStatus === 'PENDING' ? 'in Progress' : 'Failed'}</p>
                  <p className="text-[11px] text-amber-800 mt-0.5">
                    CarBlink requires your bank account to be verified before payouts can be initiated. Please verify your bank details in KYC.
                  </p>
                </div>
              </div>
            ) : null}

            {/* Target Account Info */}
            {bankDetails && (bankDetails.accountNumber || bankDetails.acc) && (
              <div className="bg-gray-50 border border-gray-200 p-3 rounded-xl text-xs space-y-1">
                <div className="flex justify-between text-gray-500 font-medium">
                  <span>Payout to Account:</span>
                  <span className="font-mono font-bold text-gray-900">•••• {String(bankDetails.accountNumber || bankDetails.acc).slice(-4)}</span>
                </div>
                <div className="flex justify-between text-gray-500 font-medium">
                  <span>IFSC & Bank:</span>
                  <span className="font-mono font-bold text-gray-700">{bankDetails.ifscCode || bankDetails.ifsc}</span>
                </div>
              </div>
            )}

            <div className="bg-emerald-50 border border-emerald-100 p-3.5 rounded-xl text-xs font-medium text-emerald-900 flex justify-between items-center">
              <span>Available Wallet Balance:</span>
              <strong className="text-sm text-emerald-700 font-black">₹{balance.toLocaleString("en-IN")}</strong>
            </div>

            <form onSubmit={handleWithdrawSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Enter Amount to Withdraw (₹)</label>
                <Input
                  type="number"
                  min="100"
                  max={balance}
                  placeholder="e.g. 1000"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="text-sm rounded-xl py-2.5"
                  autoFocus
                  disabled={bankVerificationStatus === 'PENDING' || bankVerificationStatus === 'FAILED'}
                />
                <p className="text-[11px] text-gray-400 mt-1">Minimum withdrawal amount is ₹100.</p>
              </div>

              {/* Quick Amount Chips */}
              <div className="flex gap-2">
                {[500, 1000, 2500, balance].map((amt, idx) => (
                  <button
                    type="button"
                    key={idx}
                    disabled={bankVerificationStatus === 'PENDING' || bankVerificationStatus === 'FAILED'}
                    onClick={() => setWithdrawAmount(String(amt))}
                    className="flex-1 py-1.5 px-2 bg-gray-100 hover:bg-emerald-50 hover:text-emerald-700 border border-gray-200 hover:border-emerald-200 rounded-lg text-xs font-bold transition-all text-center disabled:opacity-50"
                  >
                    {amt === balance ? "All" : `₹${amt}`}
                  </button>
                ))}
              </div>

              <div className="pt-2 flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowWithdrawModal(false)}
                  className="flex-1 text-xs font-bold rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  isLoading={withdrawMutation.isPending}
                  disabled={
                    !withdrawAmount || 
                    Number(withdrawAmount) <= 0 || 
                    !bankDetails || 
                    (!bankDetails.accountNumber && !bankDetails.acc) ||
                    bankVerificationStatus === 'PENDING' || 
                    bankVerificationStatus === 'FAILED'
                  }
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl py-2.5 shadow-sm"
                >
                  Confirm Withdrawal
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
