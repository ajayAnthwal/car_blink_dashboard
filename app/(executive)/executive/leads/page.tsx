"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Target, Loader2, MapPin, Calendar, Car, Wrench, X, UserPlus, Search, ChevronLeft, ChevronRight } from "lucide-react";
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
  useUpdateLead,
  useServices,
  usePartnerStatus
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

  // React Query: Fetch Leads
  const {
    data: leadsData,
    isLoading: isLeadsLoading,
    refetch: refetchLeads
  } = useExecutiveLeads({ page, limit, search, status: "PENDING,QUOTED" });

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

    return () => {
      socket.off("new_lead", refetchLeads);
      socket.off("quote_received", refetchLeads);
      socket.off("booking_confirmed", refetchLeads);
    };
  }, [socket, refetchLeads]);

  // Mutations
  const assignMutation = useAssignLeadMutation();
  const forwardMutation = useForwardQuoteMutation();
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

  // Construct query string for usePartnerStatus based on filters
  const partnerFilterStr = useMemo(() => {
    if (!selectedLead) return "verificationStatus=APPROVED";
    let query = "verificationStatus=APPROVED";

    // Geo distance filter — check lead location OR customer saved profile location
    if (radiusKm !== "all") {
      const coords = selectedLead?.location?.coordinates?.length === 2
        ? selectedLead.location.coordinates
        : (selectedLead?.customerId?.location?.coordinates?.length === 2 ? selectedLead.customerId.location.coordinates : null);

      if (coords) {
        const [lng, lat] = coords;
        query += `&lat=${lat}&lng=${lng}&radius=${radiusKm}`;
      }
    }

    if (selectedServiceFilter !== "all") {
      query += `&serviceId=${selectedServiceFilter}`;
    }
    return query;
  }, [selectedLead, radiusKm, selectedServiceFilter]);

  const { data: partnersData, isLoading: isFetchingPartners } = usePartnerStatus(1, 100, partnerFilterStr);
  const pData = partnersData as any;
  const rawPartners = Array.isArray(pData?.partners)
    ? pData.partners
    : (Array.isArray(pData?.docs) ? pData.docs : (Array.isArray(pData) ? pData : []));

// Sub-location coordinates map for instant, accurate Haversine distance calculation
const LOCATION_COORDINATES_MAP: Record<string, [number, number]> = {
  "rispna": [78.0556, 30.2931],
  "rispna pull": [78.0556, 30.2931],
  "isbt": [78.0322, 30.3165],
  "isbt dehradun": [78.0322, 30.3165],
  "clock tower": [78.0422, 30.3256],
  "ghanta ghar": [78.0422, 30.3256],
  "rajpur": [78.0612, 30.3421],
  "rajpur road": [78.0612, 30.3421],
  "ballupur": [78.0089, 30.3341],
  "subhash nagar": [77.9944, 30.2711],
  "cle": [77.9944, 30.2711],
  "prem nagar": [77.9622, 30.3321],
  "patel nagar": [78.0211, 30.3089],
  "saharanpur road": [78.0211, 30.3089],
  "dehradun": [78.0322, 30.3165],
  "bhuddi": [77.9800, 30.2600],
  "agar": [76.0167, 23.7167],
};

