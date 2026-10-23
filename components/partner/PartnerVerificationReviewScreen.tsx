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
  Car,
  Download,
  Printer
} from "lucide-react";
import toast from "react-hot-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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

  const generatePartnerPDF = () => {
    const p = data?.partner;
    if (!p) return null;
    const doc = new jsPDF();

    // 1. Header Banner
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, 210, 32, "F");

    doc.setTextColor(249, 115, 22); // orange-500
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("CARBLINK", 14, 15);

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9.5);
    doc.setFont("helvetica", "normal");
    doc.text("PARTNER ONBOARDING & VERIFICATION DOSSIER", 14, 23);

    doc.setFontSize(8.5);
    doc.setTextColor(203, 213, 225);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 135, 15);
    doc.text(`Partner ID: ${p.uniquePartnerId || "PENDING"}`, 135, 23);

    // 2. Partner Basic Information Table
    const basicInfo = [
      ["Workshop Name", p.workshopName || p.businessName || "N/A", "Verification Status", p.verificationStatus || "PENDING"],
      ["Owner Full Name", p.ownerName || p.userId?.fullName || "N/A", "Account Status", p.isActive ? "ACTIVE" : "INACTIVE"],
      ["Registered Mobile", `+91 ${p.userId?.phone || p.mobile || "N/A"}`, "Email Address", p.userId?.email || p.email || "N/A"],
      ["Physical Address", p.addressLine || p.businessAddress || "N/A", "City / State", `${p.city || p.cityId?.name || "N/A"}, ${p.state || "N/A"}`],
      ["GPS Coordinates", p.location?.coordinates ? `Lat: ${p.location.coordinates[1]}, Lng: ${p.location.coordinates[0]}` : "Not Pinned", "PIN Code", p.pincode || "N/A"]
    ];

    autoTable(doc, {
      startY: 37,
      head: [["Workshop Profile & Contact Details", "", "", ""]],
      body: basicInfo,
      theme: "grid",
      headStyles: { fillColor: [249, 115, 22], textColor: 255, fontStyle: "bold", fontSize: 9.5 },
      styles: { fontSize: 8, cellPadding: 2.2 },
      columnStyles: {
        0: { fontStyle: "bold", fillColor: [248, 250, 252], width: 45 },
        1: { width: 55 },
        2: { fontStyle: "bold", fillColor: [248, 250, 252], width: 45 },
        3: { width: 55 }
      }
    });

    let currentY = (doc as any).lastAutoTable.finalY + 6;

    // 3. Business KYC & Tax Registrations Table
    const aadhaarDisplay = p.aadhaarNumber ? `XXXX-XXXX-${p.aadhaarNumber.slice(-4)}` : "Not Provided";
    const kycInfo = [
      ["PAN Number", p.pan || "N/A", "PAN Verification Status", p.panStatus || "PENDING"],
      ["GSTIN", p.isGstRegistered ? (p.gstin || "N/A") : "Not GST Registered", "GST Status", p.gstStatus || (p.isGstRegistered ? "PENDING" : "NON-GST")],
      ["Aadhaar Card", aadhaarDisplay, "Aadhaar Status", p.aadhaarStatus || "PENDING"],
      ["Aadhaar Holder Name", p.aadhaarHolderName || p.ownerName || "N/A", "MSME / Udyam No.", p.udyamNumber || "N/A"],
      ["Representative", p.isRepresentative ? `${p.representativeDetails?.fullName || "Representative"} (${p.representativeDetails?.designation || "Staff"})` : "Self (Owner)", "Non-GST Proof Type", p.nonGstProofType || "N/A"]
    ];

    autoTable(doc, {
      startY: currentY,
      head: [["Government Identification & Tax Compliance", "", "", ""]],
      body: kycInfo,
      theme: "grid",
      headStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: "bold", fontSize: 9.5 },
      styles: { fontSize: 8, cellPadding: 2.2 },
      columnStyles: {
        0: { fontStyle: "bold", fillColor: [248, 250, 252], width: 45 },
        1: { width: 55 },
        2: { fontStyle: "bold", fillColor: [248, 250, 252], width: 45 },
        3: { width: 55 }
      }
    });

    currentY = (doc as any).lastAutoTable.finalY + 6;

    // 4. Bank Account & Settlement Table
    const bankInfo = [
      ["Account Holder Name", p.accountHolderName || p.bankDetails?.accountHolderName || "N/A", "Bank Name", p.bankName || "N/A"],
      ["Bank Account Number", data?.maskedAccountNumber || p.accountNumber || "N/A", "IFSC Code", p.ifsc || p.bankDetails?.ifscCode || "N/A"],
      ["Bank Verification Status", p.bankVerificationStatus || "PENDING", "Bank Proof Document", p.bankProofRef ? "Uploaded & Available" : "Missing"]
    ];

    autoTable(doc, {
      startY: currentY,
      head: [["Bank Account & Payout Settlement Details", "", "", ""]],
      body: bankInfo,
      theme: "grid",
      headStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: "bold", fontSize: 9.5 },
      styles: { fontSize: 8, cellPadding: 2.2 },
      columnStyles: {
        0: { fontStyle: "bold", fillColor: [248, 250, 252], width: 45 },
        1: { width: 55 },
        2: { fontStyle: "bold", fillColor: [248, 250, 252], width: 45 },
        3: { width: 55 }
      }
    });

    currentY = (doc as any).lastAutoTable.finalY + 6;

    // 5. Capabilities & Service Parameters Table
    const workingDaysStr = Array.isArray(p.workingDays) && p.workingDays.length > 0 ? p.workingDays.join(", ") : "Mon - Sat";
    const workingHoursStr = p.workingHours?.open && p.workingHours?.close ? `${p.workingHours.open} - ${p.workingHours.close}` : "09:00 AM - 08:00 PM";
    const servicesStr = Array.isArray(p.services) && p.services.length > 0 
      ? p.services.map((s: string) => s === "Other" && p.otherServicesDescription ? `Other (${p.otherServicesDescription})` : s).join(", ")
      : "None Specified";

    const capInfo = [
      ["Service Bays", `${p.serviceBays || 1} Bays`, "Technicians", `${p.technicianCount || 1} Technicians`],
      ["Working Hours", workingHoursStr, "Working Days", workingDaysStr],
      ["Pickup & Drop", p.pickupDropAvailable ? "Yes (Available)" : "No", "Insurance Repair", p.insuranceWorkCapable ? "Yes (Authorized)" : "No"],
      ["Authorized Service", p.authorizedServiceClaim ? "Claimed (Certificate Attached)" : "No", "Daily Capacity", `${p.dailyCapacity || 5} cars/day`],
      ["Services Offered", { content: servicesStr, colSpan: 3 }]
    ];

    autoTable(doc, {
      startY: currentY,
      head: [["Workshop Capabilities & Operational Parameters", "", "", ""]],
      body: capInfo as any,
      theme: "grid",
      headStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: "bold", fontSize: 9.5 },
      styles: { fontSize: 8, cellPadding: 2.2 },
      columnStyles: {
        0: { fontStyle: "bold", fillColor: [248, 250, 252], width: 45 },
        1: { width: 55 },
        2: { fontStyle: "bold", fillColor: [248, 250, 252], width: 45 },
        3: { width: 55 }
      }
    });

    // 6. Submitted Proofs & Documents List Table
    currentY = (doc as any).lastAutoTable.finalY + 6;
    if (currentY > 230) {
      doc.addPage();
      currentY = 20;
    }

    const docItems = [
      ["Workshop Exterior Photo", p.exteriorPhotoRef ? "Available (Uploaded)" : "Missing", p.exteriorPhotoRef || "N/A"],
      ["Workshop Interior / Bay Photo", p.interiorPhotoRef ? "Available (Uploaded)" : "Missing", p.interiorPhotoRef || "N/A"],
      ["Signboard / Nameplate Photo", p.signboardPhotoRef ? "Available (Uploaded)" : "Missing", p.signboardPhotoRef || "N/A"],
      [`Address Proof (${p.addressProofType || "ELECTRICITY_BILL"})`, p.addressProofRef ? "Available (Uploaded)" : "Missing", p.addressProofRef || "N/A"],
      ["Bank Cheque / Passbook Proof", p.bankProofRef ? "Available (Uploaded)" : "Missing", p.bankProofRef || "N/A"],
      ["Aadhaar Identity Proof", p.aadhaarProofRef ? "Available (Uploaded)" : (p.aadhaarNumber ? "Aadhaar Number Verified" : "N/A"), p.aadhaarProofRef || "N/A"],
      ["Non-GST Business Proof", p.proofRef ? "Available (Uploaded)" : "N/A", p.proofRef || "N/A"],
      ["Representative Authorization Letter", p.authorizationDocRef ? "Available (Uploaded)" : "N/A", p.authorizationDocRef || "N/A"],
      ["Authorized Service Certificate", p.authorizedServiceProofRef ? "Available (Uploaded)" : "N/A", p.authorizedServiceProofRef || "N/A"]
    ];

    autoTable(doc, {
      startY: currentY,
      head: [["Submitted Verification Documents & Upload Proofs", "Status", "Reference / URL"]],
      body: docItems,
      theme: "grid",
      headStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: "bold", fontSize: 9 },
      styles: { fontSize: 7.5, cellPadding: 2 },
      columnStyles: {
        0: { fontStyle: "bold", fillColor: [248, 250, 252], width: 55 },
        1: { width: 40 },
        2: { width: 105 }
      }
    });

    // 7. Audit History Trail
    if (auditLogs && auditLogs.length > 0) {
      currentY = (doc as any).lastAutoTable.finalY + 6;
      if (currentY > 230) {
        doc.addPage();
        currentY = 20;
      }

      const auditRows = auditLogs.map((log: any) => [
        new Date(log.timestamp).toLocaleString(),
        log.action,
        `${log.fromStatus || "START"} -> ${log.toStatus || "N/A"}`,
        log.verifierId?.fullName || "System",
        log.notes || "-"
      ]);

      autoTable(doc, {
        startY: currentY,
        head: [["Verification Audit History", "", "", "", ""]],
        body: [
          ["Timestamp", "Action", "Status Transition", "Verifier", "Notes"],
          ...auditRows
        ],
        theme: "striped",
        headStyles: { fillColor: [71, 85, 105], textColor: 255, fontStyle: "bold", fontSize: 8.5 },
        styles: { fontSize: 7.5, cellPadding: 2 }
      });
    }

    // Page numbers footer
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `CarBlink Partner Onboarding & Verification System — Page ${i} of ${pageCount}`,
        14,
        290
      );
    }

    return doc;
  };

  const handleSavePDF = () => {
    try {
      const doc = generatePartnerPDF();
      if (!doc) {
        toast.error("Partner details are not loaded yet");
        return;
      }
      const safeName = (data?.partner?.workshopName || data?.partner?.businessName || "partner")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "_");
      const filename = `${safeName}_verification_dossier.pdf`;
      doc.save(filename);
      toast.success("Partner dossier PDF saved (downloaded) successfully!");
    } catch (err: any) {
      console.error("Failed to generate and save PDF:", err);
      toast.error("Failed to save partner PDF dossier");
    }
  };

  const handlePrintPDF = () => {
    try {
      const doc = generatePartnerPDF();
      if (!doc) {
        toast.error("Partner details are not loaded yet");
        return;
      }
      const blob = doc.output("blob");
      const blobUrl = URL.createObjectURL(blob);

      const iframe = document.createElement("iframe");
      iframe.style.position = "fixed";
      iframe.style.right = "0";
      iframe.style.bottom = "0";
      iframe.style.width = "0";
      iframe.style.height = "0";
      iframe.style.border = "0";
      iframe.src = blobUrl;
      document.body.appendChild(iframe);

      iframe.onload = () => {
        setTimeout(() => {
          try {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
            toast.success("Print dialog opened for Partner Dossier PDF");
          } catch (e) {
            window.open(blobUrl, "_blank");
          }
        }, 250);
      };
    } catch (err: any) {
      console.error("Failed to print partner PDF:", err);
      toast.error("Failed to print partner PDF dossier");
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

  const isPdfUrl = (url?: string): boolean => {
    const clean = url.split("?")[0].toLowerCase();
    return clean.endsWith(".pdf") || url.includes("/raw/upload/") || url.includes("application/pdf");
  };

  const renderProofThumbnail = (url: string, label: string) => {
    const isPdf = isPdfUrl(url);
    const isCloudinary = isPdf && url.includes("cloudinary.com");
    const thumbUrl = isCloudinary ? url.replace(/\.pdf($|\?)/i, ".jpg$1") : null;

    if (isPdf) {
      return (
        <a 
          href={url}
          target="_blank"
          rel="noreferrer"
          className="relative group cursor-pointer aspect-video sm:aspect-square bg-slate-100 rounded-xl overflow-hidden border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center block"
        >
          {thumbUrl ? (
            <>
              <img 
                src={thumbUrl} 
                alt={label} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
              <div className="absolute top-2 left-2 bg-black/75 text-white text-[10px] font-bold px-2 py-0.5 rounded backdrop-blur-xs flex items-center gap-1 shadow-sm">
                <FileText className="w-3 h-3 text-primary-orange" /> PDF Document
              </div>
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-bold gap-1.5">
                <ExternalLink className="w-4 h-4" /> Open PDF Document ↗
              </div>
            </>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-orange-50/50 p-2 text-slate-800">
              <div className="w-10 h-10 rounded-full bg-primary-orange/10 flex items-center justify-center text-primary-orange mb-1.5 shadow-xs">
                <FileText className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold text-gray-900 line-clamp-1">{label}</span>
              <span className="text-[10px] font-semibold text-primary-orange bg-primary-orange/10 px-2 py-0.5 rounded-full mt-0.5">
                PDF Document
              </span>
              <div className="mt-2 text-[11px] font-bold text-blue-600 group-hover:underline flex items-center gap-1">
                <ExternalLink className="w-3.5 h-3.5" /> View PDF ↗
              </div>
            </div>
          )}
        </a>
      );
    }

    return (
      <div 
        onClick={() => setSelectedPhoto(url)}
        className="relative group cursor-pointer aspect-video sm:aspect-square bg-gray-100 rounded-xl overflow-hidden border border-gray-200 shadow-sm"
      >
        <img 
          src={url} 
          alt={label} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
        />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-bold gap-1">
          <Eye className="w-4 h-4" /> Click to Zoom
        </div>
      </div>
    );
  };

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

          {/* PDF Generation: Save (Download) & Print */}
          <div className="flex items-center gap-1.5 border-l border-gray-200 pl-2.5">
            <Button
              type="button"
              variant="outline"
              onClick={handleSavePDF}
              className="bg-white border-slate-300 text-slate-800 hover:bg-slate-50 hover:text-primary-orange font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-primary-orange" /> Save PDF
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={handlePrintPDF}
              className="bg-white border-slate-300 text-slate-800 hover:bg-slate-50 hover:text-blue-600 font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5 text-blue-600" /> Print PDF
            </Button>
          </div>
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
                  renderProofThumbnail(partner.exteriorPhotoRef, "Workshop Exterior")
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
                  renderProofThumbnail(partner.interiorPhotoRef, "Workshop Interior")
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
                  renderProofThumbnail(partner.signboardPhotoRef, "Workshop Signboard")
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

            <div>
              <span className="text-gray-400 block uppercase tracking-wider text-[10px] font-bold">Aadhaar Card (Owner)</span>
              <div className="flex items-center justify-between mt-0.5">
                <span className="font-mono font-bold text-gray-900">
                  {partner.aadhaarNumber ? `XXXX-XXXX-${partner.aadhaarNumber.slice(-4)}` : "Not Provided"}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                  partner.aadhaarStatus === "VERIFIED"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-gray-100 text-gray-700 border-gray-200"
                }`}>
                  {partner.aadhaarStatus || "PENDING"}
                </span>
              </div>
              {partner.aadhaarHolderName && (
                <p className="text-[11px] text-gray-500 mt-0.5">
                  Holder: <strong className="text-gray-800">{partner.aadhaarHolderName}</strong>
                </p>
              )}
              {partner.aadhaarProofRef && (
                <a href={partner.aadhaarProofRef} target="_blank" rel="noreferrer" className="text-primary-orange text-[11px] font-bold hover:underline block mt-1">
                  View Aadhaar Document ↗
                </a>
              )}
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
                  partner.services.map((s: string, idx: number) => {
                    const isOther = s === "Other";
                    return (
                      <span
                        key={idx}
                        className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${
                          isOther && partner.otherServicesDescription
                            ? "bg-amber-50 text-amber-900 border-amber-300 font-bold"
                            : "bg-slate-100 text-slate-800 border-slate-200"
                        }`}
                      >
                        {isOther && partner.otherServicesDescription
                          ? `Other: ${partner.otherServicesDescription}`
                          : s}
                      </span>
                    );
                  })
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

            {/* Working Schedule & Authorized Service Claim */}
            <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-100 space-y-1 text-[11px]">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Working Days:</span>
                <span className="font-bold text-gray-800">
                  {partner.workingDays && partner.workingDays.length > 0 ? partner.workingDays.join(", ") : "Mon - Sat"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Working Hours:</span>
                <span className="font-bold text-gray-800">
                  {partner.workingHours?.open && partner.workingHours?.close
                    ? `${partner.workingHours.open} - ${partner.workingHours.close}`
                    : "09:00 AM - 08:00 PM"}
                </span>
              </div>
            </div>

            {partner.authorizedServiceClaim && (
              <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg text-[11px]">
                <span className="font-bold text-blue-900 block">Authorized Brand Workshop Claim</span>
                {partner.authorizedServiceProofRef && (
                  <a href={partner.authorizedServiceProofRef} target="_blank" rel="noreferrer" className="text-blue-700 underline font-semibold mt-0.5 block">
                    View Authorization Certificate ↗
                  </a>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* COMPLETE SUBMITTED DOCUMENTS & AUTO-GENERATED DOSSIER */}
      <Card className="border-gray-200 shadow-sm overflow-hidden">
        <CardHeader className="bg-slate-50 border-b border-gray-100 py-3.5 px-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary-orange" /> Submitted Verification Documents &amp; Auto-Generated Dossier
              </CardTitle>
              <p className="text-xs text-gray-500 mt-0.5">
                Complete archive of legal, business, and workshop proofs submitted by this partner
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                type="button"
                onClick={handleSavePDF}
                className="bg-primary-orange hover:bg-primary-orange-dark text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" /> Save PDF Dossier
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handlePrintPDF}
                className="bg-white border-slate-300 text-slate-800 hover:bg-slate-100 font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5 text-blue-600" /> Print Dossier
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {/* 1. Exterior Photo */}
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <span className="text-[10px] uppercase font-bold text-gray-400 block">Workshop Exterior Photo</span>
                <span className="text-xs font-semibold text-gray-800 truncate block">
                  {partner.exteriorPhotoRef ? "Exterior Image Uploaded" : "Not Provided"}
                </span>
              </div>
              {partner.exteriorPhotoRef ? (
                <a href={partner.exteriorPhotoRef} target="_blank" rel="noreferrer" className="text-xs font-bold text-primary-orange hover:underline shrink-0">
                  View ↗
                </a>
              ) : (
                <span className="text-[11px] text-gray-400 font-medium shrink-0">Missing</span>
              )}
            </div>

            {/* 2. Interior Photo */}
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <span className="text-[10px] uppercase font-bold text-gray-400 block">Interior / Bay Photo</span>
                <span className="text-xs font-semibold text-gray-800 truncate block">
                  {partner.interiorPhotoRef ? "Service Bay Image Uploaded" : "Not Provided"}
                </span>
              </div>
              {partner.interiorPhotoRef ? (
                <a href={partner.interiorPhotoRef} target="_blank" rel="noreferrer" className="text-xs font-bold text-primary-orange hover:underline shrink-0">
                  View ↗
                </a>
              ) : (
                <span className="text-[11px] text-gray-400 font-medium shrink-0">Missing</span>
              )}
            </div>

            {/* 3. Signboard Photo */}
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <span className="text-[10px] uppercase font-bold text-gray-400 block">Signage / Nameplate Photo</span>
                <span className="text-xs font-semibold text-gray-800 truncate block">
                  {partner.signboardPhotoRef 
                    ? (isPdfUrl(partner.signboardPhotoRef) ? "Signboard PDF Document" : "Signboard Image Uploaded") 
                    : "Not Provided"}
                </span>
              </div>
              {partner.signboardPhotoRef ? (
                <a href={partner.signboardPhotoRef} target="_blank" rel="noreferrer" className="text-xs font-bold text-primary-orange hover:underline shrink-0">
                  View ↗
                </a>
              ) : (
                <span className="text-[11px] text-gray-400 font-medium shrink-0">Missing</span>
              )}
            </div>

            {/* 4. Address Proof */}
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <span className="text-[10px] uppercase font-bold text-gray-400 block">
                  Address Proof ({partner.addressProofType || "ELECTRICITY_BILL"})
                </span>
                <span className="text-xs font-semibold text-gray-800 truncate block">
                  {partner.addressProofRef ? "Document Uploaded" : "Not Provided"}
                </span>
              </div>
              {partner.addressProofRef ? (
                <a href={partner.addressProofRef} target="_blank" rel="noreferrer" className="text-xs font-bold text-primary-orange hover:underline shrink-0">
                  View ↗
                </a>
              ) : (
                <span className="text-[11px] text-gray-400 font-medium shrink-0">Missing</span>
              )}
            </div>

            {/* 5. Bank Cheque / Passbook Proof */}
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <span className="text-[10px] uppercase font-bold text-gray-400 block">Bank Account Proof</span>
                <span className="text-xs font-semibold text-gray-800 truncate block">
                  {partner.bankProofRef ? "Cancelled Cheque / Passbook" : "Not Provided"}
                </span>
              </div>
              {partner.bankProofRef ? (
                <a href={partner.bankProofRef} target="_blank" rel="noreferrer" className="text-xs font-bold text-primary-orange hover:underline shrink-0">
                  View ↗
                </a>
              ) : (
                <span className="text-[11px] text-gray-400 font-medium shrink-0">Missing</span>
              )}
            </div>

            {/* 6. Aadhaar Document Proof */}
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <span className="text-[10px] uppercase font-bold text-gray-400 block">Aadhaar Identification</span>
                <span className="text-xs font-semibold text-gray-800 truncate block">
                  {partner.aadhaarNumber ? `Aadhaar XXXX-${partner.aadhaarNumber.slice(-4)}` : "Not Provided"}
                </span>
              </div>
              {partner.aadhaarProofRef ? (
                <a href={partner.aadhaarProofRef} target="_blank" rel="noreferrer" className="text-xs font-bold text-primary-orange hover:underline shrink-0">
                  View Doc ↗
                </a>
              ) : (
                <span className="text-[11px] text-emerald-600 font-medium shrink-0">
                  {partner.aadhaarNumber ? "Verified ✓" : "Missing"}
                </span>
              )}
            </div>

            {/* 7. Non-GST Proof (if applicable) */}
            {partner.proofRef && !partner.isGstRegistered && (
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-[10px] uppercase font-bold text-gray-400 block">Non-GST Business Proof</span>
                  <span className="text-xs font-semibold text-gray-800 truncate block">
                    {partner.nonGstProofType || "Business License"}
                  </span>
                </div>
                <a href={partner.proofRef} target="_blank" rel="noreferrer" className="text-xs font-bold text-primary-orange hover:underline shrink-0">
                  View ↗
                </a>
              </div>
            )}

            {/* 8. Representative Authorization (if applicable) */}
            {partner.authorizationDocRef && (
              <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-[10px] uppercase font-bold text-amber-900 block">Representative Authorization</span>
                  <span className="text-xs font-semibold text-amber-950 truncate block">
                    Owner Authorization Letter
                  </span>
                </div>
                <a href={partner.authorizationDocRef} target="_blank" rel="noreferrer" className="text-xs font-bold text-amber-900 underline shrink-0">
                  View ↗
                </a>
              </div>
            )}

            {/* 9. Authorized Service Certificate (if applicable) */}
            {partner.authorizedServiceProofRef && (
              <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-[10px] uppercase font-bold text-blue-900 block">Authorized Brand Certificate</span>
                  <span className="text-xs font-semibold text-blue-950 truncate block">
                    OEM / Brand Authorization
                  </span>
                </div>
                <a href={partner.authorizedServiceProofRef} target="_blank" rel="noreferrer" className="text-xs font-bold text-blue-800 underline shrink-0">
                  View ↗
                </a>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

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

      {/* Photo / Document Lightbox Modal */}
      {selectedPhoto && (
        <div 
          onClick={() => setSelectedPhoto(null)}
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm cursor-pointer animate-in fade-in"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl w-full max-h-[90vh] overflow-hidden rounded-2xl bg-white shadow-2xl flex flex-col"
          >
            <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 text-white border-b border-slate-800">
              <span className="text-xs font-bold flex items-center gap-2">
                {isPdfUrl(selectedPhoto) ? (
                  <>
                    <FileText className="w-4 h-4 text-primary-orange" /> PDF Document Preview
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4 text-primary-orange" /> Workshop Photo Preview
                  </>
                )}
              </span>
              <div className="flex items-center gap-2">
                <a
                  href={selectedPhoto}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded-md transition-colors"
                >
                  Open in New Tab <ExternalLink className="w-3 h-3" />
                </a>
                <button 
                  onClick={() => setSelectedPhoto(null)}
                  className="bg-slate-800 hover:bg-slate-700 text-white rounded-md px-2.5 py-1 text-xs font-bold transition-colors"
                >
                  ✕ Close
                </button>
              </div>
            </div>

            <div className="p-2 bg-slate-950 flex items-center justify-center min-h-[400px] max-h-[82vh] overflow-auto">
              {isPdfUrl(selectedPhoto) ? (
                <div className="w-full h-[75vh] flex flex-col bg-slate-900 rounded-lg overflow-hidden border border-slate-800">
                  <iframe
                    src={`https://docs.google.com/viewer?url=${encodeURIComponent(selectedPhoto)}&embedded=true`}
                    title="PDF Preview"
                    className="w-full flex-1 border-0 bg-white"
                  />
                  <div className="p-2.5 bg-slate-800/90 text-center flex items-center justify-center gap-3">
                    <span className="text-xs text-slate-300">Viewing PDF Document</span>
                    <a
                      href={selectedPhoto}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary-orange hover:bg-primary-orange-dark text-white text-xs font-bold rounded-lg shadow-sm transition-colors"
                    >
                      Open Original PDF in New Tab <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              ) : (
                <img 
                  src={selectedPhoto} 
                  alt="Enlarged Proof" 
                  className="max-w-full max-h-[80vh] object-contain mx-auto rounded-lg" 
                />
              )}
            </div>
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
