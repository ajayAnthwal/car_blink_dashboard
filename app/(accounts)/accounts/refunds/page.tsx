"use client";

import React, { useState, useEffect } from "react";
import { getAllRefunds, approveRefund, processRefund, rejectRefund } from "@/lib/services";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Undo2, Check, X, Loader2, ArrowRightCircle } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function RefundsPage() {
  const [refunds, setRefunds] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectFor, setShowRejectFor] = useState<string | null>(null);

  const fetchRefunds = async () => {
    setIsLoading(true);
    try {
      const res = await getAllRefunds(1, 50);
      const data = Array.isArray(res) ? res : (res?.refunds || res?.docs || []);
      setRefunds(data);
    } catch (err) {
      console.error("Failed to load refunds", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRefunds();
  }, []);

  const handleAction = async (id: string, action: "approve" | "process" | "reject") => {
    setActionId(id);
    setMessage({ type: "", text: "" });
    try {
      if (action === "approve") {
        await approveRefund(id);
        setMessage({ type: "success", text: "Refund approved." });
      } else if (action === "process") {
        await processRefund(id);
        setMessage({ type: "success", text: "Refund processed successfully." });
      } else if (action === "reject") {
        await rejectRefund(id, { rejectionReason: rejectReason });
        setMessage({ type: "success", text: "Refund rejected." });
        setShowRejectFor(null);
        setRejectReason("");
      }
      fetchRefunds();
    } catch (err: any) {
      setMessage({ type: "error", text: err?.message || `Failed to ${action} refund.` });
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-primary-navy">Refund Management</h2>
      </div>

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
                        #{refund._id?.slice(-6).toUpperCase()}
                        <div className="text-xs text-neutral-muted mt-1">Booking: {refund.bookingId}</div>
                      </td>
                      <td className="px-4 py-3 font-bold text-primary-navy">₹{refund.amount}</td>
                      <td className="px-4 py-3 text-neutral-dark max-w-[200px] truncate" title={refund.reason}>
                        {refund.reason}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          refund.status === 'PROCESSED' ? 'bg-green-100 text-green-700' :
                          refund.status === 'APPROVED' ? 'bg-blue-100 text-blue-700' :
                          refund.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                          'bg-warning/20 text-warning'
                        }`}>
                          {refund.status || 'PENDING'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right space-x-2">
                        {refund.status === 'REQUESTED' && (
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
                        )}
                        {refund.status === 'APPROVED' && (
                          <Button 
                            size="sm" 
                            className="bg-primary-navy hover:bg-primary-navy-light"
                            onClick={() => handleAction(refund._id, "process")}
                            isLoading={actionId === refund._id}
                          >
                            <ArrowRightCircle className="w-4 h-4 mr-1" /> Process
                          </Button>
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
    </div>
  );
}