function getCoordinatesForLocationText(text: string): [number, number] | null {
  if (!text) return null;
  const lower = text.toLowerCase();
  for (const [key, coords] of Object.entries(LOCATION_COORDINATES_MAP)) {
    if (lower.includes(key)) {
      return coords;
    }
  }
  return null;
}

  // Client-side text address & distance filter logic with SMART PROXIMITY SORTING
  const partners = useMemo(() => {
    if (!selectedLead) return rawPartners;

    // Safely extract location text without regex destruction
    const rawDesc = (selectedLead.description || "").replace(/Vehicle:[^,]+/gi, "").replace(/Fuel:[^,]+/gi, "");
    const rawMsg = (selectedLead.message || "").replace(/Vehicle:[^,]+/gi, "").replace(/Fuel:[^,]+/gi, "");

    const combinedLocText = [
      selectedLead.address,
      selectedLead.city,
      selectedLead.cityId?.name,
      rawDesc,
      rawMsg,
    ].filter(Boolean).join(" ").toLowerCase();

    // Resolve GPS coordinates for lead (either from lead object or text geocoding map)
    const leadCoords = selectedLead?.location?.coordinates?.length === 2
      ? selectedLead.location.coordinates
      : (selectedLead?.customerId?.location?.coordinates?.length === 2
          ? selectedLead.customerId.location.coordinates
          : getCoordinatesForLocationText(combinedLocText));

    const stopWords = new Set([
      "custom", "address", "location", "services", "fuel", "vehicle", "testing", "booking",
      "petrol", "diesel", "cng", "maruti", "suzuki", "dzire", "tata", "motors", "tiago",
      "honda", "hyundai", "car", "wash", "repair", "service", "lead", "request", "details",
      "visit", "garage", "doorstep", "quoted", "pending", "status", "road", "near", "opposite", "street"
    ]);

    const leadKeywords = combinedLocText
      .split(/[\s|,|:|-|\/|\n]+/)
      .map(w => w.trim())
      .filter(w => w.length > 2 && !stopWords.has(w));

    // Compute distance and text match score for each partner
    const processedPartners = rawPartners.map((p: any) => {
      let calcDist = p.distance;
      let matchScore = 0;

      // 1. Calculate GPS spherical distance if coords exist
      if (leadCoords && p.location?.coordinates?.length === 2) {
        const [lon1, lat1] = leadCoords;
        const [lon2, lat2] = p.location.coordinates;
        const R = 6371e3; // meters
        const φ1 = (lat1 * Math.PI) / 180;
        const φ2 = (lat2 * Math.PI) / 180;
        const Δφ = ((lat2 - lat1) * Math.PI) / 180;
        const Δλ = ((lon2 - lon1) * Math.PI) / 180;
        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
                  Math.cos(φ1) * Math.cos(φ2) *
                  Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        calcDist = Math.round(R * c);
      }

      // 2. Calculate text location match score against businessAddress and city name
      const pCityName = (p.cityId?.name || p.city?.name || "").toLowerCase();
      const pAddress = (p.businessAddress || "").toLowerCase();
      const pText = `${pCityName} ${pAddress}`;

      let matchedWordsCount = 0;
      leadKeywords.forEach((kw) => {
        if (pText.includes(kw)) {
          matchedWordsCount += 1;
        }
      });

      matchScore = matchedWordsCount;

      return {
        ...p,
        calculatedDistance: calcDist,
        matchScore: matchScore,
        matchedKeyword: leadKeywords.find(kw => pText.includes(kw)) || ""
      };
    });

    // 1. Apply Service Filter if selected
    let filteredList = processedPartners;
    if (selectedServiceFilter !== "all") {
      filteredList = filteredList.filter((p: any) => {
        if (!p.servicesOffered || p.servicesOffered.length === 0) return true;
        return p.servicesOffered.some((s: any) => {
          const sId = typeof s === 'object' ? s._id : s;
          return String(sId) === String(selectedServiceFilter);
        });
      });
    }

    // 2. Filter by Distance / Radius if active
    let resultList = filteredList;
    if (radiusKm !== "all") {
      const maxDistMeters = Number(radiusKm) * 1000;
      if (leadCoords) {
        resultList = filteredList.filter((p: any) => {
          if (p.calculatedDistance !== undefined && p.calculatedDistance !== null) {
            return p.calculatedDistance <= maxDistMeters;
          }
          return p.matchScore > 0;
        });
      } else if (leadKeywords.length > 0) {
        resultList = filteredList.filter((p: any) => p.matchScore > 0);
      }
    } else if (useCityFilter && leadKeywords.length > 0) {
      resultList = filteredList.filter((p: any) => p.matchScore > 0);
    }

    // 3. SMART PROXIMITY SORTING: Closest distance first, or Highest Location Match Score first!
    resultList.sort((a: any, b: any) => {
      // If GPS distance is present for both, sort by closest distance
      if (a.calculatedDistance !== undefined && a.calculatedDistance !== null &&
          b.calculatedDistance !== undefined && b.calculatedDistance !== null) {
        return a.calculatedDistance - b.calculatedDistance;
      }
      // Otherwise sort by highest text match score
      if (b.matchScore !== a.matchScore) {
        return b.matchScore - a.matchScore;
      }
      return 0;
    });

    return resultList;
  }, [rawPartners, useCityFilter, radiusKm, selectedServiceFilter, selectedLead]);

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
          <h2 className="text-2xl font-bold text-primary-navy">Lead Assignment</h2>
          <p className="text-neutral-muted text-sm mt-1">
            Review unassigned service requests and manually allocate them to specific partners.
          </p>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); setPage(1); }} className="w-full md:w-64 relative">
          <Input
            placeholder="Search leads..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
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
        <div className="bg-white rounded-xl shadow-sm border border-neutral-muted/20 overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-50/50">
                <TableRow>
                  <TableHead className="whitespace-nowrap font-semibold">Lead ID & Customer</TableHead>
                  <TableHead className="whitespace-nowrap font-semibold">Service Details</TableHead>
                  <TableHead className="whitespace-nowrap font-semibold">Location & Time</TableHead>
                  <TableHead className="whitespace-nowrap font-semibold">Bids & Status</TableHead>
                  <TableHead className="whitespace-nowrap font-semibold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.map((lead: any) => (
                  <TableRow key={lead._id} className="hover:bg-gray-50/50">

                    {/* Customer & Lead ID */}
                    <TableCell className="min-w-[200px] align-top">
                      <div className="flex flex-col space-y-1">
                        <span className="font-semibold text-primary-navy text-sm">
                          {lead.customerId?.fullName || "Unknown Customer"}
                        </span>
                        <div className="text-xs text-neutral-muted flex flex-col">
                          {lead.customerId?.phone && <span>{lead.customerId.phone}</span>}
                          {lead.customerId?.email && <span>{lead.customerId.email}</span>}
                        </div>
                        <div className="mt-2 text-[10px] text-neutral-muted flex items-center space-x-2">
                          <span className="bg-gray-100 px-1.5 py-0.5 rounded font-medium border">ID: {lead._id.substring(0, 8)}</span>
                          {lead.customerId?.rewardPoints !== undefined && <span className="text-yellow-600 font-bold">⭐ {lead.customerId?.rewardPoints}</span>}
                        </div>
                      </div>
                    </TableCell>

                    {/* Service Details */}
                    <TableCell className="min-w-[220px] max-w-[280px] align-top whitespace-normal break-words">
                      <div className="flex flex-col space-y-1">
                        <span className="font-bold text-sm text-neutral-dark flex items-center gap-1.5">
                          <Wrench className="w-3.5 h-3.5 text-primary-orange" />
                          {lead.serviceId?.name || "Service Request"}
                        </span>
                        <span className="text-xs font-medium text-neutral-600 flex items-center gap-1.5">
                          <Car className="w-3.5 h-3.5 text-neutral-muted" />
                          {lead.vehicleId?.brand} {lead.vehicleId?.model}
                        </span>

                        {(lead.serviceMode || lead.paymentMode) && (
                          <div className="flex flex-wrap gap-1.5 mt-1.5">
                            {lead.serviceMode && (
                              <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px] font-medium border border-blue-100 uppercase">
                                {lead.serviceMode.replace('_', ' ')}
                              </span>
                            )}
                            {lead.paymentMode && (
                              <span className="px-1.5 py-0.5 bg-green-50 text-green-700 rounded text-[10px] font-medium border border-green-100 uppercase">
                                {lead.paymentMode}
                              </span>
                            )}
                          </div>
                        )}
                        <p className="text-[11px] text-neutral-muted line-clamp-2 mt-1.5 whitespace-normal break-words" title={lead.description}>
                          {lead.description || "No description provided."}
                        </p>
                      </div>
                    </TableCell>

                    {/* Location & Time */}
                    <TableCell className="min-w-[200px] align-top">
                      <div className="flex flex-col space-y-2">
                        <div className="flex items-start text-xs text-neutral-700 gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-neutral-muted mt-0.5 shrink-0" />
                          <div className="flex flex-col">
                            <span className="font-medium">{lead.cityId?.name}</span>
                            {lead.address && <span className="text-[10px] text-neutral-muted">{lead.address} {lead.landmark && `(${lead.landmark})`}</span>}
                          </div>
                        </div>
                        <div className="flex items-start text-xs text-neutral-700 gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-neutral-muted mt-0.5 shrink-0" />
                          <span className="font-medium">{new Date(lead.preferredDate).toLocaleString()}</span>
                        </div>

                        {/* Follow Up */}
                        <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between group">
                          <div className="flex flex-col">
                            <span className="text-[10px] font-semibold text-primary-navy">Follow-up:</span>
                            <span className="text-[10px] text-neutral-600">
                              {lead.followUpDate ? new Date(lead.followUpDate).toLocaleString() : 'Not Set'}
                            </span>
                          </div>
                          <button onClick={() => {
                            setEditingLeadId(lead._id);
                            followUpForm.reset({
                              followUpDate: lead.followUpDate ? new Date(new Date(lead.followUpDate).getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().slice(0, 16) : "",
                              remarks: lead.remarks || ""
                            });
                          }} className="text-[10px] text-secondary-blue hover:underline opacity-0 group-hover:opacity-100 transition-opacity">
                            Edit
                          </button>
                        </div>
                        {editingLeadId === lead._id && (
                          <form onSubmit={followUpForm.handleSubmit((d) => handleUpdateLead(lead._id, d))} className="mt-2 space-y-2 bg-gray-50 p-2 rounded border border-gray-100">
                            <div>
                              <input
                                type="datetime-local"
                                className="w-full border rounded p-1 text-[10px]"
                                {...followUpForm.register("followUpDate")}
                              />
                            </div>
                            <div>
                              <input
                                type="text"
                                className="w-full border rounded p-1 text-[10px]"
                                placeholder="Remarks..."
                                {...followUpForm.register("remarks")}
                              />
                            </div>
                            <div className="flex space-x-2 pt-1">
                              <Button type="submit" size="sm" isLoading={updateLeadMutation.isPending} className="flex-1 text-[10px] h-5 bg-secondary-blue p-0">Save</Button>
                              <Button type="button" size="sm" variant="outline" onClick={() => setEditingLeadId(null)} className="flex-1 text-[10px] h-5 p-0">Cancel</Button>
                            </div>
                          </form>
                        )}
                      </div>
                    </TableCell>

                    {/* Bids & Status */}
                    <TableCell className="min-w-[220px] align-top">
                      <div className="flex flex-col space-y-2">
                        <span className={`inline-flex self-start px-2 py-0.5 rounded text-[10px] font-bold border ${lead.assignment?.assignedPartnerIds?.length > 0 ? 'bg-warning/10 text-warning-dark border-warning/20' : 'bg-secondary-blue/10 text-secondary-blue border-secondary-blue/20'}`}>
                          {lead.assignment?.assignedPartnerIds?.length > 0 ? (lead.bids?.length > 0 ? 'QUOTES RECEIVED' : 'BIDDING REQUESTED') : 'UNASSIGNED'}
                        </span>

                        {lead.assignment?.assignedPartnerIds?.length > 0 && (
                          <div className="text-[10px] text-neutral-600 bg-gray-50 p-1.5 rounded border">
                            <span className="font-semibold block mb-0.5">Requested from:</span>
                            <span className="line-clamp-2">{lead.assignment.assignedPartnerIds.map((p: any) => p.businessName || 'Partner').join(', ')}</span>
                          </div>
                        )}

                        {lead.bids && lead.bids.length > 0 && (
                          <div className="flex flex-col gap-1 mt-1">
                            <span className="text-[10px] font-semibold text-primary-navy">{lead.bids.length} Bids Received:</span>
                            {lead.bids.map((bid: any) => (
                              <div key={bid._id} className="flex justify-between items-center text-[10px] bg-white p-1 rounded border border-gray-200">
                                <span className="font-medium truncate max-w-[80px]" title={bid.partnerId?.businessName}>{bid.partnerId?.businessName || 'Partner'}</span>
                                <span className="font-bold text-green-700">₹{bid.quotedAmount}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="align-top text-right min-w-[140px]">
                      <div className="flex flex-col gap-2 items-end">
                        <Button
                          size="sm"
                          className={`w-full text-xs h-8 ${lead.assignment?.assignedPartnerIds?.length > 0 ? 'bg-white text-neutral-dark border border-gray-200 hover:bg-gray-50' : 'bg-secondary-blue hover:bg-secondary-blue/90'}`}
                          onClick={() => openAssignModal(lead)}
                        >
                          <UserPlus className="w-3.5 h-3.5 mr-1.5" />
                          {lead.assignment?.assignedPartnerIds?.length > 0 ? "Assign More" : "Assign"}
                        </Button>

                        {lead.status === 'PENDING' && lead.bids?.length > 0 && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full text-[10px] h-7 text-secondary-blue border-secondary-blue/30 hover:bg-secondary-blue/10"
                            onClick={() => {
                              setForwardBidData({ leadId: lead._id, bids: lead.bids });
                              forwardForm.reset({ bidIds: lead.bids.map((b: any) => b._id) });
                            }}
                          >
                            Forward Quotes
                          </Button>
                        )}

                        {/* Send Satisfaction Template Button */}
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full text-[10px] h-7 text-primary-orange border-primary-orange/30 hover:bg-orange-50 font-bold"
                          onClick={async () => {
                            try {
                              const { sendSatisfactionTemplate } = await import("@/lib/services");
                              await sendSatisfactionTemplate(lead._id);
                              toast.success("Satisfaction Form template sent to customer!");
                              refetchLeads();
                            } catch (err: any) {
                              toast.error(err.message || "Failed to send satisfaction form");
                            }
                          }}
                        >
                          Send Satisfaction Form
                        </Button>

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
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
              <div>
                <h3 className="text-xl font-bold text-gray-900 font-heading">Assign Partner</h3>
                <p className="text-sm text-gray-500 mt-1">Select the best partner for this service request</p>
              </div>
              <button
                onClick={() => setSelectedLead(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <div className="mb-6 bg-gradient-to-r from-primary-navy/5 to-transparent p-4 rounded-xl border border-primary-navy/10 flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-primary-navy/10 flex items-center justify-center shrink-0">
                  <Car className="w-5 h-5 text-primary-navy" />
                </div>
                <div>
                  <p className="font-bold text-primary-navy text-lg">{selectedLead.serviceId?.name}</p>
                  <p className="text-gray-600 text-sm mt-0.5">{selectedLead.vehicleId?.brand} {selectedLead.vehicleId?.model} • {selectedLead.cityId?.name}</p>
                </div>
              </div>

              <form id="assignForm" onSubmit={assignForm.handleSubmit(handleAssignSubmit)} className="space-y-6">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">City Filter</label>
                    <select
                      value={useCityFilter ? "city" : "all"}
                      onChange={(e) => setUseCityFilter(e.target.value === "city")}
                      className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 bg-gray-50 hover:bg-gray-100/50 transition-colors focus:ring-2 focus:ring-primary-navy/20 focus:border-primary-navy outline-none"
                    >
                      <option value="all">All Cities</option>
                      <option value="city">Lead's City ({selectedLead?.cityId?.name || selectedLead?.city || "Local"})</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Service Filter</label>
                    <select
                      value={selectedServiceFilter}
                      onChange={(e) => setSelectedServiceFilter(e.target.value)}
                      className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 bg-gray-50 hover:bg-gray-100/50 transition-colors focus:ring-2 focus:ring-primary-navy/20 focus:border-primary-navy outline-none"
                    >
                      <option value="all">All Categories</option>
                      {selectedLead?.serviceId?._id && (
                        <option value={selectedLead.serviceId._id}>Match Lead Service ({selectedLead.serviceId.name})</option>
                      )}
                      <optgroup label="All Services">
                        {allServices.map((s: any) => (
                          <option key={s._id} value={s._id}>{s.name} {s.category ? `(${s.category})` : ''}</option>
                        ))}
                      </optgroup>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Distance</label>
                    <select
                      value={radiusKm}
                      onChange={(e) => setRadiusKm(e.target.value)}
                      className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 bg-gray-50 hover:bg-gray-100/50 transition-colors focus:ring-2 focus:ring-primary-navy/20 focus:border-primary-navy outline-none"
                    >
                      <option value="all">Any Distance</option>
                      <option value="5">Within 5 km</option>
                      <option value="10">Within 10 km</option>
                      <option value="15">Within 15 km</option>
                      <option value="50">Within 50 km</option>
                    </select>
                  </div>
                </div>

                {(() => {
                  const hasCoords = selectedLead?.location?.coordinates?.length === 2 || selectedLead?.customerId?.location?.coordinates?.length === 2;
                  const rawLoc = [
                    selectedLead?.cityId?.name,
                    selectedLead?.city,
                    selectedLead?.address,
                    selectedLead?.message,
                  ].filter(Boolean).join(" ");
                  const leadLoc = rawLoc.replace(/Custom Address:|Location:|Services:.*$/gi, "").trim() || "Local";

                  if (useCityFilter && leadLoc) {
                    return (
                      <div className="flex items-center gap-2 text-xs text-primary-navy bg-primary-navy/5 p-3 rounded-xl border border-primary-navy/15 font-medium">
                        <MapPin className="w-4 h-4 text-primary-orange shrink-0" />
                        <span>Matching partners by lead location text: <strong className="text-primary-navy">{leadLoc}</strong></span>
                      </div>
                    );
                  }

                  if (!hasCoords && radiusKm !== "all") {
                    return (
                      <div className="flex items-center gap-2 text-xs text-amber-800 bg-amber-50 p-3 rounded-xl border border-amber-200/60 font-medium">
                        <MapPin className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>No GPS coordinates for this lead. Matched partners by address text: <strong className="text-amber-900">{leadLoc}</strong></span>
                      </div>
                    );
                  }
                  return null;
                })()}

                <div className="space-y-3">
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider flex justify-between">
                    <span>Available Partners</span>
                    {assignForm.formState.errors.partnerIds && (
                      <span className="text-red-500 font-medium normal-case">{assignForm.formState.errors.partnerIds.message}</span>
                    )}
                  </label>
                  <div className="max-h-64 overflow-y-auto space-y-3 pr-2 relative custom-scrollbar">
                    {isFetchingPartners && (
                      <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center rounded-xl border border-gray-100">
                        <Loader2 className="w-8 h-8 animate-spin text-primary-navy" />
                        <p className="text-sm font-medium text-primary-navy mt-2">Finding partners...</p>
                      </div>
                    )}

                    {partners.length === 0 && !isFetchingPartners && (
                      <div className="flex flex-col items-center justify-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                        <Target className="w-10 h-10 text-gray-300 mb-3" />
                        <p className="text-sm font-medium text-gray-500 text-center px-4">
                          {useCityFilter
                            ? `No partners registered in ${selectedLead?.cityId?.name || selectedLead?.city || "this city"}.`
                            : "No partners found matching criteria."}
                        </p>
                        <div className="flex gap-3 mt-3">
                          {useCityFilter && (
                            <button
                              type="button"
                              onClick={() => setUseCityFilter(false)}
                              className="text-xs text-primary-navy font-bold hover:underline bg-primary-navy/10 px-3 py-1.5 rounded-lg"
                            >
                              Show All Cities
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => { setSelectedServiceFilter("all"); setRadiusKm("all"); setUseCityFilter(false); }}
                            className="text-xs text-primary-orange font-semibold hover:underline px-3 py-1.5"
                          >
                            Clear All Filters
                          </button>
                        </div>
                      </div>
                    )}

                    <Controller
                      name="partnerIds"
                      control={assignForm.control}
                      render={({ field }) => (
                        <>
                          {partners.map((p: any) => {
                            const isSelected = field.value.includes(p._id);
                            return (
                              <div
                                key={p._id}
                                onClick={() => {
                                  if (isSelected) {
                                    field.onChange(field.value.filter(id => id !== p._id));
                                  } else {
                                    field.onChange([...field.value, p._id]);
                                  }
                                }}
                                className={`flex items-center space-x-4 p-4 rounded-xl border transition-all cursor-pointer ${isSelected ? 'border-primary-orange bg-primary-orange/5 shadow-sm' : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'}`}
                              >
                                <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'bg-primary-orange text-white' : 'border-2 border-gray-300'}`}>
                                  {isSelected && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className={`text-sm font-bold truncate ${isSelected ? 'text-gray-900' : 'text-gray-700'}`}>{p.businessName || p.fullName}</p>
                                  <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-500">
                                    <MapPin className="w-3.5 h-3.5 text-primary-orange shrink-0" />
                                    <span className="truncate font-medium">{p.cityId?.name || p.city?.name || p.businessAddress || 'Location Registered'}</span>
                                  </div>
                                </div>
                                {p.calculatedDistance !== undefined && p.calculatedDistance !== null ? (
                                  p.calculatedDistance > 0 ? (
                                    <div className="text-xs font-semibold bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg border border-blue-200/60 shrink-0">
                                      {(p.calculatedDistance / 1000).toFixed(1)} km away
                                    </div>
                                  ) : (
                                    <div className="text-xs font-semibold bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-lg border border-emerald-200/60 shrink-0">
                                      Local Partner
                                    </div>
                                  )
                                ) : (
                                  p.distance ? (
                                    <div className="text-xs font-semibold bg-gray-100 px-2 py-1 rounded text-gray-600 shrink-0">
                                      {(p.distance / 1000).toFixed(1)} km
                                    </div>
                                  ) : null
                                )}
                              </div>
                            );
                          })}
                        </>
                      )}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Notes for Partner <span className="text-gray-400 font-normal lowercase">(Optional)</span></label>
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
              <Button type="button" variant="outline" className="flex-1 bg-white border-gray-200 hover:bg-gray-100 text-gray-700 h-12 rounded-xl shadow-sm" onClick={() => setSelectedLead(null)}>
                Cancel
              </Button>
              <Button
                form="assignForm"
                type="submit"
                className="flex-1 bg-primary-navy hover:bg-primary-navy-light text-white h-12 rounded-xl shadow-lg shadow-primary-navy/20"
                isLoading={assignMutation.isPending}
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
