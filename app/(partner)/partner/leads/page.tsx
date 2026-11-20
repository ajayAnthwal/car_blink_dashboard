// @ts-nocheck
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Target, Loader2, MapPin, Calendar, Car, Wrench, X, AlertTriangle, FileText, Receipt } from "lucide-react";
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
                
                <div className="bg-neutral-bg rounded-xl p-3.5 mb-4 text-sm border border-neutral-muted/10 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Car className="w-4 h-4 text-neutral-muted mr-2" />
                      <span className="font-semibold text-neutral-dark">{lead.vehicleId?.brand} {lead.vehicleId?.model}</span>
                    </div>
                    <span className="text-xs text-neutral-muted font-mono font-medium">ID: {leadId?.substring(0,8)}</span>
                  </div>

                  {lead.description && (
                    <div className="flex items-start text-xs text-neutral-700">
                      <Wrench className="w-3.5 h-3.5 text-neutral-muted mr-2 mt-0.5 shrink-0" />
                      <span className="break-words whitespace-pre-wrap">{lead.description}</span>
                    </div>
                  )}

                  {/* Executive Special Instructions Banner */}
                  {(lead.remarks || lead.assignment?.notes) && (
                    <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-3 text-xs text-amber-950 shadow-2xs">
                      <div className="flex items-center gap-1.5 font-bold text-amber-900 mb-1">
                        <FileText className="w-3.5 h-3.5 text-primary-orange shrink-0" />
                        <span>Executive Instructions / Notes:</span>
                      </div>
                      <p className="whitespace-pre-wrap break-words font-medium leading-relaxed bg-white/70 p-2 rounded-lg border border-amber-100">
                        {lead.remarks || lead.assignment?.notes}
                      </p>
                    </div>
                  )}
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
              <div className="mb-4 bg-primary-navy/5 p-3.5 rounded-xl text-sm space-y-2">
                <div className="flex items-center justify-between">
                  <p className="font-bold text-primary-navy text-base">
                    {(typeof selectedLead.serviceId === 'object' && selectedLead.serviceId?.name) 
                      ? selectedLead.serviceId.name 
                      : (selectedLead.customServiceName || "Service Request")}
                  </p>
                  <span className="text-xs font-mono text-neutral-500 font-bold">
                    {(selectedLead.vehicleId?.brand || "")} {(selectedLead.vehicleId?.model || "")}
                  </span>
                </div>
                <p className="text-xs text-neutral-600 flex items-center font-medium">
                  <MapPin className="w-3.5 h-3.5 mr-1 text-primary-orange shrink-0" />
                  <span>{selectedLead.address || selectedLead.city || (typeof selectedLead.cityId === 'object' && selectedLead.cityId?.name && selectedLead.cityId?.name !== 'Bamboo Flat' ? selectedLead.cityId.name : null) || "N/A"}</span>
                </p>

                {selectedLead.description && (
                  <div className="pt-2 border-t border-neutral-200/60 text-xs text-neutral-700">
                    <span className="font-bold text-neutral-800 block mb-0.5">Customer Description:</span>
                    <p className="whitespace-pre-wrap break-words">{selectedLead.description}</p>
                  </div>
                )}

                {/* Executive Special Instructions */}
                {(selectedLead.remarks || selectedLead.assignment?.notes) && (
                  <div className="pt-2 border-t border-amber-200/60 text-xs">
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 text-amber-950">
                      <span className="font-bold text-amber-900 flex items-center gap-1.5 mb-1">
                        <FileText className="w-3.5 h-3.5 text-primary-orange" />
                        Executive Special Instructions / Notes:
                      </span>
                      <p className="whitespace-pre-wrap break-words font-medium leading-relaxed bg-white/80 p-2 rounded border border-amber-100">
                        {selectedLead.remarks || selectedLead.assignment?.notes}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <form onSubmit={handlePlaceBid} className="space-y-4">
                <div>
                  <Input
                    label="Service Amount"
                    type="number"
                    min="1"
                    step="any"
                    placeholder="e.g. 1500"
                    value={quotedAmount}
                    onChange={(e) => setQuotedAmount(e.target.value)}
                    required
                  />
                  {quotedAmount && !isNaN(Number(quotedAmount)) && Number(quotedAmount) > 0 && (() => {
                    const amount = Number(quotedAmount);
                    const govTaxes = amount - (amount / 1.18);
                    const convenienceFee = amount * 0.03;
                    const totalPlatformShare = amount * 0.15;
                    const platformFee = totalPlatformShare / 1.18;
                    const gstOnPlatformFee = totalPlatformShare - platformFee;
                    const estimatedSettlement = Math.max(0, amount - govTaxes - convenienceFee - platformFee - gstOnPlatformFee);

                    const formatCurrency = (val: number) => {
                      return val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                    };

                    return (
                      <div className="mt-2.5 bg-slate-50/90 rounded-2xl p-3.5 border border-slate-200/90 space-y-2.5 text-xs shadow-xs">
                        <div className="flex items-center justify-between font-semibold text-gray-800 pb-2 border-b border-slate-200">
                          <span className="flex items-center gap-1.5 text-primary-navy">
                            <Receipt className="w-3.5 h-3.5 text-primary-orange" />
                            <span>Payment Breakdown</span>
                          </span>
                          <span className="font-mono text-gray-900 font-bold">₹{formatCurrency(amount)}</span>
                        </div>

                        <div className="space-y-1.5 text-gray-600">
                          <div className="flex items-center justify-between text-gray-800 font-medium">
                            <span>Service Amount</span>
                            <span className="font-mono font-semibold">₹{formatCurrency(amount)}</span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-gray-500">Government Taxes</span>
                            <span className="font-mono font-medium text-rose-600">− ₹{formatCurrency(govTaxes)}</span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-gray-500">Convenience Fee</span>
                            <span className="font-mono font-medium text-rose-600">− ₹{formatCurrency(convenienceFee)}</span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-gray-500">CarBlink Platform Fee</span>
                            <span className="font-mono font-medium text-rose-600">− ₹{formatCurrency(platformFee)}</span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-gray-500">GST on CarBlink Platform Fee</span>
                            <span className="font-mono font-medium text-rose-600">− ₹{formatCurrency(gstOnPlatformFee)}</span>
                          </div>
                        </div>

                        <div className="pt-2.5 border-t border-slate-200/90 flex items-center justify-between bg-emerald-50/90 -mx-3.5 -mb-3.5 p-3 rounded-b-2xl border-t border-emerald-100">
                          <div>
                            <span className="font-bold text-emerald-950 block text-xs">
                              Estimated Partner Settlement
                            </span>
                            <span className="text-[10px] text-emerald-700 block">
                              Net payout after deductions
                            </span>
                          </div>
                          <span className="font-black text-emerald-700 text-base font-mono">
                            ₹{formatCurrency(estimatedSettlement)}
                          </span>
                        </div>
                      </div>
                    );
                  })()}
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
