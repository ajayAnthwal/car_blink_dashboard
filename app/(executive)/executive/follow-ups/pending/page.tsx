"use client";

import React, { useState, useEffect } from "react";
import { getPendingFollowUps, updateFollowUp } from "@/lib/services";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, Loader2, CheckCircle2, User, Briefcase, Calendar } from "lucide-react";

export default function PendingFollowUpsPage() {
  const [pending, setPending] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    fetchPending();
  }, []);

  const fetchPending = async () => {
    try {
      setIsLoading(true);
      const res = await getPendingFollowUps(1, 50);
      const dataArray = res?.data?.docs || res?.data || (Array.isArray(res) ? res : (res?.docs || (Array.isArray(res) ? res : (res?.docs || res?.data || []))));
      setPending(Array.isArray(dataArray) ? dataArray : []);
    } catch (err) {
      console.error("Failed to load pending follow-ups", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResolve = async (id: string) => {
    setUpdatingId(id);
    setMessage({ type: "", text: "" });
    try {
      await updateFollowUp(id, {
        callOutcome: "RESOLVED",
        notes: "Marked as resolved from pending list."
      });
      setMessage({ type: "success", text: "Follow-up marked as resolved!" });
      fetchPending();
    } catch (err: any) {
      setMessage({ type: "error", text: err?.message || "Failed to resolve follow-up." });
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-primary-navy">Pending Follow-ups</h2>
        <p className="text-neutral-muted text-sm mt-1">Calls that require your attention today.</p>
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

      {isLoading ? (
        <div className="flex items-center justify-center p-10 bg-neutral-white rounded-2xl shadow-sm border border-neutral-muted/20">
          <Loader2 className="w-8 h-8 text-primary-orange animate-spin" />
        </div>
      ) : pending.length === 0 ? (
        <div className="bg-neutral-white p-10 rounded-2xl shadow-sm border border-neutral-muted/20 text-center">
          <CheckCircle2 className="w-12 h-12 text-success/50 mb-3 mx-auto" />
          <p className="text-neutral-muted">You're all caught up! No pending calls.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pending.map((log) => (
            <Card key={log._id} className="hover:shadow-md transition-shadow border-l-4 border-l-warning">
              <CardContent className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="bg-warning/10 p-2 rounded-lg">
                      {log.relatedTo === "PARTNER" ? <Briefcase className="w-5 h-5 text-warning" /> : <User className="w-5 h-5 text-warning" />}
                    </div>
                    <div>
                      <h3 className="font-bold text-primary-navy">{log.relatedTo} Follow-up</h3>
                      <p className="text-xs font-medium text-warning flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        Due: {new Date(log.followUpDate).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="bg-neutral-bg rounded-lg p-3 text-sm border border-neutral-muted/10">
                    <p className="text-neutral-dark">Previous notes: {log.notes}</p>
                    <p className="text-xs text-neutral-muted mt-1">Outcome: {log.callOutcome.replace(/_/g, " ")}</p>
                  </div>
                </div>
                
                <div className="shrink-0 flex md:flex-col space-x-2 md:space-x-0 md:space-y-2">
                  <Button 
                    className="flex-1 bg-success hover:bg-success/90"
                    onClick={() => handleResolve(log._id)}
                    isLoading={updatingId === log._id}
                    disabled={updatingId === log._id}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" /> Mark Resolved
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
