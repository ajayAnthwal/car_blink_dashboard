// @ts-nocheck
"use client";

import React, { useState } from "react";
import { 
  useRefunds, 
  useEligiblePaymentsForRefund, 
  useInitiateRefundMutation, 
  useApproveRefundMutation, 
  useProcessRefundMutation, 
  useRejectRefundMutation 
} from "@/features/accounts/hooks/useAccountsQueries";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Undo2, Check, X, Loader2, ArrowRightCircle } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function RefundsPage() {
  const { data, isLoading } = useRefunds({ page: 1, limit: 50 });
  const refunds = data?.refunds || [];
  
  const [actionId, setActionId] = useState<string | null>(null);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectFor, setShowRejectFor] = useState<string | null>(null);
  const [securityPin, setSecurityPin] = useState("");
  const [showProcessFor, setShowProcessFor] = useState<string | null>(null);

  // Initiate Refund state
  const [showInitiateModal, setShowInitiateModal] = useState(false);
  const { data: eligiblePaymentsData, refetch: refetchEligible } = useEligiblePaymentsForRefund();
  const eligiblePayments = eligiblePaymentsData || [];
  
  const [selectedPayment, setSelectedPayment] = useState<unknown>(null);
  const [refundAmount, setRefundAmount] = useState<number | "">("");
  const [initiateReason, setInitiateReason] = useState("");

  const initiateMutation = useInitiateRefundMutation();
  const approveMutation = useApproveRefundMutation();
  const processMutation = useProcessRefundMutation();
  const rejectMutation = useRejectRefundMutation();

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

  const handleAction = async (id: string, action: "approve" | "process" | "reject") => {
    setActionId(id);
    setMessage({ type: "", text: "" });
    try {
      if (action === "approve") {
        await approveMutation.mutateAsync(id);
        setMessage({ type: "success", text: "Refund approved." });
      } else if (action === "process") {
        if (!securityPin || securityPin.length < 4) {
          setMessage({ type: "error", text: "Please enter a valid 4-digit Security PIN." });
          setActionId(null);
          return;
        }
        await processMutation.mutateAsync({ id, pin: securityPin });
        setMessage({ type: "success", text: "Refund processed successfully." });
        setShowProcessFor(null);
        setSecurityPin("");
      } else if (action === "reject") {
        await rejectMutation.mutateAsync({ id, reason: rejectReason });
        setMessage({ type: "success", text: "Refund rejected." });
        setShowRejectFor(null);
        setRejectReason("");
      }
    } catch (err: unknown) {
      setMessage({ type: "error", text: err?.message || `Failed to ${action} refund.` });
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-primary-navy">Refund Management</h2>
        <Button onClick={openInitiateModal} className="bg-primary-orange hover:bg-orange-600 text-white font-bold">
          Initiate Refund
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
            <span>All Refunds</span>
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
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-success text-success hover:bg-success/5"
                              onClick={() => handleAction(refund._id, "approve")}
                              isLoading={actionId === refund._id}
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-danger text-danger hover:bg-danger/5"
                              onClick={() => setShowRejectFor(refund._id)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </>
                        ) : refund.status === 'APPROVED' ? (
                          <Button
                            size="sm"
                            className="bg-primary-navy hover:bg-primary-navy-light"
                            onClick={() => setShowProcessFor(refund._id)}
                            isLoading={actionId === refund._id}
                          >
                            <ArrowRightCircle className="w-4 h-4 mr-1" /> Process
                          </Button>
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

      {/* Reject Modal Overlay */}
      {showRejectFor && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md shadow-xl">
            <CardHeader>
              <CardTitle>Reject Refund</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Rejection Reason"
                placeholder="Why is this refund being rejected?"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                required
              />
              <div className="flex justify-end space-x-3 pt-2">
                <Button variant="outline" onClick={() => { setShowRejectFor(null); setRejectReason(""); }}>
                  Cancel
                </Button>
                <Button
                  className="bg-danger hover:bg-danger/90 text-white"
                  onClick={() => handleAction(showRejectFor, "reject")}
                  isLoading={actionId === showRejectFor}
                  disabled={!rejectReason}
                >
                  Reject Refund
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Process Modal Overlay */}
      {showProcessFor && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md shadow-xl">
            <CardHeader>
              <CardTitle>Process Refund (RazorpayX)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-primary-navy/5 border border-primary-navy/10 rounded-lg">
                <p className="text-sm text-primary-navy/80 font-medium leading-relaxed">
                  This will automatically deduct funds from your RazorpayX account and transfer them back to the customer's original payment method.
                </p>
              </div>
              <Input
                label="Security PIN"
                type="password"
                placeholder="Enter 4-digit PIN"
                value={securityPin}
                onChange={(e) => setSecurityPin(e.target.value)}
                maxLength={4}
                required
              />
              <div className="flex justify-end space-x-3 pt-2">
                <Button variant="outline" onClick={() => { setShowProcessFor(null); setSecurityPin(""); }}>
                  Cancel
                </Button>
                <Button 
                  onClick={() => handleAction(showProcessFor, "process")}
                  isLoading={actionId === showProcessFor}
                  disabled={!securityPin || securityPin.length < 4}
                >
                  Initiate Automatic Refund
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Initiate Refund Modal */}
      {showInitiateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg shadow-xl">
            <CardHeader>
              <CardTitle>Initiate Refund</CardTitle>
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
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Reason</label>
                  <textarea
                    className="w-full p-2 border border-gray-200 rounded-lg text-sm resize-none"
                    rows={3}
                    placeholder="Enter reason for refund"
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
                    Submit Refund
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
