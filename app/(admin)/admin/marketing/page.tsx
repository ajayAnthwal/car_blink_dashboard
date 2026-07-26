"use client";

import React, { useState, useEffect } from "react";
import { getSuperAdminCoupons, createSuperAdminCoupon, toggleSuperAdminCoupon, deleteSuperAdminCoupon } from "@/lib/services";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Loader2, Megaphone, Plus, Power, Trash2, Tag } from "lucide-react";

export default function AdminMarketingPage() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  
  // New Coupon State
  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState("PERCENTAGE");
  const [discountValue, setDiscountValue] = useState("");
  const [maxUses, setMaxUses] = useState("100");

  const fetchCoupons = async () => {
    setIsLoading(true);
    try {
      const res = await getSuperAdminCoupons();
      setCoupons(res.data || []);
    } catch (error) {
      console.error("Failed to load coupons", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !discountValue || !maxUses) {
      alert("Please fill all required fields.");
      return;
    }

    setIsCreating(true);
    try {
      await createSuperAdminCoupon({
        code: code.toUpperCase(),
        discountType,
        discountValue: Number(discountValue),
        maxUses: Number(maxUses)
      });
      alert("Coupon created successfully!");
      setCode("");
      setDiscountValue("");
      setMaxUses("100");
      fetchCoupons();
    } catch (error: any) {
      alert(error?.message || "Failed to create coupon.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleToggle = async (id: string) => {
    try {
      await toggleSuperAdminCoupon(id);
      fetchCoupons();
    } catch (error) {
      alert("Failed to toggle coupon status.");
    }
  };

  const handleDelete = async (id: string) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this coupon? This cannot be undone.");
    if (!confirmDelete) return;

    try {
      await deleteSuperAdminCoupon(id);
      alert("Coupon deleted.");
      fetchCoupons();
    } catch (error) {
      alert("Failed to delete coupon.");
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in pb-12 p-4">
      <div className="bg-gradient-to-r from-primary-orange to-red-500 rounded-3xl p-6 flex items-center justify-between shadow-elevated">
        <div className="flex items-center gap-5 text-white">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center border border-white/30">
            <Megaphone className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold font-heading">Marketing & Promotions</h1>
            <p className="text-white/90 mt-1 font-medium">Create discount codes and manage active promotions.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Create Coupon Form */}
        <div className="lg:col-span-1">
          <Card className="bg-white/90 backdrop-blur-md shadow-sm border-gray-200 sticky top-24">
            <CardHeader className="bg-gray-50/50 border-b border-gray-100 pb-4">
              <CardTitle className="text-lg text-primary-navy flex items-center gap-2">
                <Plus className="w-5 h-5 text-primary-orange" /> Create New Coupon
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <form onSubmit={handleCreateCoupon} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Coupon Code</label>
                  <input 
                    type="text" 
                    placeholder="e.g. DIWALI50"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-orange text-sm uppercase"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Discount Type</label>
                  <select 
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-orange text-sm"
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value)}
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FLAT">Flat Amount (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Discount Value</label>
                  <input 
                    type="number" 
                    placeholder={discountType === 'PERCENTAGE' ? "e.g. 20 (for 20%)" : "e.g. 100 (for ₹100)"}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-orange text-sm"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Max Uses (Total)</label>
                  <input 
                    type="number" 
                    placeholder="100"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-orange text-sm"
                    value={maxUses}
                    onChange={(e) => setMaxUses(e.target.value)}
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={isCreating}
                  className="w-full mt-2 bg-primary-orange hover:bg-orange-600 text-white font-bold py-3 rounded-xl transition-colors shadow-md shadow-orange-200 disabled:opacity-50"
                >
                  {isCreating ? "Generating..." : "Generate Coupon"}
                </button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: List of Coupons */}
        <div className="lg:col-span-2">
          <Card className="bg-white/90 backdrop-blur-md shadow-sm border-gray-200">
            <CardHeader className="bg-gray-50/50 border-b border-gray-100 pb-4">
              <CardTitle className="text-lg text-primary-navy flex items-center gap-2">
                <Tag className="w-5 h-5 text-primary-orange" /> Active & Past Promo Codes
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                  <Loader2 className="w-10 h-10 animate-spin mb-4 text-primary-orange" />
                  <p className="font-medium">Loading coupons...</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50/50 text-gray-500 text-xs uppercase border-b border-gray-100">
                      <tr>
                        <th className="px-6 py-4 font-bold tracking-wider">Promo Code</th>
                        <th className="px-6 py-4 font-bold tracking-wider">Discount</th>
                        <th className="px-6 py-4 font-bold tracking-wider text-center">Usage</th>
                        <th className="px-6 py-4 font-bold tracking-wider text-center">Status</th>
                        <th className="px-6 py-4 font-bold tracking-wider text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {coupons.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="text-center py-10 text-gray-400 font-medium">No promo codes created yet.</td>
                        </tr>
                      ) : (
                        coupons.map((coupon: any) => (
                          <tr key={coupon._id} className={`transition-colors ${!coupon.isActive ? 'bg-gray-50/50 opacity-70' : 'hover:bg-orange-50/30'}`}>
                            <td className="px-6 py-4">
                              <div className="font-mono font-bold text-primary-navy bg-gray-100 px-3 py-1.5 rounded-lg inline-block tracking-wider">
                                {coupon.code}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="font-bold text-gray-900">
                                {coupon.discountType === 'PERCENTAGE' ? `${coupon.discountValue}% OFF` : `₹${coupon.discountValue} OFF`}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className="font-medium text-gray-900">{coupon.currentUses}</span>
                              <span className="text-gray-400 text-xs mx-1">/</span>
                              <span className="text-gray-500 text-xs">{coupon.maxUses}</span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                coupon.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'
                              }`}>
                                {coupon.isActive ? 'ACTIVE' : 'DISABLED'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-3">
                                <button 
                                  onClick={() => handleToggle(coupon._id)}
                                  className={`p-2 rounded-lg transition-colors ${
                                    coupon.isActive ? 'text-orange-500 hover:bg-orange-50' : 'text-green-600 hover:bg-green-50'
                                  }`}
                                  title={coupon.isActive ? 'Disable Coupon' : 'Enable Coupon'}
                                >
                                  <Power className="w-5 h-5" />
                                </button>
                                <button 
                                  onClick={() => handleDelete(coupon._id)}
                                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Delete Coupon"
                                >
                                  <Trash2 className="w-5 h-5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
