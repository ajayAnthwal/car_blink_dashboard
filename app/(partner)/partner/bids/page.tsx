// @ts-nocheck
"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MessageSquareQuote, Loader2, IndianRupee, Clock, FileText, CheckCircle2, XCircle } from "lucide-react";
import { usePartnerBids, useWithdrawBidMutation } from "@/features/partner/hooks/usePartnerQueries";

export default function PartnerBidsPage() {
  const { data: bidsData, isLoading } = usePartnerBids();
  const bids = bidsData?.bids || [];
  
  const withdrawBidMutation = useWithdrawBidMutation();

  const [message, setMessage] = useState({ type: "", text: "" });

  const handleWithdraw = async (id: string) => {
    setMessage({ type: "", text: "" });
    try {
      await withdrawBidMutation.mutateAsync(id);
      setMessage({ type: "success", text: "Bid withdrawn successfully." });
    } catch (err: unknown) {
      setMessage({ type: "error", text: err?.message || "Failed to withdraw bid." });
    }
  };

  const getStatusDisplay = (status: string) => {
    switch(status?.toUpperCase()) {
      case 'ACCEPTED':
        return <span className="bg-success/10 text-success text-xs px-2.5 py-1 rounded-full font-medium border border-success/20 flex items-center"><CheckCircle2 className="w-3 h-3 mr-1" /> Accepted</span>;
      case 'REJECTED':
        return <span className="bg-danger/10 text-danger text-xs px-2.5 py-1 rounded-full font-medium border border-danger/20 flex items-center"><XCircle className="w-3 h-3 mr-1" /> Rejected</span>;
      case 'WITHDRAWN':
        return <span className="bg-neutral-muted/10 text-neutral-muted text-xs px-2.5 py-1 rounded-full font-medium border border-neutral-muted/20">Withdrawn</span>;
      default:
        return <span className="bg-warning/10 text-warning text-xs px-2.5 py-1 rounded-full font-medium border border-warning/20">Pending</span>;
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      <h2 className="text-2xl font-bold text-primary-navy">My Bids</h2>
      
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
      ) : bids.length === 0 ? (
        <div className="bg-neutral-white p-10 rounded-2xl shadow-sm border border-neutral-muted/20 text-center">
          <MessageSquareQuote className="w-12 h-12 text-neutral-muted/30 mb-3 mx-auto" />
          <p className="text-neutral-muted">You haven&apos;t placed any bids yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {bids.map((bid) => {
            const bidId = bid._id || bid.id;
            return (
            <Card key={bidId} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-bold text-primary-navy">
                        {bid.bookingId?.serviceId?.name || "Service Request"}
                      </h3>
                      {getStatusDisplay(bid.status)}
                    </div>
                    
                    <p className="text-sm text-neutral-muted mb-4">
                      For: <span className="font-medium text-neutral-dark">{bid.bookingId?.vehicleId?.brand} {bid.bookingId?.vehicleId?.model}</span>
                    </p>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                      <div className="bg-neutral-bg p-3 rounded-lg border border-neutral-muted/10">
                        <p className="text-xs text-neutral-muted flex items-center mb-1"><IndianRupee className="w-3 h-3 mr-1"/> Quoted Amount</p>
                        <p className="font-bold text-primary-navy text-lg">₹{bid.quotedAmount}</p>
                      </div>
                      <div className="bg-neutral-bg p-3 rounded-lg border border-neutral-muted/10">
                        <p className="text-xs text-neutral-muted flex items-center mb-1"><Clock className="w-3 h-3 mr-1"/> Est. Duration</p>
                        <p className="font-medium text-neutral-dark">{bid.estimatedDuration}</p>
                      </div>
                    </div>

                    {bid.notes && (
                      <div className="flex items-start bg-primary-navy/5 p-3 rounded-lg">
                        <FileText className="w-4 h-4 text-primary-navy mr-2 mt-0.5 shrink-0" />
                        <p className="text-sm text-neutral-dark italic">&quot;{bid.notes}&quot;</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col space-y-2 shrink-0 md:w-32 border-t md:border-t-0 md:border-l border-neutral-muted/10 pt-4 md:pt-0 md:pl-4">
                    {bid.status === "PENDING" && (
                      <Button 
                        variant="outline" 
                        className="w-full border-danger text-danger hover:bg-danger/5"
                        onClick={() => handleWithdraw(bidId)}
                        disabled={withdrawBidMutation.isPending}
                        isLoading={withdrawBidMutation.isPending}
                      >
                        Withdraw Bid
                      </Button>
                    )}
                    {bid.status === "ACCEPTED" && (
                      <p className="text-xs text-center text-success font-medium">Customer accepted your quote! Check My Jobs.</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
