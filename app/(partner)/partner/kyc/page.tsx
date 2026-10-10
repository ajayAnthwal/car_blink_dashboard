// @ts-nocheck
"use client";

import React, { useState, useEffect } from "react";
import { apiClient } from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileUpload } from "@/components/ui/FileUpload";
import {
  ShieldCheck,
  Building2,
  UserCheck,
  FileText,
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
  AlertTriangle,
  MapPin,
  Compass,
  Landmark,
  Wrench,
  ChevronRight,
  Info,
  Check,
  Car,
  Calendar,
} from "lucide-react";

const ALL_SERVICES = [
  "Mechanical",
  "General Service",
  "AC",
  "Electrical",
  "Denting/Painting",
  "Detailing",
  "PPF",
  "Ceramic",
  "Car Wash",
  "Tyres",
  "Battery",
  "Insurance Repair",
  "Body Shop",
  "Other",
];

const ALL_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function PartnerKycPage() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"checklist" | "business" | "workshop" | "bank" | "capabilities">("checklist");
  const [checklistData, setChecklistData] = useState<any>(null);
  const [message, setMessage] = useState<{ type: "success" | "error" | "warning"; text: string } | null>(null);

  // Submitting states per step
  const [submittingStep, setSubmittingStep] = useState<string | null>(null);

  // Step 1: Business KYC State
  const [pan, setPan] = useState("");
  const [panHolderName, setPanHolderName] = useState("");
  const [isGstRegistered, setIsGstRegistered] = useState(false);
  const [gstin, setGstin] = useState("");
  const [gstLegalName, setGstLegalName] = useState("");
  const [gstTradeName, setGstTradeName] = useState("");
  const [nonGstProofType, setNonGstProofType] = useState("SHOP_ESTABLISHMENT_LICENSE");
  const [proofRef, setProofRef] = useState("");
  const [udyamNumber, setUdyamNumber] = useState("");
  const [businessRegistrationProofRef, setBusinessRegistrationProofRef] = useState("");
  const [isRepresentative, setIsRepresentative] = useState(false);
  const [representativeName, setRepresentativeName] = useState("");
  const [representativeMobile, setRepresentativeMobile] = useState("");
  const [representativeEmail, setRepresentativeEmail] = useState("");
  const [representativeDesignation, setRepresentativeDesignation] = useState("");
  const [authorizationDocRef, setAuthorizationDocRef] = useState("");

  // Step 2: Workshop Proof State
  const [exteriorPhotoRef, setExteriorPhotoRef] = useState("");
  const [interiorPhotoRef, setInteriorPhotoRef] = useState("");
  const [signboardPhotoRef, setSignboardPhotoRef] = useState("");
  const [addressProofType, setAddressProofType] = useState("ELECTRICITY_BILL");
  const [addressProofRef, setAddressProofRef] = useState("");
  const [latitude, setLatitude] = useState<string>("28.6139");
  const [longitude, setLongitude] = useState<string>("77.2090");
  const [isLocating, setIsLocating] = useState(false);

  // Step 3: Bank Details State
  const [accountHolderName, setAccountHolderName] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifsc, setIfsc] = useState("");
  const [bankProofRef, setBankProofRef] = useState("");

  // Step 4: Capabilities State
  const [services, setServices] = useState<string[]>(["Mechanical", "General Service", "Car Wash"]);
  const [serviceBays, setServiceBays] = useState<number>(2);
  const [technicianCount, setTechnicianCount] = useState<number>(3);
  const [workingDays, setWorkingDays] = useState<string[]>(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]);
  const [openTime, setOpenTime] = useState<string>("09:00 AM");
  const [closeTime, setCloseTime] = useState<string>("08:00 PM");
  const [pickupDropAvailable, setPickupDropAvailable] = useState<boolean>(false);
  const [insuranceWorkCapable, setInsuranceWorkCapable] = useState<boolean>(false);
  const [authorizedServiceClaim, setAuthorizedServiceClaim] = useState<boolean>(false);
  const [authorizedServiceProofRef, setAuthorizedServiceProofRef] = useState<string>("");

  const loadData = async () => {
    try {
      setLoading(true);
      const [businessRes, checklistRes] = await Promise.all([
        apiClient.get("/partner/kyc/business/status"),
        apiClient.get("/partner/kyc/checklist"),
      ]);

      const bRaw = businessRes?.data;
      const bData = bRaw?.data && !Array.isArray(bRaw.data) ? bRaw.data : bRaw;

      const cRaw = checklistRes?.data;
      const cData = cRaw?.partnerId || cRaw?.checklist || cRaw?.completedItems
        ? cRaw
        : (cRaw?.data && !Array.isArray(cRaw.data) ? cRaw.data : cRaw);

      if (cData) {
        setChecklistData(cData);
        const d = (cData.data && typeof cData.data === 'object' && !Array.isArray(cData.data)) ? cData.data : cData;
        if (d) {
          if (d.exteriorPhotoRef) setExteriorPhotoRef(d.exteriorPhotoRef);
          if (d.interiorPhotoRef) setInteriorPhotoRef(d.interiorPhotoRef);
          if (d.signboardPhotoRef) setSignboardPhotoRef(d.signboardPhotoRef);
          if (d.addressProofType) setAddressProofType(d.addressProofType);
          if (d.addressProofRef) setAddressProofRef(d.addressProofRef);
          if (d.latitude !== undefined) setLatitude(String(d.latitude));
          if (d.longitude !== undefined) setLongitude(String(d.longitude));
          if (d.accountHolderName) setAccountHolderName(d.accountHolderName);
          if (d.bankName) setBankName(d.bankName);
          if (d.accountNumber) setAccountNumber(d.accountNumber);
          if (d.ifsc) setIfsc(d.ifsc);
          if (d.bankProofRef) setBankProofRef(d.bankProofRef);
          if (d.services && Array.isArray(d.services) && d.services.length > 0) setServices(d.services);
          if (d.serviceBays) setServiceBays(d.serviceBays);
          if (d.technicianCount) setTechnicianCount(d.technicianCount);
          if (d.workingDays) setWorkingDays(d.workingDays);
          if (d.workingHours?.open) setOpenTime(d.workingHours.open);
          if (d.workingHours?.close) setCloseTime(d.workingHours.close);
          if (d.pickupDropAvailable !== undefined) setPickupDropAvailable(d.pickupDropAvailable);
          if (d.insuranceWorkCapable !== undefined) setInsuranceWorkCapable(d.insuranceWorkCapable);
          if (d.authorizedServiceClaim !== undefined) setAuthorizedServiceClaim(d.authorizedServiceClaim);
          if (d.authorizedServiceProofRef) setAuthorizedServiceProofRef(d.authorizedServiceProofRef);
        }
      }

      if (bData) {
        if (bData.pan) setPan(bData.pan);
        if (bData.isGstRegistered !== undefined) setIsGstRegistered(bData.isGstRegistered);
        if (bData.gstin) setGstin(bData.gstin);
        if (bData.gstLegalName) setGstLegalName(bData.gstLegalName);
        if (bData.gstTradeName) setGstTradeName(bData.gstTradeName);
        if (bData.nonGstProofType) setNonGstProofType(bData.nonGstProofType);
        if (bData.proofRef) setProofRef(bData.proofRef);
        if (bData.udyamNumber) setUdyamNumber(bData.udyamNumber);
        if (bData.businessRegistrationProofRef) setBusinessRegistrationProofRef(bData.businessRegistrationProofRef);
        if (bData.isRepresentative !== undefined) setIsRepresentative(bData.isRepresentative);
        if (bData.representativeDetails) {
          setRepresentativeName(bData.representativeDetails.fullName || "");
          setRepresentativeMobile(bData.representativeDetails.mobile || "");
          setRepresentativeEmail(bData.representativeDetails.email || "");
          setRepresentativeDesignation(bData.representativeDetails.designation || "");
        }
        if (bData.authorizationDocRef) setAuthorizationDocRef(bData.authorizationDocRef);
      }
    } catch (err: any) {
      console.error("Failed to load KYC and checklist data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Geolocation detector
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setMessage({ type: "error", text: "Geolocation is not supported by your browser." });
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude.toFixed(6));
        setLongitude(pos.coords.longitude.toFixed(6));
        setIsLocating(false);
      },
      (err) => {
        setIsLocating(false);
        setMessage({ type: "error", text: "Unable to detect GPS position. Please enter manually." });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // 1. Submit Step 1: Business KYC
  const handleSubmitBusinessKyc = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setSubmittingStep("business");

    try {
      const payload: any = {
        pan: pan.trim().toUpperCase(),
        panHolderName: panHolderName.trim() || undefined,
        isGstRegistered,
        gstin: isGstRegistered ? gstin.trim().toUpperCase() : undefined,
        gstLegalName: isGstRegistered ? gstLegalName.trim() : undefined,
        gstTradeName: isGstRegistered ? gstTradeName.trim() : undefined,
        nonGstProofType: !isGstRegistered ? nonGstProofType : undefined,
        proofRef: !isGstRegistered ? proofRef : undefined,
        udyamNumber: udyamNumber.trim() ? udyamNumber.trim().toUpperCase() : undefined,
        businessRegistrationProofRef: businessRegistrationProofRef.trim() || undefined,
        isRepresentative,
        representativeDetails: isRepresentative
          ? {
              fullName: representativeName.trim(),
              mobile: representativeMobile.trim().slice(-10),
              email: representativeEmail.trim() || undefined,
              designation: representativeDesignation.trim() || undefined,
            }
          : undefined,
        authorizationDocRef: isRepresentative ? authorizationDocRef : undefined,
        ownerName: checklistData?.ownerName || undefined,
      };

      await apiClient.post("/partner/kyc/business", payload);
      setMessage({ type: "success", text: "Step 1 (Business KYC) saved successfully!" });
      await loadData();
      setActiveTab("workshop");
    } catch (err: any) {
      setMessage({ type: "error", text: err.response?.data?.message || err.message || "Failed to save Business KYC." });
    } finally {
      setSubmittingStep(null);
    }
  };

  // 2. Submit Step 2: Workshop Physical Proof
  const handleSubmitWorkshopProof = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!exteriorPhotoRef || !interiorPhotoRef || !signboardPhotoRef || !addressProofRef) {
      setMessage({ type: "error", text: "All 4 photos and address proof documents are mandatory." });
      return;
    }

    setSubmittingStep("workshop");
    try {
      const payload = {
        exteriorPhotoRef,
        interiorPhotoRef,
        signboardPhotoRef,
        addressProofType,
        addressProofRef,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
      };

      await apiClient.post("/partner/kyc/workshop-proof", payload);
      setMessage({ type: "success", text: "Step 2 (Workshop Physical Proof) saved successfully!" });
      await loadData();
      setActiveTab("bank");
    } catch (err: any) {
      setMessage({ type: "error", text: err.response?.data?.message || err.message || "Failed to save Workshop Proof." });
    } finally {
      setSubmittingStep(null);
    }
  };

  // 3. Submit Step 3: Bank Details
  const handleSubmitBankDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    const cleanAcc = accountNumber.trim();
    const cleanIfsc = ifsc.trim().toUpperCase();

    if (!cleanAcc || !/^\d{9,18}$/.test(cleanAcc)) {
      setMessage({ type: "error", text: "Valid bank account number (9 to 18 digits) is required." });
      return;
    }
    if (!cleanIfsc || !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(cleanIfsc)) {
      setMessage({ type: "error", text: "Valid 11-character IFSC code is required (e.g., SBIN0001234)." });
      return;
    }
    if (!bankProofRef) {
      setMessage({ type: "error", text: "Please upload your cancelled cheque or passbook proof." });
      return;
    }

    setSubmittingStep("bank");
    try {
      const payload = {
        accountHolderName: accountHolderName.trim(),
        bankName: bankName.trim(),
        accountNumber: cleanAcc,
        ifsc: cleanIfsc,
        bankProofRef,
      };

      const res = await apiClient.post("/partner/kyc/bank-details", payload);
      const data = res.data?.data || res.data;

      if (data?.nameMismatch) {
        setMessage({
          type: "warning",
          text: `Bank details saved, but account holder name mismatched! Marked for manual verification: ${data.mismatchReason || ""}`,
        });
      } else {
        setMessage({ type: "success", text: "Step 3 (Bank Details) saved successfully!" });
      }

      await loadData();
      setActiveTab("capabilities");
    } catch (err: any) {
      setMessage({ type: "error", text: err.response?.data?.message || err.message || "Failed to save Bank Details." });
    } finally {
      setSubmittingStep(null);
    }
  };

  // 4. Submit Step 4: Capabilities
  const handleSubmitCapabilities = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (services.length === 0) {
      setMessage({ type: "error", text: "Please select at least one service offered." });
      return;
    }
    if (authorizedServiceClaim && !authorizedServiceProofRef) {
      setMessage({ type: "error", text: "Supporting proof is required when claiming authorized service status." });
      return;
    }

    setSubmittingStep("capabilities");
    try {
      const payload = {
        services,
        serviceBays: Number(serviceBays),
        technicianCount: Number(technicianCount),
        workingDays,
        workingHours: { open: openTime, close: closeTime },
        pickupDropAvailable,
        insuranceWorkCapable,
        authorizedServiceClaim,
        authorizedServiceProofRef: authorizedServiceClaim ? authorizedServiceProofRef : undefined,
      };

      await apiClient.post("/partner/kyc/capabilities", payload);
      setMessage({ type: "success", text: "Step 4 (Capabilities) saved successfully!" });
      await loadData();
      setActiveTab("checklist");
    } catch (err: any) {
      setMessage({ type: "error", text: err.response?.data?.message || err.message || "Failed to save Capabilities." });
    } finally {
      setSubmittingStep(null);
    }
  };

  const toggleService = (srv: string) => {
    setServices((prev) => (prev.includes(srv) ? prev.filter((s) => s !== srv) : [...prev, srv]));
  };

  const toggleDay = (day: string) => {
    setWorkingDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "APPROVED":
      case "APPROVED_VERIFIED":
        return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200">Verified & Approved</Badge>;
      case "UNDER_REVIEW":
        return <Badge className="bg-purple-500/10 text-purple-600 border-purple-200">Under Review</Badge>;
      case "MANUAL_VERIFICATION_REQUIRED":
        return <Badge className="bg-amber-500/10 text-amber-600 border-amber-200">Manual Verification Required</Badge>;
      case "DOCUMENTS_PENDING":
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-200">Documents Pending</Badge>;
      case "REJECTED":
        return <Badge className="bg-rose-500/10 text-rose-600 border-rose-200 font-semibold">Application Rejected</Badge>;
      case "SUSPENDED":
        return <Badge className="bg-red-500/20 text-red-700 border-red-300 font-bold">Account Suspended</Badge>;
      default:
        return <Badge className="bg-slate-100 text-slate-700 border-slate-200">{status || "Registration Submitted"}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3">
        <Loader2 className="w-8 h-8 text-primary-orange animate-spin" />
        <p className="text-xs text-gray-500 font-medium">Loading Partner Verification Details...</p>
      </div>
    );
  }

  const completedCount = checklistData?.completedItems?.length || 0;
  const pendingCount = checklistData?.pendingItems?.length || 0;
  const totalCount = completedCount + pendingCount;
  const completionPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 font-heading">
            Partner KYC & Workshop Verification
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            {checklistData?.workshopName || "Workshop"} • {checklistData?.ownerName || "Partner"}
          </p>
        </div>
        <div>{getStatusBadge(checklistData?.verificationStatus)}</div>
      </div>

      {/* Dynamic Status Notifications with Explicit Reasons */}
      {checklistData?.verificationStatus === "SUSPENDED" && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-300 text-rose-900 flex items-start space-x-3.5 shadow-sm">
          <AlertTriangle className="w-5 h-5 text-rose-600 mt-0.5 shrink-0" />
          <div className="text-xs sm:text-sm space-y-1.5">
            <p className="font-bold text-rose-800 text-base">Partner Account Suspended</p>
            <p className="text-rose-700">
              <strong>Reason:</strong> &quot;{checklistData?.rejectionReason || checklistData?.adminNotes || "Account suspended by Administrator"}&quot;
            </p>
            <p className="text-rose-600 text-xs">
              Operational dashboard access, job assignment, and bidding have been blocked. Please contact CarBlink Operations support for assistance.
            </p>
          </div>
        </div>
      )}

      {checklistData?.verificationStatus === "REJECTED" && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-300 text-red-900 flex items-start space-x-3.5 shadow-sm">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
          <div className="text-xs sm:text-sm space-y-1.5">
            <p className="font-bold text-red-800 text-base">Application Rejected</p>
            <p className="text-red-700">
              <strong>Reason:</strong> &quot;{checklistData?.rejectionReason || checklistData?.adminNotes || "Requirements or business verification criteria were not met."}&quot;
            </p>
            <p className="text-slate-600 text-xs">
              Partner dashboard access is restricted. Please contact your assigned Field Executive or CarBlink Support at support@carblink.com to resolve discrepancies.
            </p>
          </div>
        </div>
      )}

      {checklistData?.verificationStatus === "MANUAL_VERIFICATION_REQUIRED" && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 flex items-start space-x-3.5 shadow-sm">
          <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
          <div className="text-xs sm:text-sm space-y-1.5">
            <p className="font-bold text-amber-800 text-base">Manual Verification Required</p>
            <p className="text-amber-700">
              <strong>Reason:</strong> &quot;{checklistData?.rejectionReason || checklistData?.adminNotes || "Owner name mismatch or authorized representative documents queued for manual review."}&quot;
            </p>
            <p className="text-amber-800/80 text-xs">
              A member of the CarBlink verification team is manually checking your uploaded documents. Full dashboard features unlock once cleared.
            </p>
          </div>
        </div>
      )}

      {checklistData?.verificationStatus === "UNDER_REVIEW" && (
        <div className="p-4 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 flex items-start space-x-3">
          <Clock className="w-5 h-5 text-purple-600 mt-0.5 shrink-0" />
          <div className="text-xs sm:text-sm space-y-1">
            <p className="font-bold">Application Automatically Under Review!</p>
            <p className="text-purple-800">
              All mandatory items from Task 3 & Task 4 have been submitted. Our field executive and operations team
              are verifying your workshop details for final approval.
            </p>
          </div>
        </div>
      )}

      {message && (
        <div
          className={`p-4 rounded-xl border flex items-start space-x-3 text-xs sm:text-sm ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-900 border-emerald-200"
              : message.type === "error"
              ? "bg-rose-50 text-rose-900 border-rose-200"
              : "bg-amber-50 text-amber-900 border-amber-200"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Checklist Progress Overview Card */}
      <Card className="border-gray-200 shadow-sm bg-gradient-to-br from-slate-900 to-slate-800 text-white">
        <CardContent className="pt-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-semibold text-primary-orange uppercase tracking-wider">
                Onboarding Progress
              </span>
              <h2 className="text-lg font-bold">
                {completedCount} of {totalCount} Mandatory Requirements Completed
              </h2>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold font-mono text-emerald-400">{completionPercent}%</span>
              <p className="text-[11px] text-gray-400">Total Completion</p>
            </div>
          </div>

          <div className="w-full bg-slate-700 h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-primary-orange h-full rounded-full transition-all duration-500"
              style={{ width: `${completionPercent}%` }}
            />
          </div>

          <p className="text-xs text-gray-300">
            {completionPercent === 100
              ? "🎉 All mandatory requirements completed! Your profile is currently under review."
              : "Complete the remaining steps below to automatically move your account to UNDER_REVIEW for verification clearance."}
          </p>
        </CardContent>
      </Card>

      {/* Step Navigation Tabs */}
      <div className="flex overflow-x-auto space-x-2 border-b border-gray-200 pb-2 scrollbar-none">
        <button
          onClick={() => setActiveTab("checklist")}
          className={`px-3 py-2 text-xs font-bold rounded-lg transition-all shrink-0 flex items-center gap-1.5 ${
            activeTab === "checklist"
              ? "bg-slate-900 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          Pending Checklist
          {pendingCount > 0 && (
            <span className="ml-1 px-1.5 py-0.2 bg-amber-400 text-black rounded-full text-[10px] font-bold">
              {pendingCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("business")}
          className={`px-3 py-2 text-xs font-bold rounded-lg transition-all shrink-0 flex items-center gap-1.5 ${
            activeTab === "business"
              ? "bg-primary-orange text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          1. Business KYC
        </button>

        <button
          onClick={() => setActiveTab("workshop")}
          className={`px-3 py-2 text-xs font-bold rounded-lg transition-all shrink-0 flex items-center gap-1.5 ${
            activeTab === "workshop"
              ? "bg-primary-orange text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          2. Workshop Proof
        </button>

        <button
          onClick={() => setActiveTab("bank")}
          className={`px-3 py-2 text-xs font-bold rounded-lg transition-all shrink-0 flex items-center gap-1.5 ${
            activeTab === "bank"
              ? "bg-primary-orange text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          <Landmark className="w-3.5 h-3.5" />
          3. Bank & Settlement
        </button>

        <button
          onClick={() => setActiveTab("capabilities")}
          className={`px-3 py-2 text-xs font-bold rounded-lg transition-all shrink-0 flex items-center gap-1.5 ${
            activeTab === "capabilities"
              ? "bg-primary-orange text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          <Wrench className="w-3.5 h-3.5" />
          4. Capabilities
        </button>
      </div>

      {/* ================= TAB 0: CHECKLIST ================= */}
      {activeTab === "checklist" && (
        <div className="space-y-4">
          {/* Under Review Verification Pipeline Card */}
          {(checklistData?.verificationStatus === "UNDER_REVIEW" || completionPercent === 100) && (
            <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-900 border border-emerald-500/30 rounded-2xl p-5 sm:p-6 text-white shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base sm:text-lg font-bold font-heading text-white">
                        Application Submitted &amp; Under Verification
                      </h3>
                      <Badge className="bg-purple-500 text-white text-[10px] uppercase font-bold tracking-wider">
                        UNDER REVIEW
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-300 mt-0.5">
                      All 4 mandatory onboarding steps have been saved for <span className="text-emerald-300 font-semibold">{checklistData?.workshopName || "your workshop"}</span>.
                    </p>
                  </div>
                </div>
              </div>

              {/* 3-Stage Progress Timeline */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                <div className="bg-slate-800/80 border border-emerald-500/40 rounded-xl p-3.5 text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-300 mb-1">
                    <Check className="w-4 h-4 text-emerald-400" /> Stage 1: Online KYC
                  </div>
                  <p className="text-[11px] text-slate-300 font-medium">Completed ✓ All 15 requirements uploaded and recorded.</p>
                </div>

                <div className="bg-amber-950/40 border border-amber-500/40 rounded-xl p-3.5 text-xs shadow-inner">
                  <div className="flex items-center gap-1.5 font-bold text-amber-300 mb-1">
                    <Clock className="w-4 h-4 text-amber-400 animate-spin" /> Stage 2: Executive On-Site
                  </div>
                  <p className="text-[11px] text-amber-100 font-medium">In Progress ⏳ Field executive will visit your workshop within 24–48 hrs.</p>
                </div>

                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-3.5 text-xs opacity-80">
                  <div className="flex items-center gap-1.5 font-bold text-slate-400 mb-1">
                    <ShieldCheck className="w-4 h-4 text-slate-400" /> Stage 3: Super Admin Final
                  </div>
                  <p className="text-[11px] text-slate-400 font-medium">Pending Stage 2 clearance. Unique Partner ID will be issued.</p>
                </div>
              </div>
            </div>
          )}

          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="pb-3 border-b border-gray-100">
              <CardTitle className="text-sm sm:text-base font-bold text-gray-800 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Mandatory Onboarding Checklist
                </span>
                <span className="text-xs font-semibold text-gray-500">
                  {completedCount} of {totalCount} Completed
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {Object.entries(checklistData?.checklist || {}).map(([key, isDone]: any) => {
                  const labels: Record<string, { title: string; step: string }> = {
                    panSubmitted: { title: "PAN Card Registration", step: "Step 1: Business KYC" },
                    gstOrAlternateProofSubmitted: { title: "GSTIN / Alternate Proof", step: "Step 1: Business KYC" },
                    representativeAuthorizationSubmitted: { title: "Representative Authorization", step: "Step 1: Business KYC" },
                    exteriorPhotoSubmitted: { title: "Workshop Exterior Photo", step: "Step 2: Workshop Proof" },
                    interiorPhotoSubmitted: { title: "Workshop Interior Photo", step: "Step 2: Workshop Proof" },
                    signboardPhotoSubmitted: { title: "Workshop Signboard Photo", step: "Step 2: Workshop Proof" },
                    addressProofSubmitted: { title: "Workshop Address Proof", step: "Step 2: Workshop Proof" },
                    mapLocationSubmitted: { title: "Google Maps Location Coordinates", step: "Step 2: Workshop Proof" },
                    bankAccountSubmitted: { title: "Bank Account Number", step: "Step 3: Bank & Settlement" },
                    bankIfscSubmitted: { title: "Bank IFSC Code", step: "Step 3: Bank & Settlement" },
                    bankProofSubmitted: { title: "Cancelled Cheque Proof", step: "Step 3: Bank & Settlement" },
                    servicesSelected: { title: "Services Offered Selected", step: "Step 4: Capabilities" },
                    serviceBaysSpecified: { title: "Service Bays Capacity", step: "Step 4: Capabilities" },
                    techniciansSpecified: { title: "Technicians Count", step: "Step 4: Capabilities" },
                    authorizedProofSubmitted: { title: "Authorized Service Proof", step: "Step 4: Capabilities" },
                  };

                  const info = labels[key] || { title: key, step: "KYC Step" };

                  return (
                    <div
                      key={key}
                      className={`p-3 rounded-xl border flex items-center justify-between ${
                        isDone ? "bg-emerald-50/60 border-emerald-200" : "bg-amber-50/60 border-amber-200"
                      }`}
                    >
                      <div className="flex items-center space-x-2.5">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                            isDone ? "bg-emerald-500 text-white" : "bg-amber-400 text-white"
                          }`}
                        >
                          {isDone ? <Check className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{info.title}</p>
                          <p className="text-[10px] text-gray-500">{info.step}</p>
                        </div>
                      </div>
                      <Badge className={isDone ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-800"}>
                        {isDone ? "Done" : "Pending"}
                      </Badge>
                    </div>
                  );
                })}
              </div>

              <div className="pt-2 flex flex-col sm:flex-row justify-end items-center gap-2 sm:gap-3">
                {pendingCount > 0 ? (
                  <Button
                    onClick={() => setActiveTab("business")}
                    className="w-full sm:w-auto bg-primary-orange hover:bg-primary-orange-dark text-white font-bold text-xs h-10"
                  >
                    Start Completing Pending Steps
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => setActiveTab("business")}
                      className="w-full sm:w-auto border-gray-300 text-gray-700 hover:bg-gray-100 font-bold text-xs h-10"
                    >
                      View / Review Submitted Steps
                    </Button>
                    <Button
                      onClick={loadData}
                      className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-10 shadow-sm"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-1.5" />
                      All Requirements Met ✓ (Refresh Status)
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ================= TAB 1: BUSINESS KYC ================= */}
      {activeTab === "business" && (
        <form onSubmit={handleSubmitBusinessKyc} className="space-y-4">
          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="pb-3 border-b border-gray-100">
              <CardTitle className="text-sm font-bold text-gray-800 flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary-orange" />
                Step 1: Permanent Account Number (PAN) & Tax Identity
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">10-Digit PAN Card Number *</label>
                  <Input
                    value={pan}
                    onChange={(e) => setPan(e.target.value.toUpperCase())}
                    placeholder="e.g. ABCDE1234F"
                    maxLength={10}
                    required
                    className="font-mono uppercase text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Name on PAN (Confirmation)</label>
                  <Input
                    value={panHolderName}
                    onChange={(e) => setPanHolderName(e.target.value)}
                    placeholder="e.g. Ramesh Chandra"
                    className="text-xs"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="pb-3 border-b border-gray-100">
              <CardTitle className="text-sm font-bold text-gray-800 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-primary-orange" />
                GST Registration & Business Proof
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4 text-xs">
              <div className="flex items-center space-x-6 p-3 bg-gray-50 rounded-xl border border-gray-100">
                <span className="font-semibold text-gray-800">Is workshop registered under GST?</span>
                <label className="inline-flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={isGstRegistered}
                    onChange={() => setIsGstRegistered(true)}
                    className="text-primary-orange"
                  />
                  <span>Yes, Registered</span>
                </label>
                <label className="inline-flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={!isGstRegistered}
                    onChange={() => setIsGstRegistered(false)}
                    className="text-primary-orange"
                  />
                  <span>No (Unregistered)</span>
                </label>
              </div>

              {isGstRegistered ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-orange-50/40 rounded-xl border border-orange-100">
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">15-Digit GSTIN Number *</label>
                    <Input
                      value={gstin}
                      onChange={(e) => setGstin(e.target.value.toUpperCase())}
                      placeholder="e.g. 05AAAAA0000A1Z5"
                      maxLength={15}
                      required={isGstRegistered}
                      className="font-mono uppercase text-xs bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Trade / Garage Name on GST</label>
                    <Input
                      value={gstTradeName}
                      onChange={(e) => setGstTradeName(e.target.value)}
                      placeholder="e.g. Apex Auto Works"
                      className="text-xs bg-white"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Alternate Business Proof Type *</label>
                    <select
                      value={nonGstProofType}
                      onChange={(e) => setNonGstProofType(e.target.value)}
                      className="w-full h-10 px-3 bg-white border border-gray-200 rounded-lg text-xs"
                      required={!isGstRegistered}
                    >
                      <option value="SHOP_ESTABLISHMENT_LICENSE">Shop & Establishment License</option>
                      <option value="TRADE_LICENSE">Municipal Trade License</option>
                      <option value="UDYAM_REGISTRATION">Udyam Registration</option>
                      <option value="ELECTRICITY_BILL">Workshop Commercial Electricity Bill</option>
                      <option value="RENT_AGREEMENT">Workshop Commercial Rent Deed</option>
                      <option value="OTHER">Other Local Government Registration</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Upload Document *</label>
                    <FileUpload
                      folder="partner-kyc"
                      currentValue={proofRef}
                      onUploadSuccess={(url) => setProofRef(url)}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Button
            type="submit"
            disabled={submittingStep === "business"}
            className="w-full h-11 bg-primary-orange hover:bg-primary-orange-dark text-white font-bold text-xs"
          >
            {submittingStep === "business" ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Step 1 & Proceed to Step 2"}
          </Button>
        </form>
      )}

      {/* ================= TAB 2: WORKSHOP PROOF ================= */}
      {activeTab === "workshop" && (
        <form onSubmit={handleSubmitWorkshopProof} className="space-y-4">
          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="pb-3 border-b border-gray-100">
              <CardTitle className="text-sm font-bold text-gray-800 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-primary-orange" />
                Step 2: Workshop Physical Photos & Signage Proof (All Mandatory)
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="block font-semibold text-gray-700">1. Exterior Photo (Building/Frontage) *</label>
                  <FileUpload
                    folder="workshop-proof"
                    currentValue={exteriorPhotoRef}
                    onUploadSuccess={(url) => setExteriorPhotoRef(url)}
                  />
                  <p className="text-[10px] text-gray-400">Clear view of entrance with road frontage.</p>
                </div>

                <div className="space-y-1">
                  <label className="block font-semibold text-gray-700">2. Interior / Service Bay Photo *</label>
                  <FileUpload
                    folder="workshop-proof"
                    currentValue={interiorPhotoRef}
                    onUploadSuccess={(url) => setInteriorPhotoRef(url)}
                  />
                  <p className="text-[10px] text-gray-400">View showing ramps, tools & service bays.</p>
                </div>

                <div className="space-y-1">
                  <label className="block font-semibold text-gray-700">3. Signboard / Nameplate Photo *</label>
                  <FileUpload
                    folder="workshop-proof"
                    currentValue={signboardPhotoRef}
                    onUploadSuccess={(url) => setSignboardPhotoRef(url)}
                  />
                  <p className="text-[10px] text-gray-400">Visible workshop brand name signboard.</p>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Workshop Address Proof Type *</label>
                  <select
                    value={addressProofType}
                    onChange={(e) => setAddressProofType(e.target.value)}
                    className="w-full h-10 px-3 bg-white border border-gray-200 rounded-lg text-xs"
                    required
                  >
                    <option value="ELECTRICITY_BILL">Electricity Bill (Commercial)</option>
                    <option value="RENT_AGREEMENT">Rent Agreement / Lease Deed</option>
                    <option value="PROPERTY_TAX">Property Tax Receipt</option>
                    <option value="OTHER">Other Proof</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Upload Address Proof Document *</label>
                  <FileUpload
                    folder="workshop-proof"
                    currentValue={addressProofRef}
                    onUploadSuccess={(url) => setAddressProofRef(url)}
                  />
                </div>
              </div>

              {/* Editable Coordinates */}
              <div className="border-t border-gray-100 pt-4 space-y-2 p-3 bg-slate-50 rounded-xl">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-800 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-primary-orange" />
                    Exact Google Maps GPS Pin (Editable)
                  </span>
                  <button
                    type="button"
                    onClick={handleDetectLocation}
                    disabled={isLocating}
                    className="text-primary-orange hover:text-primary-navy font-semibold inline-flex items-center gap-1 text-[11px]"
                  >
                    <Compass className={`w-3.5 h-3.5 ${isLocating ? "animate-spin" : ""}`} />
                    {isLocating ? "Detecting..." : "Detect Current GPS"}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="number"
                    step="any"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    placeholder="Latitude (-90 to 90)"
                    required
                    className="font-mono text-xs bg-white"
                  />
                  <Input
                    type="number"
                    step="any"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    placeholder="Longitude (-180 to 180)"
                    required
                    className="font-mono text-xs bg-white"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Button
            type="submit"
            disabled={submittingStep === "workshop"}
            className="w-full h-11 bg-primary-orange hover:bg-primary-orange-dark text-white font-bold text-xs"
          >
            {submittingStep === "workshop" ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Step 2 & Proceed to Step 3"}
          </Button>
        </form>
      )}

      {/* ================= TAB 3: BANK DETAILS ================= */}
      {activeTab === "bank" && (
        <form onSubmit={handleSubmitBankDetails} className="space-y-4">
          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="pb-3 border-b border-gray-100">
              <CardTitle className="text-sm font-bold text-gray-800 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Landmark className="w-4 h-4 text-primary-orange" />
                  Step 3: Bank Account & Settlement Details
                </span>
                <Badge className="bg-amber-100 text-amber-800 text-[10px]">Settlements Locked Until Verified</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4 text-xs">
              <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 text-blue-900 flex items-start space-x-2">
                <Info className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                <div>
                  The bank account holder name must match either the verified workshop owner (
                  <strong>{checklistData?.ownerName || "Owner"}</strong>) or workshop business name. Mismatches
                  route to manual verification.
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Account Holder Name *</label>
                  <Input
                    value={accountHolderName}
                    onChange={(e) => setAccountHolderName(e.target.value)}
                    placeholder="e.g. Ramesh Chandra / Apex Auto Works"
                    required
                    className="text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Bank Name *</label>
                  <Input
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="e.g. HDFC Bank"
                    required
                    className="text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Bank Account Number *</label>
                  <Input
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value.replace(/[^0-9]/g, ""))}
                    placeholder="e.g. 50100234567890"
                    required
                    className="font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">11-Digit IFSC Code *</label>
                  <Input
                    value={ifsc}
                    onChange={(e) => setIfsc(e.target.value.toUpperCase())}
                    placeholder="e.g. HDFC0001234"
                    maxLength={11}
                    required
                    className="font-mono uppercase text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Upload Cancelled Cheque / Passbook Copy *
                </label>
                <FileUpload
                  folder="bank-proof"
                  currentValue={bankProofRef}
                  onUploadSuccess={(url) => setBankProofRef(url)}
                />
              </div>
            </CardContent>
          </Card>

          <Button
            type="submit"
            disabled={submittingStep === "bank"}
            className="w-full h-11 bg-primary-orange hover:bg-primary-orange-dark text-white font-bold text-xs"
          >
            {submittingStep === "bank" ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Step 3 & Proceed to Step 4"}
          </Button>
        </form>
      )}

      {/* ================= TAB 4: CAPABILITIES ================= */}
      {activeTab === "capabilities" && (
        <form onSubmit={handleSubmitCapabilities} className="space-y-4">
          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="pb-3 border-b border-gray-100">
              <CardTitle className="text-sm font-bold text-gray-800 flex items-center gap-2">
                <Wrench className="w-4 h-4 text-primary-orange" />
                Step 4: Workshop Capabilities & Service Parameters
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4 text-xs">
              {/* Services Offered Multi-select */}
              <div>
                <label className="block font-semibold text-gray-700 mb-2">
                  Services Offered * (Click to toggle)
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {ALL_SERVICES.map((srv) => {
                    const selected = services.includes(srv);
                    return (
                      <button
                        type="button"
                        key={srv}
                        onClick={() => toggleService(srv)}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                          selected
                            ? "bg-primary-orange text-white border-primary-orange shadow-sm"
                            : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                        }`}
                      >
                        {selected ? "✓ " : "+ "}
                        {srv}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Bays & Techs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-gray-100 pt-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Number of Service Bays *</label>
                  <Input
                    type="number"
                    min={1}
                    value={serviceBays}
                    onChange={(e) => setServiceBays(parseInt(e.target.value) || 1)}
                    required
                    className="text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Number of Trained Technicians *</label>
                  <Input
                    type="number"
                    min={1}
                    value={technicianCount}
                    onChange={(e) => setTechnicianCount(parseInt(e.target.value) || 1)}
                    required
                    className="text-xs"
                  />
                </div>
              </div>

              {/* Working Days & Hours */}
              <div className="border-t border-gray-100 pt-3 space-y-2">
                <label className="block font-semibold text-gray-700">Working Days *</label>
                <div className="flex flex-wrap gap-1.5">
                  {ALL_DAYS.map((d) => {
                    const selected = workingDays.includes(d);
                    return (
                      <button
                        type="button"
                        key={d}
                        onClick={() => toggleDay(d)}
                        className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition-all ${
                          selected
                            ? "bg-primary-navy text-white border-primary-navy"
                            : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                        }`}
                      >
                        {d.slice(0, 3)}
                      </button>
                    );
                  })}
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Opening Time</label>
                    <Input
                      value={openTime}
                      onChange={(e) => setOpenTime(e.target.value)}
                      placeholder="09:00 AM"
                      className="text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Closing Time</label>
                    <Input
                      value={closeTime}
                      onChange={(e) => setCloseTime(e.target.value)}
                      placeholder="08:00 PM"
                      className="text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Toggles */}
              <div className="border-t border-gray-100 pt-3 space-y-2">
                <label className="flex items-center space-x-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pickupDropAvailable}
                    onChange={(e) => setPickupDropAvailable(e.target.checked)}
                    className="rounded text-primary-orange"
                  />
                  <span className="font-semibold text-gray-700">Pickup & Drop Service Available for Customers</span>
                </label>

                <label className="flex items-center space-x-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={insuranceWorkCapable}
                    onChange={(e) => setInsuranceWorkCapable(e.target.checked)}
                    className="rounded text-primary-orange"
                  />
                  <span className="font-semibold text-gray-700">Cashless Insurance Claim Repair Capable</span>
                </label>

                <label className="flex items-center space-x-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={authorizedServiceClaim}
                    onChange={(e) => setAuthorizedServiceClaim(e.target.checked)}
                    className="rounded text-primary-orange"
                  />
                  <span className="font-semibold text-gray-700">Authorized Brand Service Center / OEM Dealership Partner</span>
                </label>

                {authorizedServiceClaim && (
                  <div className="p-3 bg-orange-50/50 rounded-xl border border-orange-200 mt-2 space-y-1">
                    <label className="block font-semibold text-gray-700">
                      Upload Authorized OEM Franchise Certificate *
                    </label>
                    <FileUpload
                      folder="capability-proof"
                      currentValue={authorizedServiceProofRef}
                      onUploadSuccess={(url) => setAuthorizedServiceProofRef(url)}
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Button
            type="submit"
            disabled={submittingStep === "capabilities"}
            className="w-full h-11 bg-primary-orange hover:bg-primary-orange-dark text-white font-bold text-xs"
          >
            {submittingStep === "capabilities" ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Step 4 & Complete Onboarding"}
          </Button>
        </form>
      )}

      {/* Audit Log Activity History */}
      {checklistData?.verificationLogs && checklistData.verificationLogs.length > 0 && (
        <Card className="border-gray-200 shadow-sm mt-6">
          <CardHeader className="pb-3 border-b border-gray-100">
            <CardTitle className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-gray-500" />
              Verification Activity History (Audit Trail)
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-3 divide-y divide-gray-100">
            {checklistData.verificationLogs.map((log: any, idx: number) => (
              <div key={idx} className="py-2.5 flex items-start justify-between text-xs">
                <div>
                  <span className="font-bold text-gray-800">{log.action?.replace(/_/g, " ")}</span>
                  <p className="text-gray-500 text-[11px] mt-0.5">{log.notes || "Status updated"}</p>
                  {log.fromStatus && log.toStatus && (
                    <span className="text-[10px] text-gray-400 font-mono">
                      {log.fromStatus} → {log.toStatus}
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-gray-400 shrink-0 font-mono">
                  {new Date(log.timestamp).toLocaleDateString()} {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
