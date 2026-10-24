"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { updateUserProfile } from "@/lib/services";
import { useCities } from "@/features/customer/hooks/useCustomerQueries";
import { INDIAN_STATES, getCitiesForState } from "@/lib/data/locations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/Select";
import { FileUpload } from "@/components/ui/FileUpload";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { User, Mail, MapPin, Building2, Map } from "lucide-react";

const profileSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  address: z.string().optional(),
  state: z.string().optional(),
  cityId: z.string().optional(),
  profileImage: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export function ProfileForm() {
  const { user, refreshUser } = useAuth();
  
  const { data: citiesData, isLoading: isLoadingCities } = useCities();
  
  // Comprehensive Indian States list merged with backend cities
  const backendStates = Array.from(new Set((citiesData || []).map((c: any) => c.state))).filter(Boolean) as string[];
  const allStatesList = Array.from(new Set([...INDIAN_STATES, ...backendStates])).sort();
  const states = allStatesList.map((s: string) => ({ name: s, value: s }));
  
  const [selectedState, setSelectedState] = useState("");
  
  // Combine backend DB cities (with _id) and master locations list
  const stateMasterCities = getCitiesForState(selectedState);
  const backendMatchingCities = (citiesData || []).filter((c: any) => selectedState ? c.state?.toLowerCase() === selectedState.toLowerCase() : true);
  
  // Build clean unified list of city options
  const cityOptionsDict: Record<string, { value: string; label: string }> = {};
  backendMatchingCities.forEach((c: any) => {
    if (c && c.name) {
      cityOptionsDict[c.name.toLowerCase()] = { value: String(c._id || c.name), label: c.name };
    }
  });
  stateMasterCities.forEach((cityName: string) => {
    if (cityName && !cityOptionsDict[cityName.toLowerCase()]) {
      cityOptionsDict[cityName.toLowerCase()] = { value: cityName, label: cityName };
    }
  });
  const filteredCities: { value: string; label: string }[] = Object.keys(cityOptionsDict)
    .map((k) => cityOptionsDict[k])
    .sort((a, b) => a.label.localeCompare(b.label));

  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: "",
      email: "",
      address: "",
      state: "",
      cityId: "",
      profileImage: "",
    },
  });

  useEffect(() => {
    if (user && !isInitialized) {
      reset({
        fullName: user.fullName || "",
        email: user.email || "",
        address: (user as any).address || "",
        state: (user as any).state || "",
        cityId: (user as any).cityId || "",
        profileImage: (user as any).profileImage || "",
      });
      setIsInitialized(true);
    }
  }, [user, reset, isInitialized]);

  const profileImageValue = watch("profileImage");
  const cityIdValue = watch("cityId");
  const stateValue = watch("state");

  useEffect(() => {
    if (stateValue) {
      setSelectedState(stateValue);
    }
  }, [stateValue]);

  const onSubmit = async (data: ProfileFormValues) => {
    setIsLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const payload: any = { ...data };
      if (payload.cityId) {
        // If cityId is not a 24-character hex ObjectId, search backend DB or store in address
        const isMongoId = /^[0-9a-fA-F]{24}$/.test(payload.cityId);
        if (!isMongoId) {
          const match = (citiesData || []).find((c: any) => c.name.toLowerCase() === payload.cityId.toLowerCase());
          if (match && match._id) {
            payload.cityId = match._id;
          } else {
            // Do not send non-hex ID to ObjectId field to prevent CastError
            delete payload.cityId;
          }
        }
      } else {
        delete payload.cityId;
      }
      if (!payload.state || payload.state.trim() === "") delete payload.state;
      if (!payload.email || payload.email.trim() === "") delete payload.email;

      await updateUserProfile(payload);
      // Fetch fresh user profile instead of mutating state directly with partial data
      await refreshUser();
      
      setMessage({ type: "success", text: "Profile updated successfully!" });
    } catch (error: any) {
      const errorMsg = typeof error?.response?.data?.message === "string" 
        ? error.response.data.message 
        : typeof error?.message === "string" && !error.message.includes("Cast to") 
        ? error.message 
        : "Failed to update profile. Please verify your entries.";
      setMessage({ type: "error", text: errorMsg });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="bg-white/80 backdrop-blur-md shadow-sm border border-neutral-muted/20 overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-primary-navy/5 to-transparent border-b border-neutral-muted/10">
        <CardTitle className="flex items-center space-x-2 text-primary-navy">
          <User className="w-5 h-5 text-primary-orange" />
          <span>Basic Information</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {message.text && (
            <div className={`p-4 rounded-xl text-sm font-medium border flex items-center space-x-2 ${
              message.type === "success" 
                ? "bg-success/10 text-success border-success/20" 
                : "bg-danger/10 text-danger border-danger/20"
            }`}>
              {message.text}
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-neutral-dark flex items-center gap-1.5"><User className="w-4 h-4 text-neutral-muted" /> Full Name</label>
              <Input
                {...register("fullName")}
                required
                className="bg-neutral-white border-neutral-muted/40 focus:border-primary-orange"
              />
              {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName.message}</p>}
            </div>
            
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-neutral-dark flex items-center gap-1.5"><Mail className="w-4 h-4 text-neutral-muted" /> Email (Optional)</label>
              <Input
                {...register("email")}
                className="bg-neutral-white border-neutral-muted/40 focus:border-primary-orange"
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-neutral-dark flex items-center gap-1.5">Phone</label>
              <Input
                value={user?.phone || ""}
                readOnly
                className="bg-neutral-bg text-neutral-muted cursor-not-allowed border-transparent"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-neutral-dark flex items-center gap-1.5"><MapPin className="w-4 h-4 text-neutral-muted" /> Address</label>
              <Input
                placeholder="e.g. Connaught Place, New Delhi"
                {...register("address")}
                className="bg-neutral-white border-neutral-muted/40 focus:border-primary-orange"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-neutral-dark flex items-center gap-1.5"><Map className="w-4 h-4 text-neutral-muted" /> State</label>
              <Select
                value={stateValue || ""}
                onChange={(e) => {
                  setValue("state", e.target.value);
                  setValue("cityId", "");
                }}
                options={states.map(s => ({ value: s.value, label: s.name }))}
                disabled={isLoadingCities}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-neutral-dark flex items-center gap-1.5"><Building2 className="w-4 h-4 text-neutral-muted" /> Location / City</label>
              <Select
                value={cityIdValue || ""}
                onChange={(e) => setValue("cityId", e.target.value)}
                options={filteredCities}
                disabled={!selectedState || isLoadingCities}
              />
            </div>
          </div>

          <div className="max-w-xs">
            <FileUpload
              label="Profile Image"
              folder="profile"
              currentValue={profileImageValue || ""}
              onUploadSuccess={(url) => setValue("profileImage", url)}
              onUploadError={(err) => setMessage({ type: "error", text: err })}
            />
          </div>
          
          <div className="flex justify-end">
            <Button type="submit" isLoading={isLoading}>Save Changes</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
