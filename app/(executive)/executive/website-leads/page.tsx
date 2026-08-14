// @ts-nocheck
"use client";

import React, { useState } from "react";
import { getCities, getServices, getVehicleBrands, getVehicleModels } from "@/lib/services";
import { useWebsiteLeads, useConvertWebsiteLead } from "@/features/executive/hooks/useExecutiveQueries";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Megaphone, Phone, Mail, Car, MapPin, Calendar, ExternalLink, X, Search, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";

export default function MarketingLeadsPage() {
  const [selectedLead, setSelectedLead] = useState<any | null>(null);
  
  // Pagination & Filters
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all");
  const limit = 20;

  const { data: leadsData, isLoading: isLoadingLeads } = useWebsiteLeads({ page, limit, search, status: sourceFilter });
  const leads = (leadsData?.leads || []) as any[];
  const totalPages = leadsData?.total ? Math.ceil(leadsData.total / limit) : 1;
  const convertMutation = useConvertWebsiteLead();

  const [showConvertModal, setShowConvertModal] = useState(false);
  const [services, setServices] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [models, setModels] = useState<any[]>([]);

  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [selectedCityName, setSelectedCityName] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  const [convertMessage, setConvertMessage] = useState("");

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  const openConvertModal = async () => {
    setShowConvertModal(true);
    // Pre-fill if we have text from the lead
    const leadBrand = selectedLead?.vehicleBrand || "";
    setSelectedBrand(leadBrand);
    setSelectedModel(selectedLead?.vehicleModel || "");
    setSelectedCityName(selectedLead?.city || "");

    // Extract services from the message text if present
    // Format usually is: "Services: AC Repair, Battery | Fuel: Petrol ..."
    const msg = selectedLead?.message || "";
    let extractedServices = "";
    const servicesMatch = msg.match(/Services:\s*([^|]+)/i);
    if (servicesMatch && servicesMatch[1]) {
      extractedServices = servicesMatch[1].trim();
    }

    try {
      const [servicesRes, citiesRes, brandsRes] = await Promise.all([getServices(), getCities(), getVehicleBrands()]);
      const fetchedServices = Array.isArray(servicesRes?.docs) ? servicesRes.docs : (Array.isArray(servicesRes?.data) ? servicesRes.data : []);
      const fetchedCities = Array.isArray(citiesRes?.docs) ? citiesRes.docs : (Array.isArray(citiesRes?.data) ? citiesRes.data : []);
      const fetchedBrands = brandsRes?.data || [];
      
      setServices(fetchedServices);
      setCities(fetchedCities);
      setBrands(fetchedBrands);

      if (extractedServices && fetchedServices.length > 0) {
        // Find the first service that matches the extracted string
        const matchedService = fetchedServices.find(s => extractedServices.toLowerCase().includes(s.name.toLowerCase()));
        if (matchedService) {
          setSelectedServiceId(matchedService._id);
        }
      }

      const fullAddress = selectedLead?.city || "";
      if (fullAddress && fetchedCities.length > 0) {
        // Try to find a master city that matches the address string
        const matchedCity = fetchedCities.find(c => fullAddress.toLowerCase().includes(c.name.toLowerCase()));
        if (matchedCity) {
          setSelectedCityName(matchedCity.name);
        } else {
          setSelectedCityName(fullAddress);
        }
      }

      if (leadBrand) {
        const brandObj = fetchedBrands.find(b => b.name === leadBrand);
        if (brandObj) {
          const modelsRes = await getVehicleModels(brandObj._id);
          setModels(modelsRes?.data || []);
        }
      }
    } catch (err) {
      console.error("Failed to load master data", err);
    }
  };

  const handleBrandChange = async (brandId: string, brandName: string) => {
    setSelectedBrand(brandName);
    setSelectedModel(""); // reset model
    try {
      const modelsRes = await getVehicleModels(brandId);
      setModels(modelsRes?.data || []);
    } catch (err) {
      console.error("Failed to load models", err);
    }
  };

  const handleConvertLead = async () => {
    // Try exact match first, then fallback to checking if the input contains the master city name
    const validCity = cities.find(c => c.name.toLowerCase() === selectedCityName.toLowerCase()) 
      || cities.find(c => selectedCityName.toLowerCase().includes(c.name.toLowerCase()));
      
    if (!validCity) {
      setConvertMessage("Please type and select a valid city from the list.");
      return;
    }

    if (!selectedServiceId || !selectedBrand || !selectedModel) {
      setConvertMessage("Please select service, city, brand, and model.");
      return;
    }
    
    setConvertMessage("");
    try {
      await convertMutation.mutateAsync({
        id: selectedLead._id, 
        data: {
          serviceId: selectedServiceId,
          cityId: validCity._id,
          vehicleBrand: selectedBrand,
          vehicleModel: selectedModel
        }
      });
      setShowConvertModal(false);
      setSelectedLead(null);
    } catch (err: any) {
      setConvertMessage(err.response?.data?.message || err.message || "Failed to convert lead");
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
            <h1 className="text-3xl font-bold font-heading">Website Leads</h1>
            <p className="text-white/90 mt-1 font-medium">View quotes and callback requests from the website.</p>
          </div>
        </div>
      </div>

      <Card className="bg-white/90 backdrop-blur-md shadow-sm border-gray-200">
        <CardHeader className="bg-gray-50/50 border-b border-gray-100 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <CardTitle className="text-lg text-primary-navy flex items-center gap-2">
            <ExternalLink className="w-5 h-5 text-primary-orange" /> Lead Submissions
          </CardTitle>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-64">
              <input 
                type="text" 
                placeholder="Search by name, phone..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary-orange focus:ring-1 focus:ring-primary-orange"
              />
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </form>
            
            <div className="relative w-full sm:w-48">
              <select 
                value={sourceFilter}
                onChange={(e) => { setSourceFilter(e.target.value); setPage(1); }}
                className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary-orange focus:ring-1 focus:ring-primary-orange appearance-none bg-white"
              >
                <option value="all">All Sources</option>
                <option value="WEBSITE_QUOTE">Website Quote</option>
                <option value="QUICK_CALLBACK">Quick Callback</option>
                <option value="WORKSHOP_PARTNER">Workshop Partner</option>
              </select>
              <Filter className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoadingLeads ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <Loader2 className="w-10 h-10 animate-spin mb-4 text-primary-orange" />
              <p className="font-medium">Loading leads...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50/50 text-gray-500 text-xs uppercase border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 font-bold tracking-wider">Customer Details</th>
                    <th className="px-6 py-4 font-bold tracking-wider">Contact Info</th>
                    <th className="px-6 py-4 font-bold tracking-wider">Vehicle & Location</th>
                    <th className="px-6 py-4 font-bold tracking-wider">Source</th>
                    <th className="px-6 py-4 font-bold tracking-wider">Query / Message</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {leads.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-10 text-gray-400 font-medium">No leads generated yet.</td>
                    </tr>
                  ) : (
                    leads.map((lead: any) => (
                      <tr 
                        key={lead._id} 
                        className="hover:bg-orange-50/30 transition-colors cursor-pointer"
                        onClick={() => setSelectedLead(lead)}
                      >
                        <td className="px-6 py-4">
                          <div className="font-bold text-gray-900">{lead.name}</div>
                          <div className="flex items-center text-xs text-gray-400 mt-1">
                            <Calendar className="w-3 h-3 mr-1" />
                            {lead.createdAt ? format(new Date(lead.createdAt), 'MMM dd, yyyy HH:mm') : 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center text-gray-600 mb-1">
                            <Phone className="w-3.5 h-3.5 mr-2 text-gray-400" />
                            <a href={`tel:${lead.phone}`} className="hover:text-primary-orange">{lead.phone}</a>
                          </div>
                          {lead.email && (
                            <div className="flex items-center text-gray-600">
                              <Mail className="w-3.5 h-3.5 mr-2 text-gray-400" />
                              <a href={`mailto:${lead.email}`} className="hover:text-primary-orange">{lead.email}</a>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center text-gray-700 font-medium mb-1">
                            <Car className="w-4 h-4 mr-2 text-gray-500" />
                            {lead.vehicleBrand || lead.vehicleModel ? `${lead.vehicleBrand || ''} ${lead.vehicleModel || ''}` : 'Not provided'}
                          </div>
                          <div className="flex items-center text-gray-500 text-xs">
                            <MapPin className="w-3.5 h-3.5 mr-2 text-gray-400" />
                            {lead.city || 'Not provided'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${
                            lead.source === 'QUICK_CALLBACK' ? 'bg-blue-100 text-blue-700' :
                            lead.source === 'WEBSITE_QUOTE' ? 'bg-purple-100 text-purple-700' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {lead.source?.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-gray-600 text-xs line-clamp-3 max-w-xs" title={lead.message}>
                            {lead.message || 'No message provided.'}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
          
          {/* Pagination Controls */}
          {!isLoadingLeads && totalPages > 1 && (
            <div className="px-6 py-4 flex items-center justify-between border-t border-gray-100 bg-gray-50/50">
              <span className="text-sm text-gray-500">
                Page <span className="font-bold text-gray-900">{page}</span> of <span className="font-bold text-gray-900">{totalPages}</span>
              </span>
              <div className="flex gap-2">
                <button 
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 text-sm font-medium border border-gray-200 rounded-md bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" /> Prev
                </button>
                <button 
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="px-3 py-1.5 text-sm font-medium border border-gray-200 rounded-md bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedLead && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <Card className="w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between border-b border-gray-100 pb-4 sticky top-0 bg-white z-10">
              <CardTitle className="text-xl text-primary-navy">Lead Details</CardTitle>
              <button 
                onClick={() => setSelectedLead(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Customer Name</h4>
                    <p className="font-medium text-gray-900">{selectedLead.name}</p>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Contact</h4>
                    <p className="font-medium text-gray-900 flex items-center">
                      <Phone className="w-4 h-4 mr-2 text-primary-orange" /> 
                      <a href={`tel:${selectedLead.phone}`} className="hover:underline">{selectedLead.phone}</a>
                    </p>
                    {selectedLead.email && (
                      <p className="font-medium text-gray-900 flex items-center mt-1">
                        <Mail className="w-4 h-4 mr-2 text-primary-orange" /> 
                        <a href={`mailto:${selectedLead.email}`} className="hover:underline">{selectedLead.email}</a>
                      </p>
                    )}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Vehicle</h4>
                    <p className="font-medium text-gray-900">
                      {selectedLead.vehicleBrand || selectedLead.vehicleModel ? `${selectedLead.vehicleBrand || ''} ${selectedLead.vehicleModel || ''}` : 'Not provided'}
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Source</h4>
                    <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${
                      selectedLead.source === 'QUICK_CALLBACK' ? 'bg-blue-100 text-blue-700' :
                      selectedLead.source === 'WEBSITE_QUOTE' ? 'bg-purple-100 text-purple-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {selectedLead.source?.replace('_', ' ')}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Submitted At</h4>
                    <p className="font-medium text-gray-900">
                      {selectedLead.createdAt ? format(new Date(selectedLead.createdAt), 'MMM dd, yyyy hh:mm a') : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Customer Query / Message</h4>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 text-sm text-gray-700 whitespace-pre-wrap">
                  {selectedLead.message || 'No message provided.'}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center">
                  <MapPin className="w-4 h-4 mr-1 text-primary-orange" /> Location Map
                </h4>
                {selectedLead.city ? (
                  <div className="rounded-lg overflow-hidden border border-gray-200 h-64 bg-gray-100">
                    <iframe 
                      width="100%" 
                      height="100%" 
                      frameBorder="0" 
                      scrolling="no" 
                      marginHeight={0} 
                      marginWidth={0} 
                      src={`https://maps.google.com/maps?q=${encodeURIComponent(selectedLead.city)}&output=embed`}
                    ></iframe>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">No location provided.</p>
                )}
                {selectedLead.city && (
                  <p className="text-xs text-gray-500 mt-2 flex justify-between">
                    <span>Address/Coords: {selectedLead.city}</span>
                    <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedLead.city)}`} target="_blank" rel="noopener noreferrer" className="text-primary-orange hover:underline font-semibold flex items-center">
                      Open in Google Maps <ExternalLink className="w-3 h-3 ml-1" />
                    </a>
                  </p>
                )}
                </div>

                {selectedLead.status !== 'CONVERTED' && (
                  <div className="pt-4 border-t border-gray-100 flex justify-end mt-4">
                    <Button 
                      onClick={openConvertModal}
                      className="bg-primary-orange hover:bg-orange-600 text-white"
                    >
                      Convert to Booking / Assign Partner
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Convert Modal */}
        {showConvertModal && selectedLead && (
          <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
            <Card className="w-full max-w-md shadow-2xl">
              <CardHeader className="border-b border-gray-100 pb-4">
                <CardTitle className="text-lg">Convert Lead to Booking</CardTitle>
                <p className="text-xs text-neutral-muted mt-1">Select required details to add this lead to the formal assignment pipeline.</p>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                {convertMessage && (
                  <div className="p-2 bg-red-50 text-red-600 text-xs rounded border border-red-200">
                    {convertMessage}
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Service Type *</label>
                  <select 
                    className="w-full border border-gray-300 rounded-md p-2 text-sm focus:border-primary-orange focus:ring-1 focus:ring-primary-orange"
                    value={selectedServiceId}
                    onChange={e => setSelectedServiceId(e.target.value)}
                  >
                    <option value="">-- Select Service --</option>
                    {services.map(s => (
                      <option key={s._id} value={s._id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                  <input 
                    type="text"
                    list="cities-list"
                    placeholder="Type city name..."
                    className="w-full border border-gray-300 rounded-md p-2 text-sm focus:border-primary-orange focus:ring-1 focus:ring-primary-orange"
                    value={selectedCityName}
                    onChange={e => setSelectedCityName(e.target.value)}
                  />
                  <datalist id="cities-list">
                    {cities.map(c => (
                      <option key={c._id} value={c.name} />
                    ))}
                  </datalist>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Brand *</label>
                  <select 
                    className="w-full border border-gray-300 rounded-md p-2 text-sm focus:border-primary-orange focus:ring-1 focus:ring-primary-orange"
                    value={brands.find(b => b.name === selectedBrand)?._id || ""}
                    onChange={e => {
                      const selectedOption = e.target.options[e.target.selectedIndex];
                      handleBrandChange(e.target.value, selectedOption.text);
                    }}
                  >
                    <option value="">-- Select Brand --</option>
                    {brands.map(b => (
                      <option key={b._id} value={b._id}>{b.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Model *</label>
                  <select 
                    className="w-full border border-gray-300 rounded-md p-2 text-sm focus:border-primary-orange focus:ring-1 focus:ring-primary-orange"
                    value={selectedModel}
                    onChange={e => setSelectedModel(e.target.value)}
                    disabled={!selectedBrand || models.length === 0}
                  >
                    <option value="">-- Select Model --</option>
                    {models.map(m => (
                      <option key={m._id} value={m.name}>{m.name}</option>
                    ))}
                  </select>
                </div>
                
                <div className="flex space-x-3 pt-4">
                  <Button 
                    className="flex-1 bg-primary-orange hover:bg-orange-600" 
                    onClick={handleConvertLead}
                    isLoading={convertMutation.isPending}
                  >
                    Confirm & Convert
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex-1" 
                    onClick={() => setShowConvertModal(false)}
                    disabled={convertMutation.isPending}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    );
  }
