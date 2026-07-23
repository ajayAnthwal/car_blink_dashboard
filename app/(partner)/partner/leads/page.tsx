"use client";

import React, { useState, useEffect } from "react";
import { getLeads, createBid } from "@/lib/services";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Target, Loader2, MapPin, Calendar, Car, Wrench, X } from "lucide-react";

export default function LeadsPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [selectedLead, setSelectedLead] = useState<any | null>(null);
  const [quotedAmount, setQuotedAmount] = useState("");
  const [estimatedDuration, setEstimatedDuration] = useState("");
  const [notes, setNotes] = useState("");
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      setIsLoading(true);
      const res = await getLeads(1, 50); // Get recent leads
      setLeads(res?.docs || res || []);
    } catch (err) {
      console.error("Failed to load leads", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlaceBid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead) return;

    setIsSubmitting(true);
    setMessage({ type: "", text: "" });

    try {
      await createBid({
        bookingId: selectedLead._id,
        quotedAmount: parseFloat(quotedAmount),
        estimatedDuration,
        notes
      });

      setMessage({ type: "success", text: "Bid placed successfully!" });
      setSelectedLead(null);
      setQuotedAmount("");
      setEstimatedDuration("");
      setNotes("");
      fetchLeads();
    } catch (err: any) {
      setMessage({ type: "error", text: err?.message || "Failed to place bid." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto relative">
      <h2 className="text-2xl font-bold text-primary-navy">Available Leads</h2>
      
      <p className="text-neutral-muted text-sm mb-6">
        Browse service requests from customers in your area and place competitive bids to win jobs.
      </p>

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
      ) : leads.length === 0 ? (
        <div className="bg-neutral-white p-10 rounded-2xl shadow-sm border border-neutral-muted/20 text-center">
          <Target className="w-12 h-12 text-neutral-muted/30 mb-3 mx-auto" />
          <p className="text-neutral-muted">No new leads available right now. Check back later!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {leads.map((lead) => (
            <Card key={lead._id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-primary-navy mb-1">{lead.serviceId?.name || "Service Request"}</h3>
                    <div className="flex items-center text-xs text-neutral-muted space-x-3">
                      <span className="flex items-center"><MapPin className="w-3 h-3 mr-1"/> {lead.cityId?.name}</span>
                      <span className="flex items-center"><Calendar className="w-3 h-3 mr-1"/> {new Date(lead.preferredDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <span className="bg-success/10 text-success text-xs px-2.5 py-1 rounded-full font-medium border border-success/20">
                    New Lead
                  </span>
                </div>
                
                <div className="bg-neutral-bg rounded-lg p-3 mb-4 text-sm border border-neutral-muted/10">
                  <div className="flex items-center mb-2">
                    <Car className="w-4 h-4 text-neutral-muted mr-2" />
                    <span className="font-medium text-neutral-dark">{lead.vehicleId?.brand} {lead.vehicleId?.model}</span>
                  </div>
                  <div className="flex items-start">
                    <Wrench className="w-4 h-4 text-neutral-muted mr-2 mt-0.5" />
                    <span className="text-neutral-muted line-clamp-2">{lead.description || "No description provided."}</span>
                  </div>
                </div>

                <Button className="w-full" onClick={() => setSelectedLead(lead)}>
                  Place Bid
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Bidding Modal */}
      {selectedLead && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md shadow-2xl">
            <CardHeader className="flex flex-row items-center justify-between border-b border-neutral-muted/10 pb-4">
              <CardTitle>Submit Your Quote</CardTitle>
              <button 
                onClick={() => setSelectedLead(null)}
                className="text-neutral-muted hover:text-neutral-dark"
              >
                <X className="w-5 h-5" />
              </button>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="mb-4 bg-primary-navy/5 p-3 rounded-lg text-sm">
                <p className="font-medium text-primary-navy">{selectedLead.serviceId?.name}</p>
                <p className="text-neutral-muted">{selectedLead.vehicleId?.brand} {selectedLead.vehicleId?.model}</p>
              </div>

              <form onSubmit={handlePlaceBid} className="space-y-4">
                <Input
                  label="Quoted Amount (₹)"
                  type="number"
                  min="1"
                  placeholder="e.g. 1500"
                  value={quotedAmount}
                  onChange={(e) => setQuotedAmount(e.target.value)}
                  required
                />
                
                <Input
                  label="Estimated Duration"
                  placeholder="e.g. 2 hours, 1 day"
                  value={estimatedDuration}
                  onChange={(e) => setEstimatedDuration(e.target.value)}
                  required
                />
                
                <div>
                  <label className="block text-sm font-medium text-neutral-dark mb-1.5">Additional Notes (Optional)</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="E.g. We can pick up the car today..."
                    rows={3}
                    className="flex w-full rounded-lg border border-neutral-muted/40 bg-neutral-white px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:border-primary-orange focus:ring-primary-orange/20"
                  />
                </div>

                <div className="flex space-x-3 pt-2">
                  <Button type="button" variant="outline" className="w-full" onClick={() => setSelectedLead(null)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="w-full" isLoading={isSubmitting}>
                    Submit Bid
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
