// @ts-nocheck
"use client";

import React, { useState, useEffect } from "react";
import { apiClient } from "@/lib/axios";
import { useSocket } from "@/lib/SocketContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Building2, 
  MapPin, 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  Loader2, 
  ArrowLeft, 
  ExternalLink, 
  Landmark, 
  Wrench, 
  FileText, 
  UserCheck, 
  Calendar, 
  Phone, 
  Mail, 
  History, 
  Sparkles, 
  AlertCircle,
  Eye,
  Check,
  Ban,
  RotateCcw,
  Compass,
  Car
} from "lucide-react";
import toast from "react-hot-toast";

interface Props {
  partnerId: string;
  userRole?: string;
  onBack?: () => void;
}

export default function PartnerVerificationReviewScreen({ partnerId, userRole = "ADMIN", onBack }: Props) {
  const { socket } = useSocket();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Modal / Action state
  const [activeModal, setActiveModal] = useState<
    "APPROVE" | "REJECT" | "REQUEST_DOCUMENTS" | "MARK_MANUAL" | "SUSPEND" | "REACTIVATE" | "RECOMMEND" | null
  >(null);
  const [modalNotes, setModalNotes] = useState("");
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  const isFinalApprovalAuthorized = userRole === "SUPER_ADMIN" || userRole === "ADMIN";

  const fetchReviewData = async () => {
    try {
      setLoading(true);
      // Use super-admin endpoint if admin, or executive endpoint if executive
      const endpoint = userRole === "EXECUTIVE" 
        ? `/executive/partner-status/${partnerId}/review`
        : `/super-admin/partners/${partnerId}/review`;

      let res: any;
      try {
        res = await apiClient.get(endpoint);
      } catch (err: any) {
        const fallbackEndpoint = endpoint.includes('/super-admin/')
          ? `/executive/partner-status/${partnerId}/review`
          : `/super-admin/partners/${partnerId}/review`;
        res = await apiClient.get(fallbackEndpoint);
      }

      const resData = res?.data?.partner
        ? res.data
        : res?.partner
        ? res
        : res?.data?.data?.partner
        ? res.data.data
        : res?.data || res;
      setData(resData);
    } catch (err: any) {
      console.error("Failed to load partner review details:", err);
      toast.error(err.response?.data?.message || err.message || "Failed to load partner review details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (partnerId) {
      fetchReviewData();
    }
  }, [partnerId, userRole]);

  // Live Socket Refresh
  useEffect(() => {
    if (!socket || !partnerId) return;

    const handleEvent = (payload: any) => {
      if (payload?.partnerId === partnerId) {
        fetchReviewData();
      }
    };

    socket.on("partner_status_updated", handleEvent);
    socket.on("kyc_status_changed", handleEvent);

    return () => {
      socket.off("partner_status_updated", handleEvent);
      socket.off("kyc_status_changed", handleEvent);
    };
  }, [socket, partnerId]);

  const handleExecuteAction = async () => {
    if (!activeModal) return;

    // Validate mandatory notes
    if (["REJECT", "REQUEST_DOCUMENTS", "SUSPEND"].includes(activeModal) && !modalNotes.trim()) {
      toast.error("Notes/Reason is mandatory for this action.");
      return;
    }

    setActionLoading(true);
    try {
      let mappedAction = activeModal;
      if (activeModal === "MARK_MANUAL") mappedAction = "MARK_MANUAL_VERIFICATION";
      if (activeModal === "RECOMMEND") mappedAction = "EXECUTIVE_RECOMMEND";

      const endpoint = userRole === "EXECUTIVE"
        ? `/executive/partner-status/${partnerId}/review-action`
        : `/super-admin/partners/${partnerId}/review-action`;

      let res: any;
      try {
        res = await apiClient.post(endpoint, {
          action: mappedAction,
          notes: modalNotes.trim() || undefined,
        });
      } catch (postErr: any) {
        const fallbackEndpoint = endpoint.includes('/super-admin/')
          ? `/executive/partner-status/${partnerId}/review-action`
          : `/super-admin/partners/${partnerId}/review-action`;
        res = await apiClient.post(fallbackEndpoint, {
          action: mappedAction,
          notes: modalNotes.trim() || undefined,
        });
      }

      const message = res?.data?.message || "Action executed successfully";
      toast.success(message);
      setActiveModal(null);
      setModalNotes("");
      await fetchReviewData();
    } catch (err: any) {
      console.error("Action execution failed:", err);
      toast.error(err.response?.data?.message || err.message || "Action execution failed");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-4">
        <Loader2 className="w-10 h-10 text-primary-orange animate-spin" />
        <p className="text-sm text-gray-500 font-medium">Loading Partner Review Data &amp; Verification Proofs...</p>
      </div>
    );
  }

  if (!data || !data.partner) {
    return (
      <div className="p-8 text-center text-red-500 font-bold bg-white rounded-2xl border border-red-200">
        Partner profile could not be loaded or was not found.
      </div>
    );
  }

  const { partner, maskedAccountNumber, evaluation, auditLogs = [] } = data;
  const isApproved = partner.verificationStatus === "APPROVED_VERIFIED" || partner.verificationStatus === "APPROVED";
  const isSuspended = partner.verificationStatus === "SUSPENDED" || partner.isActive === false;
  const coordinates = partner.location?.coordinates;
  const hasCoordinates = coordinates && coordinates.length === 2 && (coordinates[0] !== 0 || coordinates[1] !== 0);
  const googleMapsUrl = hasCoordinates 
    ? `https://www.google.com/maps?q=${coordinates[1]},${coordinates[0]}` 
    : partner.businessAddress ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(partner.businessAddress)}` : null;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Header & Actions Bar */}
      <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div className="space-y-2">
          {onBack && (
            <button 
              onClick={onBack}
              className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors mb-2"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Partners List
            </button>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-bold font-heading text-gray-900">
              {partner.workshopName || partner.businessName}
            </h1>

            {partner.uniquePartnerId ? (
              <span className="font-mono text-xs font-bold bg-emerald-500/10 text-emerald-700 border border-emerald-300 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                ID: {partner.uniquePartnerId}
              </span>
            ) : (
              <span className="font-mono text-xs text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full border border-gray-200">
                Partner ID Pending Approval
              </span>
            )}

            <Badge className={`uppercase text-xs font-bold px-3 py-1 ${
              partner.verificationStatus === "APPROVED_VERIFIED" || partner.verificationStatus === "APPROVED"
                ? "bg-emerald-500 text-white"
                : partner.verificationStatus === "SUSPENDED"
                ? "bg-rose-600 text-white"
                : partner.verificationStatus === "REJECTED"
                ? "bg-red-500 text-white"
                : partner.verificationStatus === "MANUAL_VERIFICATION_REQUIRED"
                ? "bg-amber-500 text-white"
                : "bg-blue-600 text-white"
            }`}>
              {partner.verificationStatus || "PENDING"}
            </Badge>

            {partner.isActive ? (
              <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                ● Active
              </span>
            ) : (
              <span className="text-[11px] font-bold text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                ● Inactive / Suspended
              </span>
            )}
          </div>

          <p className="text-xs text-gray-500 flex items-center gap-2">
            <span>Owner: <strong className="text-gray-800">{partner.ownerName || partner.userId?.fullName || "N/A"}</strong></span>
            <span>•</span>
            <span>Phone: <strong className="font-mono text-gray-800">+91 {partner.userId?.phone}</strong></span>
            <span>•</span>
            <span>City: <strong className="text-gray-800">{partner.cityId?.name || partner.city || "N/A"}</strong></span>
          </p>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          {isFinalApprovalAuthorized ? (
            <>
              {!isApproved ? (
                <Button
                  onClick={() => setActiveModal("APPROVE")}
                  disabled={!evaluation?.isComplete}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" /> Approve Partner
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => setActiveModal("SUSPEND")}
                  className="border-rose-300 text-rose-600 hover:bg-rose-50 font-bold text-xs rounded-xl flex items-center gap-1.5"
                >
                  <Ban className="w-4 h-4" /> Suspend
                </Button>
              )}

              {isSuspended && (
                <Button
                  onClick={() => setActiveModal("REACTIVATE")}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5"
                >
                  <RotateCcw className="w-4 h-4" /> Reactivate Partner
                </Button>
              )}

              <Button
                variant="outline"
                onClick={() => setActiveModal("REJECT")}
                className="border-red-300 text-red-600 hover:bg-red-50 font-bold text-xs rounded-xl flex items-center gap-1.5"
              >
                <XCircle className="w-4 h-4" /> Reject
              </Button>

              <Button
                variant="outline"
                onClick={() => setActiveModal("REQUEST_DOCUMENTS")}
                className="border-blue-300 text-blue-600 hover:bg-blue-50 font-bold text-xs rounded-xl flex items-center gap-1.5"
              >
                <FileText className="w-4 h-4" /> Request Docs
              </Button>

              <Button
                variant="outline"
                onClick={() => setActiveModal("MARK_MANUAL")}
                className="border-amber-300 text-amber-700 hover:bg-amber-50 font-bold text-xs rounded-xl flex items-center gap-1.5"
              >
                <AlertTriangle className="w-4 h-4" /> Mark Manual Review
              </Button>
            </>
          ) : (
            // Field Executive Actions
            <>
              <Button
                onClick={() => setActiveModal("RECOMMEND")}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5"
              >
                <ShieldCheck className="w-4 h-4" /> Recommend Super Admin Approval
              </Button>
              <Button
                variant="outline"
                onClick={() => setActiveModal("REQUEST_DOCUMENTS")}
                className="border-blue-300 text-blue-600 hover:bg-blue-50 font-bold text-xs rounded-xl flex items-center gap-1.5"
              >
                <FileText className="w-4 h-4" /> Request Clarification
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Mandatory Checks Evaluation Banner */}
      {!evaluation?.isComplete ? (
        <div className="p-5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-950 flex items-start gap-3.5 shadow-sm">
          <AlertCircle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-2">
            <h4 className="font-bold text-base text-rose-900">
              Approval Blocked – Mandatory Requirements Pending ({evaluation?.missingItems?.length} Missing)
            </h4>
            <p className="text-xs text-rose-800">
              Per platform verification policy, final partner approval is strictly prohibited until every mandatory check passes:
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              {evaluation?.missingItems?.map((item: string, i: number) => (
                <span key={i} className="text-xs font-semibold bg-white text-rose-700 border border-rose-200 px-2.5 py-1 rounded-lg">
                  ✕ {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
            <div>
              <p className="font-bold text-emerald-900 text-sm">All Mandatory Verification Criteria Satisfied ✓</p>
              <p className="text-xs text-emerald-800">KYC, physical photos, address proof, map coordinates, and bank details are verified.</p>
            </div>
          </div>
          {!isApproved && isFinalApprovalAuthorized && (
            <Button
              size="sm"
              onClick={() => setActiveModal("APPROVE")}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md"
            >
              Approve Now
            </Button>
          )}
        </div>
      )}

      {/* Task 8: ANTI-FAKE / DUPLICATE CONTROLS WARNING BANNER */}
      {partner.duplicateFlags && partner.duplicateFlags.length > 0 && (
        <div className="p-5 rounded-2xl bg-amber-50/90 border border-amber-300 text-amber-950 shadow-sm space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0" />
              <div>
                <h4 className="font-bold text-base text-amber-950 flex items-center gap-2">
                  Anti-Fake &amp; Duplicate Flags Detected ({partner.duplicateFlags.length})
                </h4>
                <p className="text-xs text-amber-800">
                  Potential matching records detected across mobile, PAN, GSTIN, bank details, workshop location, or name. Please inspect matched workshops before approving.
                </p>
              </div>
            </div>
            <Badge className="bg-amber-600 text-white font-mono text-[11px]">
              AUDIT FLAG
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {partner.duplicateFlags.map((flag: any, index: number) => {
              const matchedP = flag.matchedPartnerId;
              const matchedId = flag.matchedUniquePartnerId || (typeof matchedP === "object" ? matchedP?.uniquePartnerId : null);
              const matchedName = flag.matchedWorkshopName || (typeof matchedP === "object" ? matchedP?.businessName || matchedP?.workshopName : null);
              const isHigh = flag.severity === "HIGH";

              return (
                <div
                  key={index}
                  className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
                    isHigh
                      ? "bg-rose-50/80 border-rose-200 text-rose-950"
                      : "bg-white border-amber-200 text-amber-950"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] uppercase ${
                      isHigh ? "bg-rose-600 text-white" : "bg-amber-500 text-white"
                    }`}>
                      {flag.field || "DUPLICATE"}
                    </span>
                    <span className="text-[10px] font-bold text-gray-500">
                      {flag.severity || "MEDIUM"} SEVERITY
                    </span>
                  </div>

                  <p className="font-medium leading-relaxed">
                    {flag.reason}
                  </p>

                  {(matchedId || matchedName) && (
                    <div className="pt-1 flex items-center gap-1.5 text-[11px] text-gray-700 font-medium">
                      <span>Matched Workshop:</span>
                      {matchedId && (
                        <span className="font-mono font-bold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                          {matchedId}
                        </span>
                      )}
                      {matchedName && <span className="font-bold text-gray-900">{matchedName}</span>}
                    </div>
                  )}

                  {flag.matchedValue && (
                    <div className="text-[11px] text-gray-500">
                      Matched Value: <span className="font-mono font-semibold text-gray-700">{flag.matchedValue}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Task 8: RE-VERIFICATION REQUIRED DIFF BANNER */}
      {partner.reVerificationRequired && (
        <div className="p-5 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-950 shadow-sm space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <RotateCcw className="w-6 h-6 text-indigo-600 shrink-0" />
              <div>
                <h4 className="font-bold text-base text-indigo-950">
                  Re-Verification Required – Post-Approval Profile Changes
                </h4>
                <p className="text-xs text-indigo-800">
                  Partner modified verified critical fields (PAN, GSTIN, bank details, address, or map pin). In accordance with policy, existing jobs continue, but new leads and payouts are paused until re-approved.
                </p>
              </div>
            </div>
            <Badge className="bg-indigo-600 text-white font-mono text-[11px]">
              RE-VERIFICATION PENDING
            </Badge>
          </div>

          {partner.reVerificationDetails && (
            <div className="bg-white rounded-xl border border-indigo-100 overflow-hidden shadow-xs">
              <div className="px-4 py-2.5 bg-indigo-100/60 font-bold text-xs text-indigo-950 flex items-center justify-between">
                <span>Critical Fields Modified by Partner</span>
                {partner.reVerificationDetails.requestedAt && (
                  <span className="text-[11px] font-normal text-indigo-800">
                    Requested: {new Date(partner.reVerificationDetails.requestedAt).toLocaleString("en-IN")}
                  </span>
                )}
              </div>
              <div className="divide-y divide-gray-100 text-xs">
                {partner.reVerificationDetails.changedFields?.map((field: string, idx: number) => {
                  return (
                    <div key={idx} className="p-3 grid grid-cols-1 md:grid-cols-3 gap-2 items-center">
                      <div className="font-bold text-gray-800">{field}</div>
                      <div className="text-gray-500">
                        <span className="text-[10px] text-gray-400 block uppercase font-bold">Previous Verified</span>
                        <span className="font-mono text-gray-700">
                          {JSON.stringify(partner.reVerificationDetails.oldValues?.[field] || partner.reVerificationDetails.oldValues?.[field.toLowerCase()] || "Verified")}
                        </span>
                      </div>
                      <div className="text-emerald-700">
                        <span className="text-[10px] text-emerald-600 block uppercase font-bold">New Submitted</span>
                        <span className="font-mono font-bold text-emerald-800">
                          {JSON.stringify(partner.reVerificationDetails.newValues?.[field] || partner.reVerificationDetails.newValues?.[field.toLowerCase()] || "Submitted")}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {isFinalApprovalAuthorized && (
            <div className="flex items-center justify-end pt-1">
              <Button
                size="sm"
                onClick={() => setActiveModal("APPROVE")}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" /> Approve Re-Verification &amp; Restore Access
              </Button>
            </div>
          )}
        </div>
      )}

      {/* SIDE-BY-SIDE COMPARISON: Address / Map Pin vs Workshop Photos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Column 1: Address & Geolocation Map Pin */}
        <Card className="border-gray-200 shadow-sm overflow-hidden flex flex-col">
          <CardHeader className="bg-slate-50 border-b border-gray-100 pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary-orange" /> Address Proof &amp; GPS Map Pin
              </CardTitle>
              {evaluation?.checklist?.locationPinSet && evaluation?.checklist?.addressProofUploaded ? (
                <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                  VERIFIED ✓
                </span>
              ) : (
                <span className="text-[11px] font-bold text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded">
                  INCOMPLETE
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-5 space-y-4 flex-1 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
                  Registered Physical Address
                </span>
                <p className="text-sm font-semibold text-gray-900 leading-relaxed">
                  {partner.addressLine || partner.businessAddress || "No address provided"}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  City: <strong>{partner.city || partner.cityId?.name || "N/A"}</strong> | State: <strong>{partner.state || "N/A"}</strong> | PIN: <strong className="font-mono">{partner.pincode || "N/A"}</strong>
                </p>
              </div>

              {/* Coordinates & Google Maps Link */}
              <div className="p-3.5 bg-blue-50/70 border border-blue-100 rounded-xl flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 flex items-center gap-1">
                    <Compass className="w-3.5 h-3.5 text-blue-600" /> GPS Geolocation Pin
                  </span>
                  <p className="text-xs font-mono font-bold text-blue-950">
                    {hasCoordinates ? `Lat: ${coordinates[1].toFixed(6)}, Long: ${coordinates[0].toFixed(6)}` : "No coordinates pinned"}
                  </p>
                </div>
                {googleMapsUrl && (
                  <a
                    href={googleMapsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors"
                  >
                    View on Google Maps <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              {/* Address Proof Document */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Address Proof Type: {partner.addressProofType || "ELECTRICITY_BILL"}
                  </span>
                  {partner.addressProofRef ? (
                    <span className="text-[10px] font-bold text-emerald-600">Document Uploaded ✓</span>
                  ) : (
                    <span className="text-[10px] font-bold text-rose-600">Missing Upload</span>
                  )}
                </div>
                {partner.addressProofRef ? (
                  <div className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-gray-200">
                    <span className="text-xs font-medium text-gray-700 truncate max-w-[200px]">
                      {partner.addressProofRef.split("/").pop()}
                    </span>
                    <a
                      href={partner.addressProofRef}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-bold text-primary-orange hover:underline flex items-center gap-1"
                    >
                      View Document ↗
                    </a>
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 italic">No address proof document uploaded.</p>
                )}
              </div>
            </div>

            <div className="text-[11px] text-gray-400 bg-gray-50 p-2.5 rounded-lg border border-dashed border-gray-200">
              💡 <strong>Tip for Field Executives:</strong> Compare the workshop signage name in the photos with the legal name on the address proof before recommending approval.
            </div>
          </CardContent>
        </Card>

        {/* Column 2: Workshop Photo Gallery (Exterior / Interior / Signboard) */}
        <Card className="border-gray-200 shadow-sm overflow-hidden flex flex-col">
          <CardHeader className="bg-slate-50 border-b border-gray-100 pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary-orange" /> Physical Workshop Proof Gallery
              </CardTitle>
              {evaluation?.checklist?.exteriorPhotoUploaded && 
               evaluation?.checklist?.interiorPhotoUploaded && 
               evaluation?.checklist?.signboardPhotoUploaded ? (
                <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                  ALL 3 PHOTOS READY ✓
                </span>
              ) : (
                <span className="text-[11px] font-bold text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded">
                  PHOTOS INCOMPLETE
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-5 flex-1 flex flex-col justify-between">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Exterior */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-gray-700">Exterior Photo</span>
                  {partner.exteriorPhotoRef ? (
                    <span className="text-[10px] text-emerald-600 font-bold">✓</span>
                  ) : (
                    <span className="text-[10px] text-rose-600 font-bold">✕</span>
                  )}
                </div>
                {partner.exteriorPhotoRef ? (
                  <div 
                    onClick={() => setSelectedPhoto(partner.exteriorPhotoRef)}
                    className="relative group cursor-pointer aspect-video sm:aspect-square bg-gray-100 rounded-xl overflow-hidden border border-gray-200 shadow-sm"
                  >
                    <img 
                      src={partner.exteriorPhotoRef} 
                      alt="Workshop Exterior" 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-bold gap-1">
                      <Eye className="w-4 h-4" /> Click to Zoom
                    </div>
                  </div>
                ) : (
                  <div className="aspect-video sm:aspect-square bg-gray-50 border border-dashed border-gray-200 rounded-xl flex items-center justify-center text-xs text-gray-400">
                    Missing Exterior
                  </div>
                )}
              </div>

              {/* Interior */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-gray-700">Interior / Bays</span>
                  {partner.interiorPhotoRef ? (
                    <span className="text-[10px] text-emerald-600 font-bold">✓</span>
                  ) : (
                    <span className="text-[10px] text-rose-600 font-bold">✕</span>
                  )}
                </div>
                {partner.interiorPhotoRef ? (
                  <div 
                    onClick={() => setSelectedPhoto(partner.interiorPhotoRef)}
                    className="relative group cursor-pointer aspect-video sm:aspect-square bg-gray-100 rounded-xl overflow-hidden border border-gray-200 shadow-sm"
                  >
                    <img 
                      src={partner.interiorPhotoRef} 
                      alt="Workshop Interior" 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-bold gap-1">
                      <Eye className="w-4 h-4" /> Click to Zoom
                    </div>
                  </div>
                ) : (
                  <div className="aspect-video sm:aspect-square bg-gray-50 border border-dashed border-gray-200 rounded-xl flex items-center justify-center text-xs text-gray-400">
                    Missing Interior
                  </div>
                )}
              </div>

              {/* Signboard */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-gray-700">Signboard</span>
                  {partner.signboardPhotoRef ? (
                    <span className="text-[10px] text-emerald-600 font-bold">✓</span>
                  ) : (
                    <span className="text-[10px] text-rose-600 font-bold">✕</span>
                  )}
                </div>
                {partner.signboardPhotoRef ? (
                  <div 
                    onClick={() => setSelectedPhoto(partner.signboardPhotoRef)}
                    className="relative group cursor-pointer aspect-video sm:aspect-square bg-gray-100 rounded-xl overflow-hidden border border-gray-200 shadow-sm"
                  >
                    <img 
                      src={partner.signboardPhotoRef} 
                      alt="Workshop Signboard" 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-bold gap-1">
                      <Eye className="w-4 h-4" /> Click to Zoom
                    </div>
                  </div>
                ) : (
                  <div className="aspect-video sm:aspect-square bg-gray-50 border border-dashed border-gray-200 rounded-xl flex items-center justify-center text-xs text-gray-400">
                    Missing Signboard
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
              <span>Signage Visible: <strong>{partner.exteriorPhotoRef ? "Yes" : "Pending Inspection"}</strong></span>
              <span>Daily Capacity: <strong className="text-gray-900">{partner.dailyCapacity || 5} cars/day</strong></span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* KYC, BANK DETAILS & WORKSHOP CAPABILITIES */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 1. Business & Owner KYC */}
        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="bg-slate-50 border-b border-gray-100 pb-3">
            <CardTitle className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-primary-orange" /> Business &amp; Owner KYC
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3.5 text-xs">
            <div>
              <span className="text-gray-400 block uppercase tracking-wider text-[10px] font-bold">PAN Number</span>
              <div className="flex items-center justify-between mt-0.5">
                <span className="font-mono font-bold text-gray-900 text-sm">{partner.pan || "Not Provided"}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {partner.panStatus || "PENDING"}
                </span>
              </div>
            </div>

            <div>
              <span className="text-gray-400 block uppercase tracking-wider text-[10px] font-bold">GST Registration</span>
              <div className="flex items-center justify-between mt-0.5">
                <span className="font-mono font-bold text-gray-900">
                  {partner.isGstRegistered ? (partner.gstin || "GST Registered") : "Not GST Registered"}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                  {partner.isGstRegistered ? "GSTIN" : partner.nonGstProofType || "NON-GST"}
                </span>
              </div>
              {partner.proofRef && !partner.isGstRegistered && (
                <a href={partner.proofRef} target="_blank" rel="noreferrer" className="text-primary-orange text-[11px] font-bold hover:underline block mt-1">
                  View Non-GST Business Proof ↗
                </a>
              )}
            </div>

            <div>
              <span className="text-gray-400 block uppercase tracking-wider text-[10px] font-bold">MSME / Udyam Number</span>
              <span className="font-mono text-gray-800 font-semibold">{partner.udyamNumber || "Not Provided"}</span>
            </div>

            {partner.isRepresentative && (
              <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 space-y-1">
                <span className="font-bold text-amber-900 text-[11px] block">Registered via Representative</span>
                <p className="text-amber-800 text-[11px]">
                  Name: {partner.representativeDetails?.fullName || "Representative"} ({partner.representativeDetails?.designation || "Staff"})
                </p>
                {partner.authorizationDocRef && (
                  <a href={partner.authorizationDocRef} target="_blank" rel="noreferrer" className="text-amber-900 underline font-bold text-[11px] block pt-0.5">
                    View Authorization Letter ↗
                  </a>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 2. Bank & Settlement (Masked) */}
        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="bg-slate-50 border-b border-gray-100 pb-3">
            <CardTitle className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Landmark className="w-4 h-4 text-primary-orange" /> Bank &amp; Settlement Account
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3.5 text-xs">
            <div>
              <span className="text-gray-400 block uppercase tracking-wider text-[10px] font-bold">Account Holder</span>
              <p className="font-bold text-gray-900 mt-0.5">
                {partner.accountHolderName || partner.bankDetails?.accountHolderName || "Not Provided"}
              </p>
            </div>

            <div>
              <span className="text-gray-400 block uppercase tracking-wider text-[10px] font-bold">Bank Name</span>
              <p className="font-semibold text-gray-800 mt-0.5">{partner.bankName || "Not Provided"}</p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-gray-400 block uppercase tracking-wider text-[10px] font-bold">Account Number</span>
                <span className="font-mono font-bold text-gray-900">{maskedAccountNumber}</span>
              </div>
              <div>
                <span className="text-gray-400 block uppercase tracking-wider text-[10px] font-bold">IFSC Code</span>
                <span className="font-mono font-bold text-gray-900">{partner.ifsc || partner.bankDetails?.ifscCode || "N/A"}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-gray-100">
              <span className="text-gray-400 block uppercase tracking-wider text-[10px] font-bold mb-1">Cancelled Cheque / Bank Proof</span>
              {partner.bankProofRef ? (
                <a
                  href={partner.bankProofRef}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-lg transition-colors text-[11px]"
                >
                  <FileText className="w-3.5 h-3.5 text-primary-orange" /> View Bank Proof Document ↗
                </a>
              ) : (
                <span className="text-rose-600 font-semibold text-[11px]">No bank proof uploaded</span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 3. Workshop Capabilities */}
        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="bg-slate-50 border-b border-gray-100 pb-3">
            <CardTitle className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Wrench className="w-4 h-4 text-primary-orange" /> Workshop Capabilities
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3.5 text-xs">
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-100">
                <span className="text-gray-400 text-[10px] uppercase font-bold block">Service Bays</span>
                <span className="text-base font-bold text-gray-900">{partner.serviceBays || 1} Bays</span>
              </div>
              <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-100">
                <span className="text-gray-400 text-[10px] uppercase font-bold block">Technicians</span>
                <span className="text-base font-bold text-gray-900">{partner.technicianCount || 1} Techs</span>
              </div>
            </div>

            <div>
              <span className="text-gray-400 block uppercase tracking-wider text-[10px] font-bold mb-1.5">Offered Services</span>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                {partner.services && partner.services.length > 0 ? (
                  partner.services.map((s: string, idx: number) => (
                    <span key={idx} className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded-md text-[10px] font-semibold border border-slate-200">
                      {s}
                    </span>
                  ))
                ) : (
                  <span className="text-gray-400 italic">No services specified</span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-gray-100">
              <div>
                <span className="text-gray-400 block">Pickup &amp; Drop:</span>
                <strong className={partner.pickupDropAvailable ? "text-emerald-600" : "text-gray-500"}>
                  {partner.pickupDropAvailable ? "Available ✓" : "No"}
                </strong>
              </div>
              <div>
                <span className="text-gray-400 block">Insurance Repair:</span>
                <strong className={partner.insuranceWorkCapable ? "text-emerald-600" : "text-gray-500"}>
                  {partner.insuranceWorkCapable ? "Capable ✓" : "No"}
                </strong>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* VERIFICATION & REJECTION AUDIT TRAIL HISTORY */}
      <Card className="border-gray-200 shadow-sm">
        <CardHeader className="bg-slate-50 border-b border-gray-100 pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
              <History className="w-5 h-5 text-primary-orange" /> Verification &amp; Rejection Audit History ({auditLogs.length} Entries)
            </CardTitle>
            <span className="text-xs text-gray-500 font-medium">Immutable append-only audit trail</span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {auditLogs.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-xs">
              No verification logs recorded for this partner yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-gray-50/80 text-gray-500 uppercase tracking-wider text-[10px] border-b border-gray-100">
                  <tr>
                    <th className="px-5 py-3">Timestamp</th>
                    <th className="px-4 py-3">Action</th>
                    <th className="px-4 py-3">Transition</th>
                    <th className="px-4 py-3">Verifier / Admin</th>
                    <th className="px-5 py-3">Notes &amp; Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {auditLogs.map((log: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-3.5 font-mono text-gray-600 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          log.action?.includes("APPROVED")
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : log.action?.includes("REJECTED") || log.action === "SUSPENDED"
                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                            : log.action?.includes("RE_VERIFICATION") || log.action?.includes("DUPLICATE")
                            ? "bg-amber-50 text-amber-800 border border-amber-300 font-extrabold"
                            : "bg-blue-50 text-blue-700 border border-blue-200"
                        }`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 font-mono text-[11px] text-gray-700">
                        {log.fromStatus} → <strong className="text-gray-900">{log.toStatus}</strong>
                      </td>
                      <td className="px-4 py-3.5 text-gray-800">
                        {log.verifierId?.fullName || "System Admin"} ({log.verifierId?.role || "SYSTEM"})
                      </td>
                      <td className="px-5 py-3.5 text-gray-700 max-w-xs truncate" title={log.notes}>
                        {log.notes || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Photo Lightbox Modal */}
      {selectedPhoto && (
        <div 
          onClick={() => setSelectedPhoto(null)}
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm cursor-pointer animate-in fade-in"
        >
          <div className="relative max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl bg-black">
            <img src={selectedPhoto} alt="Enlarged Proof" className="max-w-full max-h-[85vh] object-contain mx-auto" />
            <button 
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-3 right-3 bg-white/20 hover:bg-white/40 text-white rounded-full p-2 text-xs font-bold"
            >
              ✕ Close
            </button>
          </div>
        </div>
      )}

      {/* Decision Action Modal */}
      {activeModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-200 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-lg font-bold font-heading text-gray-900 flex items-center gap-2">
                {activeModal === "APPROVE" && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                {activeModal === "REJECT" && <XCircle className="w-5 h-5 text-red-600" />}
                {activeModal === "REQUEST_DOCUMENTS" && <FileText className="w-5 h-5 text-blue-600" />}
                {activeModal === "MARK_MANUAL" && <AlertTriangle className="w-5 h-5 text-amber-600" />}
                {activeModal === "SUSPEND" && <Ban className="w-5 h-5 text-rose-600" />}
                {activeModal === "REACTIVATE" && <RotateCcw className="w-5 h-5 text-emerald-600" />}
                {activeModal === "RECOMMEND" && <ShieldCheck className="w-5 h-5 text-indigo-600" />}
                Confirm Decision: {activeModal.replace(/_/g, " ")}
              </h3>
              <button 
                onClick={() => { setActiveModal(null); setModalNotes(""); }}
                className="text-gray-400 hover:text-gray-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {activeModal === "APPROVE" ? (
              <div className="p-4 bg-emerald-50 rounded-2xl text-emerald-950 text-xs space-y-2 border border-emerald-200">
                <p className="font-bold text-sm text-emerald-900">Final Partner Authorization:</p>
                <p>
                  • A sequential, permanent Partner ID in format <strong>CB-P-000124</strong> will be generated automatically.
                </p>
                <p>• Account status will update to <strong>APPROVED_VERIFIED</strong> and <strong>isActive = true</strong>.</p>
                <p>• Partner dashboard access, bidding on leads, and jobs will be unlocked immediately.</p>
              </div>
            ) : activeModal === "SUSPEND" ? (
              <div className="p-4 bg-rose-50 rounded-2xl text-rose-950 text-xs space-y-2 border border-rose-200">
                <p className="font-bold text-sm text-rose-900">Suspension Enforcement:</p>
                <p>• Immediate operational lockout on next request.</p>
                <p>• Any active in-progress bookings and jobs will be flagged for Admin workflow.</p>
                <p>• A clear suspension reason must be documented below.</p>
              </div>
            ) : null}

            {/* Notes Input Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700">
                {["REJECT", "REQUEST_DOCUMENTS", "SUSPEND"].includes(activeModal) 
                  ? "Notes / Reason (Mandatory)*" 
                  : "Administrative Notes (Optional)"}
              </label>
              <textarea
                rows={4}
                value={modalNotes}
                onChange={(e) => setModalNotes(e.target.value)}
                placeholder={
                  activeModal === "REJECT" 
                    ? "Explain why the application is being rejected..." 
                    : activeModal === "REQUEST_DOCUMENTS" 
                    ? "Specify which documents or clarifications are required..."
                    : activeModal === "SUSPEND"
                    ? "Enter reason for partner suspension..."
                    : "Add any internal remarks..."
                }
                className="w-full text-xs p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-orange focus:outline-none"
              />
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-gray-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setActiveModal(null); setModalNotes(""); }}
                className="rounded-xl text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={actionLoading}
                onClick={handleExecuteAction}
                className={`rounded-xl text-xs font-bold ${
                  activeModal === "REJECT" || activeModal === "SUSPEND"
                    ? "bg-rose-600 hover:bg-rose-700 text-white"
                    : "bg-emerald-600 hover:bg-emerald-700 text-white"
                }`}
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : null}
                Confirm {activeModal.replace(/_/g, " ")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
