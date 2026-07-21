"use client";

import React, { useState, useEffect } from "react";
import { getFollowUps, createFollowUp } from "@/lib/services";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { PhoneCall, Loader2, Plus, User, Briefcase, Calendar } from "lucide-react";

export default function FollowUpsPage() {
  const [followUps, setFollowUps] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const [formData, setFormData] = useState({
    relatedTo: "CUSTOMER",
    relatedUserId: "",
    bookingId: "",
    callOutcome: "CONNECTED",
    notes: "",
    followUpDate: ""
  });

  useEffect(() => {
    fetchFollowUps();
  }, []);

  const fetchFollowUps = async () => {
    try {
      setIsLoading(true);
      const res = await getFollowUps(1, 50);
      setFollowUps(res?.docs || res || []);
    } catch (err) {
      console.error("Failed to load follow-ups", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage({ type: "", text: "" });

    try {
      await createFollowUp({
        ...formData,
        followUpDate: formData.followUpDate ? new Date(formData.followUpDate).toISOString() : undefined
      });

      setMessage({ type: "success", text: "Follow-up logged successfully!" });
      setShowCreateModal(false);
      setFormData({
        relatedTo: "CUSTOMER",
        relatedUserId: "",
        bookingId: "",
        callOutcome: "CONNECTED",
        notes: "",
        followUpDate: ""
      });
      fetchFollowUps();
    } catch (err: any) {
      setMessage({ type: "error", text: err?.message || "Failed to log follow-up." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getOutcomeColor = (outcome: string) => {
    switch (outcome) {
      case "RESOLVED": return "bg-success/10 text-success border-success/20";
      case "NO_ANSWER": return "bg-danger/10 text-danger border-danger/20";
      case "CALLBACK_REQUESTED": return "bg-warning/10 text-warning border-warning/20";
      default: return "bg-secondary-blue/10 text-secondary-blue border-secondary-blue/20";
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-primary-navy">All Follow-ups</h2>
          <p className="text-neutral-muted text-sm mt-1">Log and track your customer and partner calls.</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="flex items-center">
          <Plus className="w-4 h-4 mr-2" /> Log Call
        </Button>
      </div>

      {message.text && !showCreateModal && (
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
      ) : followUps.length === 0 ? (
        <div className="bg-neutral-white p-10 rounded-2xl shadow-sm border border-neutral-muted/20 text-center">
          <PhoneCall className="w-12 h-12 text-neutral-muted/30 mb-3 mx-auto" />
          <p className="text-neutral-muted">No follow-ups logged yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {followUps.map((log) => (
            <Card key={log._id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="bg-primary-navy/5 p-2 rounded-lg">
                      {log.relatedTo === "PARTNER" ? <Briefcase className="w-5 h-5 text-primary-navy" /> : <User className="w-5 h-5 text-primary-navy" />}
                    </div>
                    <div>
                      <h3 className="font-bold text-primary-navy">{log.relatedTo}</h3>
                      <p className="text-xs text-neutral-muted">ID: {log.relatedUserId?.substring(0,8)}</p>
                    </div>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${getOutcomeColor(log.callOutcome)}`}>
                    {log.callOutcome.replace(/_/g, " ")}
                  </span>
                </div>
                
                <p className="text-sm text-neutral-dark bg-neutral-bg p-3 rounded-lg border border-neutral-muted/10 mb-3">
                  {log.notes || "No notes provided."}
                </p>
                
                <div className="flex items-center justify-between text-xs text-neutral-muted">
                  <span>Logged: {new Date(log.createdAt).toLocaleDateString()}</span>
                  {log.followUpDate && (
                    <span className="flex items-center font-medium text-warning">
                      <Calendar className="w-3 h-3 mr-1" /> Next: {new Date(log.followUpDate).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg shadow-2xl">
            <CardHeader className="border-b border-neutral-muted/10 pb-4">
              <CardTitle>Log a Follow-up Call</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {message.text && (
                <div className={`p-3 mb-4 rounded-lg text-sm border ${
                  message.type === "success" 
                    ? "bg-success/10 text-success border-success/20" 
                    : "bg-danger/10 text-danger border-danger/20"
                }`}>
                  {message.text}
                </div>
              )}
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Select
                    label="Related To"
                    name="relatedTo"
                    value={formData.relatedTo}
                    onChange={handleInputChange}
                    options={[
                      { value: "CUSTOMER", label: "Customer" },
                      { value: "PARTNER", label: "Partner" }
                    ]}
                    required
                  />
                  <Select
                    label="Call Outcome"
                    name="callOutcome"
                    value={formData.callOutcome}
                    onChange={handleInputChange}
                    options={[
                      { value: "CONNECTED", label: "Connected" },
                      { value: "NO_ANSWER", label: "No Answer" },
                      { value: "CALLBACK_REQUESTED", label: "Callback Requested" },
                      { value: "RESOLVED", label: "Resolved" }
                    ]}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="User ID"
                    name="relatedUserId"
                    value={formData.relatedUserId}
                    onChange={handleInputChange}
                    placeholder="Object ID"
                    required
                  />
                  <Input
                    label="Booking ID (Optional)"
                    name="bookingId"
                    value={formData.bookingId}
                    onChange={handleInputChange}
                    placeholder="Object ID"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-dark mb-1.5">Call Notes</label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    placeholder="Summary of the conversation..."
                    rows={3}
                    className="flex w-full rounded-lg border border-neutral-muted/40 bg-neutral-white px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:border-primary-orange focus:ring-primary-orange/20"
                    required
                  />
                </div>

                {(formData.callOutcome === "NO_ANSWER" || formData.callOutcome === "CALLBACK_REQUESTED") && (
                  <Input
                    label="Next Follow-up Date"
                    name="followUpDate"
                    type="datetime-local"
                    value={formData.followUpDate}
                    onChange={handleInputChange}
                    required
                  />
                )}

                <div className="flex space-x-3 pt-2">
                  <Button type="button" variant="outline" className="w-full" onClick={() => setShowCreateModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="w-full" isLoading={isSubmitting}>
                    Save Log
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
