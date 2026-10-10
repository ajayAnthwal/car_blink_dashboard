"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Target, Loader2, MapPin, Calendar, Car, Wrench, X, UserPlus, Search, ChevronLeft, ChevronRight, CheckCircle, Clock, Zap } from "lucide-react";
import { useSocket } from "@/lib/SocketContext";
import Link from "next/link";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import toast from "react-hot-toast";

// Data fetching hooks
import {
  useExecutiveLeads,
  useAssignLeadMutation,
  useForwardQuoteMutation,
  useConfirmQuoteMutation,
  useUpdateLead,
  useServices,
  usePartnerStatus,
  useEligiblePartnersForLead
} from "@/features/executive/hooks/useExecutiveQueries";

// Zod schemas
const assignLeadSchema = z.object({
  partnerIds: z.array(z.string()).min(1, "Select at least one partner"),
  notes: z.string().optional(),
});
type AssignLeadFormValues = z.infer<typeof assignLeadSchema>;

const forwardQuoteSchema = z.object({
  bidIds: z.array(z.string()).min(1, "Select at least one quote to forward"),
});
type ForwardQuoteFormValues = z.infer<typeof forwardQuoteSchema>;

const followUpSchema = z.object({
  followUpDate: z.string().optional(),
  remarks: z.string().optional(),
});
type FollowUpFormValues = z.infer<typeof followUpSchema>;

