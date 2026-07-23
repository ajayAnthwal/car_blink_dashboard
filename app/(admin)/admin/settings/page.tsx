"use client";

import React, { useState, useEffect } from "react";
import { getCurrentUserProfile, updateAuthUserProfile } from "@/lib/services";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Settings as SettingsIcon, User, Shield, CheckCircle2, AlertCircle } from "lucide-react";
import { useAuth } from "@/features/auth/hooks/useAuth";

export default function AdminSettingsPage() {
  const { user: authUser } = useAuth();
  const [profile, setProfile] = useState({ fullName: "", phone: "", email: "", role: "" });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true);
      try {
        const res = await getCurrentUserProfile();
        setProfile({
          fullName: res.data?.fullName || "",
          phone: res.data?.phone || "",
          email: res.data?.email || "",
          role: res.data?.role || ""
        });
      } catch (error) {
        console.error("Failed to load profile", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage({ type: "", text: "" });
    try {
      const res = await updateAuthUserProfile({ fullName: profile.fullName, phone: profile.phone });
      setMessage({ type: "success", text: "Profile updated successfully." });
      
      // Update local auth state if needed
      if (res.data) {
        
      }
    } catch (error: any) {
      setMessage({ type: "error", text: error.message || "Failed to update profile." });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12 p-4">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-gray-900 via-primary-navy to-primary-navy border border-primary-navy/20 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-elevated">
        <div className="flex items-center gap-5 text-white">
          <div className="w-16 h-16 bg-white/10 rounded-2xl shadow-sm flex items-center justify-center shrink-0 border border-white/20 backdrop-blur-sm">
            <SettingsIcon className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-bold font-heading tracking-tight">Platform Settings</h2>
            <p className="text-white/80 mt-1 font-medium">Manage your super admin account and preferences.</p>
          </div>
        </div>
      </div>

      {message.text && (
        <div className={`p-4 rounded-xl text-sm border font-medium flex items-center gap-3 ${
          message.type === "success" 
            ? "bg-green-50 text-green-700 border-green-200" 
            : "bg-red-50 text-red-700 border-red-200"
        }`}>
          {message.type === "success" ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          {message.text}
        </div>
      )}

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Loader2 className="w-10 h-10 animate-spin mb-4 text-primary-navy" />
          <p className="font-medium">Loading settings...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-1 space-y-4">
            <Card className="bg-white/90 backdrop-blur-md shadow-sm border-gray-200">
              <CardContent className="p-6 flex flex-col items-center text-center">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center shrink-0 border border-gray-200 text-gray-600 font-bold shadow-sm mb-4 text-3xl">
                  {profile.fullName?.charAt(0).toUpperCase()}
                </div>
                <h3 className="text-lg font-bold text-gray-900">{profile.fullName}</h3>
                <p className="text-sm text-gray-500 mb-4">{profile.email}</p>
                <span className="px-3 py-1 text-[11px] font-bold tracking-wide uppercase rounded-full bg-purple-100 text-purple-700 border border-purple-200 inline-flex items-center gap-1">
                  <Shield className="w-3 h-3" /> {profile.role.replace('_', ' ')}
                </span>
              </CardContent>
            </Card>
          </div>

          <div className="md:col-span-2 space-y-6">
            <Card className="bg-white/90 backdrop-blur-md shadow-sm border-gray-200">
              <CardHeader className="border-b border-gray-50 bg-gray-50/50">
                <CardTitle className="text-lg text-primary-navy font-bold flex items-center gap-2">
                  <User className="w-5 h-5 text-primary-orange" /> 
                  Profile Details
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleUpdateProfile} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700">Full Name</label>
                      <Input 
                        placeholder="John Doe" 
                        value={profile.fullName}
                        onChange={(e) => setProfile({...profile, fullName: e.target.value})}
                        className="rounded-xl border-gray-200 focus:border-primary-navy"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700">Phone Number</label>
                      <Input 
                        placeholder="+91 9876543210" 
                        value={profile.phone}
                        onChange={(e) => setProfile({...profile, phone: e.target.value})}
                        className="rounded-xl border-gray-200 focus:border-primary-navy"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">Email Address (Read-only)</label>
                    <Input 
                      value={profile.email}
                      disabled
                      className="rounded-xl border-gray-200 bg-gray-50 text-gray-500"
                    />
                  </div>

                  <div className="flex justify-end pt-4">
                    <Button 
                      type="submit" 
                      disabled={isSaving}
                      className="bg-primary-navy hover:bg-primary-navy-light text-white rounded-xl px-8 font-bold shadow-sm"
                    >
                      {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                      Save Changes
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
