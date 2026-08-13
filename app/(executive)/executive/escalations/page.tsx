// @ts-nocheck
"use client";

import React, { useState } from "react";
import { useEscalations, useAssignEscalation, useResolveEscalation } from "@/features/executive/hooks/useExecutiveQueries";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Loader2, CheckCircle2, UserPlus, Clock, User, ShieldAlert } from "lucide-react";

export default function EscalationsPage() {
  const { data: escalationsData, isLoading } = useEscalations({ page: 1, limit: 50, status: "OPEN,IN_PROGRESS" });
  const escalations = (escalationsData?.escalations || []) as unknown[];

  const assignMutation = useAssignEscalation();
  const resolveMutation = useResolveEscalation();

  const [selectedEscalation, setSelectedEscalation] = useState<unknown | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState("");

  const [isAssigning, setIsAssigning] = useState<string | null>(null);
  
  const [message, setMessage] = useState({ type: "", text: "" });
  const handleAssignSelf = async (id: string) => {
    setIsAssigning(id);
    setMessage({ type: "", text: "" });
    try {
      await assignMutation.mutateAsync(id);
      setMessage({ type: "success", text: "Escalation assigned to you." });
    } catch (err: unknown) {
      setMessage({ type: "error", text: err?.message || "Failed to assign escalation." });
    } finally {
      setIsAssigning(null);
    }
  };

  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEscalation || !resolutionNotes) return;

    setMessage({ type: "", text: "" });

    try {
      await resolveMutation.mutateAsync({
        id: selectedEscalation._id, 
        data: { resolutionNotes }
      });
      setMessage({ type: "success", text: "Escalation resolved successfully!" });
      setSelectedEscalation(null);
      setResolutionNotes("");
    } catch (err: unknown) {
      setMessage({ type: "error", text: err?.message || "Failed to resolve escalation." });
    }
  };

  const getSeverityStyles = (severity: string) => {
    switch(severity) {
      case "CRITICAL": return "bg-danger text-neutral-white border-danger";
      case "HIGH": return "bg-danger/10 text-danger border-danger/20";
      case "MEDIUM": return "bg-warning/10 text-warning border-warning/20";
      case "LOW": return "bg-secondary-blue/10 text-secondary-blue border-secondary-blue/20";
      default: return "bg-neutral-muted/10 text-neutral-muted border-neutral-muted/20";
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto relative">
      <div>
        <h2 className="text-2xl font-bold text-primary-navy flex items-center">
          <ShieldAlert className="w-6 h-6 mr-2 text-danger" /> 
          Escalations
        </h2>
        <p className="text-neutral-muted text-sm mt-1">Manage and resolve high-priority issues raised by customers or partners.</p>
      </div>

      {message.text && !selectedEscalation && (
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
      ) : escalations.length === 0 ? (
        <div className="bg-neutral-white p-10 rounded-2xl shadow-sm border border-neutral-muted/20 text-center">
          <CheckCircle2 className="w-12 h-12 text-success/50 mb-3 mx-auto" />
          <p className="text-neutral-muted">Excellent! No open escalations at the moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {escalations.map((esc) => (
            <Card key={esc._id} className={`transition-shadow ${esc.isSlaBreached ? 'border-danger/50 shadow-sm shadow-danger/20 bg-danger/5' : 'hover:shadow-md'}`}>
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center space-x-2">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-bold border ${getSeverityStyles(esc.severity)}`}>
                      {esc.severity}
                    </span>
                    <span className="text-xs bg-neutral-muted/10 px-2 py-1 rounded border border-neutral-muted/20 flex items-center">
                      <User className="w-3 h-3 mr-1"/> Raised by: {esc.raisedBy}
                    </span>
                    {esc.isSlaBreached && (
                      <span className="text-xs bg-danger text-white px-2 py-1 rounded font-bold uppercase animate-pulse">
                        SLA BREACH
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-neutral-muted flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                    {new Date(esc.createdAt).toLocaleDateString()}
                  </span>
                </div>
                
                <h3 className="font-semibold text-primary-navy mb-2 line-clamp-2">
                  {esc.description}
                </h3>

                <div className="bg-neutral-bg p-3 rounded-lg border border-neutral-muted/10 text-xs text-neutral-dark mb-4 flex justify-between">
                  <span>Booking ID: {esc.bookingId?.substring(0,8) || "N/A"}</span>
                  <span>Ticket ID: {esc.ticketId?.substring(0,8) || "N/A"}</span>
                </div>

                <div className="flex space-x-3 mt-auto">
                  {!esc.assignedTo ? (
                    <Button 
                      variant="outline" 
                      className="w-full flex items-center justify-center" 
                      onClick={() => handleAssignSelf(esc._id)}
                      isLoading={isAssigning === esc._id}
                      disabled={isAssigning !== null && isAssigning !== esc._id}
                    >
                      <UserPlus className="w-4 h-4 mr-2" /> Assign to Me
                    </Button>
                  ) : (
                    <Button 
                      className="w-full flex items-center justify-center bg-danger hover:bg-danger/90"
                      onClick={() => setSelectedEscalation(esc)}
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" /> Resolve Issue
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Resolve Modal */}
      {selectedEscalation && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md shadow-2xl">
            <CardHeader className="border-b border-neutral-muted/10 pb-4">
              <CardTitle>Resolve Escalation</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="mb-4 bg-danger/5 p-3 rounded-lg text-sm border border-danger/10">
                <p className="font-medium text-danger mb-1">{selectedEscalation.severity} Priority</p>
                <p className="text-neutral-dark">{selectedEscalation.description}</p>
              </div>

              {message.text && (
                <div className={`p-3 mb-4 rounded-lg text-sm border ${
                  message.type === "success" 
                    ? "bg-success/10 text-success border-success/20" 
                    : "bg-danger/10 text-danger border-danger/20"
                }`}>
                  {message.text}
                </div>
              )}

              <form onSubmit={handleResolve} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-dark mb-1.5">Resolution Notes</label>
                  <textarea
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    placeholder="Describe how this escalation was resolved..."
                    rows={4}
                    className="flex w-full rounded-lg border border-neutral-muted/40 bg-neutral-white px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:border-primary-orange focus:ring-primary-orange/20"
                    required
                  />
                </div>

                <div className="flex space-x-3 pt-2">
                  <Button type="button" variant="outline" className="w-full" onClick={() => setSelectedEscalation(null)}>
                    Cancel
                  </Button>
                  <Button onClick={handleResolve} className="w-full bg-success hover:bg-success/90" isLoading={resolveMutation.isPending}>
                    Mark Resolved
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
