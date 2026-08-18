// @ts-nocheck
"use client";

import React, { useState } from "react";
import { useFollowUps, useCreateFollowUp, useClickToCallMutation, useCustomerStatus, usePartnerStatus, useExecutiveLeads } from "@/features/executive/hooks/useExecutiveQueries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/Select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { PhoneCall, Loader2, Plus, User, Briefcase, Calendar } from "lucide-react";

export default function FollowUpsPage() {
  const { data: followUpsData, isLoading } = useFollowUps(1, 50);
  const followUps = (followUpsData || []) as unknown[];

  const createMutation = useCreateFollowUp();
  const clickToCallMutation = useClickToCallMutation();
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const [callNumber, setCallNumber] = useState("");
  const [isCalling, setIsCalling] = useState(false);
  const [callMessage, setCallMessage] = useState({ type: "", text: "" });

  const { data: customersData } = useCustomerStatus(1, 100);
  const customers = (Array.isArray(customersData?.customers) ? customersData.customers : Array.isArray(customersData?.docs) ? customersData.docs : Array.isArray(customersData?.data) ? customersData.data : Array.isArray(customersData) ? customersData : []) as any[];

  const { data: partnersData } = usePartnerStatus(1, 100);
  const partners = (Array.isArray(partnersData?.docs) ? partnersData.docs : Array.isArray(partnersData?.data?.partners) ? partnersData.data.partners : Array.isArray(partnersData?.data) ? partnersData.data : Array.isArray(partnersData) ? partnersData : []) as any[];

  const { data: bookingsData } = useExecutiveLeads({ page: 1, limit: 100 });
  const bookings = (bookingsData?.leads || []) as any[];

  const [formData, setFormData] = useState({
    relatedTo: "CUSTOMER",
    relatedUserId: "",
    bookingId: "",
    callOutcome: "CONNECTED",
    notes: "",
    followUpDate: ""
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });

    try {
      const payload: any = {
        relatedTo: formData.relatedTo,
        relatedUserId: formData.relatedUserId,
        callOutcome: formData.callOutcome,
        notes: formData.notes,
      };

      if (formData.bookingId) payload.bookingId = formData.bookingId;
      if (formData.followUpDate) payload.followUpDate = new Date(formData.followUpDate).toISOString();

      await createMutation.mutateAsync(payload);

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
    } catch (err: unknown) {
      setMessage({ type: "error", text: err?.message || "Failed to log follow-up." });
    }
  };

  const handleQuickCall = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!callNumber) return;
    setIsCalling(true);
    setCallMessage({ type: "", text: "" });
    try {
      await clickToCallMutation.mutateAsync({ phoneNumber: callNumber });
      setCallMessage({ type: "success", text: `Calling ${callNumber}... Check your phone.` });
      setCallNumber("");
    } catch (err: unknown) {
      setCallMessage({ type: "error", text: err?.message || "Failed to initiate call." });
    } finally {
      setIsCalling(false);
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

      <Card className="shadow-subtle mb-6">
        <CardContent className="p-4">
          <h3 className="font-semibold text-primary-navy mb-3 flex items-center">
            <PhoneCall className="w-4 h-4 mr-2 text-primary-orange" /> Quick Click-to-Call
          </h3>
          {callMessage.text && (
            <div className={`p-2 mb-3 rounded-lg text-xs border ${
              callMessage.type === "success" 
                ? "bg-success/10 text-success border-success/20" 
                : "bg-danger/10 text-danger border-danger/20"
            }`}>
              {callMessage.text}
            </div>
          )}
          <form onSubmit={handleQuickCall} className="flex space-x-3">
            <Input 
              placeholder="Enter phone number (e.g. +91 9876543210)" 
              value={callNumber}
              onChange={(e) => setCallNumber(e.target.value)}
              className="flex-1"
              required
            />
            <Button type="submit" isLoading={isCalling} className="bg-success hover:bg-success-dark">
              Call Now
            </Button>
          </form>
        </CardContent>
      </Card>

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
                      <p className="text-xs text-neutral-muted">ID: {typeof log.relatedUserId === 'object' ? log.relatedUserId?._id?.substring(0,8) : String(log.relatedUserId || "").substring(0,8)}</p>
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
                  <Select
                    label="User Name"
                    name="relatedUserId"
                    value={formData.relatedUserId}
                    onChange={handleInputChange}
                    options={[
                      { value: "", label: "-- Select User --" },
                      ...(formData.relatedTo === "CUSTOMER" 
                        ? customers.map(c => ({ value: c._id, label: c.fullName || c.name || (c.firstName ? `${c.firstName} ${c.lastName || ''}` : '') || c.email || c.phone || c._id }))
                        : partners.map(p => ({ value: p._id, label: p.companyName || p.fullName || p.name || (p.firstName ? `${p.firstName} ${p.lastName || ''}` : '') || p.email || p.phone || p._id }))
                      )
                    ]}
                    required
                  />
                  <Select
                    label="Booking (Optional)"
                    name="bookingId"
                    value={formData.bookingId}
                    onChange={handleInputChange}
                    options={[
                      { value: "", label: "-- None (Optional) --" },
                      ...bookings.map(b => ({ value: b._id, label: `${b.serviceId?.name || 'Service'} - ${b.customerId?.fullName || ''}` }))
                    ]}
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
                  <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)} className="flex-1">
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1 bg-primary-navy hover:bg-primary-navy/90" isLoading={createMutation.isPending}>
                    Log Follow-up
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
