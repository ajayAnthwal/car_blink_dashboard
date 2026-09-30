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
                        <div className="font-bold text-primary-navy group-hover:text-secondary-blue transition-colors flex items-center gap-1.5">
                          <span>{partner.businessName || "No Business Name"}</span>
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

      {/* Comprehensive Partner Details & KYC Modal */}
      {selectedPartner && (
        <div className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <Card className="w-full max-w-3xl shadow-2xl overflow-hidden bg-white border-gray-100 flex flex-col max-h-[90vh]">
            <CardHeader className="border-b border-gray-100 bg-slate-900 text-white p-5 flex flex-row items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-xl bg-secondary-blue/20 border border-secondary-blue/40 flex items-center justify-center text-secondary-blue">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold font-heading text-white flex items-center gap-2">
                    {selectedPartner.businessName || "Workshop Partner Details"}
                    <Badge variant="outline" className={`ml-2 text-xs border-transparent ${getStatusColor(selectedPartner.verificationStatus)}`}>
                      {selectedPartner.verificationStatus?.replace(/_/g, " ") || "PENDING"}
                    </Badge>
                  </CardTitle>
                  <p className="text-xs text-slate-400 mt-0.5 font-medium">
                    Owner: <span className="text-white">{selectedPartner.ownerName || selectedPartner.userId?.fullName || "N/A"}</span> • Joined: {new Date(selectedPartner.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedPartner(null)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </CardHeader>

            <CardContent className="p-6 overflow-y-auto space-y-6 custom-scrollbar text-sm">
              {/* 1. Contact & Owner Information */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Phone className="w-4 h-4 text-secondary-blue" /> Contact & Account Details
                </h4>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <span className="text-gray-500 text-xs font-medium block">Owner Full Name</span>
                    <span className="font-bold text-gray-900">{selectedPartner.ownerName || selectedPartner.userId?.fullName || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 text-xs font-medium block">Phone Number</span>
                    <span className="font-bold text-gray-900 flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-gray-400" /> +91 {selectedPartner.userId?.phone || "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 text-xs font-medium block">Email Address</span>
                    <span className="font-bold text-gray-900 truncate block" title={selectedPartner.userId?.email}>
                      {selectedPartner.userId?.email || "No Email Provided"}
                    </span>
                  </div>
                </div>
              </div>

              {/* 2. Registration & Tax Credentials */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Tag className="w-4 h-4 text-primary-orange" /> Business Credentials & Tax IDs
                </h4>
                <div className="bg-orange-50/40 border border-orange-100 rounded-xl p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-gray-500 text-xs font-medium block">GST Number</span>
                    <span className="font-mono font-black text-gray-900 text-base flex items-center gap-2 mt-0.5">
                      {selectedPartner.gstNumber || "NOT PROVIDED"}
                      {selectedPartner.gstNumber && (
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(selectedPartner.gstNumber);
                            toast.success("GST Number copied to clipboard!");
                          }}
                          className="p-1 hover:bg-orange-100 rounded text-gray-500 hover:text-gray-900"
                          title="Copy GST"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </span>
                  </div>

                  <div>
                    <span className="text-gray-500 text-xs font-medium block">MSME / Udyam Certificate No</span>
                    <span className="font-mono font-black text-gray-900 text-base mt-0.5 block">
                      {selectedPartner.msmeNumber || "NOT PROVIDED"}
                    </span>
                  </div>
                </div>
              </div>

              {/* 3. Workshop Address & Map Pin Location */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-red-500" /> Workshop Physical Address & Map Pin
                </h4>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div>
                    <span className="font-bold text-gray-900 block text-base">{selectedPartner.businessName}</span>
                    <p className="text-xs text-gray-600 mt-1 leading-relaxed font-medium">
                      {selectedPartner.businessAddress && selectedPartner.businessAddress !== "Workshop Address" 
                        ? selectedPartner.businessAddress 
                        : "Address not provided yet by partner."}
                    </p>
                  </div>

                  <a
                    href={
                      selectedPartner.location?.coordinates?.length === 2 && 
                      (selectedPartner.location.coordinates[0] !== 77.2090 || selectedPartner.location.coordinates[1] !== 28.6139)
                        ? `https://www.google.com/maps?q=${selectedPartner.location.coordinates[1]},${selectedPartner.location.coordinates[0]}`
                        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                            (selectedPartner.businessAddress && selectedPartner.businessAddress !== "Workshop Address"
                              ? selectedPartner.businessAddress
                              : selectedPartner.businessName) + ", Dehradun, Uttarakhand"
                          )}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-xs font-bold flex items-center gap-1.5 border border-red-200 shrink-0 shadow-2xs transition-colors"
                  >
                    <MapPin className="w-4 h-4 text-red-600" /> Open Map Location <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* 4. Bank Account Details */}
              {selectedPartner.bankDetails && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-emerald-600" /> Bank Payout Account Details
                  </h4>
                  <div className="bg-emerald-50/40 border border-emerald-100 rounded-xl p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <span className="text-gray-500 text-xs font-medium block">Account Holder</span>
                      <span className="font-bold text-gray-900">{selectedPartner.bankDetails.accountHolderName || "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 text-xs font-medium block">Account Number</span>
                      <span className="font-mono font-bold text-gray-900">{selectedPartner.bankDetails.accountNumber || "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 text-xs font-medium block">IFSC Code</span>
                      <span className="font-mono font-bold text-gray-900">{selectedPartner.bankDetails.ifscCode || "N/A"}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* 5. Uploaded KYC & Legal Documents */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-blue-600" /> Uploaded Verification Documents
                </h4>
                {selectedPartner.kycDocuments && selectedPartner.kycDocuments.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {selectedPartner.kycDocuments.map((doc: any) => (
                      <div key={doc._id} className="bg-slate-50 border border-slate-200 p-3 rounded-xl flex items-center justify-between">
                        <div className="flex items-center space-x-2.5">
                          <FileText className="w-5 h-5 text-secondary-blue" />
                          <div>
                            <span className="font-bold text-xs text-gray-900 block">{doc.documentType?.replace(/_/g, ' ')}</span>
                            <span className="text-[10px] text-gray-500">Status: {doc.status}</span>
                          </div>
                        </div>
                        <a
                          href={doc.documentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 bg-white hover:bg-slate-100 text-secondary-blue text-xs font-bold rounded border border-slate-200 flex items-center gap-1 shadow-2xs"
                        >
                          View Document <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-gray-50 border border-dashed border-gray-300 rounded-xl p-4 text-center text-xs text-gray-500">
                    No KYC documents uploaded by partner yet.
                  </div>
                )}
              </div>
            </CardContent>

            {/* Modal Actions */}
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between gap-3">
              <Button variant="ghost" onClick={() => setSelectedPartner(null)} className="text-xs font-bold text-gray-600">
                Close
              </Button>

              <div className="flex gap-2">
                <Button
                  onClick={() => handleVerify(selectedPartner._id, 'REJECTED')}
                  disabled={verifyMutation.isPending}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs"
                >
                  <XCircle className="w-4 h-4 mr-1.5" /> Reject Registration
                </Button>

                <Button
                  onClick={() => handleVerify(selectedPartner._id, 'APPROVED')}
                  disabled={verifyMutation.isPending}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md"
                >
                  <CheckCircle className="w-4 h-4 mr-1.5" /> Approve & Forward to Admin
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
