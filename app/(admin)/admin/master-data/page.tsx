// @ts-nocheck
"use client";

import React, { useState } from "react";
import { 
  useMasterDataServices, 
  useMasterDataCities, 
  useCreateServiceMutation, 
  useUpdateServiceMutation, 
  useDeleteServiceMutation, 
  useCreateCityMutation, 
  useDeleteCityMutation 
} from "@/features/admin/hooks/useAdminQueries";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, MapPin, Wrench, Trash2, Plus, AlertCircle, Edit, ChevronLeft, ChevronRight, Layers, LayoutGrid } from "lucide-react";

export default function MasterDataPage() {
  const [activeTab, setActiveTab] = useState<"services" | "cities">("services");
  
  const [servicePage, setServicePage] = useState(1);
  const [cityPage, setCityPage] = useState(1);
  const limit = 5;
  
  // React Query Hooks
  const { data: servicesData, isLoading: isServicesLoading } = useMasterDataServices();
  const { data: citiesData, isLoading: isCitiesLoading } = useMasterDataCities();
  
  const createServiceMutation = useCreateServiceMutation();
  const updateServiceMutation = useUpdateServiceMutation();
  const deleteServiceMutation = useDeleteServiceMutation();
  
  const createCityMutation = useCreateCityMutation();
  const deleteCityMutation = useDeleteCityMutation();
  
  const services = servicesData || [];
  const cities = citiesData || [];
  
  const paginatedServices = services.slice((servicePage - 1) * limit, servicePage * limit);
  const totalServicePages = Math.ceil(services.length / limit) || 1;

  const paginatedCities = cities.slice((cityPage - 1) * limit, cityPage * limit);
  const totalCityPages = Math.ceil(cities.length / limit) || 1;
  
  const isLoading = activeTab === "services" ? isServicesLoading : isCitiesLoading;
  
  // Forms
  const [newService, setNewService] = useState({ name: "", description: "" });
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [newCity, setNewCity] = useState({ name: "", state: "", country: "India" });
  
  const [message, setMessage] = useState({ type: "", text: "" });

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newService.name) return;
    try {
      const slug = newService.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      const payload = { ...newService, slug, icon: "wrench" };
      
      if (editingServiceId) {
        await updateServiceMutation.mutateAsync({ id: editingServiceId, data: payload });
        setMessage({ type: "success", text: "Service updated successfully" });
      } else {
        await createServiceMutation.mutateAsync(payload);
        setMessage({ type: "success", text: "Service added successfully" });
      }
      
      setNewService({ name: "", description: "" });
      setEditingServiceId(null);
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    } catch (err: unknown) {
      setMessage({ type: "error", text: err.message || `Failed to ${editingServiceId ? 'update' : 'add'} service` });
    }
  };

  const handleAddCity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCity.name || !newCity.state) return;
    try {
      await createCityMutation.mutateAsync(newCity);
      setNewCity({ name: "", state: "", country: "India" });
      setMessage({ type: "success", text: "City added successfully" });
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    } catch (err: unknown) {
      setMessage({ type: "error", text: err.message || "Failed to add city" });
    }
  };

  const handleDelete = async (id: string, type: "service" | "city") => {
    if (!confirm(`Are you sure you want to delete this ${type}?`)) return;
    try {
      if (type === "service") {
        await deleteServiceMutation.mutateAsync(id);
      } else {
        await deleteCityMutation.mutateAsync(id);
      }
      setMessage({ type: "success", text: `${type} deleted successfully` });
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    } catch (err: unknown) {
      setMessage({ type: "error", text: err.message || `Failed to delete ${type}` });
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12 p-4">
      {/* Header Banner - Premium Redesign */}
      <div className="relative overflow-hidden rounded-[2.5rem] p-8 md:p-10 shadow-2xl bg-gradient-to-br from-[#0F172A] via-[#1E1B4B] to-[#312E81] text-white isolate">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-indigo-500/30 blur-3xl rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-purple-500/20 blur-3xl rounded-full pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-white/5 rounded-3xl shadow-inner flex items-center justify-center shrink-0 border border-white/10 backdrop-blur-xl">
              <Layers className="w-10 h-10 text-indigo-300 drop-shadow-md" />
            </div>
            <div>
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-indigo-200">
                Master Data Hub
              </h2>
              <p className="text-indigo-200/80 mt-2 font-medium text-lg max-w-lg">
                Manage global platform services, configurations, and locations across your entire network.
              </p>
            </div>
          </div>
          
          {/* Status Badge */}
          <div className="hidden md:flex items-center gap-2 bg-white/10 px-4 py-2 rounded-2xl border border-white/10 backdrop-blur-md">
             <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
             <span className="text-sm font-semibold text-indigo-100">System Active</span>
          </div>
        </div>
      </div>

      {message.text && (
        <div className={`p-4 rounded-2xl text-sm font-semibold flex items-center gap-3 shadow-sm border transform transition-all duration-300 ${
          message.type === "success" 
            ? "bg-green-50 text-green-700 border-green-200/50 shadow-green-100" 
            : "bg-red-50 text-red-700 border-red-200/50 shadow-red-100"
        }`}>
          <AlertCircle className="w-5 h-5" />
          {message.text}
        </div>
      )}

      {/* Modern Segmented Control for Tabs */}
      <div className="flex justify-center md:justify-start">
        <div className="inline-flex bg-gray-100/80 p-1.5 rounded-2xl shadow-inner border border-gray-200/50">
          <button
            onClick={() => {
              setActiveTab("services");
              setServicePage(1);
            }}
            className={`px-8 py-3 rounded-xl font-bold text-sm transition-all duration-300 flex items-center gap-2 ${
              activeTab === "services" 
                ? "bg-white text-indigo-900 shadow-md transform scale-100" 
                : "text-gray-500 hover:text-indigo-900 hover:bg-gray-200/50 scale-95"
            }`}
          >
            <Wrench className={`w-4 h-4 ${activeTab === "services" ? "text-indigo-600" : ""}`} /> Services
          </button>
          <button
            onClick={() => {
              setActiveTab("cities");
              setCityPage(1);
            }}
            className={`px-8 py-3 rounded-xl font-bold text-sm transition-all duration-300 flex items-center gap-2 ${
              activeTab === "cities" 
                ? "bg-white text-indigo-900 shadow-md transform scale-100" 
                : "text-gray-500 hover:text-indigo-900 hover:bg-gray-200/50 scale-95"
            }`}
          >
            <MapPin className={`w-4 h-4 ${activeTab === "cities" ? "text-indigo-600" : ""}`} /> Locations
          </button>
        </div>
      </div>

      <div className="space-y-8">
        {/* Modern Form Panel */}
        <div>
          <Card className="bg-white/80 backdrop-blur-xl shadow-xl border-white overflow-hidden rounded-[2rem]">
            <CardHeader className="border-b border-gray-100 bg-gradient-to-b from-gray-50 to-white p-6">
              <CardTitle className="text-xl text-gray-800 font-extrabold flex items-center gap-3 tracking-tight">
                <div className="p-2 bg-indigo-50 rounded-xl">
                  <Plus className="w-5 h-5 text-indigo-600" /> 
                </div>
                {activeTab === "services" 
                  ? (editingServiceId ? "Edit Service" : "Add New Service") 
                  : "Add New City"}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {activeTab === "services" ? (
                <form onSubmit={handleAddService} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2.5">
                      <label className="text-sm font-bold text-gray-700">Service Name <span className="text-red-500">*</span></label>
                      <Input 
                        placeholder="e.g. Premium Full Wash" 
                        value={newService.name}
                        onChange={(e) => setNewService({...newService, name: e.target.value})}
                        className="rounded-2xl border-gray-200 bg-gray-50/50 px-4 py-6 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all shadow-sm"
                        required
                      />
                    </div>
                    <div className="space-y-2.5">
                      <label className="text-sm font-bold text-gray-700">Description</label>
                      <Input 
                        placeholder="Enter detailed description..." 
                        value={newService.description}
                        onChange={(e) => setNewService({...newService, description: e.target.value})}
                        className="rounded-2xl border-gray-200 bg-gray-50/50 px-4 py-6 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all shadow-sm"
                      />
                    </div>
                  </div>
                  <div className="pt-2 flex flex-col md:flex-row gap-3">
                    <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl py-6 font-bold shadow-lg shadow-indigo-200 transition-all active:scale-[0.98]">
                      {editingServiceId ? "Update Service Details" : "Create New Service"}
                    </Button>
                    {editingServiceId && (
                      <Button type="button" variant="outline" onClick={() => { setEditingServiceId(null); setNewService({ name: "", description: "" }); }} className="w-full rounded-2xl py-6 font-bold border-gray-200 hover:bg-gray-50 text-gray-600">
                        Cancel Edit
                      </Button>
                    )}
                  </div>
                </form>
              ) : (
                <form onSubmit={handleAddCity} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div className="space-y-2.5">
                      <label className="text-sm font-bold text-gray-700">City Name <span className="text-red-500">*</span></label>
                      <Input 
                        placeholder="e.g. Mumbai" 
                        value={newCity.name}
                        onChange={(e) => setNewCity({...newCity, name: e.target.value})}
                        className="rounded-2xl border-gray-200 bg-gray-50/50 px-4 py-6 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all shadow-sm"
                        required
                      />
                    </div>
                    <div className="space-y-2.5">
                      <label className="text-sm font-bold text-gray-700">State <span className="text-red-500">*</span></label>
                      <Input 
                        placeholder="e.g. Maharashtra" 
                        value={newCity.state}
                        onChange={(e) => setNewCity({...newCity, state: e.target.value})}
                        className="rounded-2xl border-gray-200 bg-gray-50/50 px-4 py-6 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all shadow-sm"
                        required
                      />
                    </div>
                    <div className="space-y-2.5">
                      <label className="text-sm font-bold text-gray-700">Country</label>
                      <Input 
                        value={newCity.country}
                        disabled
                        className="rounded-2xl border-gray-100 bg-gray-100 text-gray-400 px-4 py-6 cursor-not-allowed"
                      />
                    </div>
                  </div>
                  <div className="pt-2 flex flex-col md:flex-row gap-3">
                    <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl py-6 font-bold shadow-lg shadow-indigo-200 transition-all active:scale-[0.98]">
                      Create New Location
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Modern Data Table Panel */}
        <div>
          <Card className="bg-white/80 backdrop-blur-xl shadow-xl border-white rounded-[2rem] h-full flex flex-col overflow-hidden">
            <CardHeader className="border-b border-gray-100 bg-gradient-to-b from-gray-50 to-white p-6">
              <CardTitle className="text-xl text-gray-800 font-extrabold flex items-center justify-between tracking-tight">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-50 rounded-xl">
                    <LayoutGrid className="w-5 h-5 text-indigo-600" />
                  </div>
                  Registered {activeTab === "services" ? "Services" : "Locations"}
                </div>
                <div className="text-xs font-bold bg-gray-100 text-gray-500 px-3 py-1.5 rounded-full">
                  Total: {activeTab === "services" ? services.length : cities.length}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex-1 bg-gray-50/30">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-24 text-indigo-400">
                  <Loader2 className="w-10 h-10 animate-spin mb-4" />
                  <p className="font-semibold text-gray-500">Syncing data from server...</p>
                </div>
              ) : activeTab === "services" ? (
                <div className="overflow-x-auto p-4 space-y-3">
                  {services.length === 0 ? (
                    <div className="text-center py-20 text-gray-400 bg-white rounded-2xl border border-gray-100 border-dashed">No services found in the database.</div>
                  ) : paginatedServices.map((s) => (
                    <div key={s._id} className="group bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md hover:border-indigo-100 transition-all duration-300 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                          <Wrench className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900 text-base">{s.name}</h4>
                          <p className="text-sm text-gray-500 mt-0.5">{s.description || 'No description provided'}</p>
                        </div>
                      </div>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => {
                            setEditingServiceId(s._id);
                            setNewService({ name: s.name, description: s.description || "" });
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className="p-2.5 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-colors shadow-sm"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(s._id, "service")}
                          className="p-2.5 rounded-xl bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-colors shadow-sm"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="overflow-x-auto p-4 space-y-3">
                  {cities.length === 0 ? (
                    <div className="text-center py-20 text-gray-400 bg-white rounded-2xl border border-gray-100 border-dashed">No locations found in the database.</div>
                  ) : paginatedCities.map((c) => (
                    <div key={c._id} className="group bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md hover:border-indigo-100 transition-all duration-300 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                          <MapPin className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900 text-base">{c.name}</h4>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-sm text-gray-500 font-medium">{c.state}</span>
                            <span className="w-1 h-1 rounded-full bg-gray-300" />
                            <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-green-50 text-green-600 border border-green-100">
                              Active
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleDelete(c._id, "city")}
                          className="p-2.5 rounded-xl bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-colors shadow-sm"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            
            {/* Elegant Pagination */}
            {!isLoading && ((activeTab === "services" && services.length > 0) || (activeTab === "cities" && cities.length > 0)) && (
              <div className="p-5 border-t border-gray-100 flex items-center justify-between bg-white rounded-b-[2rem]">
                <span className="text-sm text-gray-500 font-semibold px-3">
                  Showing Page {activeTab === "services" ? servicePage : cityPage} of {activeTab === "services" ? totalServicePages : totalCityPages}
                </span>
                <div className="flex gap-2 pr-2">
                  <button 
                    onClick={() => activeTab === "services" ? setServicePage(p => Math.max(1, p - 1)) : setCityPage(p => Math.max(1, p - 1))}
                    disabled={activeTab === "services" ? servicePage === 1 : cityPage === 1}
                    className="p-2.5 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 hover:text-indigo-600 disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-all shadow-sm"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => activeTab === "services" ? setServicePage(p => Math.min(totalServicePages, p + 1)) : setCityPage(p => Math.min(totalCityPages, p + 1))}
                    disabled={activeTab === "services" ? servicePage >= totalServicePages : cityPage >= totalCityPages}
                    className="p-2.5 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 hover:text-indigo-600 disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-all shadow-sm"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
