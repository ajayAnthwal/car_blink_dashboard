// @ts-nocheck
"use client";

import React, { useState } from "react";
import {
  useExecutiveAds,
  useCreateExecutiveAdMutation,
  useUpdateExecutiveAdMutation,
  useDeleteExecutiveAdMutation,
} from "@/features/executive/hooks/useExecutiveQueries";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Loader2,
  Image as ImageIcon,
  Plus,
  Trash2,
  Edit,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Eye,
  Sparkles,
  Layers,
  Upload,
} from "lucide-react";
import toast from "react-hot-toast";

export default function ExecutiveAdsPage() {
  const [placementFilter, setPlacementFilter] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAd, setEditingAd] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    subtitle: "",
    imageUrl: "",
    redirectUrl: "",
    placement: "HOME_HERO",
    isActive: true,
    priorityOrder: 0,
  });

  const { data: adsData, isLoading } = useExecutiveAds({ placement: placementFilter });
  const ads = adsData?.docs || [];

  const createMutation = useCreateExecutiveAdMutation();
  const updateMutation = useUpdateExecutiveAdMutation();
  const deleteMutation = useDeleteExecutiveAdMutation();

  const handleOpenAddModal = () => {
    setEditingAd(null);
    setFormData({
      title: "",
      subtitle: "",
      imageUrl: "",
      redirectUrl: "",
      placement: "HOME_HERO",
      isActive: true,
      priorityOrder: 0,
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (ad) => {
    setEditingAd(ad);
    setFormData({
      title: ad.title || "",
      subtitle: ad.subtitle || "",
      imageUrl: ad.imageUrl || "",
      redirectUrl: ad.redirectUrl || "",
      placement: ad.placement || "HOME_HERO",
      isActive: ad.isActive ?? true,
      priorityOrder: ad.priorityOrder || 0,
    });
    setIsModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Image file size should be under 10MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new window.Image();
        img.src = reader.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 1200;
          const scaleSize = MAX_WIDTH / img.width;
          const width = img.width > MAX_WIDTH ? MAX_WIDTH : img.width;
          const height = img.width > MAX_WIDTH ? img.height * scaleSize : img.height;

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);

          const compressedBase64 = canvas.toDataURL("image/jpeg", 0.85);
          setFormData((prev) => ({ ...prev, imageUrl: compressedBase64 }));
          toast.success("Image file processed & ready!");
        };
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.imageUrl.trim()) {
      toast.error("Please provide both Ad Title and Image URL.");
      return;
    }

    try {
      if (editingAd) {
        await updateMutation.mutateAsync({ id: editingAd._id, data: formData });
        toast.success("Banner Ad updated successfully!");
      } else {
        await createMutation.mutateAsync(formData);
        toast.success("Banner Ad created successfully!");
      }
      setIsModalOpen(false);
    } catch (err: any) {
      toast.error(err?.message || "Failed to save banner ad.");
    }
  };

  const handleToggleActive = async (ad) => {
    try {
      await updateMutation.mutateAsync({
        id: ad._id,
        data: { isActive: !ad.isActive },
      });
      toast.success(`Ad marked as ${!ad.isActive ? "Active" : "Inactive"}`);
    } catch (err: any) {
      toast.error("Failed to update status.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this Banner Ad?")) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast.success("Banner Ad deleted.");
    } catch (err: any) {
      toast.error("Failed to delete banner ad.");
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-16 p-4">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-primary-navy via-indigo-900 to-gray-900 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl border border-white/10 text-white">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 shadow-inner">
            <ImageIcon className="w-8 h-8 text-primary-orange" />
          </div>
          <div>
            <h1 className="text-3xl font-bold font-heading">Website Banner Ads</h1>
            <p className="text-white/80 mt-1 font-medium text-sm">
              Manage promotional image banners displayed live on the customer website.
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="bg-primary-orange hover:bg-orange-600 text-white font-bold px-6 py-3 rounded-2xl flex items-center gap-2 transition-all shadow-lg hover:shadow-orange-500/30 shrink-0"
        >
          <Plus className="w-5 h-5" /> Add New Banner Ad
        </button>
      </div>

      {/* Filter & Placement Selector */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/80 backdrop-blur-md p-4 rounded-2xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-primary-navy" />
          <span className="text-sm font-bold text-gray-700">Placement Filter:</span>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          {[
            { label: "All Placements", value: "" },
            { label: "Home Hero Slider", value: "HOME_HERO" },
            { label: "Middle Promo Banner", value: "HOME_MIDDLE" },
            { label: "Special Offers", value: "OFFERS" },
          ].map((item) => (
            <button
              key={item.value}
              onClick={() => setPlacementFilter(item.value)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                placementFilter === item.value
                  ? "bg-primary-navy text-white shadow-md"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Grid */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Loader2 className="w-12 h-12 animate-spin mb-4 text-primary-navy" />
          <p className="font-semibold text-gray-600">Loading website banner ads...</p>
        </div>
      ) : ads.length === 0 ? (
        <Card className="bg-white/80 backdrop-blur-md border-dashed border-2 border-gray-200 p-12 text-center rounded-3xl">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ImageIcon className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-800">No Banner Ads Found</h3>
          <p className="text-gray-500 text-sm mt-2 max-w-md mx-auto">
            You haven't uploaded any promotional banner ads for this placement yet. Click below to add your first ad campaign!
          </p>
          <button
            onClick={handleOpenAddModal}
            className="mt-6 bg-primary-navy hover:bg-blue-900 text-white font-bold px-6 py-2.5 rounded-xl shadow-md transition-colors"
          >
            Create Banner Ad
          </button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ads.map((ad) => (
            <Card
              key={ad._id}
              className={`overflow-hidden border transition-all duration-300 hover:shadow-xl rounded-2xl bg-white ${
                ad.isActive ? "border-gray-200" : "border-gray-200 opacity-60 bg-gray-50/50"
              }`}
            >
              {/* Image Preview Container */}
              <div className="relative h-48 w-full bg-gray-900 overflow-hidden group">
                <img
                  src={ad.imageUrl}
                  alt={ad.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => {
                    e.currentTarget.src =
                      "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?q=80&w=1000&auto=format&fit=crop";
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-4 flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <span className="bg-black/60 backdrop-blur-md text-white text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-lg border border-white/20 tracking-wider">
                      {ad.placement?.replace("_", " ")}
                    </span>

                    <button
                      onClick={() => handleToggleActive(ad)}
                      className={`px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 border shadow-xs ${
                        ad.isActive
                          ? "bg-emerald-500/90 text-white border-emerald-400"
                          : "bg-gray-700/90 text-gray-200 border-gray-500"
                      }`}
                    >
                      {ad.isActive ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" /> Active
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3 h-3" /> Inactive
                        </>
                      )}
                    </button>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-white leading-tight drop-shadow-md">{ad.title}</h3>
                    {ad.subtitle && <p className="text-white/80 text-xs mt-0.5 font-medium line-clamp-1">{ad.subtitle}</p>}
                  </div>
                </div>
              </div>

              {/* Card Footer Details */}
              <CardContent className="p-4 space-y-4">
                {ad.redirectUrl ? (
                  <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 bg-indigo-50 p-2.5 rounded-xl border border-indigo-100">
                    <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{ad.redirectUrl}</span>
                  </div>
                ) : (
                  <div className="text-xs text-gray-400 italic p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                    No target link configured
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <div className="text-[11px] text-gray-400 font-bold">
                    Order: <span className="text-gray-700 font-mono">#{ad.priorityOrder || 0}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenEditModal(ad)}
                      className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
                      title="Edit Ad"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(ad._id)}
                      className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 transition-colors"
                      title="Delete Ad"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal Dialog for Add / Edit Banner Ad */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto border border-gray-100">
            <div className="flex justify-between items-center border-b border-gray-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-orange/10 text-primary-orange flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {editingAd ? "Edit Banner Ad" : "Create New Banner Ad"}
                  </h3>
                  <p className="text-xs text-gray-500">Configure promotional website ad details.</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Ad Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Flat 20% Off Ceramic Coating"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-primary-navy font-medium"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Subtitle / Description
                </label>
                <input
                  type="text"
                  placeholder="e.g., Monsoon special car wash & detailing package"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-primary-navy font-medium"
                  value={formData.subtitle}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Banner Image * (Upload File or Enter URL)
                </label>

                {/* File Upload Dropzone */}
                <div className="border-2 border-dashed border-gray-300 hover:border-primary-navy rounded-2xl p-4 text-center bg-gray-50/50 hover:bg-blue-50/20 transition-all cursor-pointer relative group mb-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <div className="w-12 h-12 rounded-2xl bg-blue-100 text-primary-navy flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-800">
                        Click to Choose Image File from Device
                      </p>
                      <p className="text-[10px] text-gray-400 font-medium mt-0.5">PNG, JPG, WEBP up to 5MB</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 my-2">
                  <div className="flex-1 h-px bg-gray-200" />
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">OR enter Image URL</span>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>

                <input
                  type="text"
                  placeholder="https://images.unsplash.com/photo-..."
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-primary-navy font-medium"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                />

                {formData.imageUrl && (
                  <div className="mt-3 relative h-36 w-full rounded-2xl overflow-hidden border border-gray-200 bg-gray-900 shadow-inner group">
                    <img
                      src={formData.imageUrl}
                      alt="Banner Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                    <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-md text-white text-[10px] font-extrabold px-2.5 py-1 rounded-lg border border-white/20">
                      Live Preview
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Target Click / Redirect Link
                </label>
                <input
                  type="text"
                  placeholder="e.g., /services or https://carblink.com/offers"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-primary-navy font-medium"
                  value={formData.redirectUrl}
                  onChange={(e) => setFormData({ ...formData, redirectUrl: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Placement
                  </label>
                  <select
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-primary-navy font-bold"
                    value={formData.placement}
                    onChange={(e) => setFormData({ ...formData, placement: e.target.value })}
                  >
                    <option value="HOME_HERO">Home Hero Slider</option>
                    <option value="HOME_MIDDLE">Middle Promo Banner</option>
                    <option value="OFFERS">Special Offers</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Priority Order
                  </label>
                  <input
                    type="number"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-primary-navy font-mono"
                    value={formData.priorityOrder}
                    onChange={(e) => setFormData({ ...formData, priorityOrder: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="isActiveToggle"
                  className="w-5 h-5 text-primary-navy rounded-lg accent-primary-navy cursor-pointer"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                />
                <label htmlFor="isActiveToggle" className="text-sm font-bold text-gray-700 cursor-pointer">
                  Mark as Active Ad (Visible on Website)
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-bold hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="px-6 py-2.5 rounded-xl bg-primary-navy hover:bg-blue-900 text-white text-sm font-bold transition-all shadow-md disabled:opacity-50"
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? "Saving..."
                    : editingAd
                    ? "Update Ad"
                    : "Create Ad"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
