// @ts-nocheck
"use client";

import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  MessageSquareQuote,
  Loader2,
  IndianRupee,
  Clock,
  FileText,
  CheckCircle2,
  XCircle,
  Search,
  ChevronLeft,
  ChevronRight,
  Car,
  Tag,
  AlertCircle,
  Sparkles,
  ArrowRight
} from "lucide-react";
import { usePartnerBids, useWithdrawBidMutation } from "@/features/partner/hooks/usePartnerQueries";
import Link from "next/link";

export default function PartnerBidsPage() {
  const [activeTab, setActiveTab] = useState<"ALL" | "PENDING" | "ACCEPTED" | "REJECTED_WITHDRAWN">("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Status mapping for API query
  const queryStatus = useMemo(() => {
    if (activeTab === "ALL") return undefined;
    if (activeTab === "REJECTED_WITHDRAWN") return undefined; // handle in client filter
    return activeTab;
  }, [activeTab]);

  const { data: bidsData, isLoading } = usePartnerBids({
    page,
    limit,
    status: queryStatus
  });

  const withdrawBidMutation = useWithdrawBidMutation();

  const allBidsRaw = bidsData?.bids || [];
  const totalBidsCount = bidsData?.total || allBidsRaw.length;

  // Search & Tab Filtering
  const bids = useMemo(() => {
    let list = allBidsRaw;

    if (activeTab === "REJECTED_WITHDRAWN") {
      list = list.filter((b: any) => b.status === "REJECTED" || b.status === "WITHDRAWN");
    } else if (activeTab === "PENDING") {
      list = list.filter((b: any) => b.status === "PENDING");
    } else if (activeTab === "ACCEPTED") {
      list = list.filter((b: any) => b.status === "ACCEPTED");
    }

    if (!searchTerm.trim()) return list;
    const term = searchTerm.toLowerCase();

    return list.filter((bid: any) => {
      const sName = (bid.bookingId?.serviceId?.name || "").toLowerCase();
      const brand = (bid.bookingId?.vehicleId?.brand || "").toLowerCase();
      const model = (bid.bookingId?.vehicleId?.model || "").toLowerCase();
      const notes = (bid.notes || "").toLowerCase();
      const id = (bid._id || bid.id || "").toLowerCase();
      return sName.includes(term) || brand.includes(term) || model.includes(term) || notes.includes(term) || id.includes(term);
    });
  }, [allBidsRaw, activeTab, searchTerm]);

  // Statistics
  const stats = useMemo(() => {
    return {
      total: totalBidsCount,
      pending: allBidsRaw.filter((b: any) => b.status === "PENDING").length,
      accepted: allBidsRaw.filter((b: any) => b.status === "ACCEPTED").length,
      other: allBidsRaw.filter((b: any) => b.status === "REJECTED" || b.status === "WITHDRAWN").length,
    };
  }, [allBidsRaw, totalBidsCount]);

  const [message, setMessage] = useState({ type: "", text: "" });

  const totalPages = Math.ceil(totalBidsCount / limit) || 1;

  const handleWithdraw = async (id: string) => {
    if (!confirm("Are you sure you want to withdraw this bid?")) return;
    setMessage({ type: "", text: "" });
    try {
      await withdrawBidMutation.mutateAsync(id);
      setMessage({ type: "success", text: "Bid withdrawn successfully." });
    } catch (err: any) {
      setMessage({ type: "error", text: err?.message || "Failed to withdraw bid." });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toUpperCase()) {
      case "ACCEPTED":
        return (
          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider flex items-center gap-1 shadow-2xs">
            <CheckCircle2 className="w-3.5 h-3.5" /> Accepted
          </span>
        );
      case "REJECTED":
        return (
          <span className="bg-red-50 text-red-700 border border-red-200 text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider flex items-center gap-1 shadow-2xs">
            <XCircle className="w-3.5 h-3.5" /> Rejected
          </span>
        );
      case "WITHDRAWN":
        return (
          <span className="bg-gray-100 text-gray-600 border border-gray-200 text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider shadow-2xs">
            Withdrawn
          </span>
        );
      default:
        return (
          <span className="bg-amber-50 text-amber-700 border border-amber-200 text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider flex items-center gap-1 shadow-2xs">
            <Clock className="w-3.5 h-3.5" /> Pending Review
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-primary-navy via-slate-800 to-primary-navy p-6 rounded-2xl text-white shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-primary-orange text-white text-[10px] font-black px-2.5 py-0.5 rounded uppercase tracking-wider">
              PARTNER QUOTES
            </span>
            <span className="text-gray-400 text-xs">• Lead Bidding</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight font-heading flex items-center gap-2">
            Submitted Bids & Quotes <MessageSquareQuote className="w-6 h-6 text-primary-orange" />
          </h1>
          <p className="text-gray-300 text-xs md:text-sm mt-1 font-medium">
            Track customer quote responses, accepted service bids, and active proposal statuses.
          </p>
        </div>

        {/* Statistics Summary */}
        <div className="flex items-center gap-3">
          <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/10 text-center min-w-[90px]">
            <span className="text-[10px] text-gray-300 uppercase font-bold block">Pending</span>
            <span className="text-xl font-extrabold text-amber-400">{stats.pending}</span>
          </div>
          <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/10 text-center min-w-[90px]">
            <span className="text-[10px] text-gray-300 uppercase font-bold block">Accepted</span>
            <span className="text-xl font-extrabold text-emerald-400">{stats.accepted}</span>
          </div>
        </div>
      </div>

      {/* Message Banner */}
      {message.text && (
        <div className={`p-4 rounded-xl text-sm font-bold border flex items-center justify-between shadow-sm animate-in fade-in ${
          message.type === "success"
            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
            : "bg-red-50 text-red-800 border-red-200"
        }`}>
          <div className="flex items-center gap-2">
            {message.type === "success" ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <AlertCircle className="w-5 h-5 text-red-600" />}
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage({ type: "", text: "" })} className="text-xs underline font-bold opacity-70 hover:opacity-100">
            Dismiss
          </button>
        </div>
      )}

      {/* Control Bar: Tabs + Search */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Status Tabs */}
          <div className="flex items-center bg-gray-100/80 p-1 rounded-xl w-full md:w-auto overflow-x-auto custom-scrollbar">
            <button
              onClick={() => { setActiveTab("ALL"); setPage(1); }}
              className={`px-4 py-2 rounded-lg text-xs font-extrabold transition-all duration-200 shrink-0 ${
                activeTab === "ALL" ? "bg-white text-primary-navy shadow-sm" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              All Bids ({stats.total})
            </button>
            <button
              onClick={() => { setActiveTab("PENDING"); setPage(1); }}
              className={`px-4 py-2 rounded-lg text-xs font-extrabold transition-all duration-200 shrink-0 ${
                activeTab === "PENDING" ? "bg-white text-amber-600 shadow-sm" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Pending ({stats.pending})
            </button>
            <button
              onClick={() => { setActiveTab("ACCEPTED"); setPage(1); }}
              className={`px-4 py-2 rounded-lg text-xs font-extrabold transition-all duration-200 shrink-0 ${
                activeTab === "ACCEPTED" ? "bg-white text-emerald-600 shadow-sm" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Accepted ({stats.accepted})
            </button>
            <button
              onClick={() => { setActiveTab("REJECTED_WITHDRAWN"); setPage(1); }}
              className={`px-4 py-2 rounded-lg text-xs font-extrabold transition-all duration-200 shrink-0 ${
                activeTab === "REJECTED_WITHDRAWN" ? "bg-white text-gray-700 shadow-sm" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Others ({stats.other})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by vehicle, service, notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-orange/50 bg-gray-50/50 font-medium"
            />
          </div>
        </div>
      </div>

      {/* Main Bids List */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-16 bg-white rounded-2xl shadow-sm border border-gray-100 space-y-3">
          <Loader2 className="w-9 h-9 text-primary-orange animate-spin" />
          <p className="text-xs text-gray-500 font-bold">Loading submitted bids...</p>
        </div>
      ) : bids.length === 0 ? (
        <div className="bg-white p-16 rounded-2xl shadow-sm border border-gray-100 text-center space-y-3">
          <div className="w-14 h-14 bg-orange-50 text-primary-orange rounded-full flex items-center justify-center mx-auto border border-orange-100">
            <MessageSquareQuote className="w-6 h-6 opacity-60" />
          </div>
          <h3 className="text-base font-bold text-gray-900">No bids found</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            {searchTerm ? `No bids matching "${searchTerm}". Try resetting your search.` : "You haven't placed any bids in this category."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {bids.map((bid: any) => {
            const bidId = bid._id || bid.id;
            const bData = bid.bookingId || {};
            const vData = bData.vehicleId || {};
            const sData = bData.serviceId || {};

            return (
              <Card key={bidId} className="hover:shadow-md transition-all duration-300 border border-gray-200/80 bg-white overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                    <div className="flex-1 space-y-4">
                      {/* Title & Badge */}
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-extrabold text-gray-900 font-heading">
                              {sData.name || "Service Proposal"}
                            </h3>
                            <span className="text-[10px] font-mono text-gray-400 bg-gray-100 px-2 py-0.5 rounded font-bold">
                              #{bidId.substring(bidId.length - 6).toUpperCase()}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 font-medium mt-1 flex items-center gap-1">
                            <Car className="w-3.5 h-3.5 text-primary-orange" />
                            For Vehicle: <strong className="text-gray-800">{vData.brand} {vData.model}</strong>
                          </p>
                        </div>
                        {getStatusBadge(bid.status)}
                      </div>

                      {/* Financial & Time Cards */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        <div className="bg-orange-50/50 p-3 rounded-xl border border-orange-100">
                          <p className="text-[11px] text-gray-500 font-bold uppercase tracking-wider mb-0.5">Quoted Amount</p>
                          <p className="text-xl font-black text-primary-orange flex items-center">
                            <IndianRupee className="w-4 h-4 mr-0.5" />
                            {Number(bid.quotedAmount || 0).toLocaleString("en-IN")}
                          </p>
                        </div>

                        <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100">
                          <p className="text-[11px] text-gray-500 font-bold uppercase tracking-wider mb-0.5">Est. Duration</p>
                          <p className="text-sm font-bold text-gray-800 flex items-center gap-1 mt-1">
                            <Clock className="w-4 h-4 text-blue-500" />
                            {bid.estimatedDuration || "Standard"}
                          </p>
                        </div>

                        {bid.createdAt && (
                          <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 col-span-2 sm:col-span-1">
                            <p className="text-[11px] text-gray-500 font-bold uppercase tracking-wider mb-0.5">Submitted On</p>
                            <p className="text-xs font-bold text-gray-700 mt-1">
                              {new Date(bid.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Partner Notes */}
                      {bid.notes && (
                        <div className="flex items-start bg-slate-50 p-3.5 rounded-xl border border-slate-100 text-xs text-gray-700">
                          <FileText className="w-4 h-4 text-primary-navy mr-2 shrink-0 mt-0.5" />
                          <p className="italic font-medium">&quot;{bid.notes}&quot;</p>
                        </div>
                      )}
                    </div>

                    {/* Action Panel */}
                    <div className="shrink-0 lg:w-44 flex flex-col justify-center border-t lg:border-t-0 lg:border-l border-gray-100 pt-4 lg:pt-0 lg:pl-6 space-y-3">
                      {bid.status === "PENDING" && (
                        <Button
                          variant="outline"
                          onClick={() => handleWithdraw(bidId)}
                          disabled={withdrawBidMutation.isPending}
                          isLoading={withdrawBidMutation.isPending}
                          className="w-full border-red-200 text-red-600 hover:bg-red-50 font-bold text-xs py-2 rounded-xl"
                        >
                          Withdraw Bid
                        </Button>
                      )}

                      {bid.status === "ACCEPTED" && (
                        <div className="space-y-2">
                          <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-center">
                            <p className="text-xs font-extrabold text-emerald-800 flex items-center justify-center gap-1">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Accepted!
                            </p>
                            <p className="text-[10px] text-emerald-600 mt-0.5">Customer selected your quote.</p>
                          </div>
                          <Button asChild className="w-full bg-primary-navy hover:bg-black text-white font-bold text-xs py-2 rounded-xl">
                            <Link href="/partner/jobs">
                              View Active Job <ArrowRight className="w-3.5 h-3.5 ml-1" />
                            </Link>
                          </Button>
                        </div>
                      )}

                      {bid.status === "WITHDRAWN" && (
                        <p className="text-xs text-center text-gray-400 font-bold py-2 bg-gray-50 rounded-xl">
                          Bid Withdrawn
                        </p>
                      )}

                      {bid.status === "REJECTED" && (
                        <p className="text-xs text-center text-red-400 font-bold py-2 bg-red-50/50 rounded-xl">
                          Quote Declined
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="bg-white p-4 rounded-2xl border border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
          <div className="text-xs text-gray-500 font-medium">
            Showing <strong className="text-gray-900">{((page - 1) * limit) + 1}</strong> to <strong className="text-gray-900">{Math.min(page * limit, totalBidsCount)}</strong> of <strong className="text-gray-900">{totalBidsCount}</strong> bids
          </div>

          {/* Page Controls */}
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className="text-xs font-bold border-gray-200"
            >
              <ChevronLeft className="w-4 h-4 mr-1" /> Previous
            </Button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pNum) => (
              <button
                key={pNum}
                onClick={() => setPage(pNum)}
                className={`w-8 h-8 rounded-lg text-xs font-extrabold transition-colors ${
                  page === pNum ? "bg-primary-orange text-white" : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                }`}
              >
                {pNum}
              </button>
            ))}

            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              className="text-xs font-bold border-gray-200"
            >
              Next <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
