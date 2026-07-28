"use client";

import React, { useState, useEffect } from "react";
import { getServices, getCities, createService, updateService, deleteService, createCity, deleteCity } from "@/lib/services";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, MapPin, Wrench, Trash2, Plus, AlertCircle, Edit } from "lucide-react";

export default function MasterDataPage() {
  const [activeTab, setActiveTab] = useState<"services" | "cities">("services");
  const [isLoading, setIsLoading] = useState(true);
  
  // Data
  const [services, setServices] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  
  // Forms
  const [newService, setNewService] = useState({ name: "", description: "" });
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [newCity, setNewCity] = useState({ name: "", state: "", country: "India" });
  
  const [message, setMessage] = useState({ type: "", text: "" });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      if (activeTab === "services") {
        const res = await getServices(1, 100);
        const dataArray = res?.data?.docs || res?.data || res?.docs || [];
        setServices(Array.isArray(dataArray) ? dataArray : []);
      } else {
        const res = await getCities(1, 100);
        const dataArray = res?.data?.docs || res?.data || res?.docs || [];
        setCities(Array.isArray(dataArray) ? dataArray : []);
      }
    } catch (err) {
      console.error("Failed to load master data", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newService.name) return;
    try {
      const slug = newService.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      const payload = { ...newService, slug, icon: "wrench" };
      
      if (editingServiceId) {
        await updateService(editingServiceId, payload);
        setMessage({ type: "success", text: "Service updated successfully" });
      } else {
        await createService(payload);
        setMessage({ type: "success", text: "Service added successfully" });
      }
      
      setNewService({ name: "", description: "" });
      setEditingServiceId(null);
      fetchData();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || `Failed to ${editingServiceId ? 'update' : 'add'} service` });
    }
  };

  const handleAddCity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCity.name || !newCity.state) return;
    try {
      await createCity(newCity);
      setNewCity({ name: "", state: "", country: "India" });
      setMessage({ type: "success", text: "City added successfully" });
      fetchData();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to add city" });
    }
  };

  const handleDelete = async (id: string, type: "service" | "city") => {
    if (!confirm(`Are you sure you want to delete this ${type}?`)) return;
    try {
      if (type === "service") {
        await deleteService(id);
      } else {
        await deleteCity(id);
      }
      setMessage({ type: "success", text: `${type} deleted successfully` });
      fetchData();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || `Failed to delete ${type}` });
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12 p-4">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-900 via-primary-navy to-primary-navy border border-primary-navy/20 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-elevated">
        <div className="flex items-center gap-5 text-white">
          <div className="w-16 h-16 bg-white/10 rounded-2xl shadow-sm flex items-center justify-center shrink-0 border border-white/20 backdrop-blur-sm">
            <MapPin className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-bold font-heading tracking-tight">Master Data Settings</h2>
            <p className="text-white/80 mt-1 font-medium">Manage global platforms services and locations.</p>
          </div>
        </div>
      </div>

      {message.text && (
        <div className={`p-4 rounded-xl text-sm border font-medium flex items-center gap-3 ${
          message.type === "success" 
            ? "bg-green-50 text-green-700 border-green-200" 
            : "bg-red-50 text-red-700 border-red-200"
        }`}>
          <AlertCircle className="w-5 h-5" />
          {message.text}
        </div>
      )}

      {/* Tabs */}
      <div className="flex space-x-2 bg-gray-100/50 p-1 rounded-xl max-w-sm">
        <button
          onClick={() => setActiveTab("services")}
          className={`flex-1 py-2.5 px-4 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 ${
            activeTab === "services" 
              ? "bg-white text-primary-navy shadow-sm border border-gray-200/60" 
              : "text-gray-500 hover:text-primary-navy hover:bg-gray-100"
          }`}
        >
          <Wrench className="w-4 h-4" /> Services
        </button>
        <button
          onClick={() => setActiveTab("cities")}
          className={`flex-1 py-2.5 px-4 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 ${
            activeTab === "cities" 
              ? "bg-white text-primary-navy shadow-sm border border-gray-200/60" 
              : "text-gray-500 hover:text-primary-navy hover:bg-gray-100"
          }`}
        >
          <MapPin className="w-4 h-4" /> Locations
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Panel */}
        <div className="lg:col-span-1">
          <Card className="bg-white/90 backdrop-blur-md shadow-sm border-gray-200">
            <CardHeader className="border-b border-gray-50 bg-gray-50/50">
              <CardTitle className="text-lg text-primary-navy font-bold flex items-center gap-2">
                <Plus className="w-5 h-5 text-primary-orange" /> 
                {activeTab === "services" 
                  ? (editingServiceId ? "Edit Service" : "Add New Service") 
                  : "Add New City"}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {activeTab === "services" ? (
                <form onSubmit={handleAddService} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">Service Name *</label>
                    <Input 
                      placeholder="e.g. Full Wash" 
                      value={newService.name}
                      onChange={(e) => setNewService({...newService, name: e.target.value})}
                      className="rounded-xl border-gray-200 focus:border-primary-navy"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">Description</label>
                    <Input 
                      placeholder="Service details..." 
                      value={newService.description}
                      onChange={(e) => setNewService({...newService, description: e.target.value})}
                      className="rounded-xl border-gray-200 focus:border-primary-navy"
                    />
                  </div>
                  <Button type="submit" className="w-full bg-primary-navy hover:bg-primary-navy-light text-white rounded-xl py-6 font-bold shadow-sm">
                    {editingServiceId ? "Update Service" : "Create Service"}
                  </Button>
                  {editingServiceId && (
                    <Button type="button" variant="outline" onClick={() => { setEditingServiceId(null); setNewService({ name: "", description: "" }); }} className="w-full rounded-xl py-6 font-bold shadow-sm mt-2">
                      Cancel
                    </Button>
                  )}
                </form>
              ) : (
                <form onSubmit={handleAddCity} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">City Name *</label>
                    <Input 
                      placeholder="e.g. Mumbai" 
                      value={newCity.name}
                      onChange={(e) => setNewCity({...newCity, name: e.target.value})}
                      className="rounded-xl border-gray-200 focus:border-primary-navy"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">State *</label>
                    <Input 
                      placeholder="e.g. Maharashtra" 
                      value={newCity.state}
                      onChange={(e) => setNewCity({...newCity, state: e.target.value})}
                      className="rounded-xl border-gray-200 focus:border-primary-navy"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">Country</label>
                    <Input 
                      value={newCity.country}
                      disabled
                      className="rounded-xl border-gray-200 bg-gray-50 text-gray-500"
                    />
                  </div>
                  <Button type="submit" className="w-full bg-primary-navy hover:bg-primary-navy-light text-white rounded-xl py-6 font-bold shadow-sm">
                    Create City
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Data Table Panel */}
        <div className="lg:col-span-2">
          <Card className="bg-white/90 backdrop-blur-md shadow-sm border-gray-200 h-full flex flex-col">
            <CardHeader className="border-b border-gray-50 bg-gray-50/50">
              <CardTitle className="text-lg text-primary-navy font-bold">
                Existing {activeTab === "services" ? "Services" : "Locations"}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex-1">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                  <Loader2 className="w-8 h-8 animate-spin mb-4 text-primary-navy" />
                  <p className="font-medium">Loading data...</p>
                </div>
              ) : activeTab === "services" ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-500 uppercase bg-gray-50/80 border-b border-gray-100">
                      <tr>
                        <th className="px-6 py-4 font-bold tracking-wider">Service Name</th>
                        <th className="px-6 py-4 font-bold tracking-wider">Description</th>
                        <th className="px-6 py-4 font-bold tracking-wider text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {services.length === 0 ? (
                        <tr><td colSpan={3} className="text-center py-10 text-gray-400">No services found.</td></tr>
                      ) : services.map((s) => (
                        <tr key={s._id} className="hover:bg-blue-50/30 transition-colors">
                          <td className="px-6 py-4 font-bold text-gray-900">{s.name}</td>
                          <td className="px-6 py-4 text-gray-500">{s.description || '-'}</td>
                          <td className="px-6 py-4 text-right flex justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                              onClick={() => {
                                setEditingServiceId(s._id);
                                setNewService({ name: s.name, description: s.description || "" });
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleDelete(s._id, "service")}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-500 uppercase bg-gray-50/80 border-b border-gray-100">
                      <tr>
                        <th className="px-6 py-4 font-bold tracking-wider">City Name</th>
                        <th className="px-6 py-4 font-bold tracking-wider">State</th>
                        <th className="px-6 py-4 font-bold tracking-wider">Status</th>
                        <th className="px-6 py-4 font-bold tracking-wider text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {cities.length === 0 ? (
                        <tr><td colSpan={4} className="text-center py-10 text-gray-400">No cities found.</td></tr>
                      ) : cities.map((c) => (
                        <tr key={c._id} className="hover:bg-blue-50/30 transition-colors">
                          <td className="px-6 py-4 font-bold text-gray-900">{c.name}</td>
                          <td className="px-6 py-4 text-gray-600 font-medium">{c.state}</td>
                          <td className="px-6 py-4">
                            <span className="px-2 py-1 text-[10px] font-bold uppercase rounded-full bg-green-50 text-green-700 border border-green-200">
                              Active
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleDelete(c._id, "city")}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
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
