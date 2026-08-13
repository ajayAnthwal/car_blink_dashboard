// @ts-nocheck
"use client";

import React, { useState, useEffect } from "react";
import { useAdminSettings, useUpdateAdminSettingsMutation } from "@/features/admin/hooks/useAdminQueries";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Loader2, Settings, Percent, Mail, Image as ImageIcon, Power } from "lucide-react";
import toast from "react-hot-toast";

export default function AdminSettingsPage() {
  const { data: settingsData, isLoading } = useAdminSettings();
  const updateSettingsMutation = useUpdateAdminSettingsMutation();
  
  const [commissionRate, setCommissionRate] = useState(10);
  const [tdsRate, setTdsRate] = useState(1);
  const [gstRate, setGstRate] = useState(18);
  const [supportEmail, setSupportEmail] = useState("");
  const [supportPhone, setSupportPhone] = useState("");
  const [isBookingPaused, setIsBookingPaused] = useState(false);
  
  const [bannerInput, setBannerInput] = useState("");
  const [activeBanners, setActiveBanners] = useState<string[]>([]);

  useEffect(() => {
    if (settingsData) {
      setCommissionRate(settingsData.platformCommissionRate || 15);
      setTdsRate(settingsData.tdsRate || 1);
      setGstRate(settingsData.gstRate || 18);
      setSupportEmail(settingsData.supportEmail || "");
      setSupportPhone(settingsData.supportPhone || "");
      setIsBookingPaused(settingsData.isBookingPaused || false);
      setActiveBanners(settingsData.activeBanners || []);
    }
  }, [settingsData]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateSettingsMutation.mutateAsync({
        platformCommissionRate: commissionRate,
        tdsRate,
        gstRate,
        supportEmail,
        supportPhone,
        isBookingPaused,
        activeBanners
      });
      toast.success("Platform settings saved successfully!");
    } catch {
      toast.error("Failed to save settings.");
    }
  };

  const handleAddBanner = () => {
    if (bannerInput && !activeBanners.includes(bannerInput)) {
      setActiveBanners([...activeBanners, bannerInput]);
      setBannerInput("");
    }
  };

  const handleRemoveBanner = (url: string) => {
    setActiveBanners(activeBanners.filter(b => b !== url));
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <Loader2 className="w-10 h-10 animate-spin mb-4 text-primary-navy" />
        <p className="font-medium">Loading platform settings...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in pb-12 p-4">
      <div className="bg-gradient-to-r from-primary-navy to-indigo-900 rounded-3xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between shadow-elevated gap-4">
        <div className="flex items-center gap-5 text-white">
          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20">
            <Settings className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold font-heading">Platform Settings</h1>
            <p className="text-white/80 mt-1 font-medium">Manage global configurations and CMS for the platform.</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Core Configs */}
        <Card className="bg-white/90 backdrop-blur-md shadow-sm border-gray-200">
          <CardHeader className="bg-gray-50/50 border-b border-gray-100 pb-4">
            <CardTitle className="text-lg text-primary-navy flex items-center gap-2">
              <Percent className="w-5 h-5 text-primary-orange" /> Platform Config
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-5">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Base Commission Rate (%)</label>
              <div className="relative">
                <input 
                  type="number" 
                  min="0" max="100"
                  className="w-full pl-4 pr-10 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-navy text-sm font-bold text-gray-900 bg-gray-50"
                  value={commissionRate}
                  onChange={(e) => setCommissionRate(Number(e.target.value))}
                />
                <Percent className="w-4 h-4 text-gray-400 absolute right-4 top-3.5" />
              </div>
              <p className="text-[10px] text-gray-400 mt-1">Default percentage taken from every booking.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">TDS Rate (%)</label>
                <div className="relative">
                  <input 
                    type="number" 
                    min="0" max="100" step="0.1"
                    className="w-full pl-4 pr-10 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-navy text-sm font-bold text-gray-900 bg-gray-50"
                    value={tdsRate}
                    onChange={(e) => setTdsRate(Number(e.target.value))}
                  />
                  <Percent className="w-4 h-4 text-gray-400 absolute right-4 top-3.5" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">GST Rate (%)</label>
                <div className="relative">
                  <input 
                    type="number" 
                    min="0" max="100" step="0.1"
                    className="w-full pl-4 pr-10 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-navy text-sm font-bold text-gray-900 bg-gray-50"
                    value={gstRate}
                    onChange={(e) => setGstRate(Number(e.target.value))}
                  />
                  <Percent className="w-4 h-4 text-gray-400 absolute right-4 top-3.5" />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Pause All Operations</label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsBookingPaused(!isBookingPaused)}
                  className={`w-14 h-7 rounded-full relative transition-colors ${isBookingPaused ? 'bg-red-500' : 'bg-gray-200'}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-transform ${isBookingPaused ? 'translate-x-8' : 'translate-x-1'}`} />
                </button>
                <span className={`font-bold text-sm flex items-center gap-1 ${isBookingPaused ? 'text-red-600' : 'text-gray-500'}`}>
                  {isBookingPaused ? <><Power className="w-4 h-4" /> Operations Halted</> : "Active"}
                </span>
              </div>
              <p className="text-[10px] text-gray-400 mt-2">Turning this on will disable new bookings for all customers instantly.</p>
            </div>
          </CardContent>
        </Card>

        {/* Contact Info */}
        <Card className="bg-white/90 backdrop-blur-md shadow-sm border-gray-200">
          <CardHeader className="bg-gray-50/50 border-b border-gray-100 pb-4">
            <CardTitle className="text-lg text-primary-navy flex items-center gap-2">
              <Mail className="w-5 h-5 text-primary-orange" /> App Support Details
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Support Email</label>
              <input 
                type="email" 
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-navy text-sm bg-gray-50"
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Support Phone</label>
              <input 
                type="text" 
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-navy text-sm bg-gray-50"
                value={supportPhone}
                onChange={(e) => setSupportPhone(e.target.value)}
              />
            </div>
            <p className="text-[10px] text-gray-400">These details are shown on the Customer App&apos;s Help section.</p>
          </CardContent>
        </Card>

        {/* CMS / Banners */}
        <Card className="md:col-span-2 bg-white/90 backdrop-blur-md shadow-sm border-gray-200">
          <CardHeader className="bg-gray-50/50 border-b border-gray-100 pb-4">
            <CardTitle className="text-lg text-primary-navy flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-primary-orange" /> Home Page Banners
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            <div className="flex gap-3 mb-6">
              <input 
                type="url" 
                placeholder="https://example.com/banner-image.jpg"
                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-navy text-sm bg-gray-50"
                value={bannerInput}
                onChange={(e) => setBannerInput(e.target.value)}
              />
              <button 
                type="button"
                onClick={handleAddBanner}
                className="bg-primary-navy hover:bg-blue-900 text-white font-bold px-6 rounded-xl transition-colors"
              >
                Add
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {activeBanners.map((url, idx) => (
                <div key={idx} className="relative group rounded-xl overflow-hidden border border-gray-200 aspect-video bg-gray-100 flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="Banner" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.src = "https://placehold.co/600x300?text=Invalid+Image")} />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button 
                      type="button"
                      onClick={() => handleRemoveBanner(url)}
                      className="bg-red-500 hover:bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
              {activeBanners.length === 0 && (
                <div className="col-span-full py-8 text-center text-gray-400 text-sm font-medium border-2 border-dashed border-gray-200 rounded-xl">
                  No active banners. Add an image URL to display on the app home screen.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="md:col-span-2">
          <button 
            type="submit" 
            disabled={updateSettingsMutation.isPending}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl transition-colors shadow-lg disabled:opacity-50 text-lg"
          >
            {updateSettingsMutation.isPending ? "Saving Config..." : "Save All Settings"}
          </button>
        </div>

      </form>
    </div>
  );
}
