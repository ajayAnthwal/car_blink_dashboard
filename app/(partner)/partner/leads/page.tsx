// @ts-nocheck
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Target, Loader2, MapPin, Calendar, Car, Wrench, X, AlertTriangle } from "lucide-react";
import { usePartnerLeads, useCreateBidMutation, useWalletStatement } from "@/features/partner/hooks/usePartnerQueries";

export default function LeadsPage() {
  const { data: leadsData, isLoading } = usePartnerLeads();
  const leads = leadsData?.leads || [];
  const { data: walletData } = useWalletStatement();
  
  const walletStatement = (walletData && walletData.balance !== undefined) ? walletData : ((walletData as any)?.data || walletData || {});
  const walletBalance = Number(walletStatement?.balance || 0);
  
  const createBidMutation = useCreateBidMutation();

  const [selectedLead, setSelectedLead] = useState<unknown | null>(null);
  const [quotedAmount, setQuotedAmount] = useState("");
  const [estimatedDuration, setEstimatedDuration] = useState("");
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState({ type: "", text: "" });

  const handlePlaceBid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead) return;

    setMessage({ type: "", text: "" });

    try {
      await createBidMutation.mutateAsync({
        bookingId: selectedLead._id || selectedLead.id,
        quotedAmount: parseFloat(quotedAmount),
        estimatedDuration,
        notes
      });

      setMessage({ type: "success", text: "Bid placed successfully!" });
      setSelectedLead(null);
      setQuotedAmount("");
      setEstimatedDuration("");
      setNotes("");
    } catch (err: unknown) {
      setMessage({ type: "error", text: err?.message || "Failed to place bid." });
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto w-full min-w-0 relative pb-10">
      <h2 className="text-2xl font-bold text-primary-navy">Available Leads</h2>
      
      <p className="text-neutral-muted text-sm mb-6">
        Browse service requests from customers in your area and place competitive bids to win jobs.
      </p>

      {/* Threshold Alert Banner */}
      {walletBalance <= -500 && (
        <div className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
          walletBalance < -1000 ? 'bg-red-50 border-red-300' : 'bg-orange-50 border-orange-300'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-full shrink-0 ${walletBalance < -1000 ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className={`font-bold text-sm md:text-base ${walletBalance < -1000 ? 'text-red-900' : 'text-orange-950'}`}>
                {walletBalance < -1000
                  ? `🚨 Credit Limit Exceeded — Outstanding Commission: ₹${Math.abs(walletBalance).toLocaleString('en-IN')}`
                  : `Please settle outstanding commission of ₹${Math.abs(walletBalance).toLocaleString('en-IN')} to receive new leads`}
              </h3>
              <p className={`text-xs font-medium mt-0.5 ${walletBalance < -1000 ? 'text-red-700' : 'text-orange-800'}`}>
                {walletBalance < -1000
                  ? 'Your negative wallet balance exceeds the ₹1,000 threshold. New booking leads are paused until cleared.'
                  : 'Platform commission for cash jobs has reached the threshold limit. Please clear your dues in My Wallet to prevent leads from being paused.'}
              </p>
            </div>
          </div>
          <Button asChild size="sm" className={walletBalance < -1000 ? "bg-red-600 hover:bg-red-700 text-white shrink-0 font-bold" : "bg-orange-600 hover:bg-orange-700 text-white shrink-0 font-bold"}>
            <Link href="/partner/wallet">Pay Dues Now</Link>
          </Button>
        </div>
      )}

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
          {leads.map((lead: any) => {
            const leadId = lead._id || lead.id;
            const serviceTitle = (typeof lead.serviceId === 'object' && lead.serviceId?.name) 
              ? lead.serviceId.name 
              : (lead.customServiceName || "Service Request");
            const formattedTitle = serviceTitle.charAt(0).toUpperCase() + serviceTitle.slice(1);

            return (
            <Card key={leadId} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-primary-navy mb-1">{formattedTitle}</h3>
                    <div className="flex items-center text-xs text-neutral-muted space-x-3">
                      <span className="flex items-center truncate max-w-[220px]" title={lead.address || lead.city || (typeof lead.cityId === 'object' && lead.cityId?.name && lead.cityId?.name !== 'Bamboo Flat' ? lead.cityId.name : null) || "N/A"}><MapPin className="w-3 h-3 mr-1 shrink-0 text-primary-orange"/><span className="truncate">{lead.address || lead.city || (typeof lead.cityId === 'object' && lead.cityId?.name && lead.cityId?.name !== 'Bamboo Flat' ? lead.cityId.name : null) || "N/A"}</span></span>
                      <span className="flex items-center"><Calendar className="w-3 h-3 mr-1"/> {lead.preferredDate ? new Date(lead.preferredDate).toLocaleDateString() : "N/A"}</span>
                    </div>
                  </div>
                  <span className="bg-success/10 text-success text-xs px-2.5 py-1 rounded-full font-medium border border-success/20">
                    New Lead
                  </span>
                </div>
                
                <div className="bg-neutral-bg rounded-lg p-3 mb-4 text-sm border border-neutral-muted/10">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <Car className="w-4 h-4 text-neutral-muted mr-2" />
                      <span className="font-medium text-neutral-dark">{lead.vehicleId?.brand} {lead.vehicleId?.model}</span>
                    </div>
                    <span className="text-xs text-neutral-muted font-mono">ID: {leadId?.substring(0,8)}</span>
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
            );
          })}
        </div>
      )}

      {/* Bidding Modal */}
      {selectedLead && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md shadow-2xl max-h-[90vh] flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between border-b border-neutral-muted/10 pb-4 flex-shrink-0">
              <CardTitle>Submit Your Quote</CardTitle>
              <button 
                onClick={() => setSelectedLead(null)}
                className="text-neutral-muted hover:text-neutral-dark"
              >
                <X className="w-5 h-5" />
              </button>
            </CardHeader>
            <CardContent className="pt-4 overflow-y-auto custom-scrollbar flex-1">
              <div className="mb-4 bg-primary-navy/5 p-3 rounded-lg text-sm">
                <p className="font-medium text-primary-navy">
                  {(typeof selectedLead.serviceId === 'object' && selectedLead.serviceId?.name) 
                    ? selectedLead.serviceId.name 
                    : (selectedLead.customServiceName || "Service Request")}
                </p>
                <p className="text-neutral-muted">{selectedLead.vehicleId?.brand} {selectedLead.vehicleId?.model}</p>
                <p className="text-xs text-neutral-600 flex items-center mt-1.5 font-medium"><MapPin className="w-3.5 h-3.5 mr-1 text-primary-orange shrink-0" /><span>{selectedLead.address || selectedLead.city || (typeof selectedLead.cityId === 'object' && selectedLead.cityId?.name && selectedLead.cityId?.name !== 'Bamboo Flat' ? selectedLead.cityId.name : null) || "N/A"}</span></p>
              </div>

              <form onSubmit={handlePlaceBid} className="space-y-4">
                <div>
                  <Input
                    label="Quoted Amount (₹) (All-Inclusive 18% GST)"
                    type="number"
                    min="1"
                    placeholder="e.g. 1500"
                    value={quotedAmount}
                    onChange={(e) => setQuotedAmount(e.target.value)}
                    required
                  />
                  {quotedAmount && !isNaN(Number(quotedAmount)) && Number(quotedAmount) > 0 && (
                    <div className="mt-1.5 flex items-center justify-between text-[11px] text-gray-600 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200">
                      <span>Base Value: <strong>₹{(Number(quotedAmount) / 1.18).toFixed(2)}</strong></span>
                      <span>18% GST: <strong>₹{(Number(quotedAmount) - (Number(quotedAmount) / 1.18)).toFixed(2)}</strong></span>
                      <span className="text-emerald-700 font-bold">Total: ₹{Number(quotedAmount).toLocaleString('en-IN')}</span>
                    </div>
                  )}
                </div>
                
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

                <div className="flex flex-col space-y-3 pt-2">
                  <Button type="submit" className="w-full" isLoading={createBidMutation.isPending}>
                    Submit Bid
                  </Button>
                  <Button type="button" variant="outline" className="w-full" onClick={() => setSelectedLead(null)}>
                    Cancel
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
