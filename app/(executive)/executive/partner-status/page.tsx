// @ts-nocheck
"use client";

import React from "react";
import { usePartnerStatus, useVerifyPartnerMutation } from "@/features/executive/hooks/useExecutiveQueries";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Briefcase, Loader2, Phone, Mail, Clock, ShieldCheck, MapPin, FileText, CheckCircle, XCircle } from "lucide-react";

export default function PartnerStatusPage() {
  const { data: partnersData, isLoading } = usePartnerStatus(1, 50);
  const partners = (partnersData?.docs || partnersData?.partners || []) as any[];

  const verifyMutation = useVerifyPartnerMutation();

  const handleVerify = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      await verifyMutation.mutateAsync({ id, data: { status } });
    } catch (err) {
      console.error("Failed to verify partner", err);
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
                    <TableRow key={partner._id} className="hover:bg-gray-50/50 transition-colors">
                      {/* Partner & Business */}
                      <TableCell className="align-top">
                        <div className="font-bold text-primary-navy">{partner.businessName || "No Business Name"}</div>
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
                              {partner.businessAddress || "No Address Provided"}
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
                      <TableCell className="align-top text-right">
                        {isPendingVerification ? (
                          <div className="flex flex-col items-end gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleVerify(partner._id, 'APPROVED')}
                              className="w-[90px] border-green-200 text-green-700 hover:bg-green-50 hover:text-green-800 flex justify-center"
                            >
                              <CheckCircle className="w-4 h-4 mr-1.5" /> Approve
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleVerify(partner._id, 'REJECTED')}
                              className="w-[90px] border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800 flex justify-center"
                            >
                              <XCircle className="w-4 h-4 mr-1.5" /> Reject
                            </Button>
                          </div>
                        ) : (
                          <div className="flex justify-end pr-2 text-gray-400">
                            <ShieldCheck className={`w-6 h-6 ${partner.verificationStatus === 'APPROVED' ? 'text-green-500' : 'text-red-500'}`} />
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}
