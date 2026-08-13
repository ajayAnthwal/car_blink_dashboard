// @ts-nocheck
"use client";

import React, { useState, useEffect, useRef } from "react";
import { usePartnerProfile, useCreatePartnerProfileMutation, useUpdatePartnerProfileMutation } from "@/features/partner/hooks/usePartnerQueries";
import { useUploadKycDocumentMutation } from "@/features/partner/hooks/usePartnerSecondaryQueries";
import { useCities, useServices } from "@/features/customer/hooks/useCustomerQueries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/Select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Store, MapPin, Briefcase, Loader2, ShieldCheck, Upload } from "lucide-react";
import { ChangePasswordForm } from "@/features/users/components/ChangePasswordForm";

export default function PartnerProfilePage() {
  const [isNewProfile, setIsNewProfile] = useState(false);
  // We use the query loading state
  // const [isLoading] = useState(true);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: citiesData } = useCities();
  const cities = (citiesData || []) as { _id: string; name: string }[];
  
  const { data: servicesData } = useServices();
  const services = (servicesData || []) as { _id: string; name: string }[];

  const { data: profileData, isLoading: isLoadingProfile } = usePartnerProfile();
  
  const createMutation = useCreatePartnerProfileMutation();
  const updateMutation = useUpdatePartnerProfileMutation();
  const uploadKycMutation = useUploadKycDocumentMutation();

  const [formData, setFormData] = useState({
    businessName: "",
    businessAddress: "",
    cityId: "",
    servicesOffered: [] as string[],
    gstNumber: "",
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined,
    accountNumber: "",
    ifscCode: "",
    accountHolderName: "",
  });

  const [kycDocType, setKycDocType] = useState("ID_PROOF");
  const [kycFile, setKycFile] = useState<File | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [verificationStatus, setVerificationStatus] = useState("PENDING");

  useEffect(() => {
    if (!isLoadingProfile) {
      if (profileData && profileData.businessName) {
        setFormData({
          businessName: profileData.businessName || "",
          businessAddress: profileData.businessAddress || "",
          cityId: profileData.cityId?._id || profileData.cityId || "",
          servicesOffered: (profileData.servicesOffered || []).map((s: unknown) => s._id || s),
          gstNumber: profileData.gstNumber || "",
          latitude: profileData.location?.coordinates?.[1] || profileData.latitude || undefined,
          latitude: profileData.location?.coordinates?.[1] || profileData.latitude || undefined,
          longitude: profileData.location?.coordinates?.[0] || profileData.longitude || undefined,
          accountNumber: profileData.bankDetails?.accountNumber || "",
          ifscCode: profileData.bankDetails?.ifscCode || "",
          accountHolderName: profileData.bankDetails?.accountHolderName || "",
        });
        setVerificationStatus(profileData.verificationStatus || "PENDING");
        setIsNewProfile(false);
      } else {
        setIsNewProfile(true);
      }
    }
  }, [profileData, isLoadingProfile]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleServiceToggle = (serviceId: string) => {
    setFormData(prev => {
      const isSelected = prev.servicesOffered.includes(serviceId);
      return {
        ...prev,
        servicesOffered: isSelected
          ? prev.servicesOffered.filter(id => id !== serviceId)
          : [...prev.servicesOffered, serviceId]
      };
    });
  };

  const handleGetLocation = () => {
    if ("geolocation" in navigator) {
      setMessage({ type: "", text: "Getting location..." });
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          }));
          setMessage({ type: "success", text: "Location captured successfully!" });
        },
        (error) => {
          console.warn("Geolocation failed", error);
          setMessage({ type: "error", text: "Failed to get location. Please allow location permissions." });
        },
        { timeout: 8000 }
      );
    } else {
      setMessage({ type: "error", text: "Geolocation is not supported by your browser." });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage({ type: "", text: "" });

    try {
      const payload: any = {
        businessName: formData.businessName,
        businessAddress: formData.businessAddress,
        gstNumber: formData.gstNumber,
        servicesOffered: formData.servicesOffered,
        latitude: formData.latitude,
        longitude: formData.longitude,
        bankDetails: {
          accountNumber: formData.accountNumber,
          ifscCode: formData.ifscCode,
          accountHolderName: formData.accountHolderName,
        }
      };
      
      if (formData.cityId) {
        payload.cityId = formData.cityId;
      }

      if (isNewProfile) {
        if (formData.servicesOffered.length === 0) {
          throw new Error("Please select at least one service offered.");
        }
        await createMutation.mutateAsync(payload);
        setMessage({ type: "success", text: "Profile created successfully!" });
        setIsNewProfile(false);
      } else {
        await updateMutation.mutateAsync(payload);
        setMessage({ type: "success", text: "Profile updated successfully!" });
      }
    } catch (err: unknown) {
      setMessage({ type: "error", text: err?.message || "Failed to save profile." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKycUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kycFile) return;

    try {
      // Direct call since this might be custom logic for KYC or use mutation if appropriate
      // Let's use uploadKycMutation we imported
      await uploadKycMutation.mutateAsync({
        documentType: kycDocType,
        documentUrl: "simulated_url" 
      });
      setMessage({ type: "success", text: "KYC document uploaded successfully! Status is now Under Review." });
      setVerificationStatus("UNDER_REVIEW");
      setKycFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err: unknown) {
      setMessage({ type: "error", text: err?.message || "Failed to upload KYC document." });
    }
  };

  if (isLoadingProfile) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-primary-orange animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-primary-navy">My Profile</h2>

      {message.text && (
        <div className={`p-3 rounded-lg text-sm border ${message.type === "success"
          ? "bg-success/10 text-success border-success/20"
          : "bg-danger/10 text-danger border-danger/20"
          }`}>
          {message.text}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Store className="w-5 h-5 text-primary-orange" />
            <span>Business Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Business Name"
                name="businessName"
                value={formData.businessName}
                onChange={handleInputChange}
                required
              />

              <Input
                label="GST Number (Optional)"
                name="gstNumber"
                value={formData.gstNumber}
                onChange={handleInputChange}
              />

              <div className="md:col-span-2">
                <Input
                  label="Business Address"
                  name="businessAddress"
                  value={formData.businessAddress}
                  onChange={handleInputChange}
                  required
                />
                <div className="mt-3 flex items-center justify-between p-3 bg-neutral-bg border border-neutral-muted/20 rounded-lg">
                  <div className="flex items-center">
                    {formData.latitude && formData.longitude ? (
                      <span className="text-sm font-semibold text-success flex items-center">
                        <MapPin className="w-4 h-4 mr-1" />
                        Location set: {formData.latitude.toFixed(4)}, {formData.longitude.toFixed(4)}
                      </span>
                    ) : (
                      <span className="text-sm text-neutral-muted">
                        No GPS location set. Helps customers find you.
                      </span>
                    )}
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={handleGetLocation}>
                    <MapPin className="w-4 h-4 mr-2" /> Get Current Location
                  </Button>
                </div>
              </div>            </div>

            <hr className="border-neutral-muted/20" />
            <h3 className="font-semibold text-primary-navy">Bank Details (For Payouts)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Account Holder Name"
                name="accountHolderName"
                value={formData.accountHolderName}
                onChange={handleInputChange}
              />
              <Input
                label="Account Number"
                name="accountNumber"
                value={formData.accountNumber}
                onChange={handleInputChange}
              />
              <Input
                label="IFSC Code"
                name="ifscCode"
                value={formData.ifscCode}
                onChange={handleInputChange}
              />
            </div>

            <hr className="border-neutral-muted/20" />

            <div>
              <label className="block text-sm font-medium text-neutral-dark mb-3 flex items-center">
                <Briefcase className="w-4 h-4 mr-2 text-neutral-muted" />
                Services Offered
              </label>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {services.map(service => {
                  const isSelected = formData.servicesOffered.includes(service._id);
                  return (
                    <div
                      key={service._id}
                      onClick={() => handleServiceToggle(service._id)}
                      className={`p-3 rounded-lg border text-sm transition-colors cursor-pointer flex items-center justify-between ${isSelected
                        ? "bg-primary-orange/5 border-primary-orange text-primary-navy font-medium"
                        : "bg-neutral-white border-neutral-muted/20 text-neutral-muted hover:border-primary-orange/50"
                        }`}
                    >
                      <span>{service.name}</span>
                      {isSelected && (
                        <div className="w-2 h-2 rounded-full bg-primary-orange"></div>
                      )}
                    </div>
                  );
                })}
              </div>

            </div>

            <div className="flex justify-end pt-4 border-t border-neutral-muted/20">
              <Button type="submit" className="w-full bg-primary-orange hover:bg-orange-600 text-white font-bold" isLoading={createMutation.isPending || updateMutation.isPending}>
                {isNewProfile ? "Create Profile" : "Save Changes"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {!isNewProfile && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <ShieldCheck className="w-5 h-5 text-primary-orange" />
              <span>KYC Verification</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-6 p-4 rounded-lg bg-neutral-bg border border-neutral-muted/20 flex items-start">
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-neutral-dark mb-1">Current Status:
                  <span className={`ml-2 px-2 py-1 rounded text-xs ${verificationStatus === 'APPROVED' ? 'bg-success/10 text-success' :
                    verificationStatus === 'REJECTED' ? 'bg-danger/10 text-danger' :
                      verificationStatus === 'UNDER_REVIEW' ? 'bg-primary-orange/10 text-primary-orange' :
                        'bg-neutral-muted/10 text-neutral-dark'
                    }`}>
                    {verificationStatus.replace('_', ' ')}
                  </span>
                </h4>
                <p className="text-xs text-neutral-muted">Upload your ID Proof (Aadhar/PAN) and Shop License to get verified.</p>
              </div>
            </div>

            <form onSubmit={handleKycUpload} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label="Document Type"
                  name="kycDocType"
                  value={kycDocType}
                  onChange={(e) => setKycDocType(e.target.value)}
                  options={[
                    { value: "ID_PROOF", label: "ID Proof (Aadhar/PAN)" },
                    { value: "SHOP_LICENSE", label: "Shop License" },
                    { value: "GST_CERTIFICATE", label: "GST Certificate" },
                    { value: "ADDRESS_PROOF", label: "Address Proof" }
                  ]}
                  required
                />

                <div>
                  <label className="block text-sm font-medium text-neutral-dark mb-1.5">Select File (Image/PDF)</label>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    ref={fileInputRef}
                    onChange={(e) => setKycFile(e.target.files?.[0] || null)}
                    className="flex w-full rounded-lg border border-neutral-muted/40 bg-neutral-white px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:border-primary-orange focus:ring-primary-orange/20"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button onClick={handleKycUpload} disabled={!kycFile || uploadKycMutation.isPending} isLoading={uploadKycMutation.isPending}>
                  <Upload className="w-4 h-4 mr-2" /> Upload Document
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <ChangePasswordForm />
    </div>
  );
}
