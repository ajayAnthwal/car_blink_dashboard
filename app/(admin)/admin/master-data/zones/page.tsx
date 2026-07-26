"use client";

import React, { useState, useEffect } from "react";
import { getSuperAdminZones, createSuperAdminZone, updateSuperAdminZone, deleteSuperAdminZone } from "@/lib/services";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Loader2, MapPin, Plus, Trash2, Edit, Check, X, ShieldAlert } from "lucide-react";
import toast from "react-hot-toast";

export default function OperationalZonesPage() {
  const [zones, setZones] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [isAddMode, setIsAddMode] = useState(false);
  const [editZoneId, setEditZoneId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    city: "",
    pincodes: "",
    isActive: true
  });

  useEffect(() => {
    fetchZones();
  }, []);

  const fetchZones = async () => {
    setIsLoading(true);
    try {
      const res = await getSuperAdminZones();
      setZones(res.data || []);
    } catch (error) {
      console.error("Failed to load zones", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.city) return toast.error("Name and City are required");
    
    setIsSaving(true);
    try {
      const payload = {
        ...formData,
        pincodes: formData.pincodes.split(',').map(p => p.trim()).filter(p => p)
      };

      if (editZoneId) {
        await updateSuperAdminZone(editZoneId, payload);
      } else {
        await createSuperAdminZone(payload);
      }
      
      toast.success(editZoneId ? "Zone updated successfully" : "Zone created successfully");
      resetForm();
      fetchZones();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to save zone");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this zone?")) return;
    try {
      await deleteSuperAdminZone(id);
      toast.success("Zone deleted successfully");
      fetchZones();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to delete zone");
    }
  };

  const handleEdit = (z: any) => {
    setFormData({
      name: z.name,
      city: z.city,
      pincodes: z.pincodes.join(', '),
      isActive: z.isActive
    });
    setEditZoneId(z._id);
    setIsAddMode(true);
  };

  const resetForm = () => {
    setFormData({ name: "", city: "", pincodes: "", isActive: true });
    setEditZoneId(null);
    setIsAddMode(false);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <Loader2 className="w-10 h-10 animate-spin mb-4 text-primary-navy" />
        <p className="font-medium">Loading operational zones...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in pb-12 p-4">
      <div className="bg-gradient-to-r from-primary-navy to-indigo-900 rounded-3xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between shadow-elevated gap-4">
        <div className="flex items-center gap-5 text-white">
          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20">
            <MapPin className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold font-heading">Operational Zones</h1>
            <p className="text-white/80 mt-1 font-medium">Manage service areas, cities, and pincodes.</p>
          </div>
        </div>
        {!isAddMode && (
          <button
            onClick={() => setIsAddMode(true)}
            className="bg-primary-orange hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-md flex items-center gap-2"
          >
            <Plus className="w-5 h-5" /> Add New Zone
          </button>
        )}
      </div>

      {isAddMode && (
        <Card className="bg-white/90 backdrop-blur-md shadow-sm border-primary-navy/20 animate-in slide-in-from-top-4">
          <CardHeader className="bg-gray-50/50 border-b border-gray-100">
            <CardTitle className="text-lg text-primary-navy flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary-orange" /> {editZoneId ? 'Edit Zone' : 'Create New Zone'}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Zone Name *</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-navy text-sm bg-gray-50"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="e.g. South Delhi, North Mumbai"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">City *</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-navy text-sm bg-gray-50"
                  value={formData.city}
                  onChange={(e) => setFormData({...formData, city: e.target.value})}
                  placeholder="e.g. Delhi, Mumbai"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Pincodes (Comma separated)</label>
                <textarea 
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-navy text-sm bg-gray-50 min-h-[80px]"
                  value={formData.pincodes}
                  onChange={(e) => setFormData({...formData, pincodes: e.target.value})}
                  placeholder="110001, 110002, 110003"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Status</label>
                <div className="flex items-center gap-3 mt-2">
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, isActive: !formData.isActive})}
                    className={`w-12 h-6 rounded-full relative transition-colors ${formData.isActive ? 'bg-green-500' : 'bg-gray-300'}`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${formData.isActive ? 'translate-x-7' : 'translate-x-1'}`} />
                  </button>
                  <span className="text-sm font-semibold text-gray-700">{formData.isActive ? 'Active' : 'Inactive'}</span>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 mt-8">
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="bg-primary-navy hover:bg-blue-900 text-white font-bold px-6 py-2.5 rounded-xl transition-colors flex items-center gap-2"
              >
                {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                {editZoneId ? 'Update Zone' : 'Save Zone'}
              </button>
              <button 
                onClick={resetForm}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-6 py-2.5 rounded-xl transition-colors"
              >
                Cancel
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Zones List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {zones.map((z) => (
          <Card key={z._id} className="bg-white/90 backdrop-blur-md shadow-sm hover:shadow-elevated transition-all border-gray-200 overflow-hidden">
            <div className={`h-1.5 w-full ${z.isActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <CardContent className="p-5">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{z.name}</h3>
                  <p className="text-sm font-medium text-gray-500 flex items-center gap-1 mt-1">
                    <MapPin className="w-4 h-4" /> {z.city}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleEdit(z)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                    <Edit className="w-5 h-5" />
                  </button>
                  <button onClick={() => handleDelete(z._id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              <div className="mt-4">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Serviceable Pincodes ({z.pincodes.length})</p>
                <div className="flex flex-wrap gap-2">
                  {z.pincodes.map((pin: string, idx: number) => (
                    <span key={idx} className="bg-gray-100 text-gray-700 text-xs font-semibold px-2 py-1 rounded-md border border-gray-200">
                      {pin}
                    </span>
                  ))}
                  {z.pincodes.length === 0 && (
                    <span className="text-xs text-gray-400 italic">No pincodes added</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {zones.length === 0 && !isAddMode && (
          <div className="col-span-2 text-center py-20 bg-white/50 rounded-3xl border border-gray-200">
            <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No operational zones configured yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
