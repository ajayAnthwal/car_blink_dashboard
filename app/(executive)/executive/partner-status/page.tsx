// @ts-nocheck
"use client";

import React, { useState, useMemo, useEffect } from "react";
import { usePartnerStatus, useVerifyPartnerMutation } from "@/features/executive/hooks/useExecutiveQueries";
import { useQueryClient } from "@tanstack/react-query";
import { useSocket } from "@/lib/SocketContext";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useDebounce } from "@/hooks/useDebounce";
import { 
  Briefcase, 
  Loader2, 
  Phone, 
  Mail, 
  Clock, 
  ShieldCheck, 
  MapPin, 
  FileText, 
  CheckCircle, 
  XCircle, 
  Eye, 
  X, 
  ExternalLink, 
  Building2, 
  CreditCard, 
  Copy,
  Tag,
  Search,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import toast from "react-hot-toast";
import PartnerVerificationReviewScreen from "@/components/partner/PartnerVerificationReviewScreen";

export default function PartnerStatusPage() {
  const queryClient = useQueryClient();
  const { socket } = useSocket();
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const debouncedSearch = useDebounce(searchTerm, 500);

  // Live Socket Sync: Refetch partners in real time whenever a partner registers or status changes
  useEffect(() => {
    if (!socket) return;
    const handlePartnerEvent = () => {
      queryClient.invalidateQueries({ queryKey: ["executive", "partners"] });
    };

    socket.on("partner_registered", handlePartnerEvent);
    socket.on("partner_status_updated", handlePartnerEvent);
    socket.on("kyc_status_changed", handlePartnerEvent);

    return () => {
      socket.off("partner_registered", handlePartnerEvent);
      socket.off("partner_status_updated", handlePartnerEvent);
      socket.off("kyc_status_changed", handlePartnerEvent);
    };
  }, [socket, queryClient]);

  const filterStr = useMemo(() => {
    let q = "";
    if (debouncedSearch) q += `search=${encodeURIComponent(debouncedSearch)}`;
    if (statusFilter && statusFilter !== "ALL") {
      q += `${q ? "&" : ""}verificationStatus=${statusFilter}`;
    }
    return q;
  }, [debouncedSearch, statusFilter]);

  const { data: partnersData, isLoading } = usePartnerStatus(page, limit, filterStr);
  const partners = (partnersData?.partners || partnersData?.docs || []) as any[];
  const total = partnersData?.total || 0;
  const totalPages = Math.ceil(total / limit) || 1;

  const [selectedPartner, setSelectedPartner] = useState<any | null>(null);
  const verifyMutation = useVerifyPartnerMutation();

  const handleVerify = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      await verifyMutation.mutateAsync({ id, data: { status } });
      toast.success(status === 'APPROVED' ? "Partner verified & forwarded to Super Admin!" : "Partner registration rejected.");
      if (selectedPartner?._id === id) {
        setSelectedPartner(null);
      }
    } catch (err) {
      console.error("Failed to verify partner", err);
      toast.error("Failed to update partner verification status.");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case "ACTIVE":
      case "APPROVED": return "bg-success/10 text-success hover:bg-success/20";
      case "PENDING":
      case "UNDER_REVIEW": return "bg-warning/10 text-warning hover:bg-warning/20";
      case "REJECTED":
      case "SUSPENDED": return "bg-danger/10 text-danger hover:bg-danger/20";
      default: return "bg-secondary-blue/10 text-secondary-blue hover:bg-secondary-blue/20";
    }
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-10">
      <div>
        <h2 className="text-2xl md:text-3xl font-bold text-primary-navy flex items-center font-heading">
          <Briefcase className="w-7 h-7 mr-3 text-secondary-blue" /> 
          Partner Status Overview
        </h2>
        <p className="text-neutral-muted text-sm mt-2 font-body">Track and manage the current status of all registered service partners, including KYC verification.</p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl shadow-subtle border border-neutral-muted/20">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search by business, owner name, phone, email..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            className="pl-9 bg-gray-50 border-gray-200 text-sm focus:bg-white transition-colors"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {["ALL", "PENDING", "UNDER_REVIEW", "APPROVED", "REJECTED"].map((st) => (
            <Button
              key={st}
              variant={statusFilter === st ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setStatusFilter(st);
                setPage(1);
              }}
              className={`text-xs font-semibold rounded-lg ${
                statusFilter === st 
                  ? "bg-secondary-blue text-white hover:bg-secondary-blue/90" 
                  : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
              }`}
            >
              {st.replace(/_/g, " ")}
            </Button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-20 bg-white rounded-2xl shadow-subtle border border-neutral-muted/20">
          <Loader2 className="w-10 h-10 text-secondary-blue animate-spin" />
        </div>
      ) : partners.length === 0 ? (
        <div className="bg-white p-20 rounded-2xl shadow-subtle border border-neutral-muted/20 text-center flex flex-col items-center">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
            <Briefcase className="w-10 h-10 text-gray-300" />
          </div>
          <p className="text-gray-500 font-medium text-lg">No partners found.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-subtle border border-neutral-muted/20 overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-50/80">
                <TableRow>
                  <TableHead className="font-semibold text-primary-navy w-[250px]">Partner & Business</TableHead>
                  <TableHead className="font-semibold text-primary-navy">Contact Info</TableHead>
                  <TableHead className="font-semibold text-primary-navy">Location & Date</TableHead>
                  <TableHead className="font-semibold text-primary-navy">Verification & KYC</TableHead>
                  <TableHead className="font-semibold text-primary-navy text-center">Performance</TableHead>
                  <TableHead className="font-semibold text-primary-navy text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {partners.map((partner) => {
                  const userDetails = partner.userId || {};
                  const fullName = userDetails.fullName || "Unknown Name";
                  const email = userDetails.email || "No Email";
                  const phone = userDetails.phone || "No Phone";
                  const isPendingVerification = !partner.isVerified && partner.verificationStatus !== 'APPROVED';

                  return (
                    <TableRow 
                      key={partner._id} 
                      className="hover:bg-blue-50/40 transition-colors cursor-pointer group"
                      onClick={() => setSelectedPartner(partner)}
                    >
                      {/* Partner & Business */}
                      <TableCell className="align-top">
                        <div className="font-bold text-primary-navy group-hover:text-secondary-blue transition-colors flex items-center gap-1.5 flex-wrap">
                          <span>{partner.businessName || "No Business Name"}</span>
                          {partner.uniquePartnerId && (
                            <span className="font-mono text-[10px] font-black bg-blue-100 text-blue-800 px-2 py-0.5 rounded border border-blue-200">
                              {partner.uniquePartnerId}
                            </span>
                          )}
                          <Eye className="w-3.5 h-3.5 text-secondary-blue opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <div className="text-sm text-gray-500 mt-1 flex items-center">
                          <span className="font-medium mr-1">Owner:</span> {fullName}
                        </div>
                      </TableCell>

                      {/* Contact Info */}
                      <TableCell className="align-top">
                        <div className="space-y-1.5 text-sm">
                          <div className="flex items-center text-gray-600">
                            <Mail className="w-4 h-4 mr-2 shrink-0 text-gray-400" /> 
                            <span className="truncate max-w-[180px]" title={email}>{email}</span>
                          </div>
                          <div className="flex items-center text-gray-600">
                            <Phone className="w-4 h-4 mr-2 shrink-0 text-gray-400" /> 
                            {phone}
                          </div>
                        </div>
                      </TableCell>

                      {/* Location & Date */}
                      <TableCell className="align-top">
                        <div className="space-y-1.5 text-sm">
                          <div className="flex items-start text-gray-600">
                            <MapPin className="w-4 h-4 mr-2 mt-0.5 shrink-0 text-gray-400" /> 
                            <span className="line-clamp-2 max-w-[200px]">
                              {partner.businessAddress && partner.businessAddress !== "Workshop Address" 
                                ? partner.businessAddress 
                                : "Address Not Provided"}
                            </span>
                          </div>
                          <div className="flex items-center text-gray-500 text-xs">
                            <Clock className="w-3.5 h-3.5 mr-1.5 shrink-0" /> 
                            Joined {new Date(partner.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </TableCell>

                      {/* Verification & KYC */}
                      <TableCell className="align-top">
                        <div className="space-y-3">
                          <Badge variant="outline" className={`px-2.5 py-0.5 border-transparent ${getStatusColor(partner.verificationStatus)}`}>
                            {partner.verificationStatus?.replace(/_/g, " ") || "UNKNOWN"}
                          </Badge>

                          {partner.kycDocuments && partner.kycDocuments.length > 0 ? (
                            <div className="flex flex-col gap-1.5">
                              {partner.kycDocuments.map((doc: any) => (
                                <a 
                                  key={doc._id} 
                                  href={doc.documentUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-xs flex items-center text-secondary-blue hover:text-blue-700 hover:underline bg-blue-50/50 px-2 py-1 rounded w-max"
                                >
                                  <FileText className="w-3.5 h-3.5 mr-1.5 shrink-0" /> 
                                  {doc.documentType?.replace(/_/g, ' ')}
                                  <span className="text-gray-500 ml-1.5 text-[10px]">({doc.status})</span>
                                </a>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400 block">No KYC Docs</span>
                          )}
                        </div>
                      </TableCell>

                      {/* Performance */}
                      <TableCell className="align-top text-center">
                        <div className="inline-flex flex-col items-center p-2 bg-gray-50 rounded-lg border border-gray-100 min-w-[80px]">
                          <span className="text-xs text-gray-500 mb-0.5">Jobs</span>
                          <span className="font-bold text-primary-navy text-lg">{partner.totalJobsCompleted || 0}</span>
                        </div>
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="align-top text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex flex-col items-end gap-1.5">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => setSelectedPartner(partner)}
                            className="w-[100px] text-xs font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200"
                          >
                            <Eye className="w-3.5 h-3.5 mr-1" /> Inspect
                          </Button>

                          {isPendingVerification && (
                            <div className="flex gap-1 mt-1">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleVerify(partner._id, 'APPROVED')}
                                className="px-2.5 py-1 text-xs border-green-200 text-green-700 hover:bg-green-50"
                                title="Stage 1 Clearance: Approve & Forward to Admin"
                              >
                                <CheckCircle className="w-3.5 h-3.5 mr-1" /> Approve
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleVerify(partner._id, 'REJECTED')}
                                className="px-2.5 py-1 text-xs border-red-200 text-red-700 hover:bg-red-50"
                                title="Reject Partner Application"
                              >
                                <XCircle className="w-3.5 h-3.5 mr-1" /> Reject
                              </Button>
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Pagination Footer */}
          <div className="p-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-gray-50/50">
            <p className="text-xs text-gray-500 font-medium">
              Showing <span className="font-bold text-gray-900">{partners.length}</span> of <span className="font-bold text-gray-900">{total}</span> partners (Page <span className="font-bold text-gray-900">{page}</span> of <span className="font-bold text-gray-900">{totalPages}</span>)
            </p>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="text-xs font-semibold h-8 border-gray-200 bg-white"
              >
                <ChevronLeft className="w-4 h-4 mr-1" /> Previous
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="text-xs font-semibold h-8 border-gray-200 bg-white"
              >
                Next <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Comprehensive Partner Details & KYC Review Overlay */}
      {selectedPartner && (
        <div className="fixed inset-0 bg-slate-900/80 z-[70] overflow-y-auto p-3 sm:p-6 backdrop-blur-sm animate-in fade-in">
          <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden p-4 sm:p-6 my-4">
            <PartnerVerificationReviewScreen
              partnerId={selectedPartner._id || selectedPartner.id}
              userRole="EXECUTIVE"
              onBack={() => {
                setSelectedPartner(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
