"use client";

import React, { useState, useEffect } from "react";
import { getExecutiveLeads, assignLeadToPartner, getPartnerStatus, forwardQuoteToCustomer } from "@/lib/services";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select } from "@/components/ui/Select";
import { Target, Loader2, MapPin, Calendar, Car, Wrench, X, UserPlus } from "lucide-react";
import { useSocket } from "@/lib/SocketContext";
import Link from "next/link";

export default function ExecutiveLeadsPage() {
  const { socket } = useSocket();
  const [leads, setLeads] = useState<any[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [selectedLead, setSelectedLead] = useState<any | null>(null);
  const [partnerIds, setPartnerIds] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  
  const [forwardBidData, setForwardBidData] = useState<{ leadId: string, bids: any[] } | null>(null);
  const [selectedBidIds, setSelectedBidIds] = useState<string[]>([]);

  useEffect(() => {
    fetchLeads();
  }, []);

  useEffect(() => {
    if (!socket) return;
    socket.on("new_lead", fetchLeads);
    socket.on("quote_received", fetchLeads);
    socket.on("booking_confirmed", fetchLeads);

    return () => {
      socket.off("new_lead", fetchLeads);
      socket.off("quote_received", fetchLeads);
      socket.off("booking_confirmed", fetchLeads);
    };
  }, [socket]);

  const fetchLeads = async () => {
    try {
      setIsLoading(true);
      // Fetch available leads for assignment (PENDING status)
      let res, partnersRes;
      try {
        res = await getExecutiveLeads(1, 50, "status=PENDING,QUOTED");
      } catch (e) {
        console.error("Failed to fetch leads from API:", e);
      }
      try {
        partnersRes = await getPartnerStatus(1, 100, "status=ACTIVE");
      } catch (e) {
        console.error("Failed to fetch partners:", e);
      } 
      console.log("API RES:", res);
      let leadsArray = [];
      if (Array.isArray(res)) leadsArray = res;
      else if (res?.data && Array.isArray(res.data)) leadsArray = res.data;
      else if (res?.data?.leads && Array.isArray(res.data.leads)) leadsArray = res.data.leads;
      else if (res?.leads && Array.isArray(res.leads)) leadsArray = res.leads;
      else if (res?.data?.docs && Array.isArray(res.data.docs)) leadsArray = res.data.docs;
      else if (res?.docs && Array.isArray(res.docs)) leadsArray = res.docs;
      console.log("FINAL LEADS ARRAY:", leadsArray);
      setLeads(leadsArray);
      setPartners(Array.isArray(partnersRes?.docs) ? partnersRes.docs : (Array.isArray(partnersRes?.partners) ? partnersRes.partners : (Array.isArray(partnersRes?.data?.partners) ? partnersRes.data.partners : (Array.isArray(partnersRes) ? partnersRes : []))));
    } catch (err) {
      console.error("Failed to load leads", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssignLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead || partnerIds.length === 0) return;

    setIsSubmitting(true);
    setMessage({ type: "", text: "" });

    try {
      await assignLeadToPartner(selectedLead._id, {
        partnerIds,
        notes
      });

      setMessage({ type: "success", text: "Lead assigned successfully!" });
      setSelectedLead(null);
      setPartnerIds([]);
      setNotes("");
      fetchLeads();
    } catch (err: any) {
      setMessage({ type: "error", text: err?.message || "Failed to assign lead." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForwardQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forwardBidData || selectedBidIds.length === 0) return;

    setIsSubmitting(true);
    setMessage({ type: "", text: "" });

    try {
      await forwardQuoteToCustomer(forwardBidData.leadId, {
        bidIds: selectedBidIds,
        notes: notes
      });

      setMessage({ type: "success", text: "Quotes successfully forwarded to the customer!" });
      setForwardBidData(null);
      setSelectedBidIds([]);
      setNotes("");
      fetchLeads();
    } catch (err: any) {
      setMessage({ type: "error", text: err?.message || "Failed to forward quote." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto relative">
      <h2 className="text-2xl font-bold text-primary-navy">Lead Assignment</h2>
      
      <p className="text-neutral-muted text-sm mb-6">
        Review unassigned service requests and manually allocate them to specific partners.
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
          <p className="text-neutral-muted">All leads are currently assigned or no new requests exist.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {leads.map((lead) => (
            <Card key={lead._id} className="hover:shadow-md transition-shadow border-l-4 border-l-secondary-blue">
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-primary-navy mb-1">{lead.serviceId?.name || "Service Request"}</h3>
                    <div className="flex items-center text-xs text-neutral-muted space-x-3">
                      <span className="flex items-center"><MapPin className="w-3 h-3 mr-1"/> {lead.cityId?.name}</span>
                      <span className="flex items-center"><Calendar className="w-3 h-3 mr-1"/> {new Date(lead.preferredDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${lead.assignment?.assignedPartnerIds?.length > 0 ? 'bg-warning/10 text-warning-dark border-warning/20' : 'bg-secondary-blue/10 text-secondary-blue border-secondary-blue/20'}`}>
                    {lead.assignment?.assignedPartnerIds?.length > 0 ? (lead.bids?.length > 0 ? 'Quotes Received' : 'Bidding Requested') : 'Unassigned'}
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

                {lead.assignment?.assignedPartnerIds?.length > 0 && (
                  <div className="mb-4 p-2 bg-warning/5 rounded text-xs text-warning-dark flex items-center border border-warning/10">
                    <UserPlus className="w-3 h-3 mr-1" />
                    Requested Bids From: {lead.assignment.assignedPartnerIds.map((p: any) => p.businessName || 'Partner').join(', ')}
                  </div>
                )}

                {lead.bids && lead.bids.length > 0 && (
                  <div className="mb-4 p-3 bg-primary-navy/5 rounded-lg border border-primary-navy/10">
                    <h4 className="text-xs font-semibold text-primary-navy mb-2 flex items-center">
                      <Target className="w-3 h-3 mr-1" />
                      Received Bids ({lead.bids.length})
                    </h4>
                    <div className="space-y-2">
                      {lead.bids.map((bid: any) => (
                        <div key={bid._id} className="flex justify-between items-center text-xs bg-white p-2 rounded border border-neutral-muted/20">
                          <div>
                            <span className="font-medium text-neutral-dark">{bid.partnerId?.businessName || 'Partner'}</span>
                            <div className="text-neutral-muted mt-0.5">₹{bid.quotedAmount} {bid.estimatedDuration ? `• ${bid.estimatedDuration}` : ''}</div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="px-2 py-0.5 bg-neutral-muted/10 rounded-full text-neutral-dark font-medium text-[10px]">
                              {bid.status === 'PENDING' ? 'AWAITING REVIEW' : bid.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                    {lead.status === 'PENDING' && lead.bids.length > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-3 text-xs text-secondary-blue border-secondary-blue/30 hover:bg-secondary-blue/10"
                        onClick={() => {
                          setForwardBidData({ leadId: lead._id, bids: lead.bids });
                          setSelectedBidIds(lead.bids.map((b: any) => b._id));
                        }}
                      >
                        Forward Quotes to Customer
                      </Button>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-neutral-muted mb-4 border-t border-neutral-muted/10 pt-3">
                  <div className="flex flex-col space-y-1">
                    <span>Customer ID: {lead.customerId?._id?.substring(0,8) || "Unknown"}</span>
                    {lead.customerId?.rewardPoints !== undefined && <span className="text-yellow-600 font-bold">Points: {lead.customerId?.rewardPoints}</span>}
                  </div>
                  <div className="flex flex-col space-y-1 text-right">
                    <span>Booking ID: {lead._id.substring(0,8)}</span>
                    {lead.customerId?.totalSavings !== undefined && <span className="text-teal-600 font-bold">Savings: ₹{lead.customerId?.totalSavings}</span>}
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Button 
                    className={`flex-1 flex items-center justify-center ${lead.assignment?.assignedPartnerIds?.length > 0 ? 'bg-neutral-muted/20 text-neutral-dark hover:bg-neutral-muted/30' : 'bg-secondary-blue hover:bg-secondary-blue/90'}`}
                    onClick={() => setSelectedLead(lead)}
                    variant={lead.assignment?.assignedPartnerIds?.length > 0 ? "outline" : "default"}
                  >
                    <UserPlus className="w-4 h-4 mr-2" /> 
                    {lead.assignment?.assignedPartnerIds?.length > 0 ? "Assign More" : "Assign to Partner"}
                  </Button>
                  <Button variant="outline" asChild className="flex-1 flex items-center justify-center border-gray-200 hover:bg-gray-50">
                    <Link href={`/executive/leads/${lead._id || lead.id}`}>
                      View Details
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Assignment Modal */}
      {selectedLead && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md shadow-2xl">
            <CardHeader className="flex flex-row items-center justify-between border-b border-neutral-muted/10 pb-4">
              <CardTitle>Assign Partner</CardTitle>
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
                <p className="text-neutral-muted">{selectedLead.vehicleId?.brand} {selectedLead.vehicleId?.model} • {selectedLead.cityId?.name}</p>
              </div>

              <form onSubmit={handleAssignLead} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-dark mb-1.5">Select Partners</label>
                    <div className="max-h-48 overflow-y-auto space-y-2 border border-neutral-muted/20 p-2 rounded-lg bg-neutral-white">
                      {partners.map(p => (
                        <div key={p._id} className="flex items-center space-x-2 p-2 hover:bg-neutral-muted/10 rounded cursor-pointer">
                          <input 
                            type="checkbox"
                            id={`partner-${p._id}`}
                            checked={partnerIds.includes(p._id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setPartnerIds(prev => [...prev, p._id]);
                              } else {
                                setPartnerIds(prev => prev.filter(id => id !== p._id));
                              }
                            }}
                            className="rounded border-neutral-muted text-secondary-blue focus:ring-secondary-blue cursor-pointer"
                          />
                          <label htmlFor={`partner-${p._id}`} className="flex-1 text-sm cursor-pointer select-none">
                            <span className="font-medium">{p.businessName || p.fullName}</span>
                            <span className="text-neutral-muted ml-1">({p.city?.name || 'Unknown Location'})</span>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                
                <div>
                  <label className="block text-sm font-medium text-neutral-dark mb-1.5">Assignment Notes (Optional)</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="E.g. Expedite this request..."
                    rows={3}
                    className="flex w-full rounded-lg border border-neutral-muted/40 bg-neutral-white px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:border-primary-orange focus:ring-primary-orange/20"
                  />
                </div>

                <div className="flex space-x-3 pt-2">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setSelectedLead(null)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1 bg-secondary-blue hover:bg-secondary-blue/90" isLoading={isSubmitting}>
                    Assign Partner
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Forward Quote Modal */}
      {forwardBidData && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md shadow-2xl">
            <CardHeader className="flex flex-row items-center justify-between border-b border-neutral-muted/10 pb-4">
              <CardTitle>Forward Quotes to Customer</CardTitle>
              <button 
                onClick={() => { setForwardBidData(null); setSelectedBidIds([]); }}
                className="text-neutral-muted hover:text-neutral-dark"
              >
                <X className="w-5 h-5" />
              </button>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="mb-4 bg-primary-navy/5 p-3 rounded-lg text-sm max-h-48 overflow-y-auto">
                <p className="font-semibold text-primary-navy mb-2">Select Quotes to Forward:</p>
                {forwardBidData.bids.map((bid: any) => (
                  <div key={bid._id} className="flex items-center space-x-2 mb-2 p-2 bg-white rounded border border-neutral-muted/20">
                    <input 
                      type="checkbox" 
                      id={`bid-${bid._id}`}
                      checked={selectedBidIds.includes(bid._id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedBidIds(prev => [...prev, bid._id]);
                        } else {
                          setSelectedBidIds(prev => prev.filter(id => id !== bid._id));
                        }
                      }}
                      className="rounded border-neutral-muted text-secondary-blue focus:ring-secondary-blue cursor-pointer"
                    />
                    <label htmlFor={`bid-${bid._id}`} className="flex-1 text-sm cursor-pointer">
                      <div className="font-medium text-neutral-dark">{bid.partnerId?.businessName}</div>
                      <div className="text-xs text-neutral-muted">₹{bid.quotedAmount} {bid.estimatedDuration ? `• ${bid.estimatedDuration}` : ''}</div>
                    </label>
                  </div>
                ))}
              </div>

              <form onSubmit={handleForwardQuote} className="space-y-4">
                <p className="text-sm text-neutral-muted">
                  Are you sure you want to forward the selected quotes to the customer? The booking status will be changed to QUOTED and the customer will receive an SMS notification.
                </p>

                <div className="flex space-x-3 pt-2">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => { setForwardBidData(null); setSelectedBidIds([]); }}>
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1 bg-secondary-blue hover:bg-secondary-blue/90" isLoading={isSubmitting} disabled={selectedBidIds.length === 0}>
                    Forward Quotes ({selectedBidIds.length})
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
