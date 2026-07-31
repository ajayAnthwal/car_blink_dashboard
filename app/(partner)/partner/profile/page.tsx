"use client";

import React, { useState, useEffect, useRef } from "react";
import { getPartnerProfile, updatePartnerProfile, createPartnerProfile, getCities, getServices, uploadFile, uploadKycDocument } from "@/lib/services";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/Select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { User, Store, MapPin, Briefcase, FileText, Loader2, ShieldCheck, Upload } from "lucide-react";

export default function PartnerProfilePage() {
  const [isNewProfile, setIsNewProfile] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const [cities, setCities] = useState<{ _id: string; name: string }[]>([]);
  const [services, setServices] = useState<{ _id: string; name: string }[]>([]);

  const [formData, setFormData] = useState({
    businessName: "",
    businessAddress: "",
    cityId: "",
    servicesOffered: [] as string[],
    gstNumber: "",
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined,
  });

  const [kycDocType, setKycDocType] = useState("ID_PROOF");
  const [kycFile, setKycFile] = useState<File | null>(null);
  const [isUploadingKyc, setIsUploadingKyc] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [verificationStatus, setVerificationStatus] = useState("PENDING");

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setIsLoading(true);
      const [citiesRes, servicesRes] = await Promise.all([
        getCities(),
        getServices()
      ]);
      const citiesArray = citiesRes?.data?.docs || citiesRes?.data || citiesRes?.docs || [];
      setCities(Array.isArray(citiesArray) ? citiesArray : []);
      const servicesArray = servicesRes?.data?.docs || servicesRes?.data || servicesRes?.docs || [];
      setServices(Array.isArray(servicesArray) ? servicesArray : []);

      try {
        const profileRes = await getPartnerProfile();
        
        let profileData = profileRes;
        if (profileRes?.data && typeof profileRes.data === 'object' && !Array.isArray(profileRes.data) && profileRes.data.businessName) {
          profileData = profileRes.data;
        }
        
        if (profileData && profileData.businessName) {
          setFormData({
            businessName: profileData.businessName || "",
            businessAddress: profileData.businessAddress || "",
            cityId: profileData.cityId?._id || profileData.cityId || "",
            servicesOffered: (profileData.servicesOffered || []).map((s: any) => s._id || s),
            gstNumber: profileData.gstNumber || "",
            latitude: profileData.location?.coordinates?.[1] || profileData.latitude || undefined,
            longitude: profileData.location?.coordinates?.[0] || profileData.longitude || undefined,
          });
          setVerificationStatus(profileData.verificationStatus || "PENDING");
          setIsNewProfile(false);
        } else {
          setIsNewProfile(true);
        }
      } catch (err: any) {
        if (err?.response?.status === 404) {
          setIsNewProfile(true);
        }
      }
    } catch (err) {
      console.error("Failed to load initial data", err);
    } finally {
      setIsLoading(false);
    }
  };

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
      if (isNewProfile) {
        if (formData.servicesOffered.length === 0) {
          throw new Error("Please select at least one service offered.");
        }
        await createPartnerProfile({
          ...formData,
          latitude: formData.latitude,
          longitude: formData.longitude
        });
        setMessage({ type: "success", text: "Profile created successfully!" });
        setIsNewProfile(false);
      } else {
        await updatePartnerProfile({
          businessName: formData.businessName,
          businessAddress: formData.businessAddress,
          gstNumber: formData.gstNumber,
          latitude: formData.latitude,
          longitude: formData.longitude,
          cityId: formData.cityId,
          servicesOffered: formData.servicesOffered
        });
        setMessage({ type: "success", text: "Profile updated successfully!" });
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err?.message || "Failed to save profile." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKycUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kycFile) return;

    setIsUploadingKyc(true);
    setMessage({ type: "", text: "" });

    try {
      const uploadRes = await uploadFile(kycFile, "kyc");
      if (!uploadRes?.fileUrl && !uploadRes?.data?.fileUrl) {
        throw new Error("Failed to upload file. No URL returned.");
      }
      
      const fileUrl = uploadRes?.data?.fileUrl || uploadRes?.fileUrl;
      await uploadKycDocument({
        documentType: kycDocType,
        documentUrl: fileUrl
      });
      
      setMessage({ type: "success", text: "KYC document uploaded successfully! Status is now Under Review." });
      setVerificationStatus("UNDER_REVIEW");
      setKycFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err: any) {
      setMessage({ type: "error", text: err?.message || "Failed to upload KYC document." });
    } finally {
      setIsUploadingKyc(false);
    }
  };

  if (isLoading) {
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
        <div className={`p-3 rounded-lg text-sm border ${
          message.type === "success" 
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
              </div>

              <Select
                label="City"
                name="cityId"
                value={formData.cityId}
                onChange={handleInputChange}
                options={cities.map(c => ({ value: c._id, label: c.name }))}
                required
              />
            </div>

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
                      className={`p-3 rounded-lg border text-sm transition-colors cursor-pointer flex items-center justify-between ${
                        isSelected 
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
              <Button type="submit" isLoading={isSubmitting}>
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
                  <span className={`ml-2 px-2 py-1 rounded text-xs ${
                    verificationStatus === 'APPROVED' ? 'bg-success/10 text-success' :
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
                <Button type="submit" isLoading={isUploadingKyc} disabled={!kycFile || isUploadingKyc}>
                  <Upload className="w-4 h-4 mr-2" /> Upload Document
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
