"use client";

import React, { useState, useEffect } from "react";
import { getAllSettlements, processSettlement } from "@/lib/services";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { BadgeIndianRupee, Loader2, ArrowRightCircle } from "lucide-react";
import { Input } from "@/components/ui/Input";

export default function SettlementsPage() {
  const [settlements, setSettlements] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [transactionRef, setTransactionRef] = useState("");
  const [showProcessFor, setShowProcessFor] = useState<string | null>(null);

  const fetchSettlements = async () => {
    setIsLoading(true);
    try {
      const res = await getAllSettlements(1, 50);
      const data = Array.isArray(res) ? res : (res?.settlements || res?.docs || []);
      setSettlements(data);
    } catch (err) {
      console.error("Failed to load settlements", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettlements();
  }, []);

  const handleProcess = async () => {
    if (!showProcessFor || !transactionRef) return;
    
    setActionId(showProcessFor);
    setMessage({ type: "", text: "" });
    try {
      await processSettlement(showProcessFor, { transactionReference: transactionRef });
      setMessage({ type: "success", text: "Settlement processed successfully." });
      setShowProcessFor(null);
      setTransactionRef("");
      fetchSettlements();
    } catch (err: any) {
      setMessage({ type: "error", text: err?.message || `Failed to process settlement.` });
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-primary-navy">Settlement Management</h2>
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
            <BadgeIndianRupee className="w-5 h-5 text-primary-orange" />
            <span>All Partner Settlements</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-8 h-8 text-primary-orange animate-spin" />
            </div>
          ) : settlements.length === 0 ? (
            <div className="text-center py-10 text-neutral-muted">
              <p>No settlements found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-neutral-muted uppercase bg-neutral-bg">
                  <tr>
                    <th className="px-4 py-3 rounded-l-lg">ID / Partner</th>
                    <th className="px-4 py-3">Period</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 rounded-r-lg text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-muted/10">
                  {settlements.map((settlement) => (
                    <tr key={settlement._id} className="hover:bg-neutral-bg/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-primary-navy">
                        #{settlement._id?.slice(-6).toUpperCase()}
                        <div className="text-xs text-neutral-muted mt-1">Partner: {settlement.partnerId?.fullName || settlement.partnerId}</div>
                      </td>
                      <td className="px-4 py-3 text-neutral-dark">
                        {new Date(settlement.periodStart).toLocaleDateString()} - {new Date(settlement.periodEnd).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 font-bold text-primary-navy">₹{settlement.amount}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          settlement.status === 'PROCESSED' ? 'bg-green-100 text-green-700' :
                          'bg-warning/20 text-warning'
                        }`}>
                          {settlement.status || 'PENDING'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {settlement.status === 'PENDING' ? (
                          <Button 
                            size="sm" 
                            className="bg-primary-navy hover:bg-primary-navy-light"
                            onClick={() => setShowProcessFor(settlement._id)}
                          >
                            <ArrowRightCircle className="w-4 h-4 mr-1" /> Process
                          </Button>
                        ) : (
                          <span className="text-xs text-neutral-muted">Ref: {settlement.transactionReference}</span>
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

      {/* Process Modal Overlay */}
      {showProcessFor && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md shadow-xl">
            <CardHeader>
              <CardTitle>Process Settlement</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Transaction Reference"
                placeholder="e.g. UTR1234567890"
                value={transactionRef}
                onChange={(e) => setTransactionRef(e.target.value)}
                required
              />
              <div className="flex justify-end space-x-3 pt-2">
                <Button variant="outline" onClick={() => { setShowProcessFor(null); setTransactionRef(""); }}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleProcess}
                  isLoading={actionId === showProcessFor}
                  disabled={!transactionRef}
                >
                  Mark as Processed
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