export default function ExecutiveLeadsPage() {
  const { socket } = useSocket();

  // Pagination & Search state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const getStatusQuery = (filter: string) => {
    if (filter === "ACCEPTED") return "CUSTOMER_ACCEPTED,ACCEPTED,VERIFIED,IN_PROGRESS,COMPLETED";
    if (filter === "BIDDING") return "PENDING,QUOTED";
    if (filter === "IN_PROGRESS") return "VERIFIED,IN_PROGRESS,COMPLETED";
    return "PENDING,QUOTED,CUSTOMER_ACCEPTED,ACCEPTED,VERIFIED,IN_PROGRESS,COMPLETED";
  };

  // React Query: Fetch Leads
  const {
    data: leadsData,
    isLoading: isLeadsLoading,
    refetch: refetchLeads
  } = useExecutiveLeads({ page, limit, search, status: getStatusQuery(statusFilter) });

  const leads = leadsData?.leads || [];
  const total = (leadsData as any)?.total || (leadsData as any)?.count || leads.length || 0;
  const totalPages = total ? Math.ceil(total / limit) : 1;

  // React Query: Fetch Services
  const { data: allServices = [] } = useServices();

  // Socket realtime updates
  useEffect(() => {
    if (!socket) return;
    socket.on("new_lead", refetchLeads);
    socket.on("quote_received", refetchLeads);
    socket.on("booking_confirmed", refetchLeads);
    socket.on("job_verified", refetchLeads);
    socket.on("booking_status_update", refetchLeads);
    socket.on("booking_updated", refetchLeads);
    socket.on("satisfaction_response", refetchLeads);
    socket.on("satisfaction_request", refetchLeads);

    return () => {
      socket.off("new_lead", refetchLeads);
      socket.off("quote_received", refetchLeads);
      socket.off("booking_confirmed", refetchLeads);
      socket.off("job_verified", refetchLeads);
      socket.off("booking_status_update", refetchLeads);
      socket.off("booking_updated", refetchLeads);
      socket.off("satisfaction_response", refetchLeads);
      socket.off("satisfaction_request", refetchLeads);
    };
  }, [socket, refetchLeads]);

  // Mutations
  const assignMutation = useAssignLeadMutation();
  const forwardMutation = useForwardQuoteMutation();
  const confirmQuoteMutation = useConfirmQuoteMutation();
  const updateLeadMutation = useUpdateLead();

  // --- Assign Partner Modal State & Form ---
  const [selectedLead, setSelectedLead] = useState<any | null>(null);
  const [radiusKm, setRadiusKm] = useState<string>("all");
  const [selectedServiceFilter, setSelectedServiceFilter] = useState<string>("all");
  const [useCityFilter, setUseCityFilter] = useState<boolean>(false);

  const assignForm = useForm<AssignLeadFormValues>({
    resolver: zodResolver(assignLeadSchema),
    defaultValues: { partnerIds: [], notes: "" }
  });

  // Fetch strictly evaluated eligible partners for selected lead (distance, quotes, availability, performance)
  const { data: eligibleData, isLoading: isFetchingPartners } = useEligiblePartnersForLead(
    selectedLead?._id,
    {
      includeAll: true,
      cityId: useCityFilter ? selectedLead?.cityId?._id : undefined,
      maxRadiusKm: radiusKm !== "all" ? Number(radiusKm) : undefined,
    }
  );

  const partners: any[] = useMemo(() => {
    if (Array.isArray(eligibleData)) return eligibleData;
    if (Array.isArray(eligibleData?.partners)) return eligibleData.partners;
    if (Array.isArray(eligibleData?.data)) return eligibleData.data;
    return [];
  }, [eligibleData]);

  const openAssignModal = (lead: any) => {
    setSelectedLead(lead);
    setRadiusKm("all");
    setSelectedServiceFilter("all");
    setUseCityFilter(true); // Default to matching Lead's City / Address
    assignForm.reset({ partnerIds: [], notes: "" });
  };

  const handleAssignSubmit = (data: AssignLeadFormValues) => {
    if (!selectedLead) return;
    assignMutation.mutate(
      { id: selectedLead._id, data },
      {
        onSuccess: () => {
          toast.success("Lead assigned successfully!");
          setSelectedLead(null);
        },
        onError: (err: any) => {
          toast.error(err?.message || "Failed to assign lead.");
        }
      }
    );
  };

  // --- Forward Quote Modal State & Form ---
  const [forwardBidData, setForwardBidData] = useState<{ leadId: string, bids: any[] } | null>(null);

  const forwardForm = useForm<ForwardQuoteFormValues>({
    resolver: zodResolver(forwardQuoteSchema),
    defaultValues: { bidIds: [] }
  });


  const handleConfirmQuote = async (leadId: string) => {
    try {
      await confirmQuoteMutation.mutateAsync(leadId);
      toast.success("Customer selection confirmed! Job assigned to partner successfully.");
      refetchLeads();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to confirm quote selection");
    }
  };

  const handleForwardSubmit = (data: ForwardQuoteFormValues) => {
    if (!forwardBidData) return;
    forwardMutation.mutate(
      { id: forwardBidData.leadId, data },
      {
        onSuccess: () => {
          toast.success("Quotes successfully forwarded to the customer!");
          setForwardBidData(null);
        },
        onError: (err: any) => {
          toast.error(err?.message || "Failed to forward quote.");
        }
      }
    );
  };

  // --- Follow-Up Edit State & Form ---
  const [editingLeadId, setEditingLeadId] = useState<string | null>(null);

  const followUpForm = useForm<FollowUpFormValues>({
    resolver: zodResolver(followUpSchema),
    defaultValues: { followUpDate: "", remarks: "" }
  });

  const handleUpdateLead = (leadId: string, data: FollowUpFormValues) => {
    updateLeadMutation.mutate(
      {
        id: leadId,
        data: {
          followUpDate: data.followUpDate || undefined,
          remarks: data.remarks
        }
      },
      {
        onSuccess: () => {
          toast.success("Follow-up updated successfully");
          setEditingLeadId(null);
        },
        onError: (err: any) => {
          toast.error(err?.message || "Failed to update lead");
        }
      }
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto relative pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-2xl font-bold text-primary-navy">Lead Assignment</h2>
            <span className="bg-blue-100 text-blue-800 text-xs font-extrabold px-2.5 py-0.5 rounded-full border border-blue-200">
              Customer Bookings
            </span>
          </div>
          <p className="text-neutral-muted text-sm">
            Review customer service requests, track quote acceptances, and assign partners.
          </p>
        </div>

        {/* Lead Type Quick Switcher */}
        <div className="flex items-center bg-slate-200/70 p-1 rounded-xl border border-slate-300/60 shadow-2xs">
          <Link
            href="/executive/leads"
            className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-white text-primary-navy shadow-sm flex items-center gap-1.5"
          >
            <Car className="w-3.5 h-3.5 text-blue-600" /> Platform Bookings
          </Link>
          <Link
            href="/executive/website-leads"
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 transition-colors"
          >
            <Target className="w-3.5 h-3.5 text-primary-orange" /> Website Enquiries & Quotes
          </Link>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
        <div className="flex items-center bg-gray-200/80 p-1 rounded-xl w-full sm:w-auto">
          <button
            onClick={() => { setStatusFilter("ALL"); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${statusFilter === "ALL" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"}`}
          >
            All Active
          </button>
          <button
            onClick={() => { setStatusFilter("ACCEPTED"); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${statusFilter === "ACCEPTED" ? "bg-emerald-600 text-white shadow-sm" : "text-emerald-700 hover:bg-emerald-50"}`}
          >
            Customer Accepted ✓
          </button>
          <button
            onClick={() => { setStatusFilter("BIDDING"); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${statusFilter === "BIDDING" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"}`}
          >
            Bidding / Pending
          </button>
          <button
            onClick={() => { setStatusFilter("IN_PROGRESS"); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${statusFilter === "IN_PROGRESS" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"}`}
          >
            In Progress / Done
          </button>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); setPage(1); }} className="w-full sm:w-64 relative">
          <Input
            placeholder="Search customer, vehicle, location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-white text-xs"
          />
          <Search className="w-4 h-4 text-neutral-muted absolute left-3 top-1/2 -translate-y-1/2" />
        </form>
      </div>

      {isLeadsLoading ? (
        <div className="flex items-center justify-center p-10 bg-neutral-white rounded-2xl shadow-sm border border-neutral-muted/20">
          <Loader2 className="w-8 h-8 text-primary-orange animate-spin" />
        </div>
      ) : leads.length === 0 ? (
        <div className="bg-neutral-white p-10 rounded-2xl shadow-sm border border-neutral-muted/20 text-center">
          <Target className="w-12 h-12 text-neutral-muted/30 mb-3 mx-auto" />
          <p className="text-neutral-muted">All leads are currently assigned or no new requests exist.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
          <div className="overflow-x-auto">
            <Table className="w-full min-w-[980px]">
              <TableHeader className="bg-slate-50 border-b border-slate-200">
                <TableRow>
                  <TableHead className="whitespace-nowrap font-bold text-[11px] uppercase tracking-wider text-slate-700 min-w-[200px]">Lead ID & Customer</TableHead>
                  <TableHead className="whitespace-nowrap font-bold text-[11px] uppercase tracking-wider text-slate-700 min-w-[230px]">Service Details</TableHead>
                  <TableHead className="whitespace-nowrap font-bold text-[11px] uppercase tracking-wider text-slate-700 min-w-[140px]">Executive Owner</TableHead>
                  <TableHead className="whitespace-nowrap font-bold text-[11px] uppercase tracking-wider text-slate-700 min-w-[230px]">Bids & Status</TableHead>
                  <TableHead className="whitespace-nowrap font-bold text-[11px] uppercase tracking-wider text-slate-700 min-w-[180px] text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.map((lead: any) => (
                  <TableRow key={lead._id} className="hover:bg-slate-50/70 transition-colors border-b border-slate-100">

                    {/* Customer & Lead ID */}
                    <TableCell className="min-w-[200px] align-top py-3.5">
                      <div className="flex flex-col space-y-1">
                        <span className="font-semibold text-primary-navy text-sm">
                          {lead.customerId?.fullName || lead.fullName || lead.customerName || (lead.customerId?.phone || lead.phone ? `Customer (${lead.customerId?.phone || lead.phone})` : "Guest Customer")}
                        </span>
                        <div className="text-xs text-neutral-muted flex flex-col">
                          {(lead.customerId?.phone || lead.phone) && <span>{lead.customerId?.phone || lead.phone}</span>}
                          {(lead.customerId?.email || lead.email) && <span className="truncate max-w-[180px]" title={lead.customerId?.email || lead.email}>{lead.customerId?.email || lead.email}</span>}
                        </div>
                        <div className="mt-2 text-[10px] text-neutral-muted flex items-center space-x-2">
                          <span className="bg-gray-100 px-1.5 py-0.5 rounded font-medium border">ID: {lead._id.substring(0, 8)}</span>
                          {lead.customerId?.rewardPoints !== undefined && <span className="text-yellow-600 font-bold">⭐ {lead.customerId?.rewardPoints}</span>}
                        </div>
                      </div>
                    </TableCell>

                    {/* Service Details */}
                    <TableCell className="min-w-[230px] max-w-[280px] align-top py-3.5 whitespace-normal break-words">
                      <div className="flex flex-col space-y-1">
                        <span className="font-bold text-sm text-neutral-dark flex items-center gap-1.5">
                          <Wrench className="w-3.5 h-3.5 text-primary-orange shrink-0" />
                          {lead.serviceId?.name || "Service Request"}
                        </span>
                        <span className="text-xs font-medium text-neutral-600 flex items-center gap-1.5">
                          <Car className="w-3.5 h-3.5 text-neutral-muted shrink-0" />
                          {lead.vehicleId?.brand} {lead.vehicleId?.model}
                        </span>

                        {(lead.serviceMode || (lead.paymentMode && lead.paymentMode === 'CASH')) && (
                          <div className="flex flex-wrap gap-1.5 mt-1.5">
                            {lead.serviceMode && (
                              <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px] font-medium border border-blue-100 uppercase">
                                {lead.serviceMode.replace('_', ' ')}
                              </span>
                            )}
                            {lead.paymentMode === 'CASH' && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold border uppercase inline-flex items-center gap-1 bg-amber-50 text-amber-800 border-amber-200">
                                💵 CASH
                              </span>
                            )}
                          </div>
                        )}
                        <p className="text-[11px] text-neutral-muted line-clamp-2 mt-1.5 whitespace-normal break-words" title={lead.description}>
                          {lead.description || "No description provided."}
                        </p>
                      </div>
                    </TableCell>

                    {/* Executive Owner & Claim Button */}
                    <TableCell className="min-w-[140px] align-top py-3.5">
                      <div className="flex flex-col space-y-1.5">
                        {lead.assignedExecutiveId ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200">
                            👤 {lead.assignedExecutiveId?.fullName || "Executive"}
                          </span>
                        ) : (
                          <div className="flex flex-col space-y-1">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                              ⚠️ Unassigned
                            </span>
                            <Button
                              size="sm"
                              className="text-[10px] h-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2 py-0"
                              onClick={() => {
                                assignMutation.mutate(
                                  { id: lead._id, data: { notes: "Claimed by Executive" } },
                                  {
                                    onSuccess: () => toast.success("Lead claimed successfully!"),
                                    onError: (err: any) => toast.error(err?.message || "Failed to claim lead.")
                                  }
                                );
                              }}
                            >
                              <UserPlus className="w-3 h-3 mr-1" /> Claim Lead
                            </Button>
                          </div>
                        )}
                      </div>
                    </TableCell>

                    {/* Bids & Status */}
                    <TableCell className="min-w-[230px] align-top py-3.5">
                      <div className="flex flex-col space-y-2">
                        <span className={`inline-flex self-start px-2 py-0.5 rounded text-[10px] font-extrabold border ${
                          lead.status === 'VERIFIED' || lead.isVerifiedByPartner
                            ? 'bg-purple-100 text-purple-800 border-purple-300'
                            : lead.status === 'IN_PROGRESS' 
                            ? 'bg-blue-100 text-blue-800 border-blue-300' 
                            : lead.status === 'COMPLETED' 
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
                            : lead.status === 'ACCEPTED'
                            ? 'bg-teal-100 text-teal-800 border-teal-300'
                            : lead.status === 'CUSTOMER_ACCEPTED'
                            ? ((lead.payments?.some((p: any) => p.status === 'SUCCESS' && (p.paymentType === 'ADVANCE' || p.paymentType === 'FULL' || p.amount > 0)) || lead.hasPaidAdvance)
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                : 'bg-amber-100 text-amber-800 border-amber-300 animate-pulse') 
                            : lead.assignment?.assignedPartnerIds?.length > 0 
                            ? 'bg-warning/10 text-warning-dark border-warning/20' 
                            : 'bg-secondary-blue/10 text-secondary-blue border-secondary-blue/20'
                        }`}>
                          {lead.status === 'VERIFIED' || lead.isVerifiedByPartner
                            ? 'VERIFIED / WORK READY ⚡'
                            : lead.status === 'IN_PROGRESS' 
                            ? 'JOB IN PROGRESS 🔧' 
                            : lead.status === 'COMPLETED' 
                            ? 'JOB COMPLETED 🎉' 
                            : lead.status === 'ACCEPTED'
                            ? 'PARTNER ASSIGNED ✓'
                            : lead.status === 'CUSTOMER_ACCEPTED' 
                            ? ((lead.payments?.some((p: any) => p.status === 'SUCCESS' && (p.paymentType === 'ADVANCE' || p.paymentType === 'FULL' || p.amount > 0)) || lead.hasPaidAdvance)
                                ? 'CUSTOMER ACCEPTED & PAID ✓'
                                : 'AWAITING ADVANCE PAYMENT ⏳') 
                            : lead.assignment?.assignedPartnerIds?.length > 0 
                            ? (lead.bids?.length > 0 ? 'QUOTES RECEIVED' : 'BIDDING REQUESTED') 
                            : 'UNASSIGNED'}
                        </span>

                        {lead.verifiedAt && (
                          <div className="text-[10px] text-purple-700 bg-purple-50 p-1 rounded border border-purple-200 flex items-center gap-1 font-semibold">
                            <Clock className="w-3 h-3 text-purple-500" /> Verified: {new Date(lead.verifiedAt).toLocaleTimeString()}
                          </div>
                        )}

                        {/* Show Assigned Partner Workshop if assigned or in progress */}
                        {(lead.status === 'ACCEPTED' || lead.status === 'VERIFIED' || lead.status === 'IN_PROGRESS' || lead.status === 'COMPLETED') && (
                          (lead.job?.partnerId || lead.assignedPartnerId || lead.acceptedBidId?.partnerId) ? (
                            <div className="text-[10px] text-emerald-800 bg-emerald-50/90 p-1.5 rounded border border-emerald-200">
                              <span className="font-semibold block mb-0.5 text-emerald-900">Assigned Partner:</span>
                              <span className="font-bold">
                                {lead.job?.partnerId?.businessName || lead.assignedPartnerId?.businessName || lead.acceptedBidId?.partnerId?.businessName || "Workshop Partner"}
                              </span>
                            </div>
                          ) : null
                        )}

                        {/* Show bidding partners during bidding phase */}
                        {(lead.status === 'PENDING' || lead.status === 'QUOTED') && lead.assignment?.assignedPartnerIds?.length > 0 && (
                          <div className="text-[10px] text-neutral-600 bg-gray-50 p-1.5 rounded border">
                            <span className="font-semibold block mb-0.5">Requested from:</span>
                            <span className="line-clamp-2">{lead.assignment.assignedPartnerIds.map((p: any) => p.businessName || 'Partner').join(', ')}</span>
                          </div>
                        )}

                        {lead.bids && lead.bids.length > 0 && (
                          <div className="flex flex-col gap-1 mt-1">
                            <span className="text-[10px] font-semibold text-primary-navy">{lead.bids.length} Bids Received:</span>
                            {lead.bids.map((bid: any) => (
                              <div key={bid._id} className="flex justify-between items-center text-[10px] bg-white p-1.5 rounded border border-gray-200 shadow-2xs">
                                <span className="font-medium truncate max-w-[120px]" title={bid.partnerId?.businessName}>{bid.partnerId?.businessName || 'Partner'}</span>
                                <span className="font-bold text-green-700">₹{bid.quotedAmount}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="align-top py-3.5 min-w-[180px] w-[180px]">
                      <div className="flex flex-col gap-2 items-center">
                        {(lead.status === 'PENDING' || lead.status === 'QUOTED') && (
                          <Button
                            size="sm"
                            className={`w-full text-[11px] font-semibold h-8 whitespace-nowrap shadow-2xs ${
                              lead.assignment?.assignedPartnerIds?.length > 0 
                                ? 'bg-slate-100 text-slate-800 border border-slate-200 hover:bg-slate-200' 
                                : 'bg-secondary-blue hover:bg-secondary-blue/90 text-white'
                            }`}
                            onClick={() => openAssignModal(lead)}
                          >
                            <UserPlus className="w-3.5 h-3.5 mr-1" />
                            <span>{lead.assignment?.assignedPartnerIds?.length > 0 ? "Assign More / Forward" : "Forward to Partner"}</span>
                          </Button>
                        )}

                        {lead.status === 'CUSTOMER_ACCEPTED' && (
                          ((lead.payments?.some((p: any) => p.status === 'SUCCESS' && (p.paymentType === 'ADVANCE' || p.paymentType === 'FULL' || p.amount > 0))) || lead.hasPaidAdvance) ? (
                            <Button
                              size="sm"
                              className="w-full text-[11px] font-bold h-8 bg-emerald-600 hover:bg-emerald-700 text-white whitespace-nowrap shadow-sm"
                              onClick={() => handleConfirmQuote(lead._id)}
                              disabled={confirmQuoteMutation.isPending}
                            >
                              <CheckCircle className="w-3.5 h-3.5 mr-1" />
                              <span>{confirmQuoteMutation.isPending ? "Confirming..." : "Confirm & Assign"}</span>
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full text-[10px] font-bold h-8 text-amber-800 border-amber-300 bg-amber-50 hover:bg-amber-100 whitespace-nowrap shadow-2xs"
                              onClick={() => {
                                toast.error("Customer has selected quote but HAS NOT paid the advance payment yet! Advance payment is required to confirm booking.", { duration: 5000 });
                              }}
                            >
                              <Clock className="w-3.5 h-3.5 mr-1 text-amber-600" />
                              <span>Awaiting Advance Payment</span>
                            </Button>
                          )
                        )}

                        {lead.status === 'ACCEPTED' && (
                          <div className="w-full text-center text-[11px] font-bold text-teal-800 bg-teal-50 border border-teal-200 py-1.5 px-2 rounded-lg flex items-center justify-center gap-1 shadow-2xs whitespace-nowrap">
                            <CheckCircle className="w-3.5 h-3.5 text-teal-600" />
                            <span>Partner Assigned</span>
                          </div>
                        )}

                        {(lead.status === 'VERIFIED' || lead.isVerifiedByPartner) && lead.status !== 'IN_PROGRESS' && lead.status !== 'COMPLETED' && (
                          <div className="w-full text-center text-[11px] font-bold text-purple-800 bg-purple-50 border border-purple-200 py-1.5 px-2 rounded-lg flex items-center justify-center gap-1 shadow-2xs whitespace-nowrap">
                            <Zap className="w-3.5 h-3.5 text-purple-600" />
                            <span>PIN Verified / Ready</span>
                          </div>
                        )}

                        {lead.status === 'IN_PROGRESS' && (
                          <div className="w-full text-center text-[11px] font-bold text-blue-800 bg-blue-50 border border-blue-200 py-1.5 px-2 rounded-lg flex items-center justify-center gap-1 shadow-2xs whitespace-nowrap">
                            <Wrench className="w-3.5 h-3.5 text-blue-600" />
                            <span>Job In Progress</span>
                          </div>
                        )}

                        {lead.status === 'COMPLETED' && (
                          <div className="w-full text-center text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 py-1.5 px-2 rounded-lg flex items-center justify-center gap-1 shadow-2xs whitespace-nowrap">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Job Completed</span>
                          </div>
                        )}

                        {(lead.status === 'PENDING' || lead.status === 'QUOTED') && lead.bids?.length > 0 && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full text-[10px] h-7 text-secondary-blue border-secondary-blue/30 hover:bg-secondary-blue/10 whitespace-nowrap"
                            onClick={() => {
                              setForwardBidData({ leadId: lead._id, bids: lead.bids });
                              forwardForm.reset({ bidIds: lead.bids.map((b: any) => b._id) });
                            }}
                          >
                            Forward Quotes
                          </Button>
                        )}

                        {/* Send Satisfaction Template Button (Only when job is COMPLETED) */}
                        {lead.status === "COMPLETED" ? (
                          lead.satisfactionStatus === "PENDING_CUSTOMER" ? (
                            <span className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded-full font-bold text-center w-full block">
                              ⏳ Form Sent (Pending)
                            </span>
                          ) : lead.satisfactionStatus === "SATISFIED" ? (
                            <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-full font-bold text-center w-full block">
                              💚 Customer Satisfied
                            </span>
                          ) : lead.satisfactionStatus === "DISSATISFIED" ? (
                            <span className="text-[10px] text-red-700 bg-red-50 border border-red-200 px-2 py-1 rounded-full font-bold text-center w-full block">
                              🔴 Customer Dissatisfied
                            </span>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full text-[10px] h-7 text-primary-orange border-primary-orange/30 hover:bg-orange-50 font-bold whitespace-nowrap"
                              onClick={async () => {
                                try {
                                  const { sendSatisfactionTemplate } = await import("@/lib/services");
                                  await sendSatisfactionTemplate(lead._id);
                                  toast.success("Satisfaction Form template sent to customer!");
                                  refetchLeads();
                                } catch (err: any) {
                                  toast.error(err?.response?.data?.message || err.message || "Failed to send satisfaction form");
                                }
                              }}
                            >
                              Send Satisfaction Form
                            </Button>
                          )
                        ) : null}

                        <Button variant="ghost" size="sm" asChild className="w-full text-xs h-7 text-neutral-500 hover:text-primary-navy">
                          <Link href={`/executive/leads/${lead._id || lead.id}`}>
                            View Full Details
                          </Link>
                        </Button>
                      </div>
                    </TableCell>

                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Pagination Controls */}
      {!isLeadsLoading && total > 0 && (
        <div className="px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 border border-gray-200 bg-white shadow-sm mt-4 rounded-xl">
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span>
              Showing <span className="font-bold text-gray-900">{Math.min((page - 1) * limit + 1, total)}</span> to <span className="font-bold text-gray-900">{Math.min(page * limit, total)}</span> of <span className="font-bold text-gray-900">{total}</span> leads
            </span>
            
            <div className="flex items-center gap-1.5 border-l border-gray-200 pl-4">
              <span>Per page:</span>
              <select 
                value={limit}
                onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
                className="border border-gray-200 rounded px-2 py-1 text-xs font-semibold bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-primary-navy"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 text-xs font-semibold border border-gray-200 rounded-md bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 shadow-sm transition-all"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Previous
            </button>

            <div className="flex items-center gap-1 px-2">
              <span className="text-xs font-bold text-gray-900">{page}</span>
              <span className="text-xs text-gray-400">/</span>
              <span className="text-xs font-medium text-gray-500">{totalPages}</span>
            </div>

            <button 
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1.5 text-xs font-semibold border border-gray-200 rounded-md bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 shadow-sm transition-all"
            >
              Next <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Assignment Modal */}
      {selectedLead && (
        <div className="fixed inset-0 bg-neutral-navy/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
              <div>
                <h3 className="text-xl font-bold text-gray-900 font-heading flex items-center gap-2">
                  <span>Assign Partner Workshop</span>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                    Strict Eligible Only
                  </span>
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Only verified &amp; active workshops matching requested service and availability can be assigned.
                </p>
              </div>
              <button
                onClick={() => setSelectedLead(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-5">
              {/* Lead Summary Header */}
              <div className="bg-gradient-to-r from-primary-navy/5 to-transparent p-4 rounded-xl border border-primary-navy/10 flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-primary-navy/10 flex items-center justify-center shrink-0">
                  <Car className="w-5 h-5 text-primary-navy" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-primary-navy text-base">{selectedLead.serviceId?.name || "Service Request"}</p>
                    {selectedLead.serviceId?.category && (
                      <span className="text-[11px] font-semibold bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                        {selectedLead.serviceId.category}
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 text-xs mt-1">
                    {selectedLead.vehicleId?.brand} {selectedLead.vehicleId?.model} • {selectedLead.cityId?.name || "Dehradun"}
                    {selectedLead.preferredDate && ` • Preferred: ${new Date(selectedLead.preferredDate).toLocaleDateString()}`}
                  </p>
                </div>
              </div>

              <form id="assignForm" onSubmit={assignForm.handleSubmit(handleAssignSubmit)} className="space-y-5">
                {/* Filters */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">City Scope</label>
                    <select
                      value={useCityFilter ? "city" : "all"}
                      onChange={(e) => setUseCityFilter(e.target.value === "city")}
                      className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-2 bg-white text-gray-800 outline-none focus:ring-1 focus:ring-primary-navy"
                    >
                      <option value="city">Lead's City Only ({selectedLead?.cityId?.name || "Local"})</option>
                      <option value="all">All Cities</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">Max Distance</label>
                    <select
                      value={radiusKm}
                      onChange={(e) => setRadiusKm(e.target.value)}
                      className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-2 bg-white text-gray-800 outline-none focus:ring-1 focus:ring-primary-navy"
                    >
                      <option value="all">Any Distance</option>
                      <option value="5">Within 5 km</option>
                      <option value="10">Within 10 km</option>
                      <option value="15">Within 15 km</option>
                      <option value="30">Within 30 km</option>
                    </select>
                  </div>
                  <div className="col-span-2 sm:col-span-1 flex flex-col justify-end">
                    <span className="text-[11px] text-gray-500 font-medium">Eligible Workshops</span>
                    <span className="font-bold text-sm text-emerald-700">
                      {partners.filter((p: any) => p.isEligible !== false).length} of {partners.length} eligible
                    </span>
                  </div>
                </div>

                {/* Partner Comparison List */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Partner Comparison &amp; Selection
                    </label>
                    {assignForm.formState.errors.partnerIds && (
                      <span className="text-red-500 text-xs font-semibold">{assignForm.formState.errors.partnerIds.message}</span>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto space-y-2.5 pr-1 relative custom-scrollbar">
                    {isFetchingPartners && (
                      <div className="py-12 flex flex-col items-center justify-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
                        <Loader2 className="w-6 h-6 animate-spin text-primary-navy" />
                        <p className="text-xs font-medium text-gray-500 mt-2">Checking partner eligibility &amp; proximity...</p>
                      </div>
                    )}

                    {!isFetchingPartners && partners.length === 0 && (
                      <div className="py-10 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200 p-4">
                        <Target className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm font-bold text-gray-700">No eligible partners found in this city</p>
                        <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                          No active verified workshops are registered in {selectedLead?.cityId?.name || "this location"}.
                        </p>
                        {useCityFilter && (
                          <button
                            type="button"
                            onClick={() => setUseCityFilter(false)}
                            className="mt-3 px-3 py-1.5 text-xs font-semibold rounded-lg bg-primary-navy text-white hover:bg-primary-navy/90 transition-colors shadow-2xs"
                          >
                            Switch to All Cities
                          </button>
                        )}
                      </div>
                    )}

                    <Controller
                      name="partnerIds"
                      control={assignForm.control}
                      render={({ field }) => (
                        <>
                          {partners.map((p: any) => {
                            const pId = p.partnerId || p._id;
                            const isSelected = field.value.includes(pId);
                            const isEligible = p.isEligible !== false;

                            return (
                              <div
                                key={pId}
                                onClick={() => {
                                  if (!isEligible) return;
                                  if (isSelected) {
                                    field.onChange(field.value.filter((id: string) => id !== pId));
                                  } else {
                                    field.onChange([...field.value, pId]);
                                  }
                                }}
                                className={`p-3.5 rounded-xl border transition-all text-left ${
                                  !isEligible
                                    ? "bg-gray-50/70 border-gray-200 opacity-60 cursor-not-allowed"
                                    : isSelected
                                    ? "border-primary-orange bg-orange-50/20 shadow-xs cursor-pointer ring-1 ring-primary-orange"
                                    : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-xs cursor-pointer"
                                }`}
                              >
                                <div className="flex items-start gap-3">
                                  {/* Checkbox */}
                                  <div
                                    className={`w-5 h-5 rounded mt-0.5 flex items-center justify-center shrink-0 transition-colors ${
                                      !isEligible
                                        ? "bg-gray-200 text-gray-400"
                                        : isSelected
                                        ? "bg-primary-orange text-white"
                                        : "border-2 border-gray-300 bg-white"
                                    }`}
                                  >
                                    {isSelected && (
                                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                      </svg>
                                    )}
                                  </div>

                                  {/* Main Details */}
                                  <div className="flex-1 min-w-0 space-y-1.5">
                                    <div className="flex items-center justify-between gap-2 flex-wrap">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-bold text-sm text-gray-900">{p.businessName}</span>
                                        {p.uniquePartnerId && (
                                          <span className="font-mono text-[10px] font-black bg-blue-100 text-blue-900 px-1.5 py-0.5 rounded border border-blue-200">
                                            {p.uniquePartnerId}
                                          </span>
                                        )}
                                      </div>

                                      <div className="flex items-center gap-1.5">
                                        {isEligible ? (
                                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                                            ✓ Eligible
                                          </span>
                                        ) : (
                                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-800">
                                            Disabled
                                          </span>
                                        )}
                                      </div>
                                    </div>

                                    {/* Metrics Grid */}
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
                                      {/* Distance */}
                                      <div className="bg-slate-50 p-1.5 rounded border border-slate-200/60">
                                        <span className="text-gray-400 block text-[10px]">Distance</span>
                                        <span className="font-semibold text-slate-800">
                                          {p.distanceKm !== null ? `${p.distanceKm} km away` : "City Registered"}
                                        </span>
                                      </div>

                                      {/* Existing Quote */}
                                      <div className="bg-slate-50 p-1.5 rounded border border-slate-200/60">
                                        <span className="text-gray-400 block text-[10px]">Existing Quote</span>
                                        <span className={`font-bold ${p.quote ? "text-emerald-700" : "text-gray-500"}`}>
                                          {p.quote ? `₹${p.quote.quotedAmount}` : "None yet"}
                                        </span>
                                      </div>

                                      {/* Availability */}
                                      <div className="bg-slate-50 p-1.5 rounded border border-slate-200/60">
                                        <span className="text-gray-400 block text-[10px]">Availability</span>
                                        <span className={`font-semibold ${p.availability?.isAvailable ? "text-emerald-700" : "text-amber-700"}`}>
                                          {p.availability?.isAvailable ? "Available" : "At Capacity"}
                                        </span>
                                      </div>

                                      {/* Rating & Performance */}
                                      <div className="bg-slate-50 p-1.5 rounded border border-slate-200/60">
                                        <span className="text-gray-400 block text-[10px]">Rating &amp; Jobs</span>
                                        <span className="font-semibold text-amber-800">
                                          ★ {p.performance?.rating ? p.performance.rating.toFixed(1) : "New"} ({p.performance?.totalJobsCompleted || 0} jobs)
                                        </span>
                                      </div>
                                    </div>

                                    {/* Ineligibility Reason Banner */}
                                    {!isEligible && p.ineligibilityReasons?.length > 0 && (
                                      <p className="text-[11px] text-red-700 bg-red-50/80 p-1.5 rounded border border-red-200 font-medium">
                                        ⚠️ Ineligible: {p.ineligibilityReasons.join(" • ")}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </>
                      )}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                    Notes for Partner <span className="text-gray-400 font-normal lowercase">(Optional)</span>
                  </label>
                  <textarea
                    {...assignForm.register("notes")}
                    placeholder="E.g. Expedite this request..."
                    rows={2}
                    className="w-full text-sm rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-navy/20 focus:border-primary-navy"
                  />
                </div>
              </form>
            </div>

            <div className="p-5 border-t border-gray-100 bg-gray-50 flex space-x-3 mt-auto">
              <Button
                type="button"
                variant="outline"
                className="flex-1 bg-white border-gray-200 hover:bg-gray-100 text-gray-700 h-12 rounded-xl shadow-sm"
                onClick={() => setSelectedLead(null)}
              >
                Cancel
              </Button>
              <Button
                form="assignForm"
                type="submit"
                className="flex-1 bg-primary-navy hover:bg-primary-navy-light text-white h-12 rounded-xl shadow-lg shadow-primary-navy/20"
                isLoading={assignMutation.isPending}
                disabled={assignForm.watch("partnerIds").length === 0}
              >
                Assign Partner {assignForm.watch("partnerIds").length > 0 && `(${assignForm.watch("partnerIds").length})`}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Forward Quote Modal */}
      {forwardBidData && (
        <div className="fixed inset-0 bg-neutral-navy/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900 font-heading">Forward Quotes</h3>
                <p className="text-sm text-gray-500 mt-1">Send received bids to the customer</p>
              </div>
              <button
                onClick={() => setForwardBidData(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              <div className="mb-4 bg-primary-navy/5 p-4 rounded-xl border border-primary-navy/10">
                <p className="font-semibold text-primary-navy mb-3">Select Quotes to Forward:</p>
                <form id="forwardForm" onSubmit={forwardForm.handleSubmit(handleForwardSubmit)}>
                  <Controller
                    name="bidIds"
                    control={forwardForm.control}
                    render={({ field }) => (
                      <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-2">
                        {forwardBidData.bids.map((bid: any) => {
                          const isSelected = field.value.includes(bid._id);
                          return (
                            <div
                              key={bid._id}
                              onClick={() => {
                                if (isSelected) field.onChange(field.value.filter(id => id !== bid._id));
                                else field.onChange([...field.value, bid._id]);
                              }}
                              className={`flex items-center space-x-3 p-3 rounded-xl border transition-all cursor-pointer ${isSelected ? 'border-secondary-blue bg-secondary-blue/5' : 'border-gray-200 bg-white hover:border-gray-300'}`}
                            >
                              <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'bg-secondary-blue text-white' : 'border-2 border-gray-300'}`}>
                                {isSelected && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                              </div>
                              <div className="flex-1 cursor-pointer">
                                <div className="font-bold text-gray-900 text-sm">{bid.partnerId?.businessName}</div>
                                <div className="text-xs text-gray-500 mt-0.5">₹{bid.quotedAmount} {bid.estimatedDuration ? `• ${bid.estimatedDuration}` : ''}</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  />
                  {forwardForm.formState.errors.bidIds && (
                    <p className="text-red-500 text-xs font-medium mt-2">{forwardForm.formState.errors.bidIds.message}</p>
                  )}
                </form>
              </div>

              <p className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg border border-gray-100">
                Are you sure you want to forward the selected quotes to the customer? The booking status will be changed to <span className="font-bold">QUOTED</span> and the customer will receive an SMS notification.
              </p>
            </div>

            <div className="p-5 border-t border-gray-100 bg-gray-50 flex space-x-3 mt-auto">
              <Button type="button" variant="outline" className="flex-1 bg-white border-gray-200 hover:bg-gray-100 text-gray-700 h-12 rounded-xl" onClick={() => setForwardBidData(null)}>
                Cancel
              </Button>
              <Button
                form="forwardForm"
                type="submit"
                className="flex-1 bg-secondary-blue hover:bg-secondary-blue/90 text-white h-12 rounded-xl"
                isLoading={forwardMutation.isPending}
              >
                Forward {forwardForm.watch("bidIds").length > 0 && `(${forwardForm.watch("bidIds").length})`}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
