"use client";

import React, { useState, useEffect } from "react";
import { getPartnerProfile, updatePartnerProfile, createPartnerProfile, getCities, getServices } from "@/lib/services";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { User, Store, MapPin, Briefcase, FileText, Loader2 } from "lucide-react";

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
  });

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
      setCities(citiesRes?.docs || citiesRes || []);
      setServices(servicesRes?.docs || servicesRes || []);

      try {
        const profileRes = await getPartnerProfile();
        if (profileRes.data) {
          setFormData({
            businessName: profileRes.data.businessName || "",
            businessAddress: profileRes.data.businessAddress || "",
            cityId: profileRes.data.cityId?._id || profileRes.data.cityId || "",
            servicesOffered: (profileRes.data.servicesOffered || []).map((s: any) => s._id || s),
            gstNumber: profileRes.data.gstNumber || "",
          });
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage({ type: "", text: "" });

    try {
      if (isNewProfile) {
        if (formData.servicesOffered.length === 0) {
          throw new Error("Please select at least one service offered.");
        }
        await createPartnerProfile(formData);
        setMessage({ type: "success", text: "Profile created successfully!" });
        setIsNewProfile(false);
      } else {
        // Update only allows businessName, businessAddress, gstNumber according to docs
        await updatePartnerProfile({
          businessName: formData.businessName,
          businessAddress: formData.businessAddress,
          gstNumber: formData.gstNumber
        });
        setMessage({ type: "success", text: "Profile updated successfully!" });
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err?.message || "Failed to save profile." });
    } finally {
      setIsSubmitting(false);
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
              </div>

              {isNewProfile ? (
                <Select
                  label="City"
                  name="cityId"
                  value={formData.cityId}
                  onChange={handleInputChange}
                  options={cities.map(c => ({ value: c._id, label: c.name }))}
                  required
                />
              ) : (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-neutral-dark mb-1.5">City</label>
                  <div className="p-3 bg-neutral-bg border border-neutral-muted/20 rounded-lg text-sm text-neutral-muted">
                    {cities.find(c => c._id === formData.cityId)?.name || "City cannot be changed after creation"}
                  </div>
                </div>
              )}
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
                      onClick={() => isNewProfile && handleServiceToggle(service._id)}
                      className={`p-3 rounded-lg border text-sm transition-colors cursor-pointer flex items-center justify-between ${
                        isSelected 
                          ? "bg-primary-orange/5 border-primary-orange text-primary-navy font-medium"
                          : "bg-neutral-white border-neutral-muted/20 text-neutral-muted hover:border-primary-orange/50"
                      } ${!isNewProfile && "opacity-70 cursor-not-allowed"}`}
                    >
                      <span>{service.name}</span>
                      {isSelected && (
                        <div className="w-2 h-2 rounded-full bg-primary-orange"></div>
                      )}
                    </div>
                  );
                })}
              </div>
              {!isNewProfile && (
                <p className="text-xs text-neutral-muted mt-2">Services offered cannot be changed after profile creation. Contact support to modify.</p>
              )}
            </div>

            <div className="flex justify-end pt-4 border-t border-neutral-muted/20">
              <Button type="submit" isLoading={isSubmitting}>
                {isNewProfile ? "Create Profile" : "Save Changes"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
