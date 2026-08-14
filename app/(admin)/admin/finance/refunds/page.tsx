// @ts-nocheck
"use client";

import React, { useState } from "react";
import { 
  useRefunds, 
  useEligiblePaymentsForRefund, 
  useInitiateRefundMutation, 
  useApproveRefundMutation, 
} from "@/features/admin/hooks/useAdminRefundQueries";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Undo2, Check, Loader2, ArrowRightCircle, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function AdminRefundsPage() {
  const { data, isLoading } = useRefunds({ page: 1, limit: 50 });
  const refunds = data?.refunds || [];
  
  const [actionId, setActionId] = useState<string | null>(null);
  const [message, setMessage] = useState({ type: "", text: "" });

  // Initiate Refund state
  const [showInitiateModal, setShowInitiateModal] = useState(false);
  const { data: eligiblePaymentsData, refetch: refetchEligible } = useEligiblePaymentsForRefund();
  const eligiblePayments = eligiblePaymentsData || [];
  
  const [selectedPayment, setSelectedPayment] = useState<unknown>(null);
  const [refundAmount, setRefundAmount] = useState<number | "">("");
  const [initiateReason, setInitiateReason] = useState("");

  const initiateMutation = useInitiateRefundMutation();
  const approveMutation = useApproveRefundMutation();

  const openInitiateModal = () => {
    setShowInitiateModal(true);
    refetchEligible();
  };

  const handleInitiateRefundSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPayment || !refundAmount || !initiateReason) return;

    try {
      await initiateMutation.mutateAsync({
        paymentId: selectedPayment._id,
        amount: Number(refundAmount),
        reason: initiateReason
      });
      setMessage({ type: "success", text: "Refund initiated successfully." });
      setShowInitiateModal(false);
      setSelectedPayment(null);
      setRefundAmount("");
      setInitiateReason("");
    } catch (err: unknown) {
      alert(err?.message || "Failed to initiate refund.");
    }
  };

  const handleApprove = async (id: string) => {
    setActionId(id);
    setMessage({ type: "", text: "" });
    try {
      await approveMutation.mutateAsync(id);
      setMessage({ type: "success", text: "Refund approved and sent to Accounts." });
    } catch (err: unknown) {
      setMessage({ type: "error", text: err?.message || "Failed to approve refund." });
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-primary-navy">Refund Requests (Operations)</h2>
          <p className="text-sm text-neutral-muted mt-1">
            Initiate refunds for customers and approve them for the Accounts team to process.
          </p>
        </div>
        <Button onClick={openInitiateModal} className="bg-primary-orange hover:bg-orange-600 text-white font-bold">
          <Plus className="w-4 h-4 mr-2" />
          Initiate New Refund
        </Button>
      </div>

      {message.text && (
        <div className={`p-3 rounded-lg text-sm border ${message.type === "success"
          ? "bg-success/10 text-success border-success/20"
          : "bg-danger/10 text-danger border-danger/20"
          }`}>
          {message.text}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Undo2 className="w-5 h-5 text-primary-orange" />
            <span>All Refund Requests</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-8 h-8 text-primary-orange animate-spin" />
            </div>
          ) : refunds.length === 0 ? (
            <div className="text-center py-10 text-neutral-muted">
              <p>No refund requests found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-neutral-muted uppercase bg-neutral-bg">
                  <tr>
                    <th className="px-4 py-3 rounded-l-lg">ID / Booking</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Reason</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 rounded-r-lg text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-muted/10">
                  {refunds.map((refund) => (
                    <tr key={refund._id} className="hover:bg-neutral-bg/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-primary-navy">
                        #{String(refund?._id || "").slice(-6).toUpperCase()}
                        <div className="text-xs text-neutral-muted mt-1">
                          Booking: {refund?.bookingId && typeof refund.bookingId === "object" 
                            ? String(refund.bookingId._id || "").slice(-6).toUpperCase() 
                            : String(refund?.bookingId || "").slice(-6).toUpperCase()}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-neutral-dark">
                        {refund.customerId?.fullName || 'Unknown'}
                      </td>
                      <td className="px-4 py-3 font-bold text-primary-navy">₹{refund?.amount || 0}</td>
                      <td className="px-4 py-3 text-neutral-dark max-w-[200px] truncate" title={String(refund?.reason || "")}>
                        {String(refund?.reason || "")}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs rounded-full ${refund?.status === 'PROCESSED' ? 'bg-green-100 text-green-700' :
                          refund?.status === 'APPROVED' ? 'bg-blue-100 text-blue-700' :
                            refund?.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                              'bg-warning/20 text-warning'
                          }`}>
                          {String(refund?.status || 'PENDING')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right space-x-2">
                        {refund.status === 'REQUESTED' ? (
                          <Button
                            size="sm"
                            className="bg-primary-navy hover:bg-primary-navy-light"
                            onClick={() => handleApprove(refund._id)}
                            isLoading={actionId === refund._id}
                          >
                            <Check className="w-4 h-4 mr-1" /> Approve
                          </Button>
                        ) : refund.status === 'APPROVED' ? (
                          <span className="text-xs text-success bg-success/10 px-2 py-1 rounded-full border border-success/20">Sent to Accounts</span>
                        ) : (
                          <span className="text-neutral-muted text-xs px-4">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Initiate Refund Modal */}
      {showInitiateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg shadow-xl">
            <CardHeader>
              <CardTitle>Initiate Refund Request</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleInitiateRefundSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Select Payment</label>
                  <select
                    className="w-full p-2 border border-gray-200 rounded-lg text-sm"
                    required
                    onChange={(e) => {
                      const pay = eligiblePayments.find(p => p._id === e.target.value);
                      setSelectedPayment(pay);
                      if (pay) setRefundAmount(pay.amount);
                    }}
                    value={selectedPayment?._id || ""}
                  >
                    <option value="" disabled>Select a successful payment...</option>
                    {eligiblePayments.map((p) => (
                      <option key={String(p?._id || Math.random())} value={String(p?._id || "")}>
                        {String(p?.bookingId?.bookingStatus || 'Payment')} - ₹{Number(p?.amount || 0)} ({String(p?.customerId?.fullName || 'Unknown')}) - ID: {String(p?._id || "").slice(-6)}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedPayment && (
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                      Refund Amount (Max: ₹{selectedPayment.amount})
                    </label>
                    <Input
                      type="number"
                      max={selectedPayment.amount}
                      min={1}
                      value={refundAmount}
                      onChange={(e) => setRefundAmount(Number(e.target.value))}
                      required
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Reason (Visible to Accounts)</label>
                  <textarea
                    className="w-full p-2 border border-gray-200 rounded-lg text-sm resize-none"
                    rows={3}
                    placeholder="E.g. Customer cancelled within timeframe, deducting 10% penalty."
                    value={initiateReason}
                    onChange={(e) => setInitiateReason(e.target.value)}
                    required
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-2">
                  <Button type="button" variant="outline" onClick={() => setShowInitiateModal(false)}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-primary-navy hover:bg-blue-900 text-white"
                    isLoading={initiateMutation.isPending}
                    disabled={!selectedPayment || !refundAmount || !initiateReason}
                  >
                    Create Request
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
